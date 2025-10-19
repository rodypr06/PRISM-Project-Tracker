import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word documents, and text files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Validation schemas
const createNoteSchema = z.object({
  projectId: z.number(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  isMarkdown: z.boolean().optional().default(true)
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  isMarkdown: z.boolean().optional()
});

// Get all notes for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    // Verify user has access to this project
    if (req.user.role !== 'admin') {
      const userProject = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(projectId, req.user.id);
      if (!userProject) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const notes = db.prepare(`
      SELECT n.*, u.username as author_name
      FROM project_notes n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.project_id = ?
      ORDER BY n.created_at DESC
    `).all(projectId);

    // Get attachments for each note
    const notesWithAttachments = notes.map(note => {
      const attachments = db.prepare(`
        SELECT id, original_filename, file_size, mime_type, created_at
        FROM note_attachments
        WHERE note_id = ?
      `).all(note.id);

      return { ...note, attachments };
    });

    res.json({ notes: notesWithAttachments });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create new note
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { projectId, title, content, isMarkdown } = createNoteSchema.parse(req.body);

    const result = db.prepare(`
      INSERT INTO project_notes (project_id, user_id, title, content, is_markdown)
      VALUES (?, ?, ?, ?, ?)
    `).run(projectId, req.user.id, title, content, isMarkdown ? 1 : 0);

    const note = db.prepare(`
      SELECT n.*, u.username as author_name
      FROM project_notes n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ note: { ...note, attachments: [] } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const data = updateNoteSchema.parse(req.body);
    const updates = ['updated_at = CURRENT_TIMESTAMP'];
    const values = [];

    if (data.title) {
      updates.push('title = ?');
      values.push(data.title);
    }

    if (data.content) {
      updates.push('content = ?');
      values.push(data.content);
    }

    if (data.isMarkdown !== undefined) {
      updates.push('is_markdown = ?');
      values.push(data.isMarkdown ? 1 : 0);
    }

    if (updates.length === 1) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);

    const result = db.prepare(`
      UPDATE project_notes SET ${updates.join(', ')} WHERE id = ?
    `).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = db.prepare(`
      SELECT n.*, u.username as author_name
      FROM project_notes n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `).get(req.params.id);

    const attachments = db.prepare(`
      SELECT id, original_filename, file_size, mime_type, created_at
      FROM note_attachments
      WHERE note_id = ?
    `).all(req.params.id);

    res.json({ note: { ...note, attachments } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Get attachments to delete files
    const attachments = db.prepare('SELECT file_path FROM note_attachments WHERE note_id = ?').all(req.params.id);

    // Delete note (cascade will delete attachments from DB)
    const result = db.prepare('DELETE FROM project_notes WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Delete physical files
    attachments.forEach(attachment => {
      try {
        fs.unlinkSync(attachment.file_path);
      } catch (err) {
        console.error('Failed to delete file:', err);
      }
    });

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Upload attachment to note
router.post('/:id/attachments', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const noteId = parseInt(req.params.id);

    // Verify note exists
    const note = db.prepare('SELECT id FROM project_notes WHERE id = ?').get(noteId);
    if (!note) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(404).json({ error: 'Note not found' });
    }

    const result = db.prepare(`
      INSERT INTO note_attachments (note_id, filename, original_filename, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      noteId,
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype
    );

    const attachment = db.prepare(`
      SELECT id, original_filename, file_size, mime_type, created_at
      FROM note_attachments
      WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ attachment });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file on error
    }
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// Download attachment
router.get('/attachments/:id', async (req, res) => {
  try {
    const attachment = db.prepare(`
      SELECT a.*, n.project_id
      FROM note_attachments a
      JOIN project_notes n ON a.note_id = n.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Verify user has access to this project
    if (req.user.role !== 'admin') {
      const userProject = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(attachment.project_id, req.user.id);
      if (!userProject) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(attachment.file_path, attachment.original_filename);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

// Delete attachment
router.delete('/attachments/:id', requireAdmin, async (req, res) => {
  try {
    const attachment = db.prepare('SELECT file_path FROM note_attachments WHERE id = ?').get(req.params.id);

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const result = db.prepare('DELETE FROM note_attachments WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Delete physical file
    try {
      fs.unlinkSync(attachment.file_path);
    } catch (err) {
      console.error('Failed to delete file:', err);
    }

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export default router;

import express from 'express';
import { z } from 'zod';
import validator from 'validator';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schema
const createCommentSchema = z.object({
  taskId: z.number().nullable().optional(),
  phaseId: z.number().nullable().optional(),
  commentText: z.string().min(1).max(2000)
}).refine(data => data.taskId || data.phaseId, {
  message: 'Either taskId or phaseId must be provided'
});

// Create comment
router.post('/', (req, res) => {
  try {
    const { taskId, phaseId, commentText } = createCommentSchema.parse(req.body);

    // Sanitize comment text to prevent XSS - escape HTML entities
    const sanitizedText = validator.escape(commentText);

    // Verify access: clients can only comment on their own project
    if (req.user.role === 'client') {
      if (taskId) {
        const task = db.prepare(`
          SELECT t.id FROM tasks t
          JOIN phases p ON t.phase_id = p.id
          JOIN projects proj ON p.project_id = proj.id
          WHERE t.id = ? AND proj.user_id = ?
        `).get(taskId, req.user.id);

        if (!task) {
          return res.status(403).json({ error: 'Not authorized to comment on this task' });
        }
      } else if (phaseId) {
        const phase = db.prepare(`
          SELECT p.id FROM phases p
          JOIN projects proj ON p.project_id = proj.id
          WHERE p.id = ? AND proj.user_id = ?
        `).get(phaseId, req.user.id);

        if (!phase) {
          return res.status(403).json({ error: 'Not authorized to comment on this phase' });
        }
      }
    }

    const result = db.prepare(`
      INSERT INTO comments (task_id, phase_id, user_id, comment_text)
      VALUES (?, ?, ?, ?)
    `).run(taskId || null, phaseId || null, req.user.id, sanitizedText);

    const comment = db.prepare(`
      SELECT c.*, u.username, u.role, u.client_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Get comments for a task
router.get('/task/:taskId', (req, res) => {
  try {
    // Verify access for clients
    if (req.user.role === 'client') {
      const task = db.prepare(`
        SELECT t.id FROM tasks t
        JOIN phases p ON t.phase_id = p.id
        JOIN projects proj ON p.project_id = proj.id
        WHERE t.id = ? AND proj.user_id = ?
      `).get(req.params.taskId, req.user.id);

      if (!task) {
        return res.status(403).json({ error: 'Not authorized to view these comments' });
      }
    }

    const comments = db.prepare(`
      SELECT c.*, u.username, u.role, u.client_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at DESC
    `).all(req.params.taskId);

    res.json({ comments });
  } catch (error) {
    console.error('Get task comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Get comments for a phase
router.get('/phase/:phaseId', (req, res) => {
  try {
    // Verify access for clients
    if (req.user.role === 'client') {
      const phase = db.prepare(`
        SELECT p.id FROM phases p
        JOIN projects proj ON p.project_id = proj.id
        WHERE p.id = ? AND proj.user_id = ?
      `).get(req.params.phaseId, req.user.id);

      if (!phase) {
        return res.status(403).json({ error: 'Not authorized to view these comments' });
      }
    }

    const comments = db.prepare(`
      SELECT c.*, u.username, u.role, u.client_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.phase_id = ?
      ORDER BY c.created_at DESC
    `).all(req.params.phaseId);

    res.json({ comments });
  } catch (error) {
    console.error('Get phase comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Delete comment
router.delete('/:id', (req, res) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Admin can delete any comment, clients can only delete their own
    if (req.user.role !== 'admin' && comment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;

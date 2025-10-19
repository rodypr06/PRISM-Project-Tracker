import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z } from 'zod';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken, requireAdmin);

// Validation schemas
const createClientSchema = z.object({
  clientName: z.string().min(1).max(100),
  companyName: z.string().min(1).max(100),
  projectName: z.string().min(1).max(100),
  contact: z.string().email().optional().or(z.literal('')),
  phaseNames: z.array(z.string().min(1).max(100)).length(4)
});

// Get all clients
router.get('/clients', (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT u.id, u.username, u.client_name, u.company_name, u.contact, u.created_at,
             p.id as project_id, p.project_name
      FROM users u
      LEFT JOIN projects p ON u.id = p.user_id
      WHERE u.role = 'client'
      ORDER BY u.created_at DESC
    `).all();

    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Create new client with project and phases
router.post('/clients', (req, res) => {
  try {
    const { clientName, companyName, projectName, contact, phaseNames } = createClientSchema.parse(req.body);

    // Generate username from client name (lowercase, no spaces)
    const username = clientName.toLowerCase().replace(/\s+/g, '');

    // Generate random password
    const password = crypto.randomBytes(12).toString('base64').slice(0, 12);
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Start transaction
    const createClient = db.transaction(() => {
      // Create user
      const userResult = db.prepare(`
        INSERT INTO users (username, password, role, client_name, company_name, contact)
        VALUES (?, ?, 'client', ?, ?, ?)
      `).run(username, hashedPassword, clientName, companyName, contact || null);

      const userId = userResult.lastInsertRowid;

      // Create project
      const projectResult = db.prepare(`
        INSERT INTO projects (user_id, project_name)
        VALUES (?, ?)
      `).run(userId, projectName);

      const projectId = projectResult.lastInsertRowid;

      // Create 4 phases with custom names
      for (let i = 0; i < 4; i++) {
        const phaseResult = db.prepare(`
          INSERT INTO phases (project_id, phase_number, phase_name)
          VALUES (?, ?, ?)
        `).run(projectId, i, phaseNames[i]);

        // Add "Initial Assessment" task to Phase 0
        if (i === 0) {
          db.prepare(`
            INSERT INTO tasks (phase_id, task_name, task_order)
            VALUES (?, 'Initial Assessment', 1)
          `).run(phaseResult.lastInsertRowid);
        }
      }

      return { userId, projectId, username, password };
    });

    const result = createClient();

    res.status(201).json({
      message: 'Client created successfully',
      client: {
        id: result.userId,
        username: result.username,
        temporaryPassword: result.password,
        clientName,
        companyName,
        projectId: result.projectId
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Get specific client details
router.get('/clients/:id', (req, res) => {
  try {
    const client = db.prepare(`
      SELECT u.id, u.username, u.client_name, u.company_name, u.contact, u.created_at,
             p.id as project_id, p.project_name
      FROM users u
      LEFT JOIN projects p ON u.id = p.user_id
      WHERE u.id = ? AND u.role = 'client'
    `).get(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Delete client (cascades to project, phases, tasks, comments)
router.delete('/clients/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM users WHERE id = ? AND role = \'client\'').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Get project with all phases and tasks
router.get('/projects/:projectId', (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const phases = db.prepare(`
      SELECT * FROM phases WHERE project_id = ? ORDER BY phase_number
    `).all(req.params.projectId);

    const phasesWithTasks = phases.map(phase => {
      const tasks = db.prepare(`
        SELECT * FROM tasks WHERE phase_id = ? ORDER BY task_order
      `).all(phase.id);

      const updates = db.prepare(`
        SELECT * FROM updates WHERE phase_id = ? ORDER BY created_at DESC
      `).all(phase.id);

      return { ...phase, tasks, updates };
    });

    res.json({ project: { ...project, phases: phasesWithTasks } });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Add phase to project
router.post('/phases', (req, res) => {
  try {
    const schema = z.object({
      projectId: z.number(),
      phaseNumber: z.number(),
      phaseName: z.string().min(1).max(100)
    });

    const { projectId, phaseNumber, phaseName } = schema.parse(req.body);

    const result = db.prepare(`
      INSERT INTO phases (project_id, phase_number, phase_name)
      VALUES (?, ?, ?)
    `).run(projectId, phaseNumber, phaseName);

    const phase = db.prepare('SELECT * FROM phases WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ phase });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create phase error:', error);
    res.status(500).json({ error: 'Failed to create phase' });
  }
});

// Update phase
router.put('/phases/:id', (req, res) => {
  try {
    const schema = z.object({
      phaseName: z.string().min(1).max(100).optional(),
      status: z.enum(['Not Started', 'In Progress', 'Completed', 'Blocked']).optional()
    });

    const data = schema.parse(req.body);
    const updates = [];
    const values = [];

    if (data.phaseName) {
      updates.push('phase_name = ?');
      values.push(data.phaseName);
    }

    if (data.status) {
      updates.push('status = ?');
      values.push(data.status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);

    const result = db.prepare(`
      UPDATE phases SET ${updates.join(', ')} WHERE id = ?
    `).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    const phase = db.prepare('SELECT * FROM phases WHERE id = ?').get(req.params.id);

    res.json({ phase });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update phase error:', error);
    res.status(500).json({ error: 'Failed to update phase' });
  }
});

// Delete phase
router.delete('/phases/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM phases WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    res.json({ message: 'Phase deleted successfully' });
  } catch (error) {
    console.error('Delete phase error:', error);
    res.status(500).json({ error: 'Failed to delete phase' });
  }
});

// Add task to phase
router.post('/tasks', (req, res) => {
  try {
    const schema = z.object({
      phaseId: z.number(),
      taskName: z.string().min(1).max(200),
      taskOrder: z.number(),
      notes: z.string().optional(),
      dueDate: z.string().optional()
    });

    const { phaseId, taskName, taskOrder, notes, dueDate } = schema.parse(req.body);

    const result = db.prepare(`
      INSERT INTO tasks (phase_id, task_name, task_order, notes, due_date)
      VALUES (?, ?, ?, ?, ?)
    `).run(phaseId, taskName, taskOrder, notes || null, dueDate || null);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/tasks/:id', (req, res) => {
  try {
    const schema = z.object({
      taskName: z.string().min(1).max(200).optional(),
      status: z.enum(['Not Started', 'In Progress', 'Completed', 'Blocked']).optional(),
      notes: z.string().optional(),
      dueDate: z.string().optional(),
      taskOrder: z.number().optional()
    });

    const data = schema.parse(req.body);
    const updates = ['updated_at = CURRENT_TIMESTAMP'];
    const values = [];

    if (data.taskName) {
      updates.push('task_name = ?');
      values.push(data.taskName);
    }

    if (data.status) {
      updates.push('status = ?');
      values.push(data.status);
    }

    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes || null);
    }

    if (data.dueDate !== undefined) {
      updates.push('due_date = ?');
      values.push(data.dueDate || null);
    }

    if (data.taskOrder !== undefined) {
      updates.push('task_order = ?');
      values.push(data.taskOrder);
    }

    values.push(req.params.id);

    const result = db.prepare(`
      UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
    `).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    res.json({ task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/tasks/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Create update
router.post('/updates', (req, res) => {
  try {
    const schema = z.object({
      taskId: z.number().optional(),
      phaseId: z.number().optional(),
      updateText: z.string().min(1),
      milestoneDate: z.string().optional()
    }).refine(data => data.taskId || data.phaseId, {
      message: 'Either taskId or phaseId must be provided'
    });

    const { taskId, phaseId, updateText, milestoneDate } = schema.parse(req.body);

    const result = db.prepare(`
      INSERT INTO updates (task_id, phase_id, update_text, milestone_date)
      VALUES (?, ?, ?, ?)
    `).run(taskId || null, phaseId || null, updateText, milestoneDate || null);

    const update = db.prepare('SELECT * FROM updates WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ update });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create update error:', error);
    res.status(500).json({ error: 'Failed to create update' });
  }
});

// Delete update
router.delete('/updates/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM updates WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Update not found' });
    }

    res.json({ message: 'Update deleted successfully' });
  } catch (error) {
    console.error('Delete update error:', error);
    res.status(500).json({ error: 'Failed to delete update' });
  }
});

export default router;

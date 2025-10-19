import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Middleware to ensure user is a client
const requireClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Client access only' });
  }
  next();
};

router.use(requireClient);

// Get own project with all phases, tasks, and updates
router.get('/project', (req, res) => {
  try {
    const project = db.prepare(`
      SELECT * FROM projects WHERE user_id = ?
    `).get(req.user.id);

    if (!project) {
      return res.status(404).json({ error: 'No project assigned' });
    }

    const phases = db.prepare(`
      SELECT * FROM phases WHERE project_id = ? ORDER BY phase_number
    `).all(project.id);

    const phasesWithData = phases.map(phase => {
      const tasks = db.prepare(`
        SELECT * FROM tasks WHERE phase_id = ? ORDER BY task_order
      `).all(phase.id);

      const tasksWithUpdates = tasks.map(task => {
        const updates = db.prepare(`
          SELECT * FROM updates WHERE task_id = ? ORDER BY created_at DESC
        `).all(task.id);
        return { ...task, updates };
      });

      const phaseUpdates = db.prepare(`
        SELECT * FROM updates WHERE phase_id = ? ORDER BY created_at DESC
      `).all(phase.id);

      return {
        ...phase,
        tasks: tasksWithUpdates,
        updates: phaseUpdates
      };
    });

    res.json({
      project: {
        ...project,
        phases: phasesWithData
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Get specific phase details
router.get('/phases/:id', (req, res) => {
  try {
    // First verify the phase belongs to this client's project
    const phase = db.prepare(`
      SELECT p.* FROM phases p
      JOIN projects proj ON p.project_id = proj.id
      WHERE p.id = ? AND proj.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    const tasks = db.prepare(`
      SELECT * FROM tasks WHERE phase_id = ? ORDER BY task_order
    `).all(phase.id);

    const tasksWithUpdates = tasks.map(task => {
      const updates = db.prepare(`
        SELECT * FROM updates WHERE task_id = ? ORDER BY created_at DESC
      `).all(task.id);
      return { ...task, updates };
    });

    const phaseUpdates = db.prepare(`
      SELECT * FROM updates WHERE phase_id = ? ORDER BY created_at DESC
    `).all(phase.id);

    res.json({
      phase: {
        ...phase,
        tasks: tasksWithUpdates,
        updates: phaseUpdates
      }
    });
  } catch (error) {
    console.error('Get phase error:', error);
    res.status(500).json({ error: 'Failed to fetch phase' });
  }
});

// Get specific task details
router.get('/tasks/:id', (req, res) => {
  try {
    // Verify task belongs to this client's project
    const task = db.prepare(`
      SELECT t.* FROM tasks t
      JOIN phases p ON t.phase_id = p.id
      JOIN projects proj ON p.project_id = proj.id
      WHERE t.id = ? AND proj.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = db.prepare(`
      SELECT * FROM updates WHERE task_id = ? ORDER BY created_at DESC
    `).all(task.id);

    res.json({
      task: {
        ...task,
        updates
      }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

export default router;

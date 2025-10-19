import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'client')),
      client_name TEXT,
      company_name TEXT,
      contact TEXT,
      must_change_password BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Phases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS phases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      phase_number INTEGER NOT NULL,
      phase_name TEXT NOT NULL,
      status TEXT DEFAULT 'Not Started' CHECK(status IN ('Not Started', 'In Progress', 'Completed', 'Blocked')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase_id INTEGER NOT NULL,
      task_name TEXT NOT NULL,
      task_order INTEGER NOT NULL,
      status TEXT DEFAULT 'Not Started' CHECK(status IN ('Not Started', 'In Progress', 'Completed', 'Blocked')),
      notes TEXT,
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE
    )
  `);

  // Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      phase_id INTEGER,
      user_id INTEGER NOT NULL,
      comment_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Updates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      phase_id INTEGER,
      update_text TEXT NOT NULL,
      milestone_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_phases_project_id ON phases(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON tasks(phase_id);
    CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
    CREATE INDEX IF NOT EXISTS idx_comments_phase_id ON comments(phase_id);
    CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
  `);

  // Create default admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

  if (!adminExists) {
    // Use default password "admin123" as documented
    const defaultPassword = 'admin123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

    db.prepare(`
      INSERT INTO users (username, password, role, must_change_password)
      VALUES (?, ?, 'admin', 1)
    `).run('admin', hashedPassword);

    console.log('═══════════════════════════════════════════════════════');
    console.log('🔐 DEFAULT ADMIN ACCOUNT CREATED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('═══════════════════════════════════════════════════════');
    console.log('⚠️  IMPORTANT: Change this password on first login!');
    console.log('═══════════════════════════════════════════════════════\n');
  }
}

// Initialize on import
initializeDatabase();

export default db;

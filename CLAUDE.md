# Project Management Portal

## Project Overview
Build a client-facing project management portal where clients can track project progress through phases and tasks, with an admin panel for project updates and management.

## Tech Stack
- **Backend**: Node.js with Express
- **Database**: SQLite with better-sqlite3
- **Frontend**: React with Vite
- **Styling**: TailwindCSS with glassmorphism effects
- **Authentication**: JWT with httpOnly cookies
- **State Management**: React Context API

## Project Structure
```
project-portal/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── adminAuth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── admin.js
│   │   │   ├── client.js
│   │   │   └── comments.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   ├── Phase.js
│   │   │   ├── Task.js
│   │   │   └── Comment.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── ClientList.jsx
│   │   │   │   ├── CreateClient.jsx
│   │   │   │   ├── ProjectManager.jsx
│   │   │   │   ├── PhaseManager.jsx
│   │   │   │   └── TaskManager.jsx
│   │   │   ├── client/
│   │   │   │   ├── ClientDashboard.jsx
│   │   │   │   ├── PhaseOverview.jsx
│   │   │   │   ├── TaskList.jsx
│   │   │   │   └── CommentSection.jsx
│   │   │   ├── shared/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── ChangePassword.jsx
│   │   │   │   ├── StatusBadge.jsx
│   │   │   │   └── ProgressBar.jsx
│   │   │   └── Layout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── ARCHITECTURE.md
└── README.md
```

## Core Features

### Authentication System
- JWT-based authentication with httpOnly cookies for security
- Separate admin and client user types
- Default admin account created on first run (username: "admin", temporary password: "admin123")
- Forced password change on first login for admin
- Session persistence until manual logout

### Admin Panel Features
1. **Client Management**
   - Create new clients with: client name, company name, project name, contact info
   - Automatically create project structure when creating client
   - Generate username/password for client access
   - View list of all clients with quick access to their projects

2. **Project Management**
   - Customize phase names per project (4 phases: Phase 0, Phase 1, Phase 2, Phase 3)
   - Auto-populate Phase 0 with "Initial Assessment" task
   - Add/remove phases and tasks on the fly
   - Set and update statuses for phases and tasks

3. **Task Management**
   - Tasks are sequential within each phase
   - Individual task statuses: Not Started, In Progress, Completed, Blocked
   - Add progress updates with dates and notes
   - Edit or delete tasks as needed

4. **Update Management**
   - Post progress updates with timestamps
   - Add notes and milestone dates
   - Updates visible to clients in real-time

### Client Portal Features
1. **Dashboard View**
   - Overview of all phases with current status
   - Progress bars showing completion percentage
   - Timeline view of upcoming milestones
   - Quick access to active tasks

2. **Phase Details**
   - Expandable phase cards showing all tasks
   - Sequential task progression indicators
   - Task status badges with visual indicators
   - Progress updates and notes from admin

3. **Comment System**
   - Clients can leave comments on tasks and phases
   - Timestamps and author names displayed
   - Admin can reply to comments
   - Admin can delete any comment
   - Clients can only delete their own comments

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'client')),
  client_name TEXT,
  company_name TEXT,
  contact TEXT,
  must_change_password BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Projects Table
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Phases Table
```sql
CREATE TABLE phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  phase_number INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  status TEXT DEFAULT 'Not Started' CHECK(status IN ('Not Started', 'In Progress', 'Completed', 'Blocked')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
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
);
```

### Comments Table
```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  phase_id INTEGER,
  user_id INTEGER NOT NULL,
  comment_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Updates Table
```sql
CREATE TABLE updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  phase_id INTEGER,
  update_text TEXT NOT NULL,
  milestone_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE
);
```

## Design System

### Color Palette (Avoid purple coding vibes)
- **Primary**: Teal/Cyan (#0891b2, #06b6d4) - Professional and modern
- **Secondary**: Slate/Gray (#475569, #64748b) - Clean and neutral
- **Success**: Emerald (#10b981) - For completed statuses
- **Warning**: Amber (#f59e0b) - For in-progress items
- **Danger**: Rose (#f43f5e) - For blocked items
- **Background**: Gradient from slate-900 to slate-800
- **Glass Cards**: backdrop-blur with white/10 opacity

### Glassmorphism Components
- Use backdrop-filter: blur(16px)
- Semi-transparent backgrounds (bg-white/10, bg-slate-900/40)
- Subtle borders with white/20 opacity
- Soft shadows for depth
- Smooth transitions and hover effects

### Typography
- Headings: Inter or Poppins (clean, modern)
- Body: System font stack for performance
- Proper hierarchy with clear sizing

### Layout Principles
- Spacious padding and margins
- Card-based layouts with glass effect
- Consistent border radius (rounded-xl, rounded-2xl)
- Smooth animations on interactions
- Responsive design for all screen sizes

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login for both admin and client
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change password (forced on first login for admin)

### Admin Routes (Protected)
- `GET /api/admin/clients` - List all clients
- `POST /api/admin/clients` - Create new client with project
- `GET /api/admin/clients/:id` - Get specific client details
- `PUT /api/admin/clients/:id` - Update client info
- `DELETE /api/admin/clients/:id` - Delete client (cascade deletes project)

- `GET /api/admin/projects/:projectId` - Get project with all phases/tasks
- `PUT /api/admin/projects/:projectId` - Update project details

- `POST /api/admin/phases` - Add new phase to project
- `PUT /api/admin/phases/:id` - Update phase (name, status)
- `DELETE /api/admin/phases/:id` - Delete phase

- `POST /api/admin/tasks` - Add new task to phase
- `PUT /api/admin/tasks/:id` - Update task (name, status, notes, due_date, order)
- `DELETE /api/admin/tasks/:id` - Delete task

- `POST /api/admin/updates` - Create progress update
- `DELETE /api/admin/updates/:id` - Delete update

### Client Routes (Protected)
- `GET /api/client/project` - Get own project with phases/tasks/updates
- `GET /api/client/phases/:id` - Get specific phase details
- `GET /api/client/tasks/:id` - Get specific task details

### Comment Routes (Protected)
- `POST /api/comments` - Create comment (on task or phase)
- `GET /api/comments/task/:taskId` - Get all comments for a task
- `GET /api/comments/phase/:phaseId` - Get all comments for a phase
- `DELETE /api/comments/:id` - Delete comment (admin can delete any, clients only their own)

## Implementation Guidelines

### Security
- Hash passwords with bcrypt (salt rounds: 10)
- Use JWT with 24-hour expiration
- Store JWT in httpOnly cookies to prevent XSS
- Validate all inputs on backend
- Use parameterized queries to prevent SQL injection
- Admin-only routes must check role in middleware

### Database Initialization
- On first run, check if admin user exists
- If not, create admin user with username "admin" and password "admin123"
- Set must_change_password flag to true for default admin
- Create indexes on foreign keys for performance

### Error Handling
- Proper HTTP status codes
- User-friendly error messages on frontend
- Detailed error logging on backend
- Validation errors clearly displayed in forms

### Frontend State Management
- AuthContext for user authentication state
- React Query or native fetch for API calls
- Local state for form inputs
- Optimistic updates where appropriate

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Collapsible navigation on mobile
- Touch-friendly buttons and inputs

## Development Instructions

1. **Initialize Backend**
   - Create Express server with CORS enabled
   - Set up SQLite database with schema
   - Create default admin user on first run
   - Implement authentication middleware
   - Set up all API routes with proper error handling

2. **Initialize Frontend**
   - Create Vite React app with TailwindCSS
   - Set up routing with React Router
   - Implement AuthContext for global auth state
   - Create API utility functions
   - Build glassmorphism design system

3. **Build Admin Panel**
   - Admin login with forced password change
   - Client list dashboard with search/filter
   - Create client form with project creation
   - Project manager for phases and tasks
   - Task status updater with notes/dates
   - Comment management interface

4. **Build Client Portal**
   - Client login
   - Phase overview dashboard with progress indicators
   - Expandable phase/task details
   - Sequential task progression display
   - Comment section for client feedback
   - Updates timeline

5. **Polish & Testing**
   - Ensure glassmorphism is consistent across all components
   - Test all user flows (admin and client)
   - Verify sequential task logic
   - Test comment CRUD operations
   - Ensure proper authentication and authorization
   - Mobile responsive testing

## Environment Variables

### Server (.env)
```
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
DATABASE_PATH=./database.sqlite
NODE_ENV=development
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000
```

## Running the Application

### Development
```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

### Production
```bash
# Build frontend
cd client
npm run build

# Start backend (serves frontend)
cd server
npm start
```

## Notes for Claude Code
- Focus on clean, maintainable code
- Add comments for complex logic
- Use async/await for all database operations
- Implement proper error boundaries in React
- Ensure all forms have validation
- Make the glassmorphism subtle but noticeable
- Test sequential task progression thoroughly
- Verify that Phase 0 auto-creates "Initial Assessment" task
- Ensure admin can manage everything, clients are read-only except comments

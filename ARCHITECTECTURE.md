# System Architecture

## Overview
The Project Management Portal is a full-stack web application designed to provide clients with real-time visibility into their project progress while giving administrators complete control over project management.

## Architecture Pattern
**Monolithic Backend with SPA Frontend**

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React SPA (Vite)                         │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │   Admin UI  │  │   Client UI  │  │   Auth UI   │ │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │  │
│  │                                                        │  │
│  │        ┌────────────────────────────────┐            │  │
│  │        │     TailwindCSS + Glass UI     │            │  │
│  │        └────────────────────────────────┘            │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST API
                           │ (JSON + JWT Cookies)
┌──────────────────────────┴──────────────────────────────────┐
│                     Express.js Server                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Middleware Layer                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │  │   CORS   │  │   Auth   │  │   Admin Check    │   │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Route Layer                         │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │
│  │  │  Auth   │  │  Admin  │  │  Client │  │Comments │ │  │
│  │  │  Routes │  │  Routes │  │  Routes │  │ Routes  │ │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Model Layer                         │  │
│  │  ┌─────┐  ┌────────┐  ┌──────┐  ┌─────┐  ┌────────┐ │  │
│  │  │User │  │Project │  │Phase │  │Task │  │Comment │ │  │
│  │  └─────┘  └────────┘  └──────┘  └─────┘  └────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQL Queries (better-sqlite3)
┌──────────────────────────┴──────────────────────────────────┐
│                      SQLite Database                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  users | projects | phases | tasks | comments | updates│ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Frontend (React SPA)

#### AuthContext
- Manages global authentication state
- Stores current user information
- Handles login/logout flows
- Provides auth state to all components

#### Admin Components
- **AdminDashboard**: Overview of all clients and projects
- **ClientList**: Display and search clients
- **CreateClient**: Form to create new client + project + phases
- **ProjectManager**: Manage phases and tasks for a project
- **PhaseManager**: Add/edit/delete phases
- **TaskManager**: Add/edit/delete/reorder tasks

#### Client Components
- **ClientDashboard**: Overview of project phases and progress
- **PhaseOverview**: Display all phases with status indicators
- **TaskList**: Show sequential tasks within a phase
- **CommentSection**: View and add comments

#### Shared Components
- **Login**: Universal login form for both admin and clients
- **ChangePassword**: Force password change on first login
- **StatusBadge**: Visual status indicators
- **ProgressBar**: Phase/project completion indicators

### Backend (Express.js)

#### Middleware
- **auth.js**: Verify JWT token from cookie, attach user to request
- **adminAuth.js**: Check if authenticated user has admin role

#### Routes
- **auth.js**: Login, logout, get current user, change password
- **admin.js**: CRUD operations for clients, projects, phases, tasks, updates
- **client.js**: Read-only access to own project data
- **comments.js**: Create, read, delete comments (with ownership rules)

#### Models
- **User.js**: User authentication and profile
- **Project.js**: Project details linked to client
- **Phase.js**: Phase management within projects
- **Task.js**: Task management within phases
- **Comment.js**: Comments on tasks and phases

## Data Flow

### Admin Creating a Client
```
1. Admin fills CreateClient form
2. Frontend sends POST /api/admin/clients
3. Backend creates:
   - User (client credentials)
   - Project (linked to user)
   - 4 Phases (Phase 0-3 with custom names)
   - 1 Task ("Initial Assessment" in Phase 0)
4. Backend responds with created data
5. Frontend redirects to client list or project manager
```

### Client Viewing Project
```
1. Client logs in
2. Frontend gets JWT cookie
3. Frontend calls GET /api/client/project
4. Backend queries:
   - Project for this user
   - All phases for this project
   - All tasks for each phase
   - All updates for tasks/phases
5. Backend returns nested data structure
6. Frontend renders PhaseOverview with progress indicators
```

### Adding a Comment
```
1. User (admin or client) writes comment
2. Frontend sends POST /api/comments with task_id or phase_id
3. Backend verifies authentication
4. Backend inserts comment with user_id and timestamp
5. Backend returns created comment
6. Frontend appends comment to display with author name
```

### Updating Task Status
```
1. Admin changes task status in TaskManager
2. Frontend sends PUT /api/admin/tasks/:id
3. Backend verifies admin role
4. Backend updates task status and updated_at timestamp
5. Backend checks if all tasks in phase are completed
   - If yes, optionally update phase status
6. Backend returns updated task
7. Frontend updates UI optimistically or refetches
```

## Security Model

### Authentication Flow
```
1. User submits credentials
2. Backend verifies username/password (bcrypt)
3. Backend generates JWT with user payload (id, role)
4. Backend sets JWT in httpOnly cookie
5. All subsequent requests include cookie automatically
6. Middleware verifies JWT on protected routes
```

### Authorization Rules
- **Admin**: Full CRUD access to all resources
- **Client**: 
  - Read access to own project data only
  - Write access to create comments
  - Delete access to own comments only
- **Authentication**: All routes except login require valid JWT
- **Admin Routes**: Additional check for role='admin'

## Database Design

### Relationships
```
users (1) ──────────> (*) projects
                         │
                         └──> (*) phases
                                 │
                                 └──> (*) tasks
                                         │
                                         ├──> (*) comments
                                         └──> (*) updates

users (1) ──────────> (*) comments
phases (1) ─────────> (*) comments
```

### Key Indexes
- users.username (unique)
- projects.user_id
- phases.project_id
- tasks.phase_id
- comments.task_id, comments.phase_id, comments.user_id

### Cascade Deletes
- Delete user → cascade delete project → cascade delete phases → cascade delete tasks → cascade delete comments/updates
- Delete phase → cascade delete tasks → cascade delete comments/updates
- Delete task → cascade delete comments/updates

## Design System Architecture

### Glassmorphism Implementation
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.glass-card-dark {
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Color System
- **Status Colors**: Map statuses to semantic colors
  - Not Started: Slate/Gray
  - In Progress: Amber/Orange
  - Completed: Emerald/Green
  - Blocked: Rose/Red
- **Accent Colors**: Teal/Cyan for primary actions
- **Background**: Dark gradient (slate-900 → slate-800)

### Component Hierarchy
```
Layout (glass background)
├── Navbar (glass header)
├── Sidebar (glass panel) [admin only]
└── Content Area
    ├── Cards (glass effect)
    ├── Forms (glass inputs)
    └── Modals (glass overlay)
```

## Deployment Architecture

### Homelab Setup
```
┌─────────────────────────────────────────┐
│         Reverse Proxy (Optional)        │
│       (nginx, Caddy, Traefik)          │
└──────────────┬──────────────────────────┘
               │ Port 80/443
┌──────────────┴──────────────────────────┐
│         Node.js Express Server          │
│              (Port 5000)                │
│  ┌──────────────────────────────────┐  │
│  │     Serves Built React App       │  │
│  │     + API Endpoints              │  │
│  └──────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│         database.sqlite (file)          │
└─────────────────────────────────────────┘
```

### Production Considerations
- Use environment variables for all secrets
- Enable HTTPS via reverse proxy
- Regular database backups (SQLite file)
- Log rotation for error logs
- Consider PM2 or systemd for process management

## Scalability Notes

### Current Design (Single Project per Client)
- Simple 1:1 user-to-project relationship
- Easy to manage and understand
- Sufficient for small to medium client base

### Future Extensibility (If Needed)
- Add project_id to many client routes
- Allow multiple projects per user
- Add project selection in client dashboard
- No major architectural changes needed

## Error Handling Strategy

### Frontend
- Form validation before submission
- User-friendly error messages in UI
- Toast notifications for success/error
- Loading states during API calls
- Graceful degradation if API fails

### Backend
- Try-catch blocks around all async operations
- Specific error messages for different failure types
- HTTP status codes: 200, 201, 400, 401, 403, 404, 500
- Detailed error logging to console/file
- Never expose sensitive info in error responses

## Performance Considerations

### Database
- SQLite is single-threaded but sufficient for this use case
- Indexes on foreign keys for faster joins
- Avoid N+1 queries (use JOINs or batch queries)
- Limit query results (pagination if needed)

### Frontend
- Code splitting with React.lazy
- Memoization for expensive renders
- Debounce search inputs
- Optimistic UI updates
- Cache static assets

### API
- Compress responses with gzip
- Use HTTP caching headers where appropriate
- Minimal payload sizes (only send needed data)
- Connection pooling (not needed for SQLite)

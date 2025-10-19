# Getting Started with PRISM Project Tracker

## 🎉 Implementation Complete!

The PRISM Client Project Tracker has been successfully implemented with all core features:

### ✅ Backend (Complete)
- Express.js server with security middleware (Helmet, CORS, Rate Limiting)
- SQLite database with complete schema
- JWT authentication with httpOnly cookies
- Role-based access control (Admin/Client)
- Input validation using Zod
- XSS protection with HTML escaping
- Complete API endpoints for all features

### ✅ Frontend (Complete)
- React 18 with Vite
- TailwindCSS with glassmorphism styling
- React Router for navigation
- Authentication context and protected routes
- Admin and Client dashboards
- Login and password change flows

### 🔐 Default Admin Credentials

**IMPORTANT**: The admin account was created with a secure random password:

- **Username**: `admin`
- **Password**: Check the server startup logs (saved in database during first run)

You MUST change this password on first login!

---

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
cd server
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The backend will start on:
- **Local**: http://localhost:5000
- **Network**: http://192.168.50.136:5000

### 2. Start the Frontend (New Terminal)

```bash
cd client
npm run dev
```

The frontend will start on:
- **Local**: http://localhost:5173
- **Network**: http://192.168.50.136:5173

### 3. Access the Application

**Local Access**: http://localhost:5173
**Network Access**: http://192.168.50.136:5173

Access from any device on your local network using the network URL!

---

## 📋 First Steps

### For Administrators

1. **Login** with the admin credentials (check server logs for password)
2. **Change Password** (you'll be forced to on first login)
3. **Create Your First Client**:
   - Click "New Client" button
   - Fill in client name, company, project name
   - Customize the 4 phase names
   - System will generate client credentials
   - Save the generated credentials securely!

4. **Manage Projects**:
   - Add/edit phases and tasks
   - Update task statuses
   - Post progress updates with dates
   - Respond to client comments

### For Clients

1. **Login** with credentials provided by admin
2. **View Project Dashboard**:
   - See all project phases
   - Check task statuses and progress
   - Read admin updates
3. **Leave Comments** on tasks and phases
4. **Track Progress** in real-time

---

## 🏗️ Project Structure

```
prism-client-project-tracker/
├── server/                 # Backend Express application
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── middleware/    # Auth and admin middleware
│   │   ├── routes/        # API route handlers
│   │   └── server.js      # Main server entry point
│   ├── database.sqlite    # SQLite database (created on first run)
│   ├── package.json
│   └── .env              # Environment variables
│
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # Auth context
│   │   ├── utils/        # API utilities
│   │   └── App.jsx       # Main app component
│   ├── package.json
│   └── .env              # Frontend environment variables
│
├── CLAUDE.md             # Full implementation guide
├── ARCHITECTURE.md       # System architecture
├── README.md             # Project documentation
└── GETTING_STARTED.md    # This file
```

---

## 🔧 Configuration

### Backend Environment Variables

File: `server/.env`

```env
PORT=5000
JWT_SECRET=prism_project_tracker_secret_key_change_in_production_12345678
DATABASE_PATH=./database.sqlite
NODE_ENV=development
```

⚠️ **IMPORTANT for Production**:
- Change `JWT_SECRET` to a secure random string (256-bit recommended)
- Set `NODE_ENV=production`
- Enable HTTPS (via reverse proxy)

### Frontend Environment Variables

File: `client/.env`

```env
VITE_API_URL=http://192.168.50.136:5000
```

**Note**: The application is configured to accept connections from any device on your local network (192.168.50.x). Both localhost and network IP access are supported.

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Admin Routes (Requires Admin Role)
- `GET /api/admin/clients` - List all clients
- `POST /api/admin/clients` - Create client with project
- `DELETE /api/admin/clients/:id` - Delete client
- `GET /api/admin/projects/:projectId` - Get project details
- `POST /api/admin/phases` - Create phase
- `PUT /api/admin/phases/:id` - Update phase
- `DELETE /api/admin/phases/:id` - Delete phase
- `POST /api/admin/tasks` - Create task
- `PUT /api/admin/tasks/:id` - Update task
- `DELETE /api/admin/tasks/:id` - Delete task
- `POST /api/admin/updates` - Create progress update
- `DELETE /api/admin/updates/:id` - Delete update

### Client Routes (Client Access Only)
- `GET /api/client/project` - Get own project
- `GET /api/client/phases/:id` - Get phase details
- `GET /api/client/tasks/:id` - Get task details

### Comments Routes (Both Roles)
- `POST /api/comments` - Create comment
- `GET /api/comments/task/:taskId` - Get task comments
- `GET /api/comments/phase/:phaseId` - Get phase comments
- `DELETE /api/comments/:id` - Delete comment

---

## 🔒 Security Features

✅ **Implemented**:
- Bcrypt password hashing (10 salt rounds)
- JWT with httpOnly cookies (prevents XSS token theft)
- Secure random admin password generation
- Rate limiting (5 login attempts per 15min, 100 requests per 15min)
- Helmet security headers
- CORS configuration
- Input validation with Zod
- XSS protection (HTML escaping)
- SQL injection prevention (parameterized queries)
- Role-based access control

⚠️ **For Production**:
- Enable HTTPS (set up reverse proxy with nginx/Caddy)
- Set secure flag on cookies (`NODE_ENV=production`)
- Change JWT_SECRET to strong random value
- Review and configure CORS allowed origins
- Set up automated database backups

---

## 📊 Database Schema

### Tables
- **users**: Admin and client accounts with credentials
- **projects**: Client projects (1:1 with users)
- **phases**: Project phases (4 per project, customizable names)
- **tasks**: Sequential tasks within phases
- **comments**: Comments on tasks and phases
- **updates**: Progress updates from admin

All foreign keys have CASCADE DELETE for data integrity.

---

## 🚧 Next Steps / Future Enhancements

The MVP is complete and functional. Consider adding:

1. **Enhanced Admin Features**:
   - Client search and filtering
   - Bulk task operations
   - Project templates
   - Dashboard analytics

2. **Enhanced Client Features**:
   - Email notifications for updates
   - File attachments on comments
   - Export project report (PDF)
   - Mobile-responsive improvements

3. **System Improvements**:
   - Real-time updates (WebSocket)
   - Audit logging
   - Soft deletes
   - Database migration system
   - Automated backups

4. **Testing**:
   - Unit tests for API routes
   - Integration tests
   - E2E tests with Playwright

---

## 🐛 Troubleshooting

### Backend won't start
- Check Node.js version (requires 18+)
- Verify `server/.env` exists
- Check port 5000 is not in use: `lsof -i :5000`
- Review server logs for errors

### Frontend won't start
- Check `client/.env` exists
- Verify frontend dependencies installed: `cd client && npm install`
- Check port 5173 is not in use

### Can't login
- Verify backend is running
- Check browser console for API errors
- Verify credentials (username/password)
- Check database.sqlite exists in server directory

### CORS errors
- Ensure backend is running on port 5000
- Ensure frontend is running on port 5173
- Check `VITE_API_URL` in `client/.env`

---

## 📚 Additional Documentation

- **Full Implementation Guide**: See `CLAUDE.md`
- **Architecture Details**: See `ARCHITECTURE.md`
- **User Documentation**: See `README.md`

---

## ✨ Key Features

### Admin Panel
- Create and manage multiple clients
- Customize project phases
- Sequential task management
- Status tracking (Not Started, In Progress, Completed, Blocked)
- Progress updates with dates and notes
- Comment management

### Client Portal
- Real-time project overview
- Phase and task progress tracking
- View admin updates and milestones
- Comment on tasks and phases
- Clean glassmorphic UI

### Security
- Secure authentication and authorization
- Rate limiting and input validation
- XSS and SQL injection protection
- Forced password change on first login

---

**Built with ❤️ using Claude Code**

For questions or issues, check the documentation or review the codebase structure.

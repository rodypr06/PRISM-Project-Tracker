# Project Management Portal

A modern, glassmorphic client project tracking system with admin management capabilities.

## Features

### For Administrators
- 🎯 Manage multiple clients and their projects
- 📊 Create customizable project phases (4 phases: Phase 0-3)
- ✅ Add and manage sequential tasks within phases
- 📝 Post progress updates with dates and notes
- 💬 Respond to client comments
- 🔐 Generate client credentials for secure access

### For Clients
- 📈 Real-time project progress overview
- 🎨 Beautiful glassmorphic interface
- 📋 Sequential task tracking with status indicators
- 💭 Comment on tasks and phases
- 📅 View milestone dates and updates
- 🔒 Secure, personalized login

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT with httpOnly cookies
- **Design**: Glassmorphism with Teal/Cyan accent colors

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone or create the project** (if using Claude Code CLI, it will handle this)

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Install frontend dependencies**
```bash
cd client
npm install
```

4. **Set up environment variables**

Create `server/.env`:
```env
PORT=5000
JWT_SECRET=change-this-to-a-random-secret-in-production
DATABASE_PATH=./database.sqlite
NODE_ENV=development
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
```

5. **Start the development servers**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### First Login

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Important**: You will be forced to change the password on first login.

## Project Structure

```
project-portal/
├── server/               # Backend Express application
│   ├── src/
│   │   ├── config/      # Database configuration
│   │   ├── middleware/  # Auth and admin middleware
│   │   ├── routes/      # API route handlers
│   │   ├── models/      # Database models
│   │   └── server.js    # Entry point
│   └── package.json
│
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Auth context
│   │   ├── utils/       # API utilities
│   │   └── App.jsx      # Main app component
│   └── package.json
│
├── CLAUDE.md           # Full implementation guide
├── ARCHITECTURE.md     # System architecture details
└── README.md          # This file
```

## Usage Guide

### Admin Workflow

1. **Login** with admin credentials
2. **Create a new client**:
   - Click "Create New Client"
   - Enter client name, company, project name, and contact
   - System auto-generates username and password
   - Customizes 4 phase names for the project
   - Phase 0 automatically includes "Initial Assessment" task
3. **Manage project**:
   - Add/edit/delete phases and tasks
   - Update task statuses (Not Started → In Progress → Completed)
   - Add progress notes and milestone dates
   - Respond to client comments
4. **Track all clients** from the dashboard

### Client Workflow

1. **Login** with credentials provided by admin
2. **View project overview**:
   - See all phases with progress indicators
   - Expand phases to view tasks
   - Check task statuses and updates
3. **Leave comments**:
   - Ask questions on specific tasks or phases
   - Get responses from admin
4. **Track progress** in real-time

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Admin (Protected)
- `GET /api/admin/clients` - List all clients
- `POST /api/admin/clients` - Create client + project
- `GET /api/admin/clients/:id` - Get client details
- `PUT /api/admin/clients/:id` - Update client
- `DELETE /api/admin/clients/:id` - Delete client
- `POST /api/admin/phases` - Create phase
- `PUT /api/admin/phases/:id` - Update phase
- `DELETE /api/admin/phases/:id` - Delete phase
- `POST /api/admin/tasks` - Create task
- `PUT /api/admin/tasks/:id` - Update task
- `DELETE /api/admin/tasks/:id` - Delete task
- `POST /api/admin/updates` - Create update

### Client (Protected)
- `GET /api/client/project` - Get own project
- `GET /api/client/phases/:id` - Get phase details
- `GET /api/client/tasks/:id` - Get task details

### Comments (Protected)
- `POST /api/comments` - Create comment
- `GET /api/comments/task/:taskId` - Get task comments
- `GET /api/comments/phase/:phaseId` - Get phase comments
- `DELETE /api/comments/:id` - Delete comment

## Database Schema

### Tables
- **users**: Admin and client accounts
- **projects**: Client projects
- **phases**: Project phases (4 per project)
- **tasks**: Sequential tasks within phases
- **comments**: Comments on tasks and phases
- **updates**: Progress updates from admin

See `CLAUDE.md` for detailed schema definitions.

## Security Features

- Password hashing with bcrypt
- JWT authentication with httpOnly cookies
- Role-based access control (admin vs client)
- SQL injection prevention via parameterized queries
- XSS protection via httpOnly cookies
- Input validation on all endpoints

## Design System

### Colors
- **Primary**: Teal/Cyan (#0891b2, #06b6d4)
- **Neutral**: Slate/Gray (#475569, #64748b)
- **Success**: Emerald (#10b981)
- **Warning**: Amber (#f59e0b)
- **Danger**: Rose (#f43f5e)

### Status Indicators
- **Not Started**: Gray
- **In Progress**: Amber
- **Completed**: Emerald
- **Blocked**: Rose

### Glassmorphism
- Frosted glass effect with backdrop blur
- Semi-transparent cards with subtle borders
- Soft shadows for depth
- Smooth transitions and animations

## Production Deployment

### Building for Production

1. **Build the frontend**:
```bash
cd client
npm run build
```

2. **Configure the server to serve static files**:
The Express server will automatically serve the built React app from `client/dist`.

3. **Set production environment variables**:
```env
NODE_ENV=production
JWT_SECRET=use-a-secure-random-string-here
PORT=5000
```

4. **Start the server**:
```bash
cd server
npm start
```

### Homelab Deployment

1. **Install as a service** (systemd example):

Create `/etc/systemd/system/project-portal.service`:
```ini
[Unit]
Description=Project Management Portal
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/project-portal/server
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

2. **Enable and start**:
```bash
sudo systemctl enable project-portal
sudo systemctl start project-portal
```

3. **Set up reverse proxy** (nginx example):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Enable HTTPS with Let's Encrypt**:
```bash
sudo certbot --nginx -d your-domain.com
```

## Backup and Maintenance

### Database Backup
The SQLite database is a single file. Backup regularly:
```bash
cp server/database.sqlite backups/database-$(date +%Y%m%d).sqlite
```

### Automated Backups (cron example)
```bash
0 2 * * * cp /path/to/project-portal/server/database.sqlite /path/to/backups/database-$(date +\%Y\%m\%d).sqlite
```

## Troubleshooting

### Port Already in Use
Change the PORT in `server/.env` and `client/.env` (VITE_API_URL).

### Database Locked
SQLite only allows one writer at a time. This shouldn't be an issue for typical usage, but if you encounter this, check for long-running transactions.

### Admin Can't Login
Reset admin password directly in database:
```sql
-- Generate new hash for "newpassword123"
-- Then update in database
UPDATE users SET password = '$2b$10$...' WHERE username = 'admin';
```

### CORS Issues
Ensure `server/.env` PORT matches `client/.env` VITE_API_URL.

## Contributing

This project was generated with Claude Code CLI. To modify:

1. Edit `CLAUDE.md` with your desired changes
2. Run Claude Code CLI to regenerate the project
3. Test thoroughly before deploying

## License

MIT License - Feel free to use and modify for your needs.

## Support

For issues or questions:
1. Check the `CLAUDE.md` for implementation details
2. Review `ARCHITECTURE.md` for system design
3. Check server logs for error messages
4. Ensure all environment variables are set correctly

---

Built with ❤️ using Claude Code CLI

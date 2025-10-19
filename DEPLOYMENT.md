# PRISM Project Tracker - Deployment Guide

## Production Deployment to prism.rodytech.net

### Prerequisites
- Node.js 18+ installed on server
- Nginx installed and configured
- SSL certificate for prism.rodytech.net (Let's Encrypt recommended)
- PM2 or similar process manager for Node.js

### Step 1: Build the Application

#### Build Frontend
```bash
cd /home/macboypr/prism-client-project-tracker/client
npm install
npm run build
```

This creates an optimized production build in `client/dist/`

#### Prepare Backend
```bash
cd /home/macboypr/prism-client-project-tracker/server
npm install --production
```

### Step 2: Configure Environment Variables

#### Backend (.env)
```bash
cd /home/macboypr/prism-client-project-tracker/server
nano .env
```

Add:
```
PORT=5000
JWT_SECRET=your-secure-random-secret-key-change-this
DATABASE_PATH=./database.sqlite
NODE_ENV=production
FRONTEND_URL=https://prism.rodytech.net
```

#### Frontend
The frontend is already configured to use relative URLs in production (empty VITE_API_URL)

### Step 3: Setup Nginx as Reverse Proxy

Copy the nginx configuration:
```bash
sudo cp /home/macboypr/prism-client-project-tracker/nginx-config.conf /etc/nginx/sites-available/prism.rodytech.net
sudo ln -s /etc/nginx/sites-available/prism.rodytech.net /etc/nginx/sites-enabled/
```

Test nginx configuration:
```bash
sudo nginx -t
```

Reload nginx:
```bash
sudo systemctl reload nginx
```

### Step 4: Setup SSL Certificate (if not already done)

Using Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d prism.rodytech.net
```

### Step 5: Start Backend with PM2

Install PM2 globally:
```bash
sudo npm install -g pm2
```

Start the backend:
```bash
cd /home/macboypr/prism-client-project-tracker/server
pm2 start src/server.js --name prism-backend
pm2 save
pm2 startup
```

### Step 6: Verify Deployment

1. Check backend is running:
   ```bash
   pm2 status
   curl http://localhost:5000/health
   ```

2. Check frontend is accessible:
   ```bash
   curl -I https://prism.rodytech.net
   ```

3. Check API proxy is working:
   ```bash
   curl https://prism.rodytech.net/api/health
   ```

### Step 7: Initialize Database

On first deployment, the database will be created automatically with a default admin user:
- Username: `admin`
- Password: `admin123`

**Important:** Change this password immediately after first login!

## Monitoring and Maintenance

### View Backend Logs
```bash
pm2 logs prism-backend
```

### Restart Backend
```bash
pm2 restart prism-backend
```

### Stop Backend
```bash
pm2 stop prism-backend
```

### Update Application

#### Update Frontend
```bash
cd /home/macboypr/prism-client-project-tracker/client
git pull  # or copy new files
npm install
npm run build
```

#### Update Backend
```bash
cd /home/macboypr/prism-client-project-tracker/server
git pull  # or copy new files
npm install --production
pm2 restart prism-backend
```

## Troubleshooting

### Mixed Content Errors
If you see "Mixed Content" errors in browser console:
- Verify nginx is properly proxying `/api/` requests
- Check SSL certificate is valid
- Ensure `VITE_API_URL` is empty in `.env` for production

### Backend Not Accessible
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs prism-backend

# Check if port 5000 is listening
sudo netstat -tlnp | grep 5000

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Issues
```bash
# Check database file permissions
ls -la /home/macboypr/prism-client-project-tracker/server/database.sqlite

# Backup database
cp database.sqlite database.backup.sqlite
```

## Security Checklist

- ✅ Change default admin password
- ✅ Use strong JWT_SECRET in production
- ✅ Enable firewall (only ports 80, 443, 22 open)
- ✅ Keep SSL certificates up to date
- ✅ Regular database backups
- ✅ Monitor PM2 logs for suspicious activity
- ✅ Keep dependencies updated

## Backup Strategy

### Automated Daily Backup Script
Create `/home/macboypr/backup-prism.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/macboypr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /home/macboypr/prism-client-project-tracker/server/database.sqlite \
   $BACKUP_DIR/database_$DATE.sqlite
# Keep only last 30 days
find $BACKUP_DIR -name "database_*.sqlite" -mtime +30 -delete
```

Make executable and add to crontab:
```bash
chmod +x /home/macboypr/backup-prism.sh
crontab -e
# Add: 0 2 * * * /home/macboypr/backup-prism.sh
```

## Production URLs

- **Frontend**: https://prism.rodytech.net
- **API**: https://prism.rodytech.net/api
- **Health Check**: https://prism.rodytech.net/health

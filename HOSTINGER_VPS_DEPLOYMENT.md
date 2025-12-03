# PAYBACK247 - Hostinger VPS Deployment Guide

## Prerequisites
- Hostinger VPS with Ubuntu 20.04+ or similar Linux
- SSH access to your VPS
- Domain name (optional, but recommended)
- Root or sudo privileges

---

## Step 1: Connect to VPS & Install Dependencies

Connect via SSH and run:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2

# Verify installations
node --version
npm --version
postgres --version
nginx --version
```

---

## Step 2: Create App Directory & Deploy Code

```bash
# Create app directory
mkdir -p /var/www/payback247
cd /var/www/payback247

# Option A: Clone from Git (if you have a repo)
# git clone your_repo_url .

# Option B: Copy via SCP (from your local machine)
# scp -r /path/to/payback247/* root@your_vps_ip:/var/www/payback247/

# Install dependencies
npm install

# Build the app
npm run build
```

---

## Step 3: Setup PostgreSQL Database

```bash
# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user (run these commands)
sudo -u postgres psql

# Inside psql console:
CREATE USER payback247 WITH PASSWORD 'your_strong_db_password_123!';
CREATE DATABASE payback247 OWNER payback247;
ALTER ROLE payback247 WITH CREATEDB;
\q
```

**Your Database Connection String:**
```
postgresql://payback247:your_strong_db_password_123!@localhost:5432/payback247
```

---

## Step 4: Create Environment File

```bash
cd /var/www/payback247
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://payback247:your_strong_db_password_123!@localhost:5432/payback247

# Environment
NODE_ENV=production

# Admin
ADMIN_DEFAULT_PASSWORD=YourVeryStrongPassword123!@#

# App
PORT=5000
HOST=0.0.0.0

# Email (optional - update if you want email notifications)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your_email@your_domain.com
SMTP_PASSWORD=your_email_password
EOF
```

---

## Step 5: Setup PM2 Process Manager

```bash
# Create PM2 config
cat > /var/www/payback247/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'payback247',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      cwd: '/var/www/payback247',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      max_memory_restart: '500M',
      autorestart: true,
    },
  ],
};
EOF

# Create logs directory
mkdir -p /var/www/payback247/logs

# Start the app
pm2 start ecosystem.config.js

# Setup auto-start on system reboot
pm2 startup
# Follow the output instructions
pm2 save
```

---

## Step 6: Configure Nginx Reverse Proxy

```bash
# Create Nginx config
cat > /etc/nginx/sites-available/payback247 << 'EOF'
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your_domain.com www.your_domain.com;

    ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:5000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/payback247 /etc/nginx/sites-enabled/payback247

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
```

---

## Step 7: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
certbot certonly --standalone -d your_domain.com -d www.your_domain.com

# Auto-renewal is automatic
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## Step 8: Firewall Setup

```bash
# Enable UFW
ufw enable

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Check status
ufw status
```

---

## Step 9: Verify Everything Works

```bash
# Check if app is running
pm2 status

# View logs
pm2 logs payback247

# Test app locally
curl http://localhost:5000/health

# Check Nginx
systemctl status nginx

# Check PostgreSQL
systemctl status postgresql
```

---

## Step 10: Access Your App

Visit: `https://your_domain.com`

Or by IP (no domain): `https://your_vps_ip`

---

## Maintenance

### Restart App
```bash
pm2 restart payback247
```

### Stop App
```bash
pm2 stop payback247
```

### View Logs
```bash
pm2 logs payback247
tail -f /var/www/payback247/logs/error.log
```

### Update Code
```bash
cd /var/www/payback247
git pull origin main
npm install
npm run build
pm2 restart payback247
```

### Database Backup
```bash
pg_dump -U payback247 payback247 > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
psql -U payback247 payback247 < backup_file.sql
```

---

## Troubleshooting

### App won't start?
```bash
pm2 logs payback247
cat /var/www/payback247/logs/error.log
```

### Database connection error?
```bash
# Test connection
psql -U payback247 -d payback247 -c "SELECT 1;"
# Check .env DATABASE_URL
```

### Nginx not working?
```bash
nginx -t
systemctl restart nginx
tail -f /var/log/nginx/error.log
```

### SSL renewal issues?
```bash
certbot renew --dry-run
certbot renew --force-renewal
```

---

## Cost
- **Hostinger VPS**: ~$2.99-5.99/month
- **PostgreSQL**: Free (local)
- **Total**: ~$3-6/month

Much cheaper than Replit production!

---

## Need Help?
1. Check Hostinger control panel
2. Review PM2 and Nginx logs
3. Test database connection
4. Verify SSL certificates

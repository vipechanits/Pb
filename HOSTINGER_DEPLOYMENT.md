# PAYBACK247 - Hostinger VPS Deployment Guide

## Prerequisites
- Hostinger VPS with Ubuntu 20.04+ or similar Linux
- SSH access to your VPS
- Domain name (optional, but recommended)
- Root or sudo privileges

---

## Step 1: Connect to VPS & Install Dependencies

```bash
# Connect via SSH
ssh root@your_vps_ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18+ (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL (if running DB locally)
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2

# Verify installations
node --version    # Should show v18+
npm --version
postgres --version
nginx --version
```

---

## Step 2: Create App Directory & Clone Code

```bash
# Create app directory
mkdir -p /var/www/payback247
cd /var/www/payback247

# Clone your repository (if using Git)
# git clone your_repo_url .
# OR copy files via SCP/SFTP

# Copy entire project folder from local machine:
# scp -r /path/to/payback247/* root@your_vps_ip:/var/www/payback247/

# Install dependencies
npm install

# Build the app
npm run build

# Verify build succeeded
ls -la dist/
```

---

## Step 3: Setup PostgreSQL Database

```bash
# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER payback247 WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE payback247 OWNER payback247;
ALTER ROLE payback247 WITH CREATEDB;
\q

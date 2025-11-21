# PAYBACK247 - Complete Backup & Migration Guide

## Overview
This guide covers full platform backup, restoration, and migration to other hosting providers.

---

## Part 1: Database Backup & Restore

### Automatic Backup (Admin Panel)
1. **Access**: Go to Admin Dashboard → System Management → Backup
2. **Create Backup**: Click "Create Full Backup" button
3. **Download**: Automatic download of JSON file containing:
   - All users and profiles
   - All activations and activation payments
   - All income transactions
   - All notifications and re-entries
   - All matrix positions

### Restore from Backup
1. **Access**: Admin Dashboard → System Management → Restore
2. **Upload**: Select backup JSON file
3. **Confirm**: Review and confirm restoration
4. **Wait**: System restores all data in correct order

### Manual Database Backup (PostgreSQL)
```bash
# Export entire database to SQL
pg_dump DATABASE_URL > backup_$(date +%s).sql

# Export as CSV for specific tables
psql DATABASE_URL -c "COPY users TO STDOUT WITH CSV HEADER;" > users_backup.csv
psql DATABASE_URL -c "COPY activation_payments TO STDOUT WITH CSV HEADER;" > payments_backup.csv
psql DATABASE_URL -c "COPY income_transactions TO STDOUT WITH CSV HEADER;" > income_backup.csv
```

---

## Part 2: Full Framework Backup

### 1. Source Code Backup
```bash
# Clone/backup all code
git clone https://github.com/YOUR_USERNAME/payback247.git backup_payback247
cd backup_payback247

# Tag current version
git tag -a v1.0-backup -m "Full platform backup $(date)"
git push origin v1.0-backup
```

### 2. Configuration Backup
**Files to backup separately:**
- `.env.production` (secrets - store securely)
- `vite.config.ts` (build config)
- `tailwind.config.ts` (UI config)
- `drizzle.config.ts` (database config)
- `package.json` (dependencies)
- `tsconfig.json` (TypeScript config)

### 3. Database Schema Export
```bash
# Export schema only (no data)
pg_dump --schema-only DATABASE_URL > schema_backup.sql

# Export data only
pg_dump --data-only DATABASE_URL > data_backup.sql
```

### 4. Full Backup Package
```bash
#!/bin/bash
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DATABASE_URL > $BACKUP_DIR/database.sql
pg_dump --schema-only $DATABASE_URL > $BACKUP_DIR/schema.sql

# Backup source code
cp -r . $BACKUP_DIR/source_code --exclude=node_modules --exclude=.git

# Backup environment
cp .env.production $BACKUP_DIR/.env.backup

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR

echo "Complete backup created: $BACKUP_DIR.tar.gz"
```

---

## Part 3: Migration to Other Hosting

### Option A: Migrate to AWS/Azure/Google Cloud

#### Step 1: Prepare Environment
```bash
# 1. Export current database
pg_dump $DATABASE_URL > payback247_backup.sql

# 2. Export code
git clone your-repo migration_copy
cd migration_copy

# 3. Create new PostgreSQL instance on target hosting
# AWS RDS / Azure Database / Google Cloud SQL / DigitalOcean
```

#### Step 2: Set Up New Database
```bash
# 1. Connect to new database
PGPASSWORD=your_password psql -h new-db-host.com -U admin -d payback247

# 2. Restore schema
psql -h new-db-host.com -U admin -d payback247 < schema_backup.sql

# 3. Run migrations
npm run db:push
```

#### Step 3: Deploy Application
```bash
# 1. Set environment variables
export DATABASE_URL="postgresql://user:pass@new-host:5432/payback247"
export NODE_ENV="production"

# 2. Install dependencies
npm install

# 3. Build application
npm run build

# 4. Start application
npm start
```

### Option B: Migrate to Docker Container
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy files
COPY package*.json ./
COPY . .

# Install dependencies
RUN npm install
RUN npm run build

# Expose port
EXPOSE 5000

# Start
CMD ["npm", "start"]
```

```bash
# Build & Run
docker build -t payback247:latest .
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e NODE_ENV="production" \
  payback247:latest
```

### Option C: Migrate to Traditional Linux Server
```bash
# 1. SSH into server
ssh user@server.com

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PostgreSQL client
sudo apt-get install -y postgresql-client

# 4. Clone repository
git clone your-repo /var/www/payback247
cd /var/www/payback247

# 5. Set up environment
echo 'DATABASE_URL=postgresql://user:pass@db-host:5432/payback247' > .env.production
echo 'NODE_ENV=production' >> .env.production

# 6. Install & Start
npm install
npm run build

# 7. Use PM2 for process management
npm install -g pm2
pm2 start npm --name payback247 -- start
pm2 save
pm2 startup
```

---

## Part 4: GitHub Repository Sync

### Initial Setup
```bash
# 1. Create GitHub repository
# - Go to github.com/new
# - Create "payback247" repository (PRIVATE)
# - DO NOT initialize with README

# 2. Push current code
cd /home/runner/workspace
git remote add origin https://github.com/YOUR_USERNAME/payback247.git
git branch -M main
git push -u origin main

# 3. Add all files
git add .
git commit -m "Initial commit: Complete PAYBACK247 platform"
git push
```

### Automatic GitHub Backup
```bash
#!/bin/bash
# Add to crontab for automatic hourly sync

# Run: crontab -e
# Add: 0 * * * * /home/runner/workspace/github-sync.sh

# github-sync.sh
#!/bin/bash
cd /home/runner/workspace
git add .
git commit -m "Auto backup: $(date)" || true
git push origin main
```

### Restore from GitHub
```bash
# Clone to new location
git clone https://github.com/YOUR_USERNAME/payback247.git payback247_restored
cd payback247_restored

# View all backups/tags
git tag -l

# Checkout specific version
git checkout v1.0-backup

# Install and run
npm install
npm run db:push
npm start
```

---

## Part 5: Backup API Endpoints

### Admin Endpoints
```
POST   /api/admin/system/backup           → Download full JSON backup
POST   /api/admin/system/restore          → Upload & restore backup
GET    /api/admin/reports/export-csv      → Export payment reports

GET    /api/admin/reports/daily           → Daily payment report
GET    /api/admin/reports/weekly          → Weekly payment report
GET    /api/admin/reports/monthly         → Monthly payment report
```

---

## Part 6: Data Tables for Backup

### All Tables Included:
1. **users** - User accounts, profiles, payment details
2. **activations** - User activation records, status tracking
3. **activation_payments** - 8-payment system for each activation
4. **income_transactions** - All income earned (sponsor, binary, matrix)
5. **activation_matrix_positions** - Global matrix placement per cycle
6. **notifications** - User notifications and alerts
7. **reentries** - Re-entry cycles and history
8. **system_config** - Platform configuration (payment amounts, limits)
9. **binary_match_queue** - Binary matching queue
10. **user_income_summary** - Aggregate income summaries

---

## Part 7: Disaster Recovery Checklist

- [ ] Weekly full database backups created
- [ ] Backups stored in secure cloud storage (AWS S3, Google Cloud Storage)
- [ ] GitHub repository kept in sync
- [ ] Test restore procedure monthly
- [ ] Document all environment variables
- [ ] Store secrets in secure vault (AWS Secrets Manager, etc.)
- [ ] Monitor backup success/failures
- [ ] Keep old backups for at least 30 days
- [ ] Document all third-party integrations

---

## Part 8: Restore from Complete Backup

### Step-by-Step Recovery
```bash
# 1. Extract backup
tar -xzf backup_20240101_000000.tar.gz
cd backup_20240101_000000

# 2. Set up new environment
export DATABASE_URL="postgresql://new_host..."
export NODE_ENV="production"

# 3. Create fresh database
createdb payback247

# 4. Restore schema & data
psql payback247 < schema_backup.sql
psql payback247 < data_backup.sql

# 5. Install application
cd source_code
npm install
npm run build

# 6. Verify integrity
npm run db:push --force

# 7. Start service
npm start
```

---

## Support & Monitoring

- **Backup Logs**: `/var/log/payback247-backup.log`
- **Database Logs**: Check PostgreSQL logs on your hosting
- **Application Logs**: See admin dashboard → System Status

For issues: Contact support with backup ID and timestamp.

# GitHub Integration Setup

## Quick Start

### 1. Create GitHub Repository
```bash
# Go to github.com/new
# Create repository: payback247
# Select: Private (recommended)
```

### 2. Link Local Repository to GitHub
```bash
cd /home/runner/workspace

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/payback247.git

# Rename branch to main
git branch -M main

# Push all commits
git push -u origin main
```

### 3. Initial Push
```bash
# Stage all files
git add .

# Commit
git commit -m "Initial: PAYBACK247 Full Platform - Database, Backend, Frontend"

# Push to GitHub
git push origin main
```

---

## Continuous Backup Setup

### Option 1: GitHub Actions (Automatic Backup)
Create `.github/workflows/backup.yml`:
```yaml
name: Daily Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create backup
        run: |
          timestamp=$(date +%Y%m%d_%H%M%S)
          git add .
          git commit -m "Backup: $timestamp" || true
          
      - name: Push backup
        run: git push origin main
```

### Option 2: Manual Git Workflow
```bash
#!/bin/bash
# save-to-github.sh

cd /home/runner/workspace

# Stage changes
git add -A

# Commit with timestamp
git commit -m "Backup: $(date +%Y-%m-%d\ %H:%M:%S)" || true

# Push to GitHub
git push origin main

echo "Backup pushed to GitHub at $(date)"
```

---

## Version Tagging

### Create Backup Tags
```bash
# Tag current version
git tag -a v1.0-production -m "Production deployment v1.0"
git push origin v1.0-production

# List all tags
git tag -l

# Checkout specific version
git checkout v1.0-production
```

---

## Migration from GitHub to New Hosting

```bash
# 1. Clone from GitHub
git clone https://github.com/YOUR_USERNAME/payback247.git /var/www/payback247

# 2. Install dependencies
cd /var/www/payback247
npm install

# 3. Set up environment
export DATABASE_URL="postgresql://..."
export NODE_ENV="production"

# 4. Build and start
npm run build
npm start
```

---

## GitHub Best Practices

1. **Keep Secrets Out**: Never commit `.env` files
   ```
   # .gitignore
   .env
   .env.local
   .env.production
   *.log
   node_modules/
   dist/
   ```

2. **Use GitHub Secrets** for CI/CD:
   - Go to Repository Settings → Secrets
   - Add: `DATABASE_URL`, `API_KEYS`, etc.

3. **Branch Protection**: 
   - Settings → Branches → Add rule for `main`
   - Require pull requests before merging

4. **Access Control**:
   - Settings → Collaborators
   - Add team members with appropriate permissions

---

## Recovery from GitHub

```bash
# If local files are corrupted
git reset --hard HEAD

# If need to rollback to previous version
git log --oneline  # View history
git checkout <commit-hash>

# Update to latest
git pull origin main
```

All commits and versions are preserved on GitHub!

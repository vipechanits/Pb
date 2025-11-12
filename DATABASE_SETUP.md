# Database Configuration Guide

This guide explains how to configure separate development and production databases for PAYBACK247.

## Overview

The application now supports separate databases for development and production environments:

- **Development**: Uses `DEV_DATABASE_URL` for safe testing without affecting production data
- **Production**: Always uses `DATABASE_URL` (automatically set by Replit deployment)

## Environment Detection

The system automatically detects which environment it's running in:

```typescript
// Production: REPL_DEPLOYMENT=1 (set automatically by Replit)
// Development: REPL_DEPLOYMENT is not set
```

## Quick Setup

### For Development Workspace

1. **Create a development database** (if you don't have one):
   - Go to https://console.neon.tech
   - Create a new project: `payback247-dev`
   - Copy the connection string

2. **Add to Replit Secrets:**
   - Click **Tools** → **Secrets**
   - Add new secret:
     - Key: `DEV_DATABASE_URL`
     - Value: `postgresql://username:password@host/database?sslmode=require`

3. **Keep production database:**
   - Keep `DATABASE_URL` secret as-is (for production reference)

4. **Restart the workspace:**
   - The app will automatically use `DEV_DATABASE_URL`
   - You'll see: `📊 Using development database (DEV_DATABASE_URL)`

### For Production Deployment

**No action needed!**

- Production automatically uses `DATABASE_URL`
- Replit sets this automatically when you deploy
- Your development database remains separate and safe

## Configuration Options

### Option 1: Separate Databases (Recommended)

**Development:**
```env
DEV_DATABASE_URL=postgresql://dev-user:dev-pass@dev-host/payback247_dev
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host/payback247_prod
```

**Production (Deployment):**
```env
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host/payback247_prod
```

**Benefits:**
- ✅ Safe testing without affecting production
- ✅ Can reset dev data anytime
- ✅ Test payments, activations, user flows freely
- ✅ Production data stays untouched

### Option 2: Shared Database (Not Recommended)

**Both Environments:**
```env
DATABASE_URL=postgresql://user:pass@host/payback247
# DEV_DATABASE_URL not set
```

**Warning:**
- ⚠️ Development changes affect production
- ⚠️ Cannot safely test destructive operations
- ⚠️ Risk of data corruption

## Console Output

### Development with Separate Database

```
🗄️  Database Environment: DEVELOPMENT
🗄️  Using Development Database
📊 Using development database (DEV_DATABASE_URL)
✓ Database connection configured
✓ Environment variables validated
✓ Starting PAYBACK247 server...
```

### Development with Production Database (Fallback)

```
🗄️  Database Environment: DEVELOPMENT
🗄️  Using Production Database
⚠️  DEV_DATABASE_URL not set, using DATABASE_URL for development
💡 To use separate dev database, set DEV_DATABASE_URL in Secrets
✓ Database connection configured
✓ Environment variables validated
✓ Starting PAYBACK247 server...
```

### Production Deployment

```
🗄️  Database Environment: PRODUCTION
✓ Database connection configured
✓ Environment variables validated
✓ Starting PAYBACK247 server...
```

## Database Schema Sync

### Push Schema to Development Database

```bash
# The db:push command will use DEV_DATABASE_URL automatically
npm run db:push
```

### Push Schema to Production Database

**Option A: Through Deployment**
- Deploy your app
- Schema syncs automatically on first run
- Replit handles database migrations

**Option B: Manual (Not Recommended)**
```bash
# Temporarily remove DEV_DATABASE_URL from Secrets
# Run db:push
npm run db:push
# Re-add DEV_DATABASE_URL
```

## Testing the Setup

1. **Check which database is being used:**
```bash
# Start the app and check console output
npm run dev
```

Look for these log messages:
- `📊 Using development database` = Development DB active
- `⚠️ DEV_DATABASE_URL not set` = Using production DB

2. **Verify database connectivity:**
```bash
# Development
echo $DEV_DATABASE_URL

# Production
echo $DATABASE_URL
```

3. **Test data isolation:**
   - Create a test user in development
   - Deploy to production
   - Verify test user doesn't exist in production

## Common Scenarios

### Scenario 1: Reset Development Data

```bash
# 1. Drop all tables from dev database (using Neon console or SQL client)
# 2. Push fresh schema
npm run db:push
# 3. Restart workspace
# Development database is now clean
```

### Scenario 2: Copy Production Data to Development

```bash
# 1. From production: Download database backup
# Visit /admin/database and download backup (PB1 only)

# 2. Switch to development database
# Make sure DEV_DATABASE_URL is set

# 3. Upload and restore backup
# Visit /admin/database and restore the backup

# Your development database now has production data copy
```

### Scenario 3: Test Payment Flows Safely

```bash
# 1. Ensure DEV_DATABASE_URL is set
# 2. Create test users in development
# 3. Test payment submissions, confirmations, rejections
# 4. Test activation completion
# 5. Verify binary tree placement
# 6. Check matrix income calculations
# All testing happens in dev database only!
```

## Troubleshooting

### Error: "Either DEV_DATABASE_URL or DATABASE_URL must be set"

**Solution:** Set at least `DATABASE_URL` in Secrets

```
Key: DATABASE_URL
Value: postgresql://...
```

### Error: "DATABASE_URL is required in production"

**Solution:** Production deployments automatically set `DATABASE_URL`. If you see this error, contact Replit support.

### Warning: Using production database for development

**Solution:** Set `DEV_DATABASE_URL` to use a separate development database

```
Key: DEV_DATABASE_URL
Value: postgresql://your-dev-database-url
```

### Schema mismatch between dev and production

**Solution:** Keep schemas in sync:

1. Make schema changes in `shared/schema.ts`
2. Push to development: `npm run db:push`
3. Test thoroughly
4. Commit and push to GitHub
5. Deploy to production (schema syncs automatically)

## Security Best Practices

1. **Never share database credentials:**
   - Keep `DATABASE_URL` and `DEV_DATABASE_URL` secret
   - Don't commit them to Git
   - Use Replit Secrets

2. **Use read-only accounts for analytics:**
   - Create read-only database users for reporting
   - Never use admin credentials in app code

3. **Regular backups:**
   - Production: Daily backups via `/admin/database` (PB1 only)
   - Development: Optional (can recreate from schema)

4. **Access control:**
   - Limit who can access production database
   - Use separate credentials for dev and prod
   - Rotate credentials periodically

## Migration Strategy

### Development → Staging → Production

For enterprise-grade deployments:

1. **Development Database:**
   ```env
   DEV_DATABASE_URL=postgresql://dev-host/payback247_dev
   ```

2. **Staging Database (Optional):**
   ```env
   STAGING_DATABASE_URL=postgresql://staging-host/payback247_staging
   ```

3. **Production Database:**
   ```env
   DATABASE_URL=postgresql://prod-host/payback247_prod
   ```

Modify `server/db-config.ts` to support staging environment.

## Support

For database configuration issues:
- Check console logs for environment detection
- Verify Secrets are set correctly
- Ensure database URLs are valid connection strings
- Contact support: admin@payback247.com

---

**Last Updated:** November 2025

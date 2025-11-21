import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Database, Download, Upload, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminDatabase() {
  const { toast } = useToast();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      const response = await apiRequest('POST', '/api/admin/system/backup', {});

      if (!response.ok) throw new Error('Failed to create backup');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payback247-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setLastBackupTime(new Date().toLocaleString('en-IN'));
      toast({
        title: 'Success',
        description: 'Complete database backup downloaded successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create backup',
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (file: File) => {
    try {
      setRestoreLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/system/restore', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to restore backup');

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `Database restored successfully!\n${result.summary}`,
      });

      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to restore backup',
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          Database Backup & Restore
        </h1>
        <p className="text-muted-foreground">
          Manage complete platform backups including all users, activations, payments, and system data
        </p>
      </div>

      {/* Backup Features Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Backup Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Download className="h-5 w-5" />
              Create Complete Backup
            </CardTitle>
            <CardDescription className="text-blue-800 dark:text-blue-200">
              Export entire database with all tables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-2">Includes:</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ All users and profiles</li>
                  <li>✓ Activations and payments</li>
                  <li>✓ Income transactions</li>
                  <li>✓ Matrix positions (all cycles)</li>
                  <li>✓ Notifications and history</li>
                  <li>✓ System configuration</li>
                </ul>
              </div>
              <Button
                onClick={handleBackup}
                disabled={backupLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-backup-database"
              >
                <Download className="mr-2 h-4 w-4" />
                {backupLoading ? 'Creating Backup...' : 'Download Full Backup'}
              </Button>
              {lastBackupTime && (
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Last backup: {lastBackupTime}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Restore Backup Card */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <Upload className="h-5 w-5" />
              Restore from Backup
            </CardTitle>
            <CardDescription className="text-green-800 dark:text-green-200">
              Upload backup file to restore
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="text-sm text-green-900 dark:text-green-100">
                <p className="font-semibold mb-2">Restore restores:</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ All database tables</li>
                  <li>✓ Complete user data</li>
                  <li>✓ Full transaction history</li>
                  <li>✓ Matrix calculations</li>
                  <li>✓ System settings</li>
                  <li>✓ Admin configuration</li>
                </ul>
              </div>
              <input
                type="file"
                accept=".json"
                id="restore-database-file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleRestore(e.target.files[0]);
                  }
                }}
                disabled={restoreLoading}
                data-testid="input-restore-database-file"
              />
              <Button
                onClick={() => document.getElementById('restore-database-file')?.click()}
                disabled={restoreLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                variant="default"
                data-testid="button-restore-database"
              >
                <Upload className="mr-2 h-4 w-4" />
                {restoreLoading ? 'Restoring...' : 'Upload & Restore Backup'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <AlertCircle className="h-5 w-5" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-muted-foreground">
            <p>
              <strong>Backup File Format:</strong> JSON file containing all database tables and metadata
            </p>
            <p>
              <strong>Restore Warning:</strong> Restoring will OVERWRITE all existing database data. Always backup before restoring.
            </p>
            <p>
              <strong>Version Compatibility:</strong> Backups are version 2.0 compatible with all platforms
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <CheckCircle2 className="h-5 w-4" />
              Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-muted-foreground">
            <p>
              <strong>Weekly Backups:</strong> Create backups at least weekly
            </p>
            <p>
              <strong>Store Safely:</strong> Save backups in multiple secure locations
            </p>
            <p>
              <strong>Test Restores:</strong> Test restore procedures monthly to ensure data integrity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Migration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Backup Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">Backup Format</p>
              <p className="text-lg font-semibold">JSON v2.0</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">Tables Included</p>
              <p className="text-lg font-semibold">10 Tables</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">File Size</p>
              <p className="text-lg font-semibold">Variable</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            Backups include: users, activations, activation_payments, income_transactions, notifications, reentries, 
            activation_matrix_positions, binary_match_queue, user_income_summaries, system_config
          </p>
          <div className="pt-4 space-y-2">
            <p className="text-sm font-semibold">Migration Documentation:</p>
            <p className="text-sm text-muted-foreground">
              For migration to AWS, Azure, Google Cloud, Docker, or Linux servers, refer to:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• BACKUP_AND_MIGRATION_GUIDE.md - Complete migration procedures</li>
              <li>• GITHUB_SETUP.md - GitHub repository and backup sync</li>
              <li>• PLATFORM_MIGRATION_CHECKLIST.md - Pre/during/post migration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

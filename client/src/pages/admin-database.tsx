import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Database, Download, Upload, FileJson, AlertCircle, CheckCircle2, Cloud, ExternalLink, Clock, BarChart3, Shield } from 'lucide-react';
import { Loader } from 'lucide-react';

export default function AdminDatabase() {
  const { toast } = useToast();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [googleDriveLoading, setGoogleDriveLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [driveBackups, setDriveBackups] = useState<any[]>([]);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [showGoogleDriveList, setShowGoogleDriveList] = useState(false);
  const [showBackupHistory, setShowBackupHistory] = useState(true);

  useEffect(() => {
    fetchBackupHistory();
    fetchBackupStats();
    const interval = setInterval(() => {
      fetchBackupHistory();
      fetchBackupStats();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBackupStats = async () => {
    try {
      setStatsLoading(true);
      const response = await apiRequest('GET', '/api/admin/system/backup-stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setBackupStats(data);
    } catch (error: any) {
      console.error('Failed to load backup stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (showGoogleDriveList) {
      fetchGoogleDriveBackups();
    }
  }, [showGoogleDriveList]);

  const fetchBackupHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await apiRequest('GET', '/api/admin/system/backup-history');
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      setBackupHistory(data.history || []);
    } catch (error: any) {
      console.error('Failed to load backup history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchGoogleDriveBackups = async () => {
    try {
      setGoogleDriveLoading(true);
      const response = await apiRequest('GET', '/api/admin/system/google-drive-backups');
      if (!response.ok) throw new Error('Failed to fetch backups');
      
      const data = await response.json();
      setDriveBackups(data.files || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load Google Drive backups',
      });
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  const handleRestoreFromDrive = async (fileId: string, fileName: string) => {
    if (!confirm(`Restore database from "${fileName}"? This will overwrite all current data.`)) return;
    
    try {
      setRestoreLoading(true);
      const response = await apiRequest('POST', '/api/admin/system/restore-from-drive', { fileId });
      if (!response.ok) throw new Error('Failed to restore');

      const result = await response.json();
      toast({
        title: 'Success',
        description: `Database restored from Google Drive!\n${result.summary}`,
      });

      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to restore from Google Drive',
      });
    } finally {
      setRestoreLoading(false);
    }
  };

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
      <div className="grid gap-6 md:grid-cols-3">
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

        {/* Restore from File Upload Card */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <Upload className="h-5 w-5" />
              Restore from File
            </CardTitle>
            <CardDescription className="text-green-800 dark:text-green-200">
              Upload local backup file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="text-sm text-green-900 dark:text-green-100">
                <p className="font-semibold mb-2">Restore includes:</p>
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
                {restoreLoading ? 'Restoring...' : 'Upload & Restore'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Google Drive Restore Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Cloud className="h-5 w-5" />
              Restore from Google Drive
            </CardTitle>
            <CardDescription className="text-blue-800 dark:text-blue-200">
              Select backup from cloud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-2">Cloud restore:</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ List all cloud backups</li>
                  <li>✓ Select any backup</li>
                  <li>✓ Restore with one click</li>
                  <li>✓ Version history available</li>
                </ul>
              </div>
              <Button
                onClick={() => setShowGoogleDriveList(!showGoogleDriveList)}
                disabled={googleDriveLoading || restoreLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                variant="default"
                data-testid="button-list-google-drive-backups"
              >
                {googleDriveLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : showGoogleDriveList ? (
                  'Hide Cloud Backups'
                ) : (
                  <>
                    <Cloud className="mr-2 h-4 w-4" />
                    Browse Cloud Backups
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      {showBackupHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Recent Backup History
            </CardTitle>
            <CardDescription>
              Auto-backups and manual backups stored in database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading history...</p>
              </div>
            ) : backupHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No backups yet. Auto-backups will start in 24 hours.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Backup Name</th>
                      <th className="text-left py-2 px-2">Type</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-left py-2 px-2">Size</th>
                      <th className="text-left py-2 px-2">Date</th>
                      <th className="text-left py-2 px-2">Cloud Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupHistory.map((backup: any) => (
                      <tr key={backup.id} className="border-b hover:bg-accent/50">
                        <td className="py-2 px-2 truncate text-xs" data-testid={`backup-history-name-${backup.id}`}>
                          {backup.backupName}
                        </td>
                        <td className="py-2 px-2">
                          {backup.isAutomatic ? (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-2 py-1 rounded">
                              Auto
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 py-1 rounded">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {backup.status === 'completed' ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Completed</span>
                          ) : backup.status === 'failed' ? (
                            <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Failed</span>
                          ) : (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">Pending</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-xs">
                          {backup.fileSizeBytes ? `${(backup.fileSizeBytes / 1024 / 1024).toFixed(2)} MB` : '-'}
                        </td>
                        <td className="py-2 px-2 text-xs">
                          {backup.createdAt ? new Date(backup.createdAt).toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="py-2 px-2">
                          {backup.googleDriveFileId ? (
                            <div className="flex items-center gap-1">
                              <Cloud className="h-3 w-3 text-blue-600" />
                              {backup.googleDriveFolderLink && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-auto p-0 text-xs underline"
                                  onClick={() => window.open(backup.googleDriveFolderLink, '_blank')}
                                  data-testid={`link-cloud-${backup.id}`}
                                >
                                  View
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Local only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Google Drive Backups List */}
      {showGoogleDriveList && (
        <Card className="border-blue-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Available Backups on Google Drive
            </CardTitle>
          </CardHeader>
          <CardContent>
            {googleDriveLoading ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading backups...</p>
              </div>
            ) : driveBackups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No backups found in Google Drive</p>
            ) : (
              <div className="space-y-2">
                {driveBackups.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" data-testid={`backup-name-${file.id}`}>{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.createdTime ? new Date(file.createdTime).toLocaleString('en-IN') : 'Unknown date'}
                        {file.size && ` • ${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      {file.webViewLink && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(file.webViewLink, '_blank')}
                          data-testid={`link-open-drive-${file.id}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleRestoreFromDrive(file.id, file.name)}
                        disabled={restoreLoading}
                        data-testid={`button-restore-from-${file.id}`}
                      >
                        {restoreLoading ? 'Restoring...' : 'Restore'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-Backup Status & Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Backups</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-backups">{backupStats?.totalBackups || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {backupStats?.completedBackups || 0} completed
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Auto-Backups</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <div>
                <p className="text-2xl font-bold text-blue-600" data-testid="stat-auto-backups">{backupStats?.autoBackups || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  24-hour schedule
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cloud Storage</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <div>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-cloud-backups">{backupStats?.cloudBackups || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  On Google Drive
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-size">{backupStats?.totalSizeMB || 0} MB</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All backups
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Auto-Backup Status */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Clock className="h-5 w-5" />
            Automated Backup Schedule
          </CardTitle>
          <CardDescription className="text-blue-800 dark:text-blue-200">
            System automatically backs up database every 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Last Backup</p>
              <p className="font-semibold text-sm" data-testid="status-last-backup">
                {statsLoading ? (
                  'Loading...'
                ) : backupStats?.lastBackup ? (
                  new Date(backupStats.lastBackup.createdAt).toLocaleString('en-IN')
                ) : (
                  'No backups yet'
                )}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Next Scheduled</p>
              <p className="font-semibold text-sm" data-testid="status-next-backup">
                {statsLoading ? (
                  'Loading...'
                ) : backupStats?.nextAutoBackup ? (
                  new Date(backupStats.nextAutoBackup).toLocaleString('en-IN')
                ) : (
                  'In 24 hours'
                )}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <p className="font-semibold text-sm text-green-600 dark:text-green-400">Active</p>
              <p className="text-xs text-muted-foreground">Auto-backup running</p>
            </div>
          </div>
          <div className="pt-2 text-sm text-blue-900 dark:text-blue-100 space-y-2">
            <p><strong>What happens automatically:</strong></p>
            <ul className="space-y-1 text-xs ml-2">
              <li>✓ Complete database backup every 24 hours</li>
              <li>✓ All 10 database tables included</li>
              <li>✓ Automatic upload to Google Drive</li>
              <li>✓ Backup history tracked in database</li>
              <li>✓ Fallback to local storage if Cloud fails</li>
              <li>✓ Can restore from any backup anytime</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Important Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <BarChart3 className="h-5 w-5" />
              What Gets Backed Up
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p><strong>All 10 Tables:</strong></p>
            <ul className="text-xs space-y-1 ml-2">
              <li>✓ Users & Profiles</li>
              <li>✓ Activations & Payments</li>
              <li>✓ Income Transactions</li>
              <li>✓ Matrix Positions</li>
              <li>✓ Binary Matching</li>
              <li>✓ Notifications</li>
              <li>✓ Re-entry Data</li>
              <li>✓ System Config</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <CheckCircle2 className="h-5 w-4" />
              Features & Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p><strong>Complete Protection:</strong></p>
            <ul className="text-xs space-y-1 ml-2">
              <li>✓ 24-hour auto-backup cycle</li>
              <li>✓ Google Drive cloud storage</li>
              <li>✓ Version history tracking</li>
              <li>✓ One-click manual backup</li>
              <li>✓ Easy restore capability</li>
              <li>✓ File size monitoring</li>
              <li>✓ Backup status dashboard</li>
              <li>✓ Migration-ready format</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <AlertCircle className="h-5 w-5" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p><strong>Backup Details:</strong></p>
            <ul className="text-xs space-y-1 ml-2">
              <li>✓ JSON v2.0 format</li>
              <li>✓ Works with all platforms</li>
              <li>✓ Includes metadata</li>
              <li>✓ Restore overwrites all data</li>
              <li>✓ Create manual backup before restore</li>
              <li>✓ Test restores monthly</li>
              <li>✓ Multiple backup locations</li>
              <li>✓ Secure cloud encryption</li>
            </ul>
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

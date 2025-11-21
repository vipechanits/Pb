import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Database, Download, Upload, Cloud, Clock, BarChart3, AlertCircle, CheckCircle2, ExternalLink, RefreshCw, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminBackups() {
  const { toast } = useToast();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [googleDriveLoading, setGoogleDriveLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [driveBackups, setDriveBackups] = useState<any[]>([]);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showGoogleDrive, setShowGoogleDrive] = useState(false);

  useEffect(() => {
    fetchBackupHistory();
    fetchBackupStats();
    const interval = setInterval(() => {
      fetchBackupHistory();
      fetchBackupStats();
    }, 30000);
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

  const handleCreateBackup = async () => {
    try {
      setBackupLoading(true);
      const response = await apiRequest('POST', '/api/admin/system/backup', {});
      if (!response.ok) throw new Error('Failed to create backup');

      const result = await response.json();
      toast({
        title: 'Success',
        description: 'Database backup created successfully!',
      });
      fetchBackupHistory();
      fetchBackupStats();
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

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const response = await apiRequest('GET', `/api/admin/system/backup/${backupId}/download`);
      if (!response.ok) throw new Error('Failed to download backup');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payback247-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Backup downloaded successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download backup',
      });
    }
  };

  const handleUploadRestore = async () => {
    if (!uploadFile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a backup file',
      });
      return;
    }

    if (!confirm('Restore from uploaded backup? This will overwrite all current data.')) return;

    try {
      setRestoreLoading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch('/api/admin/system/restore', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to restore');
      const result = await response.json();
      toast({
        title: 'Success',
        description: 'Database restored successfully!',
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

  const handleRestoreFromDrive = async (fileId: string, fileName: string) => {
    if (!confirm(`Restore from "${fileName}"? This will overwrite all current data.`)) return;

    try {
      setRestoreLoading(true);
      const response = await apiRequest('POST', '/api/admin/system/restore-from-drive', { fileId });
      if (!response.ok) throw new Error('Failed to restore');

      const result = await response.json();
      toast({
        title: 'Success',
        description: 'Database restored from Google Drive!',
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

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2" data-testid="page-title">
            <Database className="h-8 w-8" />
            Database Backup Management
          </h1>
          <p className="text-muted-foreground">
            Manage automatic and manual backups with Google Drive cloud storage and complete restore capabilities
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleCreateBackup}
            disabled={backupLoading}
            className="gap-2"
            data-testid="button-create-backup"
          >
            {backupLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {backupLoading ? 'Creating...' : 'Create Backup Now'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowGoogleDrive(!showGoogleDrive)}
            className="gap-2"
            data-testid="button-toggle-drive"
          >
            <Cloud className="h-4 w-4" />
            {showGoogleDrive ? 'Hide' : 'Show'} Google Drive
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              fetchBackupHistory();
              fetchBackupStats();
            }}
            className="gap-2"
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Backups</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-total">{backupStats?.totalBackups || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{backupStats?.completedBackups || 0} completed</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Auto Backups</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <div>
                  <p className="text-2xl font-bold text-blue-600" data-testid="stat-auto">{backupStats?.autoBackups || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">24h schedule</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cloud Backups</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <div>
                  <p className="text-2xl font-bold text-green-600" data-testid="stat-cloud">{backupStats?.cloudBackups || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Google Drive</p>
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
                  <p className="text-2xl font-bold" data-testid="stat-size">{backupStats?.totalSizeMB || 0} MB</p>
                  <p className="text-xs text-muted-foreground mt-1">All backups</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Failed Backups</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <div>
                  <p className={`text-2xl font-bold ${(backupStats?.failedBackups || 0) > 0 ? 'text-red-600' : 'text-green-600'}`} data-testid="stat-failed">
                    {backupStats?.failedBackups || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">issues detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Auto-Backup Schedule */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Clock className="h-5 w-5" />
              Automated Backup Schedule
            </CardTitle>
            <CardDescription className="text-blue-800 dark:text-blue-200">
              System automatically backs up database every 24 hours with Google Drive cloud storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Last Backup</p>
                <p className="font-semibold text-sm" data-testid="schedule-last">
                  {statsLoading ? 'Loading...' : backupStats?.lastBackup ? new Date(backupStats.lastBackup.createdAt).toLocaleString('en-IN') : 'None yet'}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Next Scheduled</p>
                <p className="font-semibold text-sm" data-testid="schedule-next">
                  {statsLoading ? 'Loading...' : backupStats?.nextAutoBackup ? new Date(backupStats.nextAutoBackup).toLocaleString('en-IN') : 'In 24 hours'}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="font-semibold text-sm text-green-600 dark:text-green-400">Active</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Storage</p>
                <p className="font-semibold text-sm text-blue-600 dark:text-blue-400">Google Drive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload and Restore */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload Local File */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload & Restore
              </CardTitle>
              <CardDescription>
                Restore from a backup file on your computer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Backup File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm border rounded-md p-2"
                  data-testid="input-upload-file"
                />
                {uploadFile && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              <Button
                onClick={handleUploadRestore}
                disabled={restoreLoading || !uploadFile}
                className="w-full"
                data-testid="button-restore-upload"
              >
                {restoreLoading ? 'Restoring...' : 'Restore from File'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Upload a JSON backup file to restore your entire database
              </p>
            </CardContent>
          </Card>

          {/* Download Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Backup
              </CardTitle>
              <CardDescription>
                Export latest backup to your computer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {backupHistory.length > 0 && backupHistory[0] ? (
                <>
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <p className="text-sm font-medium">{backupHistory[0].backupName}</p>
                    <p className="text-xs text-muted-foreground">
                      {backupHistory[0].fileSizeBytes ? `${(backupHistory[0].fileSizeBytes / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDownloadBackup(backupHistory[0].id)}
                    className="w-full"
                    data-testid="button-download-latest"
                  >
                    Download Latest Backup
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No backups available to download</p>
              )}
              <p className="text-xs text-muted-foreground">
                Download the latest backup as a JSON file for safekeeping
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Google Drive Backups */}
        {showGoogleDrive && (
          <Card className="border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Google Drive Backups
              </CardTitle>
              <CardDescription>
                Backups stored in your Google Drive cloud storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => {
                  if (driveBackups.length === 0) {
                    fetchGoogleDriveBackups();
                  }
                }}
                className="mb-4"
                data-testid="button-load-drive"
              >
                {googleDriveLoading ? 'Loading...' : 'Load Backups'}
              </Button>

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
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`drive-backup-${file.id}`}>{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.createdTime ? new Date(file.createdTime).toLocaleString('en-IN') : 'Unknown'}
                          {file.size && ` • ${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-2">
                        {file.webViewLink && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(file.webViewLink, '_blank')}
                            data-testid={`button-open-drive-${file.id}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleRestoreFromDrive(file.id, file.name)}
                          disabled={restoreLoading}
                          data-testid={`button-restore-drive-${file.id}`}
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

        {/* Backup History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Backup History
            </CardTitle>
            <CardDescription>
              All automatic and manual backups with complete details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading history...</p>
              </div>
            ) : backupHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No backup history yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-3 font-medium">Backup Name</th>
                      <th className="text-left py-3 px-3 font-medium">Type</th>
                      <th className="text-left py-3 px-3 font-medium">Status</th>
                      <th className="text-left py-3 px-3 font-medium">Size</th>
                      <th className="text-left py-3 px-3 font-medium">Created</th>
                      <th className="text-left py-3 px-3 font-medium">Cloud</th>
                      <th className="text-left py-3 px-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupHistory.map((backup: any) => (
                      <tr key={backup.id} className="border-b hover:bg-accent/50">
                        <td className="py-3 px-3 truncate text-xs" data-testid={`history-name-${backup.id}`}>
                          {backup.backupName}
                        </td>
                        <td className="py-3 px-3">
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
                        <td className="py-3 px-3">
                          {backup.status === 'completed' ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Completed</span>
                          ) : backup.status === 'failed' ? (
                            <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Failed</span>
                          ) : (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs">
                          {backup.fileSizeBytes ? `${(backup.fileSizeBytes / 1024 / 1024).toFixed(2)} MB` : '-'}
                        </td>
                        <td className="py-3 px-3 text-xs">
                          {backup.createdAt ? new Date(backup.createdAt).toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="py-3 px-3">
                          {backup.googleDriveFileId ? (
                            <Cloud className="h-3 w-3 text-blue-600" />
                          ) : (
                            <span className="text-xs text-muted-foreground">Local</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadBackup(backup.id)}
                            data-testid={`button-download-${backup.id}`}
                          >
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">What Gets Backed Up</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-muted-foreground">
              <p>✓ All user accounts & profiles</p>
              <p>✓ Activations & payment history</p>
              <p>✓ Income transactions & summaries</p>
              <p>✓ Binary tree positions</p>
              <p>✓ Matrix placements (all cycles)</p>
              <p>✓ Notifications & alerts</p>
              <p>✓ Re-entry eligibility data</p>
              <p>✓ System configuration</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Backup Features</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-muted-foreground">
              <p>✓ Automatic 24-hour backups</p>
              <p>✓ Google Drive cloud storage</p>
              <p>✓ Manual backup on demand</p>
              <p>✓ Version control & history</p>
              <p>✓ One-click restore capability</p>
              <p>✓ File size tracking</p>
              <p>✓ Backup status monitoring</p>
              <p>✓ Migration-ready JSON format</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-muted-foreground">
              <p>✓ Restore overwrites all data</p>
              <p>✓ Create backup before restore</p>
              <p>✓ JSON v2.0 format compatible</p>
              <p>✓ Works with all platforms</p>
              <p>✓ Test restores monthly</p>
              <p>✓ Multiple backup locations</p>
              <p>✓ Secure cloud encryption</p>
              <p>✓ Automatic fallback storage</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

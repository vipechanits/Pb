import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Upload, Loader2, AlertTriangle, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DatabaseBackupPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<any>(null);

  // Fetch backup history
  const { data: backups, isLoading: loadingBackups } = useQuery<any[]>({
    queryKey: ["/api/admin/database/backups"],
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/admin/database/backup");
      
      // Get the JSON text from the response
      const jsonText = await response.text();
      const filename = `payback247_backup_${new Date().toISOString().replace(/:/g, '-')}.json`;
      
      // Create blob from text
      const blob = new Blob([jsonText], { type: 'application/json' });
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return filename;
    },
    onSuccess: (filename) => {
      toast({
        title: "Backup Created",
        description: `Backup downloaded as ${filename}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database/backups"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Backup Failed",
        description: error.message || "Failed to create backup",
      });
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (data: { backupData: any; createPreBackup: boolean }) => {
      const response = await apiRequest("POST", "/api/admin/database/restore", data);
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Restore Complete",
        description: result.message,
      });
      
      // If pre-restore backup was created, download it
      if (result.preRestoreBackup) {
        const blob = new Blob([result.preRestoreBackup.data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.preRestoreBackup.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Pre-Restore Backup Saved",
          description: `Backup saved as ${result.preRestoreBackup.filename}`,
        });
      }
      
      setShowRestoreDialog(false);
      setSelectedFile(null);
      setBackupData(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database/backups"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Restore Failed",
        description: error.message || "Failed to restore database",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setBackupData(json);
        setShowRestoreDialog(true);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: "The selected file is not a valid backup",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = () => {
    if (!backupData) return;
    restoreMutation.mutate({ backupData, createPreBackup: true });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Database Management</h1>
          <p className="text-muted-foreground">Backup and restore system database</p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access Required</strong> - Database backup/restore operations are restricted to PB0 only.
          Always create a backup before performing a restore operation.
        </AlertDescription>
      </Alert>

      {/* Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create Backup</CardTitle>
          <CardDescription>
            Export the entire database to a JSON file for safekeeping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => createBackupMutation.mutate()}
            disabled={createBackupMutation.isPending}
            data-testid="button-create-backup"
          >
            {createBackupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Restore Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Restore Database</CardTitle>
          <CardDescription>
            <strong>WARNING:</strong> This will replace all existing data with the backup data.
            A pre-restore backup will be created automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="destructive"
            data-testid="button-select-restore-file"
          >
            <Upload className="mr-2 h-4 w-4" />
            Select Backup File to Restore
          </Button>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            Recent database backups (metadata only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBackups ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups && backups.length > 0 ? (
                  backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-mono text-sm">{backup.filename}</TableCell>
                      <TableCell>{(backup.fileSize / 1024).toFixed(2)} KB</TableCell>
                      <TableCell>{backup.createdBy}</TableCell>
                      <TableCell>
                        <span className="capitalize">{backup.backupType}</span>
                      </TableCell>
                      <TableCell>{new Date(backup.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{backup.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No backups found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Confirm Database Restore</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>WARNING:</strong> This will replace ALL existing data with the backup data.
              </p>
              <p>
                A pre-restore backup will be created and downloaded automatically before proceeding.
              </p>
              {backupData && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p><strong>Backup Date:</strong> {backupData.timestamp}</p>
                  <p><strong>Version:</strong> {backupData.version}</p>
                  <p><strong>Tables:</strong> {Object.keys(backupData.tables || {}).length}</p>
                  <p><strong>Users:</strong> {backupData.metadata?.userCount || 0}</p>
                  <p><strong>Payments:</strong> {backupData.metadata?.paymentCount || 0}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoreMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoreMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-restore"
            >
              {restoreMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Restore Database"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

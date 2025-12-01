import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Trophy, Trash2, Edit2, Plus, Check, X, RefreshCw, Infinity } from 'lucide-react';

interface TopRewardRecipient {
  id: string;
  userId: string;
  userName: string | null;
  frequencyLimit: number | null;
  timesReceived: number;
  isActive: boolean;
  isUnlimited: boolean;
  priority: number;
  addedBy: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TopRewardRecipientsPage() {
  const { toast } = useToast();
  const [recipients, setRecipients] = useState<TopRewardRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    frequencyLimit: 1,
    isUnlimited: false,
    priority: 100,
    notes: '',
  });

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/admin/top-reward-recipients');
      if (response.ok) {
        const data = await response.json();
        setRecipients(data);
      }
    } catch (error) {
      console.error('Failed to fetch recipients:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load Top Reward recipients' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.userId.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'User ID is required' });
      return;
    }

    if (!formData.isUnlimited && formData.frequencyLimit < 1) {
      toast({ variant: 'destructive', title: 'Error', description: 'Frequency limit must be at least 1' });
      return;
    }

    try {
      setLoading(true);
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId 
        ? `/api/admin/top-reward-recipients/${editingId}` 
        : '/api/admin/top-reward-recipients';
      
      const payload = editingId 
        ? {
            frequencyLimit: formData.frequencyLimit,
            isUnlimited: formData.isUnlimited,
            priority: formData.priority,
            notes: formData.notes || undefined,
          }
        : {
            userId: formData.userId.toUpperCase(),
            userName: formData.userName || undefined,
            frequencyLimit: formData.frequencyLimit,
            isUnlimited: formData.isUnlimited,
            priority: formData.priority,
            notes: formData.notes || undefined,
          };
      
      const response = await apiRequest(method, url, payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save recipient');
      }
      
      toast({ title: 'Success', description: editingId ? 'Recipient updated' : 'Recipient added' });
      resetForm();
      await fetchRecipients();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this recipient from the TOP REWARD list?')) return;
    
    try {
      setLoading(true);
      const response = await apiRequest('DELETE', `/api/admin/top-reward-recipients/${id}`);
      if (!response.ok) throw new Error('Failed to delete recipient');
      
      toast({ title: 'Success', description: 'Recipient removed' });
      await fetchRecipients();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (id: string) => {
    if (!confirm('Reset this recipient counter and reactivate them?')) return;
    
    try {
      setLoading(true);
      const response = await apiRequest('POST', `/api/admin/top-reward-recipients/${id}/reset`);
      if (!response.ok) throw new Error('Failed to reset recipient');
      
      toast({ title: 'Success', description: 'Recipient counter reset' });
      await fetchRecipients();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      setLoading(true);
      const response = await apiRequest('PATCH', `/api/admin/top-reward-recipients/${id}`, {
        isActive: !currentState,
      });
      if (!response.ok) throw new Error('Failed to update recipient');
      
      toast({ title: 'Success', description: `Recipient ${!currentState ? 'activated' : 'deactivated'}` });
      await fetchRecipients();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (recipient: TopRewardRecipient) => {
    setEditingId(recipient.id);
    setFormData({
      userId: recipient.userId,
      userName: recipient.userName || '',
      frequencyLimit: recipient.frequencyLimit || 1,
      isUnlimited: recipient.isUnlimited,
      priority: recipient.priority,
      notes: recipient.notes || '',
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      userId: '',
      userName: '',
      frequencyLimit: 1,
      isUnlimited: false,
      priority: 100,
      notes: '',
    });
  };

  return (
    <div className="space-y-6" data-testid="admin-top-reward-page">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Trophy className="w-8 h-8 text-yellow-600" />
          TOP REWARD Recipients
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage users who receive TOP REWARD payments from new activations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Recipient' : 'Add New Recipient'}</CardTitle>
          <CardDescription>
            Add user IDs to receive TOP REWARD payments. Use PB0 for admin or PB#### for users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="PB0 or PB10001"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value.toUpperCase() })}
                disabled={!!editingId}
                data-testid="input-user-id"
              />
              <p className="text-xs text-muted-foreground">
                Enter PB0 for admin or user's PB ID (e.g., PB10001)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userName">Display Name (Optional)</Label>
              <Input
                id="userName"
                placeholder="User name for reference"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                disabled={!!editingId}
                data-testid="input-user-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority (Lower = Higher)</Label>
              <Input
                id="priority"
                type="number"
                min={1}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                data-testid="input-priority"
              />
              <p className="text-xs text-muted-foreground">
                Lower number = higher priority in queue
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequencyLimit">Frequency Limit</Label>
              <Input
                id="frequencyLimit"
                type="number"
                min={1}
                value={formData.frequencyLimit}
                onChange={(e) => setFormData({ ...formData, frequencyLimit: parseInt(e.target.value) || 1 })}
                disabled={formData.isUnlimited}
                data-testid="input-frequency"
              />
              <p className="text-xs text-muted-foreground">
                Number of times to receive payments
              </p>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="isUnlimited"
                checked={formData.isUnlimited}
                onCheckedChange={(checked) => setFormData({ ...formData, isUnlimited: checked })}
                data-testid="switch-unlimited"
              />
              <Label htmlFor="isUnlimited" className="flex items-center gap-1">
                <Infinity className="w-4 h-4" />
                Unlimited
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Admin notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              data-testid="input-notes"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={loading} data-testid="button-save">
              {editingId ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editingId ? 'Update' : 'Add Recipient'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Recipients</CardTitle>
          <CardDescription>
            {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} in the TOP REWARD queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && recipients.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : recipients.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No recipients added yet. Add users above to start receiving TOP REWARD payments.
            </p>
          ) : (
            <div className="space-y-3">
              {recipients.map((recipient, index) => (
                <div
                  key={recipient.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    recipient.isActive ? 'bg-card' : 'bg-muted/50 opacity-60'
                  }`}
                  data-testid={`recipient-${recipient.userId}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg" data-testid={`text-user-id-${recipient.userId}`}>
                          {recipient.userId}
                        </span>
                        {recipient.userName && (
                          <span className="text-muted-foreground">({recipient.userName})</span>
                        )}
                        {!recipient.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          Received: <strong>{recipient.timesReceived}</strong>
                          {recipient.isUnlimited ? (
                            <span className="flex items-center">
                              / <Infinity className="w-3 h-3 mx-1" />
                            </span>
                          ) : (
                            <span>/ {recipient.frequencyLimit}</span>
                          )}
                        </span>
                        <span>Priority: {recipient.priority}</span>
                        <span>Added by: {recipient.addedBy}</span>
                      </div>
                      {recipient.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{recipient.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleToggleActive(recipient.id, recipient.isActive)}
                      title={recipient.isActive ? 'Deactivate' : 'Activate'}
                      data-testid={`button-toggle-${recipient.userId}`}
                    >
                      {recipient.isActive ? (
                        <X className="w-4 h-4 text-red-500" />
                      ) : (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleReset(recipient.id)}
                      title="Reset counter"
                      data-testid={`button-reset-${recipient.userId}`}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(recipient)}
                      data-testid={`button-edit-${recipient.userId}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(recipient.id)}
                      data-testid={`button-delete-${recipient.userId}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

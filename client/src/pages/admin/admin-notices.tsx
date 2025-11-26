import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Trash2, Edit2, Plus, Check, X } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminNotices() {
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'medium' as const,
    isActive: true,
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/admin/notices');
      if (response.ok) {
        const data = await response.json();
        setNotices(data);
      }
    } catch (error) {
      console.error('Failed to fetch notices:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load notices' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Title and message are required' });
      return;
    }

    try {
      setLoading(true);
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/admin/notices/${editingId}` : '/api/admin/notices';
      
      const response = await apiRequest(method, url, formData);
      if (!response.ok) throw new Error('Failed to save notice');
      
      toast({ title: 'Success', description: editingId ? 'Notice updated' : 'Notice created' });
      setFormData({ title: '', message: '', priority: 'medium', isActive: true });
      setEditingId(null);
      await fetchNotices();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    
    try {
      setLoading(true);
      const response = await apiRequest('DELETE', `/api/admin/notices/${id}`);
      if (!response.ok) throw new Error('Failed to delete notice');
      
      toast({ title: 'Success', description: 'Notice deleted' });
      await fetchNotices();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setFormData({
      title: notice.title,
      message: notice.message,
      priority: notice.priority,
      isActive: notice.isActive,
    });
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6" data-testid="admin-notices-page">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <AlertCircle className="w-8 h-8" />
          Importance Notices
        </h1>
        <p className="text-muted-foreground mt-1">Manage system-wide notifications</p>
      </div>

      {/* Create/Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-form-title">{editingId ? 'Edit Notice' : 'Create New Notice'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notice-title">Title</Label>
            <Input
              id="notice-title"
              data-testid="input-notice-title"
              placeholder="e.g., System Maintenance"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notice-message">Message</Label>
            <Textarea
              id="notice-message"
              data-testid="textarea-notice-message"
              placeholder="Enter the notice message..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notice-priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger id="notice-priority" data-testid="select-notice-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                variant={formData.isActive ? 'default' : 'outline'}
                className="w-full"
                data-testid="button-toggle-active"
              >
                {formData.isActive ? <Check className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
                {formData.isActive ? 'Active' : 'Inactive'}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading} className="flex-1" data-testid="button-save-notice">
              {editingId ? 'Update Notice' : 'Create Notice'}
            </Button>
            {editingId && (
              <Button 
                onClick={() => {
                  setEditingId(null);
                  setFormData({ title: '', message: '', priority: 'medium', isActive: true });
                }}
                variant="outline"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notices List */}
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-notices-list">All Notices ({notices.length})</CardTitle>
          <CardDescription>Active and inactive system notices</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-muted-foreground">Loading...</p>}
          
          {!loading && notices.length === 0 && (
            <p className="text-muted-foreground text-center py-8" data-testid="text-no-notices">No notices yet</p>
          )}

          {!loading && notices.length > 0 && (
            <div className="space-y-3">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="border rounded-lg p-4 flex justify-between items-start gap-4 hover-elevate"
                  data-testid={`notice-card-${notice.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold" data-testid={`text-notice-title-${notice.id}`}>{notice.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${priorityColors[notice.priority]}`} data-testid={`badge-priority-${notice.id}`}>
                        {notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${notice.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`} data-testid={`badge-status-${notice.id}`}>
                        {notice.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`text-notice-message-${notice.id}`}>{notice.message}</p>
                    <p className="text-xs text-gray-500" data-testid={`text-notice-date-${notice.id}`}>
                      Updated: {new Date(notice.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(notice)}
                      data-testid={`button-edit-notice-${notice.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(notice.id)}
                      data-testid={`button-delete-notice-${notice.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
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

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MessageCircle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function TicketsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  // Simple in-memory ticket storage for now
  const [tickets] = useState([
    {
      id: '1',
      ticketNumber: 'TKT-001',
      subject: 'Example Ticket',
      category: 'general_inquiry',
      priority: 'medium',
      status: 'open',
      description: 'This is an example ticket. Create your own tickets using the "New Ticket" button above.',
      createdAt: new Date().toISOString(),
      replies: [],
    }
  ]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      payment_issue: 'Payment Issue',
      activation_problem: 'Activation Problem',
      technical_support: 'Technical Support',
      account_issue: 'Account Issue',
      general_inquiry: 'General Inquiry',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      open: { variant: 'default', icon: AlertCircle },
      in_progress: { variant: 'secondary', icon: Clock },
      resolved: { variant: 'default', icon: CheckCircle },
      closed: { variant: 'secondary', icon: XCircle },
    };
    const config = variants[status] || variants.open;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-500',
      medium: 'bg-blue-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500',
    };
    
    return (
      <Badge className={`${colors[priority]} text-white`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
        <p className="text-muted-foreground">
          Submit and track your support tickets. Our team will respond within 24-48 hours.
        </p>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button size="lg" data-testid="button-new-ticket">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              toast({
                title: 'Ticket Created',
                description: 'Your ticket has been submitted. We will respond within 24-48 hours.',
              });
              setIsCreateOpen(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                required
                data-testid="input-ticket-subject"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select required defaultValue="general_inquiry">
                  <SelectTrigger data-testid="select-ticket-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment_issue">Payment Issue</SelectItem>
                    <SelectItem value="activation_problem">Activation Problem</SelectItem>
                    <SelectItem value="technical_support">Technical Support</SelectItem>
                    <SelectItem value="account_issue">Account Issue</SelectItem>
                    <SelectItem value="general_inquiry">General Inquiry</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select required defaultValue="medium">
                  <SelectTrigger data-testid="select-ticket-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your issue..."
                rows={6}
                required
                data-testid="input-ticket-description"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateOpen(false)}
                data-testid="button-cancel-ticket"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-ticket">
                Submit Ticket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tickets List */}
      <div className="mt-8 space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tickets Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any support tickets. Click "New Ticket" to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <CardDescription className="flex items-center gap-4 text-xs">
                      <span className="font-mono">{ticket.ticketNumber}</span>
                      <span>•</span>
                      <span>{getCategoryLabel(ticket.category)}</span>
                      <span>•</span>
                      <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedTicket(ticket.id)}
                    data-testid={`button-view-ticket-${ticket.id}`}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {ticket.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl mb-2">
                    {tickets.find(t => t.id === selectedTicket)?.subject}
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(tickets.find(t => t.id === selectedTicket)?.status || 'open')}
                    {getPriorityBadge(tickets.find(t => t.id === selectedTicket)?.priority || 'medium')}
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-2">
                  Ticket #{tickets.find(t => t.id === selectedTicket)?.ticketNumber} • {getCategoryLabel(tickets.find(t => t.id === selectedTicket)?.category || '')}
                </div>
                <Separator className="mb-4" />
                <div className="text-sm">
                  <strong className="block mb-2">Description:</strong>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {tickets.find(t => t.id === selectedTicket)?.description}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Replies</h4>
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No replies yet. Our support team will respond within 24-48 hours.</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="reply">Add Reply</Label>
                <Textarea
                  id="reply"
                  placeholder="Type your message here..."
                  rows={4}
                  className="mt-2"
                  data-testid="input-ticket-reply"
                />
                <Button 
                  className="mt-2"
                  onClick={() => {
                    toast({
                      title: 'Reply Sent',
                      description: 'Your message has been added to the ticket.',
                    });
                  }}
                  data-testid="button-send-reply"
                >
                  Send Reply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

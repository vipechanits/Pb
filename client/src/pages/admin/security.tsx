import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Ban, CheckCircle, AlertTriangle, RefreshCw, Power } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type SecurityStats = {
  suspiciousIPs: Array<{
    ip: string;
    count: number;
    lastAttempt: string;
  }>;
  blockedIPs: string[];
  stats: {
    totalSuspicious: number;
    totalBlocked: number;
  };
};

export default function AdminSecurity() {
  const { toast } = useToast();
  const [ipToBlock, setIpToBlock] = useState("");
  const [ipToUnblock, setIpToUnblock] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/system/maintenance');
      if (response.ok) {
        const data = await response.json();
        setMaintenanceMode(data.maintenanceMode);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setMaintenanceLoading(true);
      const response = await apiRequest('POST', '/api/admin/system/maintenance', {
        maintenanceMode: !maintenanceMode,
      });

      if (!response.ok) throw new Error('Failed to toggle maintenance mode');

      setMaintenanceMode(!maintenanceMode);
      toast({
        title: 'Success',
        description: `Maintenance mode is now ${!maintenanceMode ? 'ON' : 'OFF'}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to toggle maintenance mode',
      });
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const { data: securityStats, isLoading } = useQuery<SecurityStats>({
    queryKey: ["/api/admin/security/stats"],
  });

  const blockIPMutation = useMutation({
    mutationFn: async (ip: string) => {
      const response = await apiRequest("POST", "/api/admin/security/block-ip", { ip });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/stats"] });
      setIpToBlock("");
      toast({
        title: "IP Blocked",
        description: "The IP address has been blocked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to block IP address",
        variant: "destructive",
      });
    },
  });

  const unblockIPMutation = useMutation({
    mutationFn: async (ip: string) => {
      const response = await apiRequest("POST", "/api/admin/security/unblock-ip", { ip });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/stats"] });
      setIpToUnblock("");
      toast({
        title: "IP Unblocked",
        description: "The IP address has been unblocked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unblock IP address",
        variant: "destructive",
      });
    },
  });

  const handleBlockIP = () => {
    if (!ipToBlock.trim()) {
      toast({
        title: "Error",
        description: "Please enter an IP address",
        variant: "destructive",
      });
      return;
    }
    blockIPMutation.mutate(ipToBlock);
  };

  const handleUnblockIP = (ip: string) => {
    unblockIPMutation.mutate(ip);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/security/stats"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading security stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Security Monitoring
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage blocked IPs and suspicious activity
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Maintenance Mode Toggle */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>
            Enable to block all regular users (admins bypass)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Status: {maintenanceMode ? 'ON' : 'OFF'}</p>
              <p className="text-sm text-muted-foreground">
                {maintenanceMode ? 'Platform is in maintenance mode' : 'Platform is operational'}
              </p>
            </div>
            <Button
              onClick={handleToggleMaintenance}
              disabled={maintenanceLoading}
              variant={maintenanceMode ? 'destructive' : 'default'}
              data-testid="button-toggle-maintenance"
            >
              {maintenanceLoading ? 'Updating...' : (maintenanceMode ? 'Turn OFF' : 'Turn ON')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-destructive" />
              Blocked IPs
            </CardTitle>
            <CardDescription>IPs that are currently blocked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{securityStats?.stats.totalBlocked || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Suspicious IPs
            </CardTitle>
            <CardDescription>IPs with suspicious activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{securityStats?.stats.totalSuspicious || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Manual IP Blocking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5" />
            Block IP Address
          </CardTitle>
          <CardDescription>Manually block an IP address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="ip-to-block">IP Address</Label>
              <Input
                id="ip-to-block"
                data-testid="input-block-ip"
                placeholder="192.168.1.1"
                value={ipToBlock}
                onChange={(e) => setIpToBlock(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleBlockIP}
                disabled={blockIPMutation.isPending}
                data-testid="button-block-ip"
              >
                {blockIPMutation.isPending ? "Blocking..." : "Block IP"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked IPs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            Blocked IP Addresses ({securityStats?.blockedIPs.length || 0})
          </CardTitle>
          <CardDescription>List of currently blocked IPs</CardDescription>
        </CardHeader>
        <CardContent>
          {!securityStats?.blockedIPs || securityStats.blockedIPs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
              <p>No blocked IPs</p>
            </div>
          ) : (
            <div className="space-y-2">
              {securityStats.blockedIPs.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center justify-between p-3 border rounded-md"
                  data-testid={`blocked-ip-${ip}`}
                >
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-destructive" />
                    <span className="font-mono">{ip}</span>
                    <Badge variant="destructive">Blocked</Badge>
                  </div>
                  <Button
                    onClick={() => handleUnblockIP(ip)}
                    variant="outline"
                    size="sm"
                    disabled={unblockIPMutation.isPending}
                    data-testid={`button-unblock-${ip}`}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspicious Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Suspicious Activity ({securityStats?.suspiciousIPs.length || 0})
          </CardTitle>
          <CardDescription>IPs with suspicious behavior (auto-blocked after 10 attempts)</CardDescription>
        </CardHeader>
        <CardContent>
          {!securityStats?.suspiciousIPs || securityStats.suspiciousIPs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
              <p>No suspicious activity detected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {securityStats.suspiciousIPs.map((item) => (
                <div
                  key={item.ip}
                  className="flex items-center justify-between p-3 border rounded-md"
                  data-testid={`suspicious-ip-${item.ip}`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="font-mono">{item.ip}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold">{item.count}</span> attempts
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last: {new Date(item.lastAttempt).toLocaleString()}
                    </div>
                    <Button
                      onClick={() => blockIPMutation.mutate(item.ip)}
                      variant="destructive"
                      size="sm"
                      disabled={blockIPMutation.isPending}
                      data-testid={`button-block-suspicious-${item.ip}`}
                    >
                      Block Now
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

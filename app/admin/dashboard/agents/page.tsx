'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, Filter, MoreHorizontal, CheckCircle, XCircle, UserCheck, UserX, Ban } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Agents' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export default function AgentsPage() {
  const { allAgents, fetchAllAgents, approveAgent, updateAgentStatus } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: string; agent: any } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadAgents();
  }, [statusFilter]);

  const loadAgents = async () => {
    setIsLoading(true);
    const params: any = {};
    if (statusFilter !== 'ALL') {
      if (['PENDING', 'APPROVED', 'REJECTED'].includes(statusFilter)) {
        params.approvalStatus = statusFilter;
      } else {
        params.status = statusFilter;
      }
    }
    await fetchAllAgents(params);
    setIsLoading(false);
  };

  const handleApprove = async (agentId: string) => {
    const success = await approveAgent(agentId, 'APPROVE');
    if (success) {
      loadAgents();
    }
    setActionDialog(null);
  };

  const handleReject = async (agentId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    const success = await approveAgent(agentId, 'REJECT', rejectionReason);
    if (success) {
      loadAgents();
      setRejectionReason('');
    }
    setActionDialog(null);
  };

  const handleStatusChange = async (agentId: string, action: string) => {
    const success = await updateAgentStatus(agentId, action);
    if (success) {
      loadAgents();
    }
    setActionDialog(null);
  };

  const filteredAgents = allAgents.filter((agent: any) => {
    const matchesSearch = 
      agent.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (['PENDING', 'APPROVED', 'REJECTED'].includes(statusFilter)) {
      return matchesSearch && agent.approvalStatus === statusFilter;
    }
    return matchesSearch && agent.status === statusFilter;
  });

  const getStatusBadge = (agent: any) => {
    if (agent.approvalStatus === 'PENDING') {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
    if (agent.approvalStatus === 'REJECTED') {
      return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
    }
    switch (agent.status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Pending Activation</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
      case 'BLOCKED':
        return <Badge variant="destructive">Blocked</Badge>;
      case 'SUSPENDED':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Suspended</Badge>;
      default:
        return <Badge variant="outline">{agent.status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64 bg-slate-800" />
          <Skeleton className="h-10 w-32 bg-slate-800" />
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
          <Users className="mr-3 h-8 w-8" />
          Agent Management
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Total: {filteredAgents.length} agents
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agents List */}
      <div className="space-y-4">
        {filteredAgents.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No agents found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAgents.map((agent: any) => (
            <Card key={agent.id} className="bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg">
                      {agent.fullName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{agent.fullName}</h3>
                      <p className="text-sm text-slate-500">{agent.email}</p>
                      <p className="text-sm text-slate-400">{agent.employeeId} • {agent.region}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {agent.expertise?.slice(0, 3).map((exp: string) => (
                          <Badge key={exp} variant="secondary" className="text-xs">{exp}</Badge>
                        ))}
                        {agent.expertise?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{agent.expertise.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {getStatusBadge(agent)}
                    <p className="text-xs text-slate-400 mt-1">
                      Joined {new Date(agent.createdAt).toLocaleDateString()}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      {agent.approvalStatus === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(agent.id)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setActionDialog({ open: true, type: 'reject', agent })}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {agent.approvalStatus === 'APPROVED' && (
                        <>
                          {agent.status !== 'BLOCKED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActionDialog({ open: true, type: 'block', agent })}
                            >
                              <Ban className="mr-1 h-4 w-4" />
                              Block
                            </Button>
                          )}
                          {agent.status === 'BLOCKED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(agent.id, 'UNBLOCK')}
                            >
                              <UserCheck className="mr-1 h-4 w-4" />
                              Unblock
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={actionDialog?.type === 'reject' && actionDialog.open} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Agent Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {actionDialog?.agent?.fullName}'s application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Input
              id="reason"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => actionDialog?.agent && handleReject(actionDialog.agent.id)}
            >
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={actionDialog?.type === 'block' && actionDialog.open} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to block {actionDialog?.agent?.fullName}? This will prevent them from accessing the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="blockReason">Reason (Optional)</Label>
            <Input
              id="blockReason"
              placeholder="Enter reason for blocking..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => actionDialog?.agent && handleStatusChange(actionDialog.agent.id, 'BLOCK')}
            >
              Block Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

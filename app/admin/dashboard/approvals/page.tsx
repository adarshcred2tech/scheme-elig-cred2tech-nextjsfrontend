'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAdminSocket } from '@/lib/hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCheck, XCircle, Clock, MapPin, Award, Mail, Phone, Calendar, Briefcase, User } from 'lucide-react';
import { toast } from 'sonner';

export default function ApprovalsPage() {
  const { pendingAgents, fetchPendingAgents, approveAgent } = useAdminAuth();
  const { setPendingAgents } = useAdminSocket();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingAgents();
  }, []);

  const loadPendingAgents = async () => {
    setIsLoading(true);
    await fetchPendingAgents();
    setIsLoading(false);
  };

  const handleApprove = async (agentId: string) => {
    const success = await approveAgent(agentId, 'APPROVE');
    if (success) {
      setSelectedAgent(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    const success = await approveAgent(selectedAgent.id, 'REJECT', rejectionReason);
    if (success) {
      setRejectDialog(false);
      setSelectedAgent(null);
      setRejectionReason('');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
          <UserCheck className="mr-3 h-8 w-8" />
          Pending Approvals
        </h2>
        <Badge variant="default" className="text-lg px-4 py-1">
          {pendingAgents.length} Pending
        </Badge>
      </div>

      {pendingAgents.length === 0 ? (
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-12 text-center">
            <UserCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              All Caught Up!
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              No pending agent registrations to review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingAgents.map((agent) => (
            <Card key={agent.id} className="bg-white dark:bg-slate-800 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Agent Info Section */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                        {agent.fullName[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {agent.fullName}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {agent.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {agent.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {agent.region}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Applied {new Date(agent.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center">
                          <Briefcase className="mr-2 h-4 w-4" />
                          Expertise
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {agent.expertise?.map((exp: string) => (
                            <Badge key={exp} variant="secondary">{exp}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center">
                          <Award className="mr-2 h-4 w-4" />
                          Certifications
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {agent.certifications?.length > 0 ? (
                            agent.certifications.map((cert: string) => (
                              <Badge key={cert} variant="outline">{cert}</Badge>
                            ))
                          ) : (
                            <span className="text-slate-400 text-sm">None listed</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {agent.gender && (
                      <div className="mt-4">
                        <span className="text-sm text-slate-500">Gender: </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{agent.gender}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Section */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-6 lg:w-72 flex flex-col justify-center gap-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Review Application
                    </h4>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => handleApprove(agent.id)}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        setSelectedAgent(agent);
                        setRejectDialog(true);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <p className="text-xs text-slate-400 text-center mt-2">
                      Employee ID will be auto-generated upon approval
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedAgent?.fullName}'s application?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Input
                id="reason"
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

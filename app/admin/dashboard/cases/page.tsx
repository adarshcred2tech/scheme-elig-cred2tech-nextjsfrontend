'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { casesApi } from '@/lib/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Search, Filter, UserCheck, ArrowRight, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Cases' },
  { value: 'NEW', label: 'New' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'DOCUMENTS_PENDING', label: 'Documents Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'CLOSED', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  useEffect(() => {
    loadCases();
    loadAgents();
  }, [statusFilter, priorityFilter]);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      
      const response = await casesApi.getAllCases(params);
      if (response.success) {
        setCases(response.cases);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin-auth/agents?approvalStatus=APPROVED', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents.filter((a: any) => a.status !== 'BLOCKED'));
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgent || !selectedCase) return;
    
    try {
      const response = await casesApi.assignCase(
        selectedCase.id,
        parseInt(selectedAgent),
        assignmentNotes
      );
      
      if (response.success) {
        toast.success('Case assigned successfully');
        loadCases();
        setAssignDialog(false);
        setSelectedCase(null);
        setSelectedAgent('');
        setAssignmentNotes('');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign case');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>;
      case 'ASSIGNED':
        return <Badge className="bg-purple-100 text-purple-800">Assigned</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'UNDER_REVIEW':
        return <Badge className="bg-indigo-100 text-indigo-800">Under Review</Badge>;
      case 'DOCUMENTS_PENDING':
        return <Badge className="bg-orange-100 text-orange-800">Docs Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>;
      case 'LOW':
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch = 
      caseItem.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.msmeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.schemeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.agentName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64 bg-slate-800" />
          <Skeleton className="h-10 w-32 bg-slate-800" />
          <Skeleton className="h-10 w-32 bg-slate-800" />
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
          <Briefcase className="mr-3 h-8 w-8" />
          Case Management
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Total: {filteredCases.length} cases
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by case number, MSME, scheme, or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
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
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No cases found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCases.map((caseItem) => (
            <Card key={caseItem.id} className="bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{caseItem.caseNumber}</h3>
                      {getStatusBadge(caseItem.status)}
                      {getPriorityBadge(caseItem.priority)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          MSME
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">{caseItem.msmeName || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Scheme</p>
                        <p className="font-medium text-slate-900 dark:text-white">{caseItem.schemeName || caseItem.schemeId}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {new Date(caseItem.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {caseItem.assignedAgentName && (
                      <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                        <p className="text-sm text-slate-500">
                          Assigned to: <span className="font-medium text-slate-900 dark:text-white">{caseItem.assignedAgentName}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/dashboard/cases/${caseItem.id}`)}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    {caseItem.status === 'NEW' ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setAssignDialog(true);
                        }}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Assign
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setAssignDialog(true);
                        }}
                      >
                        Reassign
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCase?.status === 'NEW' ? 'Assign Case' : 'Reassign Case'}
            </DialogTitle>
            <DialogDescription>
              {selectedCase?.caseNumber} - {selectedCase?.schemeName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Agent *</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.fullName} ({agent.employeeId}) - {agent.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add assignment notes..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedAgent}
            >
              {selectedCase?.status === 'NEW' ? 'Assign Case' : 'Reassign Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

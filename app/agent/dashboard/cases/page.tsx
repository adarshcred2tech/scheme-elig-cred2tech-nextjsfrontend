'use client';

import { useEffect, useState } from 'react';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import { useAgentSocket } from '@/lib/hooks/useSocket';
import { casesApi } from '@/lib/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface Case {
  id: string;
  caseNumber: string;
  businessName: string;
  status: 'NEW' | 'IN_PROGRESS' | 'PENDING_DOCS' | 'CLOSED';
  scheme: string;
  assignedAt: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function AgentCasesPage() {
  const { agent } = useAgentAuth();
  const { assignedCases, setAssignedCases } = useAgentSocket();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        console.log('Fetching agent cases...');
        console.log('Agent authenticated:', agent ? 'yes' : 'no');
        const response = await casesApi.getAgentCases();
        console.log('Agent cases response:', response);
        if (response.success) {
          setAssignedCases(response.cases);
        }
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, [setAssignedCases, agent]);

  const filteredCases = assignedCases.filter((caseItem: Case) => {
    const matchesSearch = (caseItem.businessName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (caseItem.caseNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || caseItem.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500';
      case 'IN_PROGRESS': return 'bg-yellow-500';
      case 'PENDING_DOCS': return 'bg-orange-500';
      case 'CLOSED': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'LOW': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Cases</h1>
          <p className="text-muted-foreground">Manage and track your assigned cases</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value="ALL">All Status</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_DOCS">Pending Docs</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredCases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No cases found</p>
              </div>
            ) : (
              filteredCases.map((caseItem: Case) => (
                <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{caseItem.businessName}</h3>
                          <Badge className={getStatusColor(caseItem.status)}>
                            {caseItem.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(caseItem.priority)}>
                            {caseItem.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Case: {caseItem.caseNumber}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Scheme: {caseItem.scheme}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Assigned: {new Date(caseItem.assignedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Link href={`/agent/dashboard/cases/${caseItem.id}`}>
                        <Button size="sm">
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

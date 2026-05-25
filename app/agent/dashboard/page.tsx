'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface CaseStats {
  total: number;
  new: number;
  inProgress: number;
  pendingDocs: number;
  closed: number;
}

export default function AgentDashboardPage() {
  const { agent, isAuthenticated } = useAgentAuth();
  const router = useRouter();
  const { assignedCases, setAssignedCases } = useAgentSocket();
  const [stats, setStats] = useState<CaseStats>({
    total: 0,
    new: 0,
    inProgress: 0,
    pendingDocs: 0,
    closed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentCases, setRecentCases] = useState<any[]>([]);

  useEffect(() => {
    // Check if agent is authenticated
    const token = localStorage.getItem('agent_token');
    if (!token && !agent) {
      router.push('/agent/login');
      return;
    }
  }, [agent, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!agent) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await casesApi.getAgentCases();
        console.log('Agent cases response:', response);
        if (response.success) {
          const cases = response.cases;
          setAssignedCases(cases);
          setRecentCases(cases.slice(0, 5));
          
          // Calculate stats
          setStats({
            total: cases.length,
            new: cases.filter((c: any) => c.status === 'NEW').length,
            inProgress: cases.filter((c: any) => c.status === 'IN_PROGRESS').length,
            pendingDocs: cases.filter((c: any) => c.status === 'DOCUMENTS_PENDING').length,
            closed: cases.filter((c: any) => c.status === 'CLOSED').length,
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [setAssignedCases]);

  // Use assignedCases for recent cases display (recentCases is redundant)
  const allRecentCases = assignedCases.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'DOCUMENTS_PENDING': return 'bg-orange-100 text-orange-800';
      case 'UNDER_REVIEW': return 'bg-indigo-100 text-indigo-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {agent?.fullName?.split(' ')[0]}!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Here's what's happening with your cases today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cases</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-3xl font-bold">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Docs</p>
                <p className="text-3xl font-bold">{stats.pendingDocs}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-3xl font-bold">{stats.closed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Cases</CardTitle>
          <Link href="/agent/dashboard/cases">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {allRecentCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No cases assigned yet</p>
              <p className="text-sm">Cases will appear here when assigned by admin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allRecentCases.slice(0, 5).map((caseItem, index) => (
                <div
                  key={`${caseItem.id}-${caseItem.case_number || caseItem.caseNumber}-${index}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{caseItem.case_number || caseItem.caseNumber}</h3>
                      <Badge className={getStatusColor(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {caseItem.scheme_name || caseItem.schemeName || caseItem.schemeId}
                    </p>
                    <p className="text-sm text-gray-400">
                      MSME: {caseItem.msme_name || caseItem.msmeName || 'Unknown'}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Created {new Date(caseItem.created_at || caseItem.createdAt).toLocaleDateString()}
                    </p>
                    <Link href={`/agent/dashboard/cases/${caseItem.id}`}>
                      <Button variant="ghost" size="sm" className="mt-2">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Hint */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <TrendingUp className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Performance Tip</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Keep your availability status updated so admins can assign cases to you.
                Cases are assigned based on your expertise and current workload.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

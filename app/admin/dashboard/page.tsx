'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAdminSocket } from '@/lib/hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  UserCheck,
  UserX,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { casesApi } from '@/lib/services/api';

export default function AdminDashboardPage() {
  const { stats, isLoading, fetchStats, fetchPendingAgents, pendingAgents } = useAdminAuth();
  const { newCases: socketNewCases } = useAdminSocket();
  const [recentCases, setRecentCases] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchPendingAgents();
  }, [fetchStats, fetchPendingAgents]);

  useEffect(() => {
    const fetchRecentCases = async () => {
      try {
        const response = await casesApi.getAllCases();
        if (response.success) {
          // Get only NEW cases and limit to recent ones
          const newCases = response.cases
            .filter((c: any) => c.status === 'NEW')
            .slice(0, 5);
          setRecentCases(newCases);
        }
      } catch (error) {
        console.error('Error fetching recent cases:', error);
      }
    };

    fetchRecentCases();
  }, []);

  // Combine socket cases with API cases for real-time updates
  const allRecentCases = [...socketNewCases, ...recentCases].slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-64 bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Admin Dashboard
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Overview of agents, cases, and system performance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Agents</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats?.agents?.total_agents || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Approval</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats?.agents?.pending_agents || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Cases</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats?.cases?.total_cases || 0}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">New Cases</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats?.cases?.new_cases || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card className="bg-white dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <UserCheck className="mr-2 h-5 w-5" />
            Pending Agent Approvals
            {pendingAgents.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingAgents.length}
              </Badge>
            )}
          </CardTitle>
          <Link href="/admin/dashboard/approvals">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {pendingAgents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <UserCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No pending approvals</p>
              <p className="text-sm">All agent registrations have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAgents.slice(0, 3).map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {agent.fullName[0]}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{agent.fullName}</h3>
                      <p className="text-sm text-slate-500">{agent.email}</p>
                      <p className="text-sm text-slate-400">{agent.region}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/admin/dashboard/approvals?agent=${agent.id}`}>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Cases */}
      <Card className="bg-white dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5" />
            Recent Cases
            {allRecentCases.length > 0 && (
              <Badge variant="default" className="ml-2">
                {allRecentCases.length} new
              </Badge>
            )}
          </CardTitle>
          <Link href="/admin/dashboard/cases">
            <Button variant="ghost" size="sm">
              Manage Cases <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {allRecentCases.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Briefcase className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No new cases</p>
              <p className="text-sm">Cases will appear when MSMEs submit applications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allRecentCases.slice(0, 3).map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-slate-900 dark:text-white">{caseItem.case_number || caseItem.caseNumber}</h3>
                      <Badge variant="default">NEW</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{caseItem.scheme_name || caseItem.schemeName}</p>
                    <p className="text-sm text-slate-400">{caseItem.msme_name || caseItem.msmeName}</p>
                  </div>
                  
                  <Link href={`/admin/dashboard/cases?assign=${caseItem.id}`}>
                    <Button size="sm">
                      Assign Agent
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Approved Agents</p>
                <p className="text-2xl font-bold">{stats?.agents?.approved_agents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserX className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Blocked Agents</p>
                <p className="text-2xl font-bold">{stats?.agents?.blocked_agents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Cases In Progress</p>
                <p className="text-2xl font-bold">{stats?.cases?.in_progress_cases || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

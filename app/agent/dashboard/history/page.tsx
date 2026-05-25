'use client';

import { useEffect, useState } from 'react';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import { casesApi } from '@/lib/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  History, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Calendar,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface HistoryItem {
  id: string;
  caseNumber: string;
  businessName: string;
  status: 'COMPLETED' | 'REJECTED' | 'WITHDRAWN';
  scheme: string;
  completedAt: string;
  outcome: string;
  notes?: string;
}

export default function AgentHistoryPage() {
  const { agent } = useAgentAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Fetch real history data from API
        const response = await casesApi.getMyCases();
        if (response.success) {
          // Filter only completed/closed cases for history
          const historyItems = response.cases
            .filter((caseItem: any) => caseItem.status === 'CLOSED' || caseItem.status === 'COMPLETED')
            .map((caseItem: any) => ({
              id: caseItem.id,
              caseNumber: caseItem.caseNumber,
              businessName: caseItem.businessName,
              status: caseItem.status === 'CLOSED' ? 'COMPLETED' : caseItem.status,
              scheme: caseItem.scheme,
              completedAt: caseItem.updatedAt || caseItem.createdAt,
              outcome: caseItem.outcome || 'Case completed',
              notes: caseItem.notes || ''
            }));
          setHistory(historyItems);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    return item.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.caseNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      case 'WITHDRAWN': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-5 w-5" />;
      case 'REJECTED': return <XCircle className="h-5 w-5" />;
      case 'WITHDRAWN': return <Clock className="h-5 w-5" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
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
          <h1 className="text-3xl font-bold">Case History</h1>
          <p className="text-muted-foreground">View your completed and past cases</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Performance Summary</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">
                {history.filter(h => h.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">
                {history.filter(h => h.status === 'REJECTED').length}
              </div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-500">
                {history.filter(h => h.status === 'WITHDRAWN').length}
              </div>
              <div className="text-sm text-muted-foreground">Withdrawn</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {history.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Cases</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No history found</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{item.businessName}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1">{item.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Case: {item.caseNumber}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Scheme: {item.scheme}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4" />
                          <span>Completed: {new Date(item.completedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-1">Outcome:</p>
                          <p className="text-sm">{item.outcome}</p>
                          {item.notes && (
                            <>
                              <p className="text-sm font-medium mb-1 mt-2">Notes:</p>
                              <p className="text-sm text-muted-foreground">{item.notes}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}

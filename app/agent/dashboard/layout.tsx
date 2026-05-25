'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import { useAgentSocket } from '@/lib/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Briefcase, 
  History, 
  Settings, 
  LogOut, 
  Bell,
  User
} from 'lucide-react';
import { Toaster } from 'sonner';

export default function AgentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { agent, isLoading, isAuthenticated, logout } = useAgentAuth();
  const { isConnected, notifications } = useAgentSocket();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/agent/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Agent Portal
              </h1>
              <Badge variant={isConnected ? 'default' : 'secondary'} className="ml-3">
                {isConnected ? '● Live' : '○ Offline'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                  {agent?.fullName?.[0] || 'A'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {agent?.fullName}
                  </p>
                  <p className="text-xs text-gray-500">{agent?.employeeId}</p>
                </div>
              </div>
              
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r min-h-[calc(100vh-4rem)] hidden md:block">
          <nav className="p-4 space-y-2">
            <Link href="/agent/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            
            <Link href="/agent/dashboard/cases">
              <Button variant="ghost" className="w-full justify-start">
                <Briefcase className="mr-2 h-4 w-4" />
                My Cases
              </Button>
            </Link>
            
            <Link href="/agent/dashboard/history">
              <Button variant="ghost" className="w-full justify-start">
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
            </Link>
            
            <Link href="/agent/dashboard/profile">
              <Button variant="ghost" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </Link>
            
            <Link href="/agent/dashboard/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

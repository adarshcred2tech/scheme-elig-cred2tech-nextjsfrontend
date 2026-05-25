'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAdminSocket } from '@/lib/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Settings, 
  LogOut, 
  Bell,
  Shield,
  UserCheck
} from 'lucide-react';
import { Toaster } from 'sonner';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin, isLoading, isAuthenticated, logout, pendingAgents } = useAdminAuth();
  const { isConnected, notifications } = useAdminSocket();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const pendingCount = pendingAgents?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-white">
                Admin Portal
              </h1>
              <Badge variant={isConnected ? 'default' : 'secondary'} className="ml-3">
                {isConnected ? '● Live' : '○ Offline'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative text-slate-300">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                  {admin?.fullName?.[0] || 'A'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">
                    {admin?.fullName}
                  </p>
                  <p className="text-xs text-slate-400">{admin?.role}</p>
                </div>
              </div>
              
              <Button variant="ghost" size="icon" onClick={logout} className="text-slate-300">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-4rem)] hidden md:block">
          <nav className="p-4 space-y-2">
            <Link href="/admin/dashboard">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/agents">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                <Users className="mr-2 h-4 w-4" />
                Agents
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/cases">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                <Briefcase className="mr-2 h-4 w-4" />
                Cases
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/approvals">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                <UserCheck className="mr-2 h-4 w-4" />
                Approvals
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            <Link href="/admin/dashboard/settings">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
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

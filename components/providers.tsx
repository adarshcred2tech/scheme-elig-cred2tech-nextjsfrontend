'use client';

import { AgentAuthProvider } from '@/contexts/AgentAuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AgentAuthProvider>
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    </AgentAuthProvider>
  );
}

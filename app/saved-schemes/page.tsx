'use client';

import { useEffect } from 'react';
import { useMsmeAuth } from '@/contexts/MsmeAuthContext';
import { useSchemes } from '@/contexts/SchemesContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SavedSchemesList from '@/components/dashboard/SavedSchemesList';

export default function SavedSchemesPage() {
  const { authStep } = useMsmeAuth();
  const { getSavedSchemes, savedSchemes } = useSchemes();
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated via sessionStorage (works on refresh)
    const token = sessionStorage.getItem('msme_auth_token');
    if (!token && authStep !== 'authenticated') {
      router.push('/');
    }
  }, [authStep, router]);

  useEffect(() => {
    if (authStep === 'authenticated') {
      getSavedSchemes();
    }
  }, [authStep]);

  if (authStep !== 'authenticated') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Saved Schemes</h1>
          <p className="text-muted-foreground mt-2">
            {savedSchemes.length === 0
              ? 'You haven\'t saved any schemes yet'
              : `You have ${savedSchemes.length} saved scheme${savedSchemes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <SavedSchemesList schemes={savedSchemes} />
      </div>
    </DashboardLayout>
  );
}

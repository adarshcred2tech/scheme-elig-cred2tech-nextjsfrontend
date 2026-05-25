'use client';

import { useEffect, useState } from 'react';
import { useMsmeAuth } from '@/contexts/MsmeAuthContext';
import { useSchemes } from '@/contexts/SchemesContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SchemeSearch from '@/components/dashboard/SchemeSearch';
import SchemesList from '@/components/dashboard/SchemesList';
import MissingProfileModal from '@/components/dashboard/MissingProfileModal';
import CompleteProfileModal from '@/components/dashboard/CompleteProfileModal';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const { authStep, token, mobile, userProfile } = useMsmeAuth();
  const { loadSchemesForDashboard, refreshSchemes, isLoading } = useSchemes();
  const router = useRouter();
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  useEffect(() => {
    if (authStep !== 'authenticated') {
      router.push('/');
    }
  }, [authStep, router]);

  useEffect(() => {
    if (authStep === 'authenticated') {
      loadSchemesForDashboard();
    }
  }, [authStep]);

  useEffect(() => {
    const checkProfile = async () => {
      if (authStep !== 'authenticated' || !token) return;
      const mobileNumber = userProfile?.mobile || mobile;
      if (!mobileNumber) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/msme-auth/profile/${mobileNumber}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const user = data.user;
          setProfileName(user.name || user.legalNameOfBusiness || '');
          setProfileEmail(user.email || '');
          if ((!user.name && !user.legalNameOfBusiness) || !user.email) {
            setShowCompleteProfile(true);
          }
        }
      } catch {}
    };
    checkProfile();
  }, [authStep, token, mobile, userProfile]);

  const handleRefresh = () => {
    refreshSchemes();
  };

  if (authStep !== 'authenticated') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            className="border-border text-muted-foreground hover:text-primary hover:border-primary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Schemes
          </Button>
        </div>
        <SchemeSearch />
        <SchemesList />
      </div>
      <MissingProfileModal />
      {showCompleteProfile && token && (
        <CompleteProfileModal
          token={token}
          initialName={profileName}
          initialEmail={profileEmail}
          onComplete={(name, email) => {
            setProfileName(name);
            setProfileEmail(email);
            setShowCompleteProfile(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}

'use client';

import { useState } from 'react';
import { useMsmeAuth } from '@/contexts/MsmeAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function PanVerificationPage() {
  const { setPanAndProfile, userId, isLoading, error } = useMsmeAuth();
  const [pan, setPan] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [state, setState] = useState('');

  const [verifyingPan, setVerifyingPan] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [panData, setPanData] = useState<any>(null);

  const handlePanVerify = async () => {
    if (!pan || pan.length !== 10) {
      toast.error('Please enter a valid 10-character PAN');
      return;
    }
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    setVerifyingPan(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/msme-auth/verify-pan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('msme_auth_token')}`,
        },
        body: JSON.stringify({ pan: pan.toUpperCase(), userId }),
      });

      const data = await response.json();

      if (data.success) {
        setPanData(data.data);
        setPanVerified(true);

        // Auto-fill fields from PAN data
        if (data.data.legalNameOfBusiness) setName(data.data.legalNameOfBusiness);
        if (data.data.principalState) setState(data.data.principalState);
        if (data.data.constitutionOfBusiness) {
          // Map constitution to business type
          const constitutionMap: Record<string, string> = {
            'Private Limited Company': 'pvt-ltd',
            'Public Limited Company': 'public-ltd',
            'Limited Liability Partnership': 'llp',
            'Partnership': 'partnership',
            'Proprietorship': 'sole-proprietor',
            'Sole Proprietor': 'sole-proprietor',
          };
          setBusinessType(constitutionMap[data.data.constitutionOfBusiness] || '');
        }

        toast.success('PAN verified successfully');
      } else {
        toast.error(data.message || 'PAN verification failed');
      }
    } catch (error) {
      console.error('PAN verification error:', error);
      toast.error('Failed to verify PAN');
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleSubmit = async () => {
    if (!panVerified) {
      toast.error('Please verify your PAN first');
      return;
    }

    const success = await setPanAndProfile(pan, {
      name,
      email,
      businessType,
      state,
    }, userId);

    if (success) {
      toast.success('Profile verified successfully');
    } else {
      toast.error(error || 'Verification failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <Card className="w-full max-w-md p-8 bg-card">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Verify Your Details</h1>
            <p className="text-muted-foreground text-sm">
              Enter your PAN number to auto-fill your business details
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">PAN</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter 10-character PAN"
                  maxLength={10}
                  value={pan.toUpperCase()}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  disabled={isLoading || panVerified || verifyingPan}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground uppercase font-mono"
                />
                {!panVerified && (
                  <Button
                    onClick={handlePanVerify}
                    disabled={verifyingPan || pan.length !== 10}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {verifyingPan ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                  </Button>
                )}
              </div>
            </div>

            {panVerified && panData && (
              <>
                <div className="space-y-3 pt-4 border-t border-border">
                  <h3 className="text-sm font-medium text-foreground">Auto-filled Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {panData.legalNameOfBusiness && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Legal Name</p>
                        <p className="text-foreground">{panData.legalNameOfBusiness}</p>
                      </div>
                    )}
                    {panData.constitutionOfBusiness && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Constitution</p>
                        <p className="text-foreground">{panData.constitutionOfBusiness}</p>
                      </div>
                    )}
                    {panData.principalState && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">State</p>
                        <p className="text-foreground">{panData.principalState}</p>
                      </div>
                    )}
                    {panData.gstin && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">GSTIN</p>
                        <p className="text-foreground">{panData.gstin}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={!panVerified || isLoading || !email.includes('@')}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Verifying...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

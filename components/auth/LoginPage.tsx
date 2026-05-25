'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMsmeAuth } from '@/contexts/MsmeAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Shield, Briefcase } from 'lucide-react';

export default function LoginPage() {
  const { sendOtp, isLoading } = useMsmeAuth();
  const [mobile, setMobileState] = useState('');

  const handleContinue = async () => {
    if (!mobile || mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    const success = await sendOtp(mobile);
    if (success) {
      toast.success('OTP sent to your mobile number');
    } else {
      toast.error('Failed to send OTP. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <Card className="w-full max-w-md p-8 bg-card">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to MSME
            </h1>
            <p className="text-muted-foreground">
              Discover government schemes for your business
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-input rounded-lg border border-border">
                  <span className="text-foreground font-medium">+91</span>
                </div>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobileState(e.target.value.replace(/[^\d]/g, ''))}
                  disabled={isLoading}
                  className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We&apos;ll send an OTP to verify your number
              </p>
            </div>

            <Button
              onClick={handleContinue}
              disabled={isLoading || mobile.length !== 10}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Sending OTP...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>

          {/* Features */}
          <div className="space-y-4 pt-8 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground">Why choose us?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>One-click access to 100+ schemes</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Personalized recommendations</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Expert support throughout the process</span>
              </li>
            </ul>
          </div>

          {/* Portal Links */}
          <div className="pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Are you an Agent or Admin?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/agent/login">
                <Button variant="outline" className="w-full h-10">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Agent Portal
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button variant="outline" className="w-full h-10">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

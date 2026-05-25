'use client';

import { useState } from 'react';
import { useMsmeAuth } from '@/contexts/MsmeAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

export default function OtpPage() {
  const { mobile, verifyOtp, isLoading, error } = useMsmeAuth();
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }

    const success = await verifyOtp(otp);
    if (success) {
      toast.success('OTP verified successfully');
    } else {
      toast.error(error || 'OTP verification failed');
    }
  };

  const handleResendOtp = () => {
    toast.success('OTP resent to your mobile number');
    setResendTimer(30);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <Card className="w-full max-w-md p-8 bg-card">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Verify OTP</h1>
            <p className="text-muted-foreground text-sm">
              We&apos;ve sent a 4-digit code to <br />
              <span className="font-medium text-foreground">+91 {mobile}</span>
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">OTP Code</label>
              <Input
                type="text"
                placeholder="Enter 4-digit OTP"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
                disabled={isLoading}
                className="text-center text-2xl tracking-widest font-mono bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.length !== 4}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </div>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Didn&apos;t receive the code?
            </p>
            <Button
              onClick={handleResendOtp}
              disabled={resendTimer > 0}
              variant="outline"
              className="w-full border-border text-primary hover:bg-primary/5"
            >
              {resendTimer > 0
                ? `Resend OTP in ${resendTimer}s`
                : 'Resend OTP'}
            </Button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span>Change mobile number</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

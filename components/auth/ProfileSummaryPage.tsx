'use client';

import { useState } from 'react';
import { useMsmeAuth } from '@/contexts/MsmeAuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { CheckCircle2, RefreshCw, ArrowRight, Building2, MapPin, User, Calendar } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function ProfileSummaryPage() {
  const {
    existingProfile,
    isLoading,
    error,
    continueToDashboard,
    initiateDataRefresh,
    completeDataRefresh,
  } = useMsmeAuth();

  const [refreshed, setRefreshed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const order = await initiateDataRefresh();
      if (!order) {
        toast.error(error || 'Failed to create payment order');
        return;
      }

      // Load Razorpay script dynamically if not already loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.body.appendChild(script);
        });
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency,
        order_id: order.orderId,
        name: 'MSME Scheme Discovery',
        description: 'Refresh PAN data',
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const success = await completeDataRefresh(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
          if (success) {
            toast.success('Data refreshed successfully!');
            setRefreshed(true);
          } else {
            toast.error(error || 'Data refresh failed after payment');
          }
          setIsRefreshing(false);
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled');
            setIsRefreshing(false);
          },
        },
        theme: { color: '#6366f1' },
      });

      rzp.open();
    } catch (err) {
      console.error('Refresh error:', err);
      toast.error('Something went wrong. Please try again.');
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const ProfileField = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || 'N/A'}</p>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-background">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back!</h1>
          <p className="text-muted-foreground text-sm">
            Here is your business profile on record.
            {existingProfile?.lastDataRefreshAt && (
              <> Last updated: <span className="font-medium text-foreground">{formatDate(existingProfile.lastDataRefreshAt)}</span></>
            )}
          </p>
        </div>

        {/* Profile Card */}
        <Card className="p-6 bg-card border border-border space-y-6">

          {/* Personal / Identity */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Identity
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <ProfileField label="Name" value={existingProfile?.name} />
              <ProfileField label="Mobile" value={existingProfile?.mobileNumber} />
              <ProfileField label="Email" value={existingProfile?.email} />
              <ProfileField label="PAN Number" value={existingProfile?.panNumber} />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Business */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Business
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <ProfileField label="Legal Name" value={existingProfile?.legalNameOfBusiness} />
              <ProfileField label="Trade Name" value={existingProfile?.tradeNameOfBusiness} />
              <ProfileField label="GSTIN" value={existingProfile?.gstin} />
              <ProfileField label="Constitution" value={existingProfile?.constitutionOfBusiness} />
              <ProfileField label="Taxpayer Type" value={existingProfile?.taxpayerType} />
              <ProfileField label="GSTIN Status" value={existingProfile?.gstinStatus} />
              <ProfileField label="Business Type" value={existingProfile?.businessType} />
              <ProfileField label="Business Sector" value={existingProfile?.businessSector} />
              <ProfileField label="Enterprise Category" value={existingProfile?.enterpriseCategory} />
              <ProfileField label="Annual Turnover (₹L)" value={existingProfile?.annualTurnoverLakhs} />
              <ProfileField label="Years in Operation" value={existingProfile?.yearsInOperation} />
              <ProfileField label="Registration Date" value={existingProfile?.registrationDate} />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Address */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Address
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <ProfileField label="Principal Address" value={existingProfile?.principalAddress} />
              </div>
              <ProfileField label="City" value={existingProfile?.principalCity} />
              <ProfileField label="District" value={existingProfile?.principalDistrict} />
              <ProfileField label="State" value={existingProfile?.principalState} />
              <ProfileField label="Pincode" value={existingProfile?.principalPincode} />
            </div>
          </div>

          {refreshed && (
            <>
              <div className="border-t border-border" />
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckCircle2 className="w-4 h-4" />
                Profile data has been refreshed with the latest information.
              </div>
            </>
          )}
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!refreshed && (
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              variant="outline"
              className="flex-1 gap-2 border-primary text-primary hover:bg-primary/10"
            >
              {isRefreshing || isLoading ? (
                <><Spinner className="w-4 h-4" /> Processing...</>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Fetch Latest Details (₹{existingProfile?.refreshPrice ?? 49})
                </>
              )}
            </Button>
          )}

          <Button
            onClick={continueToDashboard}
            disabled={isRefreshing || isLoading}
            className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {refreshed ? 'Go to Dashboard' : 'Continue with Existing Details'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </div>
    </div>
  );
}

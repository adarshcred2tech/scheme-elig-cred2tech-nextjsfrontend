'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface UserProfile {
  userId: string;
  mobile: string;
  pan: string;
  name: string;
  email: string;
  businessType: string;
  state: string;
}

export interface ExistingProfile {
  name: string | null;
  mobileNumber: string;
  email: string | null;
  panNumber: string | null;
  gstin: string | null;
  legalNameOfBusiness: string | null;
  tradeNameOfBusiness: string | null;
  principalAddress: string | null;
  principalCity: string | null;
  principalState: string | null;
  principalDistrict: string | null;
  principalPincode: string | null;
  constitutionOfBusiness: string | null;
  taxpayerType: string | null;
  gstinStatus: string | null;
  registrationDate: string | null;
  businessType: string | null;
  businessSector: string | null;
  enterpriseCategory: string | null;
  annualTurnoverLakhs: number | null;
  yearsInOperation: number | null;
  lastDataRefreshAt: string | null;
  dataRefreshCount: number;
  refreshPrice: number;
}

export interface AuthContextType {
  token: string | null;
  mobile: string | null;
  userId: string | null;
  userProfile: UserProfile | null;
  existingProfile: ExistingProfile | null;
  authStep: 'landing' | 'otp' | 'pan-verification' | 'payment' | 'profile-summary' | 'authenticated';
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  sendOtp: (mobile: string) => Promise<boolean>;
  setMobile: (mobile: string) => void;
  verifyOtp: (otp: string) => Promise<boolean>;
  setPanAndProfile: (pan: string, profile: Omit<UserProfile, 'pan' | 'mobile' | 'userId'>, userId: string) => Promise<boolean>;
  completePayment: () => Promise<boolean>;
  continueToDashboard: () => void;
  initiateDataRefresh: () => Promise<{ orderId: string; amount: number; currency: string; keyId: string } | null>;
  completeDataRefresh: (orderId: string, paymentId: string, signature: string) => Promise<boolean>;
  logout: () => void;
}

const MsmeAuthContext = createContext<AuthContextType | undefined>(undefined);

export const MsmeAuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [mobile, setMobileState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [existingProfile, setExistingProfile] = useState<ExistingProfile | null>(null);
  const [authStep, setAuthStep] = useState<AuthContextType['authStep']>('landing');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from sessionStorage
  useEffect(() => {
    const savedToken = sessionStorage.getItem('msme_auth_token');
    const savedProfile = sessionStorage.getItem('msme_profile');
    const savedMobile = sessionStorage.getItem('msme_mobile');
    const savedUserId = sessionStorage.getItem('msme_user_id');

    if (savedToken && savedMobile) {
      setToken(savedToken);
      setUserId(savedUserId);
      setMobileState(savedMobile);
      setAuthStep('authenticated');

      // Only set profile if it exists in sessionStorage
      if (savedProfile) {
        try {
          setUserProfile(JSON.parse(savedProfile));
        } catch (e) {
          console.error('Failed to parse saved profile:', e);
        }
      }
    }
    setIsInitialized(true);
  }, []);

  const sendOtp = async (mobileNumber: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/msme-auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobileNumber }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setMobileState(mobileNumber);
      setAuthStep('otp');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setMobile = (mobileNumber: string) => {
    setMobileState(mobileNumber);
    setAuthStep('otp');
    setError(null);
  };

  const verifyOtp = async (otp: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // Call backend verify-otp endpoint
      const response = await fetch(`${API_BASE_URL}/api/msme-auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile, otp }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'OTP verification failed');
      }

      setToken(data.token);
      setUserId(data.userId);
      sessionStorage.setItem('msme_auth_token', data.token);
      sessionStorage.setItem('msme_mobile', mobile || '');
      sessionStorage.setItem('msme_user_id', data.userId);

      // Use backend's authStep to determine next step
      const backendAuthStep = data.authStep;
      if (backendAuthStep === 'dashboard') {
        // Existing paid user — fetch their profile and show summary
        try {
          const profileRes = await fetch(`${API_BASE_URL}/api/msme-auth/profile/${mobile}`, {
            headers: { 'Authorization': `Bearer ${data.token}` },
          });
          const profileData = await profileRes.json();

          // Fetch refresh pricing
          const paymentStatusRes = await fetch(`${API_BASE_URL}/api/payment/status/${data.userId}`, {
            headers: { 'Authorization': `Bearer ${data.token}` },
          });
          const paymentStatus = await paymentStatusRes.json();

          if (profileData.success) {
            setExistingProfile({
              ...profileData.user,
              refreshPrice: paymentStatus?.refreshPrice || 49,
            });
          }
        } catch (e) {
          console.error('Failed to load existing profile:', e);
        }
        setAuthStep('profile-summary');
      } else if (backendAuthStep === 'payment') {
        setAuthStep('payment');
      } else {
        setAuthStep('pan-verification');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OTP verification failed';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setPanAndProfile = async (
    pan: string,
    profile: Omit<UserProfile, 'pan' | 'mobile' | 'userId'>,
    userId: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // Call backend verify-pan endpoint
      const response = await fetch(`${API_BASE_URL}/api/msme-auth/verify-pan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pan, userId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'PAN verification failed');
      }

      const fullProfile: UserProfile = {
        ...profile,
        pan,
        mobile: mobile || '',
        userId,
      };

      setUserProfile(fullProfile);
      sessionStorage.setItem('msme_profile', JSON.stringify(fullProfile));

      setAuthStep('payment');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PAN verification failed';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completePayment = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // Load Razorpay script
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay'));
        document.body.appendChild(script);
      });

      // Check if payment is required
      const checkResponse = await fetch(`${API_BASE_URL}/api/payment/check-required`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action: 'PAN_VERIFICATION' }),
      });

      const checkData = await checkResponse.json();

      // Only skip to dashboard if user has explicitly already paid
      if (checkData.hasPaid === true) {
        setAuthStep('authenticated');
        router.push('/dashboard');
        return true;
      }

      // Create payment order
      const orderResponse = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, paymentType: 'PAN_VERIFICATION', mobile }),
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      // Initialize Razorpay
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Cred2Tech',
        description: 'Registration Payment',
        handler: async (response: any) => {
          // Verify payment
          const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              orderId: orderData.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setAuthStep('authenticated');
            router.push('/dashboard');
          } else {
            setError(verifyData.message || 'Payment verification failed');
          }
          setIsLoading(false);
        },
        prefill: {
          name: userProfile?.name || '',
          email: userProfile?.email || '',
          contact: mobile || '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            setError('Payment cancelled');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      setIsLoading(false);
      return false;
    }
  };

  const continueToDashboard = () => {
    setAuthStep('authenticated');
    router.push('/dashboard');
  };

  const initiateDataRefresh = async (): Promise<{ orderId: string; amount: number; currency: string; keyId: string } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, paymentType: 'DATA_REFRESH', mobile }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to create order');
      return { orderId: data.orderId, amount: data.amount, currency: data.currency, keyId: data.keyId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate payment';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const completeDataRefresh = async (orderId: string, paymentId: string, signature: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // Verify payment
      const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, paymentId, signature }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error(verifyData.message || 'Payment verification failed');

      // Refresh PAN data
      const refreshRes = await fetch(`${API_BASE_URL}/api/msme-auth/refresh-pan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const refreshData = await refreshRes.json();
      if (!refreshData.success) throw new Error(refreshData.message || 'Data refresh failed');

      // Re-fetch updated profile
      const profileRes = await fetch(`${API_BASE_URL}/api/msme-auth/profile/${mobile}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setExistingProfile(prev => ({ ...prev!, ...profileData.user }));
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Data refresh failed';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setMobileState(null);
    setUserId(null);
    setUserProfile(null);
    setAuthStep('landing');
    setError(null);
    sessionStorage.removeItem('msme_auth_token');
    sessionStorage.removeItem('msme_profile');
    sessionStorage.removeItem('msme_mobile');
    sessionStorage.removeItem('msme_user_id');
    setExistingProfile(null);
    router.push('/');
  };

  const value: AuthContextType = {
    token,
    mobile,
    userId,
    userProfile,
    existingProfile,
    authStep,
    isLoading,
    isInitialized,
    error,
    sendOtp,
    setMobile,
    verifyOtp,
    setPanAndProfile,
    completePayment,
    continueToDashboard,
    initiateDataRefresh,
    completeDataRefresh,
    logout,
  };

  return (
    <MsmeAuthContext.Provider value={value}>
      {children}
    </MsmeAuthContext.Provider>
  );
};

export const useMsmeAuth = () => {
  const context = useContext(MsmeAuthContext);
  if (context === undefined) {
    throw new Error('useMsmeAuth must be used within MsmeAuthProvider');
  }
  return context;
};

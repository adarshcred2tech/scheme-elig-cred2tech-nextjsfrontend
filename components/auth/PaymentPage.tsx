'use client';

import { useState } from 'react';
import { useMsmeAuth } from '@/contexts/MsmeAuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { CheckCircle2, Lock } from 'lucide-react';

export default function PaymentPage() {
  const { completePayment, isLoading, userProfile } = useMsmeAuth();
  const [selectedPlan, setSelectedPlan] = useState<'premium'>('premium');

  const plans = [
    {
      id: 'premium',
      name: 'Registration',
      price: '₹499',
      period: '/one-time',
      description: 'Complete your registration',
      features: [
        'Access to 100+ government schemes',
        'Personalized scheme recommendations',
        'Save unlimited schemes',
        'Expert guidance & consulting',
        'Priority support',
        'Scheme comparison tools',
      ],
      popular: true,
    },
  ];

  const handlePayment = async () => {
    const success = await completePayment();
    if (success) {
      toast.success('Welcome! You can now explore schemes');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Select a plan to unlock unlimited access to government schemes
          </p>
        </div>

        {/* Plans Grid */}
        <div className="flex justify-center">
          {plans.map((plan) => (
            <div key={plan.id} className="relative">
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    MOST POPULAR
                  </div>
                </div>
              )}

              <Card
                className={`p-8 bg-card cursor-pointer transition-all ring-2 ring-primary shadow-lg ${
                  plan.popular ? 'md:scale-105' : ''
                }`}
              >
                <div className="space-y-6">
                  {/* Plan Header */}
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
                  </div>

                  {/* Pricing */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-3 items-start">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={handlePayment}
                    disabled={isLoading}
                    className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Security Info */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>Your payment is secure and encrypted</span>
        </div>
      </div>
    </div>
  );
}

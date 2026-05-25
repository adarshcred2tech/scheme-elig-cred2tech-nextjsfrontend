'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';
import { pincodeService } from '@/lib/pincodeService';

const EXPERTISE_OPTIONS = [
  'Finance',
  'MSME',
  'Subsidies',
  'Loans',
  'Government Schemes',
  'Taxation',
  'Legal',
  'Consulting',
  'Business Development',
  'Marketing',
];

const AVAILABILITY_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'ON_LEAVE', label: 'On Leave' },
];

export default function AgentRegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pincode: '',
    district: '',
    state: '',
    expertise: [] as string[],
    availability: 'AVAILABLE',
    certifications: '',
    gender: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const { register } = useAgentAuth();
  const router = useRouter();

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pincode = e.target.value;
    setFormData(prev => ({ ...prev, pincode }));
    setPincodeError('');

    // Clear district and state when pincode is cleared
    if (!pincode) {
      setFormData(prev => ({ ...prev, district: '', state: '' }));
      return;
    }

    // Validate pincode format
    if (!pincodeService.isValidPincode(pincode)) {
      setPincodeError('Pincode must be 6 digits');
      setFormData(prev => ({ ...prev, district: '', state: '' }));
      return;
    }

    // Only fetch if pincode is exactly 6 digits
    if (pincode.length === 6) {
      setIsFetchingPincode(true);
      try {
        // Try API first
        let pincodeData = await pincodeService.getPincodeData(pincode);
        
        // Fallback to local data if API fails
        if (!pincodeData) {
          pincodeData = pincodeService.getPincodeDataFallback(pincode);
        }

        if (pincodeData) {
          setFormData(prev => ({
            ...prev,
            district: pincodeData.city,
            state: pincodeData.state,
          }));
        } else {
          setPincodeError('Invalid pincode. Please check and try again.');
          setFormData(prev => ({ ...prev, district: '', state: '' }));
        }
      } catch (error) {
        setPincodeError('Failed to fetch pincode data. Please try again.');
        setFormData(prev => ({ ...prev, district: '', state: '' }));
      } finally {
        setIsFetchingPincode(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.expertise.length === 0) {
      setError('Please select at least one area of expertise');
      return;
    }

    if (!formData.pincode || !formData.district || !formData.state) {
      setError('Please enter a valid pincode to autofill your location');
      return;
    }

    setIsLoading(true);

    try {
      const region = `${formData.district}, ${formData.state}`;
      const success = await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        region,
        expertise: formData.expertise,
        availability: formData.availability,
        certifications: formData.certifications.split(',').map(c => c.trim()).filter(Boolean),
        gender: formData.gender,
      });

      if (success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/agent/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpertiseChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(value)
        ? prev.expertise.filter(e => e !== value)
        : [...prev.expertise, value],
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Your application has been submitted and is pending admin approval.
              You will be notified once approved.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to login page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Agent Registration</CardTitle>
          <CardDescription className="text-center">
            Create your account to start helping MSMEs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pincode"
                  placeholder="400001"
                  value={formData.pincode}
                  onChange={handlePincodeChange}
                  className="pl-10"
                  maxLength={6}
                  required
                />
                {isFetchingPincode && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {pincodeError && (
                <p className="text-sm text-destructive">{pincodeError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  placeholder="District"
                  value={formData.district}
                  readOnly
                  className="bg-muted"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={formData.state}
                  readOnly
                  className="bg-muted"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Areas of Expertise * (Select multiple)</Label>
              <div className="grid grid-cols-2 gap-2">
                {EXPERTISE_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={formData.expertise.includes(option)}
                      onChange={() => handleExpertiseChange(option)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Select
                  value={formData.availability}
                  onValueChange={(value) => setFormData({ ...formData, availability: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications">Certifications</Label>
                <Input
                  id="certifications"
                  placeholder="MBA, CFA (comma separated)"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/agent/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

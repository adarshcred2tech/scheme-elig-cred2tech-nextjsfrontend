'use client';

import { useEffect, useState } from 'react';
import { useMsmeAuth } from '@/contexts/MsmeAuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Mail, Phone, Building2, MapPin, Trash2, LogOut, Pencil, Save, X, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Valid backend SECTOR_MAP keys with human-readable labels
const SECTOR_OPTIONS = [
  { value: 'finance',       label: 'Finance, Banking, Fintech & Professional Services' },
  { value: 'technology',    label: 'IT / Software / Technology / ITES' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail',        label: 'Retail / Trading / Wholesale' },
  { value: 'services',      label: 'Other Services (Consulting, Admin, etc.)' },
  { value: 'healthcare',    label: 'Healthcare & Pharma' },
  { value: 'education',     label: 'Education & Training' },
  { value: 'construction',  label: 'Construction & Real Estate' },
  { value: 'transport',     label: 'Transportation & Logistics' },
  { value: 'agro',          label: 'Agriculture, Food Processing & Dairy' },
  { value: 'textile',       label: 'Textile & Apparel' },
  { value: 'handicraft',    label: 'Handicraft & Artisan' },
  { value: 'fisheries',     label: 'Fisheries & Aquaculture' },
  { value: 'ecommerce',     label: 'E-Commerce' },
  { value: 'energy',        label: 'Energy & Renewables' },
  { value: 'hospitality',   label: 'Hospitality & Tourism' },
  { value: 'media',         label: 'Media & Entertainment' },
];

// Sectors that are too vague — user must pick a real one
const VAGUE_SECTORS = new Set(['professional_services', 'other', 'administrative', 'public_admin', '']);

function needsSectorClarification(sector: string | null | undefined): boolean {
  if (!sector) return true;
  return VAGUE_SECTORS.has(sector) || !SECTOR_OPTIONS.some(o => o.value === sector);
}

export default function ProfilePage() {
  const { token, userId, logout, userProfile, mobile, isInitialized } = useMsmeAuth();
  const router = useRouter();

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Personal info edit
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Sector clarification
  const [isSectorEditing, setIsSectorEditing] = useState(false);
  const [editSector, setEditSector] = useState('');
  const [isSavingSector, setIsSavingSector] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!token) router.push('/');
  }, [token, router, isInitialized]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) { setIsLoading(false); return; }
      const mobileNumber = userProfile?.mobile || mobile;
      if (!mobileNumber) { setIsLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/api/msme-auth/profile/${mobileNumber}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setProfileData(data.user);
      } catch {
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [token, userProfile, mobile]);

  const handleEditStart = () => {
    setEditName(profileData?.name || '');
    setEditEmail(profileData?.email || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/msme-auth/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileData((prev: any) => ({ ...prev, name: editName, email: editEmail }));
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSector = async () => {
    if (!editSector) { toast.error('Please select a sector'); return; }
    setIsSavingSector(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/msme-auth/profile/eligibility`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessSector: editSector }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileData((prev: any) => ({ ...prev, businessSector: editSector }));
        setIsSectorEditing(false);
        toast.success('Industry sector updated');
      } else {
        toast.error(data.message || 'Failed to update sector');
      }
    } catch {
      toast.error('Failed to update sector');
    } finally {
      setIsSavingSector(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      router.push('/');
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) { toast.error('User ID not found'); return; }
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/msme-auth/delete/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Account deleted successfully');
        logout();
        router.push('/');
      } else {
        throw new Error(data.message || 'Failed to delete account');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!token) return null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </DashboardLayout>
    );
  }

  const sectorNeedsClarification = needsSectorClarification(profileData?.businessSector);
  const currentSectorLabel = SECTOR_OPTIONS.find(o => o.value === profileData?.businessSector)?.label;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account information</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleLogout} variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
            <Button onClick={handleDeleteAccount} disabled={isDeleting} variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>

        {/* Sector clarification banner */}
        {profileData?.panVerified && sectorNeedsClarification && !isSectorEditing && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Industry sector needs clarification</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your GST data shows{' '}
                <span className="font-medium text-foreground">
                  &quot;{profileData?.businessSector || 'unknown'}&quot;
                </span>{' '}
                which is too broad to find accurate schemes. Please select your actual industry.
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => { setEditSector(''); setIsSectorEditing(true); }}
            >
              Fix Now
            </Button>
          </div>
        )}

        {/* Profile card */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-6">

            {/* Personal Information */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h2>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={handleEditStart} className="gap-2">
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
                      <Save className="w-3 h-3" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="gap-2">
                      <X className="w-3 h-3" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  {isEditing ? (
                    <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Enter your name" />
                  ) : (
                    <p className="text-foreground font-medium">
                      {profileData?.name || profileData?.legalNameOfBusiness || userProfile?.name || 'Not provided'}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Mobile Number</p>
                  <p className="text-foreground font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {profileData?.mobileNumber || userProfile?.mobile}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  {isEditing ? (
                    <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Enter your email" type="email" />
                  ) : (
                    <p className="text-foreground font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {profileData?.email || userProfile?.email || 'Not provided'}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">PAN Number</p>
                  <p className="text-foreground font-medium">{profileData?.panNumber || userProfile?.pan || 'Not verified'}</p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            {profileData?.panVerified && (
              <>
                <div className="border-t border-border pt-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Business Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Legal Name of Business</p>
                      <p className="text-foreground font-medium">{profileData?.legalNameOfBusiness || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Trade Name</p>
                      <p className="text-foreground font-medium">{profileData?.tradeNameOfBusiness || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">GSTIN</p>
                      <p className="text-foreground font-medium">{profileData?.gstin || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Constitution of Business</p>
                      <p className="text-foreground font-medium">{profileData?.constitutionOfBusiness || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Business Type</p>
                      <p className="text-foreground font-medium">{profileData?.businessType || 'Not provided'}</p>
                    </div>

                    {/* Business Sector / Industry — editable when vague */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Business Sector / Industry
                          {sectorNeedsClarification && (
                            <span className="ml-2 text-xs text-yellow-500 font-medium">⚠ needs update</span>
                          )}
                        </p>
                        {!isSectorEditing && (
                          <button
                            onClick={() => {
                              setEditSector(sectorNeedsClarification ? '' : (profileData?.businessSector || ''));
                              setIsSectorEditing(true);
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            {sectorNeedsClarification ? 'Set sector' : 'Change'}
                          </button>
                        )}
                      </div>

                      {isSectorEditing ? (
                        <div className="space-y-2">
                          <select
                            value={editSector}
                            onChange={e => setEditSector(e.target.value)}
                            className="w-full h-10 px-3 rounded-md bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select your industry</option>
                            {SECTOR_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveSector} disabled={isSavingSector} className="gap-1">
                              <Save className="w-3 h-3" />
                              {isSavingSector ? 'Saving...' : 'Save'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setIsSectorEditing(false)} className="gap-1">
                              <X className="w-3 h-3" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-foreground font-medium">
                          {currentSectorLabel || profileData?.businessSector || 'Not provided'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Enterprise Category</p>
                      <p className="text-foreground font-medium capitalize">{profileData?.enterpriseCategory || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Annual Turnover (Lakhs)</p>
                      <p className="text-foreground font-medium">{profileData?.annualTurnoverLakhs || '0'}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="border-t border-border pt-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Address Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Principal Address</p>
                      <p className="text-foreground font-medium">{profileData?.principalAddress || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">City</p>
                      <p className="text-foreground font-medium">{profileData?.principalCity || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">District</p>
                      <p className="text-foreground font-medium">{profileData?.principalDistrict || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">State</p>
                      <p className="text-foreground font-medium">{profileData?.principalState || profileData?.state || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Pincode</p>
                      <p className="text-foreground font-medium">{profileData?.principalPincode || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

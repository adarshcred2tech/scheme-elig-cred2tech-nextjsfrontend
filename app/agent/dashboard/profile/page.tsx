'use client';

import { useEffect, useState } from 'react';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  Award,
  Calendar,
  Save,
  Edit
} from 'lucide-react';

export default function AgentProfilePage() {
  const { agent } = useAgentAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    region: '',
    expertise: [] as string[],
    certifications: '',
    availability: 'AVAILABLE',
    gender: '',
    joinedAt: '',
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        fullName: agent.fullName || '',
        email: agent.email || '',
        phone: agent.phone || '',
        region: agent.region || '',
        expertise: Array.isArray(agent.expertise) ? agent.expertise : [],
        certifications: agent.certifications || '',
        availability: agent.availability || 'AVAILABLE',
        gender: agent.gender || '',
        joinedAt: agent.createdAt || '',
      });
    }
  }, [agent]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Add API call to update profile
      console.log('Saving profile:', formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (agent) {
      setFormData({
        fullName: agent.fullName || '',
        email: agent.email || '',
        phone: agent.phone || '',
        region: agent.region || '',
        expertise: Array.isArray(agent.expertise) ? agent.expertise : [],
        certifications: agent.certifications || '',
        availability: agent.availability || 'AVAILABLE',
        gender: agent.gender || '',
        joinedAt: agent.createdAt || '',
      });
    }
  };

  if (!agent) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">{formData.fullName}</h3>
              <p className="text-sm text-muted-foreground">{formData.email}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{formData.region}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined: {new Date(formData.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Badge variant={formData.availability === 'AVAILABLE' ? 'default' : 'secondary'}>
                {formData.availability}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Availability Status</Label>
              <select
                id="availability"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="OFFLINE">Offline</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 md:col-start-1 md:row-start-2">
          <CardHeader>
            <CardTitle>Expertise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Areas of Expertise</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.expertise.map((expertise) => (
                <Badge key={expertise} variant="secondary">
                  {expertise}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 md:row-start-2">
          <CardHeader>
            <CardTitle>Professional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certifications">Certifications</Label>
              <div className="relative">
                <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="certifications"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10 min-h-[100px]"
                  placeholder="List your certifications (comma separated)"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

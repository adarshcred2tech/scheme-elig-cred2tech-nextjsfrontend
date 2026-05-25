'use client';

import { useState } from 'react';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Bell, 
  Lock, 
  User, 
  Globe,
  Save,
  LogOut,
  Shield,
  Smartphone
} from 'lucide-react';

export default function AgentSettingsPage() {
  const { agent, logout } = useAgentAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    twoFactorAuth: false,
    language: 'en',
    timezone: 'Asia/Kolkata',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      // Add API call to save notification settings
      console.log('Saving notification settings:', settings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Add API call to change password
      console.log('Changing password');
      setSettings({
        ...settings,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>Manage how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email updates about cases</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive SMS alerts for urgent updates</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleNotificationChange('smsNotifications', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
              />
            </div>

            <Button onClick={handleSaveNotifications} disabled={isLoading} className="w-full">
              {isLoading ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => handleNotificationChange('twoFactorAuth', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Change Password</Label>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Current Password"
                  value={settings.currentPassword}
                  onChange={(e) => setSettings({ ...settings, currentPassword: e.target.value })}
                />
                <Input
                  type="password"
                  placeholder="New Password"
                  value={settings.newPassword}
                  onChange={(e) => setSettings({ ...settings, newPassword: e.target.value })}
                />
                <Input
                  type="password"
                  placeholder="Confirm New Password"
                  value={settings.confirmPassword}
                  onChange={(e) => setSettings({ ...settings, confirmPassword: e.target.value })}
                />
              </div>
              <Button onClick={handlePasswordChange} disabled={isLoading} className="w-full">
                {isLoading ? 'Updating...' : 'Change Password'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Regional Settings</CardTitle>
            </div>
            <CardDescription>Configure your regional preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="mr">Marathi</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
            </div>

            <Button className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Regional Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <CardTitle>App Settings</CardTitle>
            </div>
            <CardDescription>Configure application preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme for the app</p>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact View</Label>
                <p className="text-sm text-muted-foreground">Use compact layout for lists</p>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-refresh</Label>
                <p className="text-sm text-muted-foreground">Automatically refresh data every 30 seconds</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Button className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save App Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-destructive">Logout</Label>
              <p className="text-sm text-muted-foreground">Sign out of your account</p>
            </div>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-destructive">Delete Account</Label>
              <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
            </div>
            <Button variant="destructive" variant="outline">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

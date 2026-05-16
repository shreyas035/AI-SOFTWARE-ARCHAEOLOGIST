import { useState } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Key,
  Trash2,
  Save,
  AlertCircle
} from 'lucide-react';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Card from '@components/ui/Card';
import { useAuthStore } from '@store/authStore';
import api from '@services/api';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Security form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // Appearance
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [compactMode, setCompactMode] = useState(false);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      await api.put('/auth/profile', { name, email });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      
      await api.put('/auth/password', {
        currentPassword,
        newPassword,
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      setLoading(true);
      await api.delete('/auth/account');
      logout();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete account' 
      });
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-dark-400">Manage your account and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`glass rounded-lg p-4 border ${
          message.type === 'success' 
            ? 'border-green-500/20 bg-green-500/5' 
            : 'border-red-500/20 bg-red-500/5'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              message.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`} />
            <div>
              <p className={`font-medium ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {message.type === 'success' ? 'Success' : 'Error'}
              </p>
              <p className={`text-sm mt-1 ${
                message.type === 'success' ? 'text-green-300/80' : 'text-red-300/80'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-dark-300 hover:bg-dark-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Profile Information</h2>
                  <p className="text-dark-400">Update your account profile information</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Name"
                    type="text"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    placeholder="Your name"
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />

                  <div className="pt-4">
                    <Button onClick={handleUpdateProfile} disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Security Settings</h2>
                  <p className="text-dark-400">Manage your password and account security</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />

                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    helperText="Must be at least 8 characters"
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />

                  <div className="pt-4">
                    <Button onClick={handleChangePassword} disabled={loading}>
                      <Key className="w-4 h-4 mr-2" />
                      {loading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </div>

                <div className="pt-8 border-t border-dark-700">
                  <h3 className="text-lg font-semibold text-white mb-2">Danger Zone</h3>
                  <p className="text-dark-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant="danger" onClick={handleDeleteAccount} disabled={loading}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Notification Preferences</h2>
                  <p className="text-dark-400">Choose what notifications you want to receive</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-dark-800">
                    <div>
                      <h3 className="text-white font-medium">Email Notifications</h3>
                      <p className="text-dark-400 text-sm">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-dark-800">
                    <div>
                      <h3 className="text-white font-medium">Analysis Complete</h3>
                      <p className="text-dark-400 text-sm">Get notified when repository analysis completes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={analysisComplete}
                        onChange={(e) => setAnalysisComplete(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-dark-800">
                    <div>
                      <h3 className="text-white font-medium">Weekly Report</h3>
                      <p className="text-dark-400 text-sm">Receive weekly summary of your repositories</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weeklyReport}
                        onChange={(e) => setWeeklyReport(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Appearance Settings</h2>
                  <p className="text-dark-400">Customize how the application looks</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-3">Theme</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setTheme('dark')}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          theme === 'dark'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 hover:border-dark-600'
                        }`}
                      >
                        <div className="w-full h-20 bg-dark-900 rounded mb-2"></div>
                        <p className="text-white font-medium">Dark</p>
                        <p className="text-dark-400 text-sm">Default theme</p>
                      </button>
                      <button
                        onClick={() => setTheme('light')}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          theme === 'light'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 hover:border-dark-600'
                        }`}
                      >
                        <div className="w-full h-20 bg-gray-100 rounded mb-2"></div>
                        <p className="text-white font-medium">Light</p>
                        <p className="text-dark-400 text-sm">Coming soon</p>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-dark-800">
                    <div>
                      <h3 className="text-white font-medium">Compact Mode</h3>
                      <p className="text-dark-400 text-sm">Reduce spacing and padding</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compactMode}
                        onChange={(e) => setCompactMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// Made with Bob

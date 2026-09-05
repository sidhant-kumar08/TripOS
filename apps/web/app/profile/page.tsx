'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/lib/protected-route';
import { useAuth } from '@/lib/auth-context';
import { usersApi } from '@/lib/api';
import { PageShell } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getInitials, formatDate } from '@/lib/utils';
import { GoogleIcon, FacebookIcon } from '@/components/auth/social-auth';
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  Camera,
  KeyRound,
  Check,
  Upload,
  FolderOpen,
  Trash2,
} from 'lucide-react';

const PRESET_AVATARS = [
  {
    id: 'traveler-1',
    name: 'Explorer Alex',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    category: 'Adventure',
  },
  {
    id: 'traveler-2',
    name: 'Mountain Hiker',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    category: 'Mountain',
  },
  {
    id: 'traveler-3',
    name: 'Beach Nomad',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    category: 'Tropical',
  },
  {
    id: 'traveler-4',
    name: 'Globetrotter',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    category: 'Global',
  },
  {
    id: 'traveler-5',
    name: 'Urban Backpacker',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    category: 'City',
  },
  {
    id: 'traveler-6',
    name: 'Jetsetter',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    category: 'Aviation',
  },
];

function ProfileContent() {
  const { user, updateUser } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  
  // Profile form state
  const [name, setName] = React.useState(user?.name || '');
  const [avatar, setAvatar] = React.useState(user?.avatar || '');
  const [customAvatarUrl, setCustomAvatarUrl] = React.useState('');
  const [profileSuccess, setProfileSuccess] = React.useState('');
  const [profileError, setProfileError] = React.useState('');
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordSuccess, setPasswordSuccess] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);

  // Profile data from API
  const [profileData, setProfileData] = React.useState<any>(null);

  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const fetchProfile = React.useCallback(async () => {
    try {
      const res = await usersApi.getProfile();
      setProfileData(res.data);
      setName(res.data.name || '');
      setAvatar(res.data.avatar || '');
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file (PNG, JPG, WEBP, etc.).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setProfileError('Image size should be under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setAvatar(base64);
        setProfileError('');
      }
    };
    reader.onerror = () => {
      setProfileError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setIsSavingProfile(true);

    try {
      const selectedAvatar = avatar || customAvatarUrl.trim() || undefined;
      const res = await usersApi.updateProfile({
        name: name.trim(),
        avatar: selectedAvatar,
      });

      updateUser({
        name: res.data.name,
        avatar: res.data.avatar,
      });

      setProfileData(res.data);
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3500);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customAvatarUrl.trim()) {
      setAvatar(customAvatarUrl.trim());
      setCustomAvatarUrl('');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsSavingPassword(true);

    try {
      await usersApi.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3500);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header Card */}
      <div className="trip-card p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden bg-gradient-to-br from-white/90 via-slate-50/70 to-indigo-50/40 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-indigo-950/20">
        <div className="relative group shrink-0">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-xl ring-4 ring-indigo-500/20 flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-3xl">
            {avatar ? (
              <img
                src={avatar}
                alt={name || 'User Avatar'}
                className="h-full w-full object-cover"
                onError={() => setAvatar('')}
              />
            ) : (
              getInitials(name || user?.email || 'User')
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload new picture from gallery"
            className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md transition-transform hover:scale-110 active:scale-95"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div className="text-center sm:text-left space-y-2 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {name || 'TripOS Explorer'}
            </h2>
            <Badge variant="default" className="text-[10px] uppercase font-bold">
              Verified Traveler
            </Badge>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="h-3.5 w-3.5 text-indigo-500" />
            <span>{user?.email}</span>
          </p>

          <p className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Member since {formatDate(profileData?.createdAt || new Date())}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Profile & DP Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Avatar & DP Chooser */}
          <div className="trip-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Profile Picture & Avatar (DP)
                </h3>
              </div>
              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar('')}
                  className="text-xs text-slate-500 hover:text-red-500 transition font-medium flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Reset to Initials
                </button>
              )}
            </div>

            {/* Local Device / Gallery Upload Dropzone */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5 text-indigo-600" />
                Upload from Gallery or Device
              </span>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Click to browse from your device gallery
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports PNG, JPG, GIF, WebP (up to 3MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Presets Gallery */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Or Choose a Travel Persona Avatar
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = avatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatar(preset.url)}
                      className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all p-0.5 ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/40 scale-105 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="h-full w-full object-cover rounded-xl"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                          <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Image URL */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                Or Paste Custom Image URL
              </span>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/my-photo.jpg"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="flex-1 text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleApplyCustomUrl}
                  disabled={!customAvatarUrl.trim()}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>

          {/* Personal Info Form */}
          <div className="trip-card p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <UserIcon className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Personal Information
              </h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <Input
                type="text"
                label="Full Display Name"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<UserIcon className="h-4 w-4 shrink-0" />}
                required
              />

              <div>
                <Input
                  type="email"
                  label="Email Address"
                  value={user?.email || ''}
                  disabled
                  icon={<Mail className="h-4 w-4 shrink-0" />}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Email address is permanently bound to your account credentials.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="default"
                  size="default"
                  isLoading={isSavingProfile}
                  className="shadow-glow-primary"
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Security & Connected Accounts */}
        <div className="space-y-6">
          {/* Connected Social Accounts */}
          <div className="trip-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Shield className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Connected Accounts
              </h3>
            </div>

            <div className="space-y-3">
              {/* Google */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                    <GoogleIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Google</p>
                    <p className="text-[10px] text-slate-500">
                      {profileData?.googleId ? 'Linked & Active' : 'Not Connected'}
                    </p>
                  </div>
                </div>
                {profileData?.googleId ? (
                  <Badge variant="success" className="text-[10px]">Connected</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Available</Badge>
                )}
              </div>

              {/* Facebook */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                    <FacebookIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Facebook</p>
                    <p className="text-[10px] text-slate-500">
                      {profileData?.facebookId ? 'Linked & Active' : 'Not Connected'}
                    </p>
                  </div>
                </div>
                {profileData?.facebookId ? (
                  <Badge variant="success" className="text-[10px]">Connected</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Available</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="trip-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <KeyRound className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Change Password
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {passwordSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <Input
                type="password"
                label="Current Password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                icon={<Lock className="h-4 w-4 shrink-0" />}
                required
              />

              <Input
                type="password"
                label="New Password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Lock className="h-4 w-4 shrink-0" />}
                required
              />

              <Input
                type="password"
                label="Confirm New Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="h-4 w-4 shrink-0" />}
                required
              />

              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="w-full mt-1"
                isLoading={isSavingPassword}
              >
                Update Password
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <PageShell
        title="Profile Settings"
        subtitle="Manage your personal traveler profile, avatar DP, and account security preferences."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Profile' },
        ]}
      >
        <ProfileContent />
      </PageShell>
    </ProtectedRoute>
  );
}

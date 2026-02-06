/**
 * Admin Settings Page
 * Logo upload and app configuration
 */

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import { settingsApi, authApi } from '../../services/api';

export default function AdminSettings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.getLogo();
        setLogoUrl(data.logoUrl);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle file selection
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPEG, SVG, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await settingsApi.uploadLogo(file);
      setLogoUrl(result.logoUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle logo removal
  const handleRemoveLogo = async () => {
    if (!confirm('Remove the logo?')) return;

    try {
      await settingsApi.deleteLogo();
      setLogoUrl(null);
      toast.success('Logo removed');
    } catch (error) {
      console.error('Remove failed:', error);
      toast.error('Failed to remove logo');
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change failed:', error);
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton height={40} width={200} className="mb-8" />
        <div className="space-y-6">
          <Skeleton height={200} className="rounded-xl" />
          <Skeleton height={200} className="rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">
          Manage app branding and account settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Logo Upload */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Logo</h2>
          <p className="text-sm text-gray-600 mb-6">
            Upload your company logo to personalize the calendar. Recommended size: 200x60 pixels.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo Preview */}
            <div className="w-full sm:w-48 h-32 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="max-w-full max-h-full object-contain p-4"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">No logo</span>
                </div>
              )}
            </div>

            {/* Upload Actions */}
            <div className="flex-1 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploading}
                  variant="secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Logo
                </Button>
                
                {logoUrl && (
                  <Button
                    onClick={handleRemoveLogo}
                    variant="danger"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Supported formats: PNG, JPEG, SVG, WebP. Max size: 5MB
              </p>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          <p className="text-sm text-gray-600 mb-6">
            Update your admin account password.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
            
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
            
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />

            <Button type="submit" isLoading={isChangingPassword}>
              Update Password
            </Button>
          </form>
        </Card>

        {/* App Info */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Info</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">App Name</span>
              <p className="font-medium text-gray-900">MortgagePros Holiday Calendar</p>
            </div>
            <div>
              <span className="text-gray-500">Version</span>
              <p className="font-medium text-gray-900">1.0.0</p>
            </div>
            <div>
              <span className="text-gray-500">Frontend</span>
              <p className="font-medium text-gray-900">React + Vite + TailwindCSS</p>
            </div>
            <div>
              <span className="text-gray-500">Backend</span>
              <p className="font-medium text-gray-900">Node.js + Express + Prisma</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

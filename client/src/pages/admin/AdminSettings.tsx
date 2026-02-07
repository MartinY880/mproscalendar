/**
 * Admin Settings Page
 * Logo upload and app configuration
 */

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Toggle from '../../components/ui/Toggle';
import Skeleton from '../../components/ui/Skeleton';
import Select from '../../components/ui/Select';
import { settingsApi, authApi, emailApi, holidaysApi, holidayApisApi } from '../../services/api';
import type { HolidayApiConfig } from '../../types';

export default function AdminSettings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // SMTP settings
  const [smtpHost, setSmtpHost] = useState('smtp.sendgrid.net');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('apikey');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  
  // API settings
  const [apiConfigs, setApiConfigs] = useState<HolidayApiConfig[]>([]);
  const [isLoadingApis, setIsLoadingApis] = useState(true);
  const [isSavingApi, setIsSavingApi] = useState(false);
  const [editingApi, setEditingApi] = useState<HolidayApiConfig | null>(null);
  const [showApiForm, setShowApiForm] = useState(false);
  const [newApi, setNewApi] = useState<Omit<HolidayApiConfig, 'id'>>({
    name: '',
    type: 'nager',
    endpoint: '',
    apiKey: '',
    country: 'US',
    color: '#3B82F6',
    category: 'federal',
    typeFilter: '',
    enabled: true
  });
  const [isDeletingFederal, setIsDeletingFederal] = useState(false);
  const [isDeletingFun, setIsDeletingFun] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.getAll();
        setLogoUrl(data.logoUrl || null);
        setSmtpHost(data.smtp_host || 'smtp.sendgrid.net');
        setSmtpPort(data.smtp_port || '587');
        setSmtpUser(data.smtp_user || 'apikey');
        setSmtpPass(data.smtp_pass || '');
        setSmtpFrom(data.smtp_from || '');
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchApiConfigs = async () => {
      try {
        const configs = await holidayApisApi.getAll();
        setApiConfigs(configs);
      } catch (error) {
        console.error('Failed to fetch API configs:', error);
      } finally {
        setIsLoadingApis(false);
      }
    };

    fetchSettings();
    fetchApiConfigs();
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

  // Handle SMTP save
  const handleSaveSmtp = async () => {
    if (!smtpHost || !smtpPort || !smtpFrom) {
      toast.error('Please fill in all required SMTP fields');
      return;
    }

    setIsSavingSmtp(true);
    try {
      await settingsApi.saveSMTP({
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        smtp_from: smtpFrom
      });
      toast.success('SMTP settings saved');
    } catch (error) {
      console.error('SMTP save failed:', error);
      toast.error('Failed to save SMTP settings');
    } finally {
      setIsSavingSmtp(false);
    }
  };

  // Handle test email
  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsTestingEmail(true);
    try {
      await emailApi.sendTest(testEmail);
      toast.success('Test email sent!');
    } catch (error) {
      console.error('Test email failed:', error);
      toast.error('Failed to send test email. Check SMTP settings.');
    } finally {
      setIsTestingEmail(false);
    }
  };

  // Handle adding new API
  const handleAddApi = async () => {
    if (!newApi.name || !newApi.endpoint) {
      toast.error('Name and endpoint are required');
      return;
    }

    setIsSavingApi(true);
    try {
      const created = await holidayApisApi.create(newApi);
      setApiConfigs([...apiConfigs, created]);
      setShowApiForm(false);
      setNewApi({
        name: '',
        type: 'nager',
        endpoint: '',
        apiKey: '',
        country: 'US',
        color: '#3B82F6',
        category: 'federal',
        enabled: true
      });
      toast.success('API added successfully');
    } catch (error) {
      console.error('Add API failed:', error);
      toast.error('Failed to add API');
    } finally {
      setIsSavingApi(false);
    }
  };

  // Handle updating API
  const handleUpdateApi = async () => {
    if (!editingApi) return;

    setIsSavingApi(true);
    try {
      const updated = await holidayApisApi.update(editingApi.id, editingApi);
      setApiConfigs(apiConfigs.map(api => api.id === updated.id ? updated : api));
      setEditingApi(null);
      toast.success('API updated successfully');
    } catch (error) {
      console.error('Update API failed:', error);
      toast.error('Failed to update API');
    } finally {
      setIsSavingApi(false);
    }
  };

  // Handle delete API
  const handleDeleteApi = async (id: string) => {
    if (!confirm('Delete this API configuration?')) return;

    try {
      await holidayApisApi.delete(id);
      setApiConfigs(apiConfigs.filter(api => api.id !== id));
      toast.success('API deleted');
    } catch (error) {
      console.error('Delete API failed:', error);
      toast.error('Failed to delete API');
    }
  };

  // Handle toggle API enabled
  const handleToggleApi = async (api: HolidayApiConfig) => {
    try {
      const updated = await holidayApisApi.update(api.id, { enabled: !api.enabled });
      setApiConfigs(apiConfigs.map(a => a.id === updated.id ? updated : a));
    } catch (error) {
      console.error('Toggle API failed:', error);
      toast.error('Failed to toggle API');
    }
  };

  // Handle delete federal holidays
  const handleDeleteFederal = async () => {
    if (!confirm('Delete all federal holidays? This cannot be undone.')) return;
    
    setIsDeletingFederal(true);
    try {
      const result = await holidaysApi.deleteBySource('federal');
      toast.success(result.message);
    } catch (error) {
      console.error('Delete federal failed:', error);
      toast.error('Failed to delete federal holidays');
    } finally {
      setIsDeletingFederal(false);
    }
  };

  // Handle delete fun holidays
  const handleDeleteFun = async () => {
    if (!confirm('Delete all fun/national holidays? This cannot be undone.')) return;
    
    setIsDeletingFun(true);
    try {
      const result = await holidaysApi.deleteBySource('fun');
      toast.success(result.message);
    } catch (error) {
      console.error('Delete fun failed:', error);
      toast.error('Failed to delete fun holidays');
    } finally {
      setIsDeletingFun(false);
    }
  };

  // Handle delete all holidays
  const handleDeleteAll = async () => {
    if (!confirm('DELETE ALL HOLIDAYS? This will remove ALL holidays including custom ones. This cannot be undone!')) return;
    
    setIsDeletingAll(true);
    try {
      const result = await holidaysApi.deleteAll();
      toast.success(result.message);
    } catch (error) {
      console.error('Delete all failed:', error);
      toast.error('Failed to delete holidays');
    } finally {
      setIsDeletingAll(false);
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

        {/* SMTP Settings */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Email (SMTP) Settings</h2>
          <p className="text-sm text-gray-600 mb-6">
            Configure SendGrid or other SMTP relay for sending calendar emails.
          </p>

          <div className="space-y-4 max-w-md">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SMTP Host"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.sendgrid.net"
              />
              <Input
                label="Port"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
              />
            </div>
            
            <Input
              label="Username"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="apikey (for SendGrid)"
            />
            
            <Input
              label="Password / API Key"
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="Your SendGrid API key"
            />
            
            <Input
              label="From Email"
              type="email"
              value={smtpFrom}
              onChange={(e) => setSmtpFrom(e.target.value)}
              placeholder="noreply@yourdomain.com"
            />

            <Button onClick={handleSaveSmtp} isLoading={isSavingSmtp}>
              Save SMTP Settings
            </Button>

            <hr className="my-4" />

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label="Test Email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <Button 
                onClick={handleTestEmail} 
                isLoading={isTestingEmail}
                variant="secondary"
              >
                Send Test
              </Button>
            </div>
          </div>
        </Card>

        {/* Holiday API Settings */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Holiday API Settings</h2>
              <p className="text-sm text-gray-600">
                Configure external APIs to sync holidays automatically.
              </p>
            </div>
            <Button onClick={() => setShowApiForm(true)} size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add API
            </Button>
          </div>

          {/* API Form (Add/Edit) */}
          {(showApiForm || editingApi) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-gray-900 mb-4">
                {editingApi ? 'Edit API' : 'Add New API'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="API Name"
                  value={editingApi ? editingApi.name : newApi.name}
                  onChange={(e) => editingApi 
                    ? setEditingApi({...editingApi, name: e.target.value})
                    : setNewApi({...newApi, name: e.target.value})
                  }
                  placeholder="e.g., Nager Federal Holidays"
                />
                <Select
                  label="API Type"
                  value={editingApi ? editingApi.type : newApi.type}
                  onChange={(e) => {
                    const type = e.target.value as HolidayApiConfig['type'];
                    const defaultEndpoints: Record<string, string> = {
                      nager: 'https://date.nager.at/api/v3',
                      calendarific: 'https://calendarific.com/api/v2',
                      abstract: 'https://holidays.abstractapi.com/v1',
                      custom: ''
                    };
                    if (editingApi) {
                      setEditingApi({...editingApi, type, endpoint: defaultEndpoints[type] || editingApi.endpoint});
                    } else {
                      setNewApi({...newApi, type, endpoint: defaultEndpoints[type] || ''});
                    }
                  }}
                >
                  <option value="nager">Nager.Date (Free)</option>
                  <option value="calendarific">Calendarific (API Key)</option>
                  <option value="abstract">AbstractAPI</option>
                  <option value="custom">Custom API</option>
                </Select>
                <Input
                  label="Endpoint URL"
                  value={editingApi ? editingApi.endpoint : newApi.endpoint}
                  onChange={(e) => editingApi 
                    ? setEditingApi({...editingApi, endpoint: e.target.value})
                    : setNewApi({...newApi, endpoint: e.target.value})
                  }
                  placeholder="https://api.example.com"
                />
                <Input
                  label="API Key (if required)"
                  type="password"
                  value={editingApi ? (editingApi.apiKey || '') : (newApi.apiKey || '')}
                  onChange={(e) => editingApi 
                    ? setEditingApi({...editingApi, apiKey: e.target.value})
                    : setNewApi({...newApi, apiKey: e.target.value})
                  }
                  placeholder="Your API key"
                />
                <Input
                  label="Country Code"
                  value={editingApi ? editingApi.country : newApi.country}
                  onChange={(e) => editingApi 
                    ? setEditingApi({...editingApi, country: e.target.value.toUpperCase()})
                    : setNewApi({...newApi, country: e.target.value.toUpperCase()})
                  }
                  placeholder="US"
                  maxLength={2}
                />
                <Select
                  label="Category"
                  value={editingApi ? editingApi.category : newApi.category}
                  onChange={(e) => editingApi 
                    ? setEditingApi({...editingApi, category: e.target.value as 'federal' | 'fun' | 'company'})
                    : setNewApi({...newApi, category: e.target.value as 'federal' | 'fun' | 'company'})
                  }
                >
                  <option value="federal">Federal / Public</option>
                  <option value="fun">Fun / National</option>
                  <option value="company">Company</option>
                </Select>
                <Input
                  label="Type Filter (Calendarific)"
                  value={editingApi ? (editingApi.typeFilter || '') : (newApi.typeFilter || '')}
                  onChange={(e) => editingApi 
                    ? setEditingApi({...editingApi, typeFilter: e.target.value})
                    : setNewApi({...newApi, typeFilter: e.target.value})
                  }
                  placeholder="e.g., national, observance, religious"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={editingApi ? editingApi.color : newApi.color}
                    onChange={(e) => editingApi 
                      ? setEditingApi({...editingApi, color: e.target.value})
                      : setNewApi({...newApi, color: e.target.value})
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button 
                  onClick={editingApi ? handleUpdateApi : handleAddApi} 
                  isLoading={isSavingApi}
                >
                  {editingApi ? 'Update API' : 'Add API'}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setShowApiForm(false);
                    setEditingApi(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* API List */}
          <div className="space-y-3">
            {isLoadingApis ? (
              <div className="space-y-3">
                <Skeleton height={80} className="rounded-lg" />
                <Skeleton height={80} className="rounded-lg" />
              </div>
            ) : apiConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p>No APIs configured yet.</p>
                <p className="text-sm">Click "Add API" to get started.</p>
              </div>
            ) : (
              apiConfigs.map(api => (
                <div 
                  key={api.id} 
                  className={`p-4 rounded-lg border-2 ${api.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: api.color }}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{api.name}</h4>
                        <p className="text-sm text-gray-500">
                          {api.type.charAt(0).toUpperCase() + api.type.slice(1)} • {api.country} • {api.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={api.enabled}
                        onChange={() => handleToggleApi(api)}
                        label=""
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingApi(api)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteApi(api.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            After configuring APIs, go to Dashboard and click "Sync Holidays" to fetch holidays from enabled APIs.
          </p>

          {/* Delete Holidays Section */}
          <hr className="my-4" />
          <h3 className="font-medium text-gray-900 mb-3">Delete Synced Holidays</h3>
          <p className="text-sm text-gray-600 mb-4">
            Remove holidays that were synced from external APIs.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleDeleteFederal} 
              isLoading={isDeletingFederal}
              variant="danger"
            >
              Delete Federal
            </Button>
            <Button 
              onClick={handleDeleteFun} 
              isLoading={isDeletingFun}
              variant="danger"
            >
              Delete Fun/National
            </Button>
            <Button 
              onClick={handleDeleteAll} 
              isLoading={isDeletingAll}
              variant="danger"
            >
              Delete ALL Holidays
            </Button>
          </div>
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

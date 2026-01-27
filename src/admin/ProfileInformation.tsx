import { useState, useEffect, lazy, Suspense } from 'react';
import { useRestaurant, useUpdateRestaurant } from '../utils/restaurantApi';
import { LoadingShimmer } from '../components/LoadingShimmer';
import { SUPPORTED_LANGUAGES } from '../utils/multilingual';
import type { LanguageCode } from '../utils/multilingual';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const CacheManager = lazy(() => import('./CacheManager'));

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileUpdateForm {
  email: string;
  restaurantName: string;
}

export default function ProfileInformation() {
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant();
  const updateRestaurantMutation = useUpdateRestaurant();
  
  const [activeSection, setActiveSection] = useState<'profile' | 'restaurant' | 'language' | 'preferences' | 'data'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState<ProfileUpdateForm>({
    email: '',
    restaurantName: ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Restaurant form state
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    description: '',
    contact: '',
    showPrices: true,
  });
  
  // Language settings
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageCode>('en');
  const [supportedLanguages, setSupportedLanguages] = useState<LanguageCode[]>(['en']);
  
  // User preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
    language: 'en',
    timezone: 'UTC',
    theme: 'light'
  });

  // Load user profile data
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Update restaurant form when data loads
  useEffect(() => {
    if (restaurant) {
      setRestaurantForm({
        name: restaurant.name || '',
        description: restaurant.description || '',
        contact: restaurant.contact || '',
        showPrices: restaurant.showPrices !== undefined ? restaurant.showPrices : true,
      });
      
      // Load language settings
      setDefaultLanguage((restaurant.defaultLanguage as LanguageCode) || 'en');
      
      try {
        const parsed = JSON.parse(restaurant.supportedLanguages || '["en"]');
        setSupportedLanguages(parsed.filter((lang: string) => lang in SUPPORTED_LANGUAGES));
      } catch (error) {
        setSupportedLanguages(['en']);
      }
    }
  }, [restaurant]);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/api/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setProfileForm({
          email: userData.email || '',
          restaurantName: userData.restaurantName || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });
      
      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/api/admin/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      
      if (response.ok) {
        setSuccess('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add validation
    if (!restaurantForm.name.trim()) {
      setError('Restaurant name is required');
      return;
    }
    
    try {
      console.log('Saving restaurant settings:', restaurantForm);
      await updateRestaurantMutation.mutateAsync(restaurantForm);
      setSuccess('Restaurant settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      setError('Failed to update restaurant settings. Please try again.');
    }
  };

  const handleRestaurantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setRestaurantForm(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setRestaurantForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLanguageToggle = (language: LanguageCode) => {
    setSupportedLanguages(prev => {
      if (prev.includes(language)) {
        // Don't remove if it's the default language or the only language
        if (language === defaultLanguage || prev.length === 1) {
          return prev;
        }
        return prev.filter(lang => lang !== language);
      } else {
        return [...prev, language];
      }
    });
  };

  const handleDefaultLanguageChange = (language: LanguageCode) => {
    setDefaultLanguage(language);
    
    // Ensure the new default language is in the supported languages
    if (!supportedLanguages.includes(language)) {
      setSupportedLanguages(prev => [...prev, language]);
    }
  };

  const saveLanguageSettings = async () => {
    try {
      setLoading(true);
      await updateRestaurantMutation.mutateAsync({
        defaultLanguage,
        supportedLanguages: JSON.stringify(supportedLanguages)
      });
      setSuccess('Language settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save language settings');
    } finally {
      setLoading(false);
    }
  };

  const getLanguageStats = () => {
    return {
      totalSupported: supportedLanguages.length,
      coverage: Math.round((supportedLanguages.length / Object.keys(SUPPORTED_LANGUAGES).length) * 100),
      regions: new Set(supportedLanguages.map(lang => {
        if (['sv', 'no', 'da', 'fi'].includes(lang)) return 'Nordic';
        if (['en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'ru'].includes(lang)) return 'European';
        if (['zh', 'zh-tw', 'ja', 'ko'].includes(lang)) return 'East Asian';
        return 'Other';
      })).size
    };
  };

  const stats = getLanguageStats();

  const sections = [
    { id: 'profile' as const, label: 'Profile & Account', icon: '👤' },
    { id: 'restaurant' as const, label: 'Restaurant Info', icon: '🏪' },
    { id: 'language' as const, label: 'Languages', icon: '🌐' },
    { id: 'preferences' as const, label: 'Preferences', icon: '⚙️' },
    { id: 'data' as const, label: 'Data Management', icon: '🗄️' },
  ];

  if (restaurantLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border-b border-gray-100 pb-6">
        <h2 className="text-2xl font-light text-gray-900">Profile Information</h2>
        <p className="text-sm text-gray-500 mt-1">Account & Restaurant Management</p>
      </div>

      {/* Section Navigation */}
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <div className="flex overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 min-w-0 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                activeSection === section.id
                  ? 'text-gray-900 bg-gray-50 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg opacity-60">{section.icon}</span>
                <span className="hidden sm:inline">{section.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-800 px-4 py-3 rounded-r">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 text-green-800 px-4 py-3 rounded-r">
          {success}
        </div>
      )}

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <div className="space-y-8">
          <div className="bg-white border border-gray-100 rounded-lg p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Profile Information
            </h3>
            
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="@username"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Change */}
          <div className="bg-white border border-gray-100 rounded-lg p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Change Password
            </h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Enter current password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restaurant Section */}
      {activeSection === 'restaurant' && (
        <div className="bg-white border border-gray-100 rounded-lg p-8">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Restaurant Information
          </h3>
          
          <form onSubmit={handleRestaurantSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={restaurantForm.name}
                  onChange={handleRestaurantChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Your Restaurant Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Information
                </label>
                <input
                  type="text"
                  name="contact"
                  value={restaurantForm.contact}
                  onChange={handleRestaurantChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Phone, email, or address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={restaurantForm.description}
                onChange={handleRestaurantChange}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="Brief description of your restaurant, cuisine type, or specialties..."
              />
            </div>

            {/* Menu Display Settings */}
            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-base font-medium text-gray-900 mb-4">
                Menu Display Settings
              </h4>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-md">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    name="showPrices"
                    checked={restaurantForm.showPrices}
                    onChange={handleRestaurantChange}
                    className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Show Prices to Guests
                  </label>
                  <p className="text-sm text-gray-600">
                    When enabled, dish prices will be visible to guests on the public menu. 
                    Disable this if you prefer to discuss pricing in person or have a market-price menu.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || updateRestaurantMutation.isPending}
                className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {loading || updateRestaurantMutation.isPending ? 'Saving...' : 'Save Restaurant Info'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Language Section */}
      {activeSection === 'language' && (
        <div className="bg-white border border-gray-100 rounded-lg p-8">
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Language Settings
            </h3>
            <p className="text-sm text-gray-500">
              Configure which languages your menu supports for international guests
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-md text-center border border-gray-100">
              <div className="text-xl font-semibold text-gray-900">{stats.totalSupported}</div>
              <div className="text-xs text-gray-500">Languages</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md text-center border border-gray-100">
              <div className="text-xl font-semibold text-gray-900">{stats.coverage}%</div>
              <div className="text-xs text-gray-500">Coverage</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md text-center border border-gray-100">
              <div className="text-xl font-semibold text-gray-900">{stats.regions}</div>
              <div className="text-xs text-gray-500">Regions</div>
            </div>
          </div>

          {/* Default Language Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Language
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => handleDefaultLanguageChange(e.target.value as LanguageCode)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            >
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => (
                <option key={code} value={code}>
                  {config.flag} {config.nativeName} ({config.name})
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              This language will be shown by default to new visitors
            </p>
          </div>

          {/* Language Grid */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Supported Languages
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => {
                const isSelected = supportedLanguages.includes(code as LanguageCode);
                const isDefault = code === defaultLanguage;
                
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleLanguageToggle(code as LanguageCode)}
                    disabled={isDefault}
                    className={`
                      relative p-4 rounded-md border transition-all text-left
                      ${isSelected 
                        ? 'border-gray-300 bg-gray-50 text-gray-900' 
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                      }
                      ${isDefault ? 'ring-1 ring-gray-400 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{config.flag}</span>
                        <div>
                          <div className="font-medium text-sm">{config.nativeName}</div>
                          <div className="text-xs opacity-75">{config.name}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mb-1">
                            Default
                          </span>
                        )}
                        {isSelected && (
                          <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveLanguageSettings}
              disabled={loading}
              className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              {loading ? 'Saving...' : 'Save Language Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Preferences Section */}
      {activeSection === 'preferences' && (
        <div className="bg-white border border-gray-100 rounded-lg p-8">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            User Preferences
          </h3>
          
          <div className="space-y-6">
            {/* Notification Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Notifications</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                    <p className="text-xs text-gray-500">Receive important updates about your restaurant</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferences(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                      preferences.emailNotifications ? 'bg-gray-800' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Marketing Emails</label>
                    <p className="text-xs text-gray-500">Receive tips and feature updates</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferences(prev => ({ ...prev, marketingEmails: !prev.marketingEmails }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                      preferences.marketingEmails ? 'bg-gray-800' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Language & Region */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Language & Region</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  >
                    <option value="en">English</option>
                    <option value="sv">Svenska (Swedish)</option>
                    <option value="fi">Suomi (Finnish)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Europe/Stockholm">Europe/Stockholm</option>
                    <option value="Europe/Helsinki">Europe/Helsinki</option>
                    <option value="Europe/Copenhagen">Europe/Copenhagen</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Management Section */}
      {activeSection === 'data' && (
        <div className="space-y-8">
          <div className="bg-white border border-gray-100 rounded-lg p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Data Management
            </h3>
            
            <Suspense fallback={<LoadingShimmer />}>
              <CacheManager />
            </Suspense>
          </div>
          
          {/* Account Deletion */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h4 className="text-base font-medium text-red-900 mb-4">
              Danger Zone
            </h4>
            
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-red-900 mb-2">Delete Account</h5>
                <p className="text-sm text-red-700 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      // TODO: Implement account deletion
                      alert('Account deletion not yet implemented');
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
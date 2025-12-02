import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Briefcase, Calendar, DollarSign, 
  Settings, ChevronRight, Edit, Save, X, Loader,
  Tag, ArrowRightLeft, Shield, Trash2
} from 'lucide-react';

interface UserProfile {
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  occupation?: string;
  monthly_budget?: number;
  onboarding_completed: boolean;
  created_at?: string;
}

interface ProfilePageProps {
  onOpenCategoryManager: () => void;
  onOpenCategoryMigration: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  onOpenCategoryManager,
  onOpenCategoryMigration 
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('API_ENDPOINTS.profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
      setEditedProfile(data);
    } catch (err: any) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setEditedProfile(profile || {});
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedProfile(profile || {});
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('API_ENDPOINTS.profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: editedProfile.full_name,
          phone: editedProfile.phone || null,
          date_of_birth: editedProfile.date_of_birth || null,
          occupation: editedProfile.occupation || null,
          monthly_budget: editedProfile.monthly_budget || null
        })
      });

      if (!response.ok) throw new Error('Failed to update profile');
      const data = await response.json();
      setProfile(data);
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    setEditedProfile({
      ...editedProfile,
      [field]: value
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Profile Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Personal Information
              </h2>
              {!editing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Username (Read-only) */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Username
                  </label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {profile?.username}
                  </p>
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Email
                  </label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {profile?.email}
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editedProfile.full_name || ''}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900 dark:text-white text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {profile?.full_name || 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={editedProfile.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900 dark:text-white text-sm"
                      placeholder="+1 234 567 8900"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {profile?.phone || 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Date of Birth
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={editedProfile.date_of_birth || ''}
                      onChange={(e) => handleChange('date_of_birth', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900 dark:text-white text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatDate(profile?.date_of_birth)}
                    </p>
                  )}
                </div>
              </div>

              {/* Occupation */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Occupation
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editedProfile.occupation || ''}
                      onChange={(e) => handleChange('occupation', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900 dark:text-white text-sm"
                      placeholder="e.g., Software Engineer"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {profile?.occupation || 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              {/* Monthly Budget */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Monthly Budget
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      value={editedProfile.monthly_budget || ''}
                      onChange={(e) => handleChange('monthly_budget', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900 dark:text-white text-sm"
                      placeholder="50000"
                      min="0"
                      step="1000"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatCurrency(profile?.monthly_budget)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Actions
            </h2>
            <div className="space-y-2">
              {/* Manage Categories */}
              <button
                onClick={onOpenCategoryManager}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white">
                      Manage Categories
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Add, edit, or delete categories
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
              </button>

              {/* Migrate Categories */}
              <button
                onClick={onOpenCategoryMigration}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white">
                      Migrate Categories
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Move transactions between categories
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </button>

              {/* Change Password */}
              <button
                onClick={() => {/* Implement password change */}}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white">
                      Change Password
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Update your password
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Account Info
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Member since</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Onboarding Status</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {profile?.onboarding_completed ? (
                    <span className="text-green-600 dark:text-green-400">✓ Completed</span>
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
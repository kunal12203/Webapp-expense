import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, X, Loader, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';

interface ExampleCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string;
  sort_order: number;
}

interface CategorySelectorProps {
  token: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ token }) => {
  const navigate = useNavigate();
  const [exampleCategories, setExampleCategories] = useState<ExampleCategory[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCategory, setCustomCategory] = useState({
    name: '',
    color: '#667EEA',
    icon: 'tag'
  });

  useEffect(() => {
    fetchExampleCategories();
  }, []);

  const fetchExampleCategories = async () => {
    try {
      const response = await fetch('https://your-backend.onrender.com/api/categories/examples');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setExampleCategories(data);
    } catch (err: any) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAddSelected = async () => {
    if (selectedIds.size === 0) {
      setError('Please select at least one category');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('https://your-backend.onrender.com/api/categories/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category_ids: Array.from(selectedIds)
        })
      });

      if (!response.ok) throw new Error('Failed to add categories');

      // Mark onboarding as complete
      await fetch('https://your-backend.onrender.com/api/profile/complete-onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save categories');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    // Mark onboarding as complete even if skipped
    try {
      await fetch('https://your-backend.onrender.com/api/profile/complete-onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      navigate('/dashboard');
    } catch (err) {
      navigate('/dashboard');
    }
  };

  const handleCreateCustom = async () => {
    if (!customCategory.name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('https://your-backend.onrender.com/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(customCategory)
      });

      if (!response.ok) throw new Error('Failed to create category');

      setShowCustomModal(false);
      setCustomCategory({ name: '', color: '#667EEA', icon: 'tag' });
      
      // Could refresh and show success, but for now just close modal
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return IconComponent;
  };

  const iconOptions = [
    'tag', 'utensils', 'car', 'shopping-bag', 'file-text', 'film',
    'dollar-sign', 'book', 'heart', 'plane', 'home', 'briefcase',
    'shield', 'gift', 'scissors', 'trending-up'
  ];

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFE66D', '#A8E6CF',
    '#E91E63', '#2196F3', '#9C27B0', '#FF9800', '#4CAF50',
    '#607D8B', '#F06292', '#795548', '#FF5722'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Choose Your Categories
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
            Select the expense categories you want to track
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            You can add more later from your profile
          </p>
        </div>

        {/* Selected Count */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {selectedIds.size}
              </span> categories selected
            </p>
            <button
              onClick={() => setShowCustomModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Custom
            </button>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {exampleCategories.map((category) => {
            const IconComponent = getIconComponent(category.icon);
            const isSelected = selectedIds.has(category.id);

            return (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg scale-105'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                }`}
              >
                {/* Checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Icon */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <IconComponent 
                    className="w-6 h-6" 
                    style={{ color: category.color }}
                  />
                </div>

                {/* Name */}
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {category.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {category.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            disabled={saving}
            className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Skip for Now
          </button>
          <button
            onClick={handleAddSelected}
            disabled={saving || selectedIds.size === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                Continue to Dashboard
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Custom Category Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Create Custom Category
              </h2>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={customCategory.name}
                  onChange={(e) => setCustomCategory({ ...customCategory, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                  placeholder="e.g., Gaming"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {iconOptions.map((iconName) => {
                    const IconComponent = getIconComponent(iconName);
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setCustomCategory({ ...customCategory, icon: iconName })}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          customCategory.icon === iconName
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCustomCategory({ ...customCategory, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        customCategory.color === color
                          ? 'border-slate-900 dark:border-white scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCustomModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustom}
                disabled={saving || !customCategory.name.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
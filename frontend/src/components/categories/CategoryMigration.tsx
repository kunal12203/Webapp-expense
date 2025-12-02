import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import * as Icons from 'lucide-react';

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  description?: string;
}

interface CategoryMigrationProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete: () => void;
}

const CategoryMigration: React.FC<CategoryMigrationProps> = ({ 
  isOpen, 
  onClose, 
  onMigrationComplete 
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [fromCategory, setFromCategory] = useState<string>('');
  const [toCategory, setToCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expenseCount, setExpenseCount] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (fromCategory) {
      fetchExpenseCount(fromCategory);
    } else {
      setExpenseCount(null);
    }
  }, [fromCategory]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('API_ENDPOINTS.categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseCount = async (categoryName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('API_ENDPOINTS.expenses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      
      // Count expenses in this category
      const count = data.filter((exp: any) => exp.category === categoryName).length;
      setExpenseCount(count);
    } catch (err) {
      setExpenseCount(null);
    }
  };

  const handleMigrate = async () => {
    if (!fromCategory || !toCategory) {
      setError('Please select both source and target categories');
      return;
    }

    if (fromCategory === toCategory) {
      setError('Source and target categories cannot be the same');
      return;
    }

    setMigrating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('API_ENDPOINTS.categories/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          from_category_name: fromCategory,
          to_category_name: toCategory
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Migration failed');
      }

      const data = await response.json();
      setSuccess(`Successfully migrated ${data.affected_count} transaction(s) from "${fromCategory}" to "${toCategory}"`);
      
      // Reset form
      setFromCategory('');
      setToCategory('');
      setExpenseCount(null);
      
      // Notify parent
      onMigrationComplete();
      
      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to migrate categories');
    } finally {
      setMigrating(false);
    }
  };

  const handleClose = () => {
    setFromCategory('');
    setToCategory('');
    setError('');
    setSuccess('');
    setExpenseCount(null);
    onClose();
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return IconComponent;
  };

  const getCategoryObject = (categoryName: string) => {
    return categories.find(cat => cat.name === categoryName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Migrate Categories</h2>
              <p className="text-blue-100 text-sm mt-1">
                Move all transactions from one category to another
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Warning Banner */}
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Important:</p>
                  <p>This action will move ALL transactions from the source category to the target category. This cannot be undone.</p>
                </div>
              </div>

              {/* From Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  From Category (Source)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((category) => {
                    const IconComponent = getIconComponent(category.icon);
                    const isSelected = fromCategory === category.name;
                    const isDisabled = toCategory === category.name;

                    return (
                      <button
                        key={category.id}
                        onClick={() => !isDisabled && setFromCategory(category.name)}
                        disabled={isDisabled}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105'
                            : isDisabled
                            ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-50 cursor-not-allowed'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                        }`}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <IconComponent 
                            className="w-5 h-5" 
                            style={{ color: category.color }}
                          />
                        </div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                          {category.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {fromCategory && expenseCount !== null && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {expenseCount}
                    </span> transaction(s) will be moved
                  </p>
                )}
              </div>

              {/* Arrow Indicator */}
              {fromCategory && (
                <div className="flex justify-center mb-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Move to
                    </span>
                    <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
              )}

              {/* To Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  To Category (Target)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((category) => {
                    const IconComponent = getIconComponent(category.icon);
                    const isSelected = toCategory === category.name;
                    const isDisabled = fromCategory === category.name || !fromCategory;

                    return (
                      <button
                        key={category.id}
                        onClick={() => !isDisabled && setToCategory(category.name)}
                        disabled={isDisabled}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg scale-105'
                            : isDisabled
                            ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-50 cursor-not-allowed'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                        }`}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <IconComponent 
                            className="w-5 h-5" 
                            style={{ color: category.color }}
                          />
                        </div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                          {category.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </div>
              )}

              {/* Migration Preview */}
              {fromCategory && toCategory && !success && (
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Migration Preview:
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg">
                      {(() => {
                        const cat = getCategoryObject(fromCategory);
                        if (!cat) return null;
                        const IconComponent = getIconComponent(cat.icon);
                        return (
                          <>
                            <IconComponent 
                              className="w-4 h-4" 
                              style={{ color: cat.color }}
                            />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {fromCategory}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg">
                      {(() => {
                        const cat = getCategoryObject(toCategory);
                        if (!cat) return null;
                        const IconComponent = getIconComponent(cat.icon);
                        return (
                          <>
                            <IconComponent 
                              className="w-4 h-4" 
                              style={{ color: cat.color }}
                            />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {toCategory}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {expenseCount !== null && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {expenseCount} transaction(s) will be updated
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMigrate}
                  disabled={migrating || !fromCategory || !toCategory || success !== ''}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {migrating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Migrating...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5" />
                      Migrate Transactions
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryMigration;
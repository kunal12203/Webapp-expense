import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Tag, Loader } from 'lucide-react';
import * as Icons from 'lucide-react';
import QuickAddCategory from './categories/QuickAddCategory';

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  description?: string;
}

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
  editExpense?: any;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  isOpen, 
  onClose, 
  onExpenseAdded,
  editExpense 
}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load categories on mount
  useEffect(() => {
    loadCategories();
    
    // Listen for category updates
    const handleCategoriesUpdated = () => {
      loadCategories();
    };
    
    window.addEventListener('categoriesUpdated', handleCategoriesUpdated);
    
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdated);
    };
  }, []);

  // Populate form if editing
  useEffect(() => {
    if (editExpense) {
      setAmount(editExpense.amount.toString());
      setCategory(editExpense.category);
      setDescription(editExpense.description || '');
      setDate(editExpense.date);
      setType(editExpense.type || 'expense');
    } else {
      resetForm();
    }
  }, [editExpense]);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://your-backend.onrender.com/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load categories');
      
      const data = await response.json();
      setCategories(data);
      
      // Auto-select first category if none selected and categories exist
      if (!category && data.length > 0) {
        setCategory(data[0].name);
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory(categories.length > 0 ? categories[0].name : '');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('expense');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !category) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const expenseData = {
        amount: parseFloat(amount),
        category,
        description: description || null,
        date,
        type
      };

      const url = editExpense 
        ? `https://your-backend.onrender.com/api/expenses/${editExpense.id}`
        : 'https://your-backend.onrender.com/api/expenses';
      
      const method = editExpense ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(expenseData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to save expense');
      }

      onExpenseAdded();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return IconComponent;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {editExpense ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  type === 'expense'
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  type === 'income'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <QuickAddCategory onCategoryAdded={loadCategories} />
            </div>

            {loadingCategories ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="w-6 h-6 text-purple-600 animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  No categories found. Please add a category first.
                </p>
              </div>
            ) : (
              <>
                {/* Category Pills */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {categories.slice(0, 6).map((cat) => {
                    const IconComponent = getIconComponent(cat.icon);
                    const isSelected = category === cat.name;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md scale-105'
                            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <IconComponent 
                            className="w-4 h-4" 
                            style={{ color: cat.color }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Dropdown for all categories */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900 dark:text-white resize-none"
                placeholder="Add a note..."
                rows={3}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loadingCategories || categories.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : editExpense ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
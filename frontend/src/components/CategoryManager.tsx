import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, AlertCircle, Tag, Palette, Smile } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

interface CategoryStats {
  category: string;
  color: string;
  icon: string;
  expense_count: number;
  total_amount: number;
  can_delete: boolean;
}

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function CategoryManager({ isOpen, onClose, onUpdate }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#667EEA');
  const [formIcon, setFormIcon] = useState('📦');

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadStats();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/categories/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleAdd = async () => {
    if (!formName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formName,
          color: formColor,
          icon: formIcon
        })
      });

      if (response.ok) {
        await loadCategories();
        await loadStats();
        setShowAddForm(false);
        setFormName('');
        setFormColor('#667EEA');
        setFormIcon('📦');
        setError('');
        if (onUpdate) onUpdate();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to create category');
      }
    } catch (err) {
      setError('Failed to create category');
    }
  };

  const handleUpdate = async (id: number) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formName || category.name,
          color: formColor || category.color,
          icon: formIcon || category.icon
        })
      });

      if (response.ok) {
        await loadCategories();
        await loadStats();
        setEditingId(null);
        setFormName('');
        setFormColor('#667EEA');
        setFormIcon('📦');
        setError('');
        if (onUpdate) onUpdate();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update category');
      }
    } catch (err) {
      setError('Failed to update category');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const categoryStats = stats.find(s => s.category === name);
    
    if (categoryStats && !categoryStats.can_delete) {
      setError(`Cannot delete "${name}" - it's used in ${categoryStats.expense_count} expense(s)`);
      return;
    }

    if (!confirm(`Delete "${name}" category?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await loadCategories();
        await loadStats();
        setError('');
        if (onUpdate) onUpdate();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to delete category');
      }
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormName(category.name);
    setFormColor(category.color);
    setFormIcon(category.icon);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormName('');
    setFormColor('#667EEA');
    setFormIcon('📦');
    setError('');
  };

  const commonEmojis = ['📦', '🍔', '🚗', '🛍️', '💡', '🎬', '💰', '📚', '🏥', '✈️', '🏠', '💳', '🎮', '☕', '🎵', '💼', '🔧', '🎨'];
  const commonColors = ['#FF6B6B', '#4ECDC4', '#95E1D3', '#FFE66D', '#A8E6CF', '#4CAF50', '#2196F3', '#E91E63', '#667EEA', '#FF9800'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Manage Categories</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Add New Category Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Category
            </button>
          )}

          {/* Add Form */}
          {showAddForm && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">New Category</h3>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Category name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />

              {/* Icon Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Smile className="w-4 h-4 inline mr-1" />
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setFormIcon(emoji)}
                      className={`w-10 h-10 rounded-lg text-xl transition-all ${
                        formIcon === emoji 
                          ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500' 
                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormColor(color)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        formColor === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Add Category
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            {loading ? (
              <p className="text-center py-8 text-slate-500">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No categories yet</p>
            ) : (
              categories.map(category => {
                const categoryStats = stats.find(s => s.category === category.name);
                const isEditing = editingId === category.id;

                return (
                  <div
                    key={category.id}
                    className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                  >
                    {isEditing ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                        />
                        
                        <div className="flex gap-2">
                          {commonEmojis.slice(0, 10).map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => setFormIcon(emoji)}
                              className={`w-8 h-8 rounded text-lg ${
                                formIcon === emoji ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-slate-100 dark:bg-slate-700'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          {commonColors.slice(0, 6).map(color => (
                            <button
                              key={color}
                              onClick={() => setFormColor(color)}
                              className="w-8 h-8 rounded"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(category.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            {category.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {category.name}
                            </p>
                            {categoryStats && (
                              <p className="text-xs text-slate-500">
                                {categoryStats.expense_count} expense(s) · ₹{categoryStats.total_amount.toFixed(0)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(category)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id, category.name)}
                            className={`p-2 rounded-lg transition-colors ${
                              categoryStats?.can_delete
                                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-slate-400 cursor-not-allowed'
                            }`}
                            disabled={!categoryStats?.can_delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
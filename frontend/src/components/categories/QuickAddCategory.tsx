import React, { useState } from "react";
import { Plus, X, Check, Loader2, Palette, Tag } from "lucide-react";
import { API_ENDPOINTS, authPost } from "../../config/api";

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#14b8a6", // Teal
];

const QuickAddCategory = ({ onCategoryAdded }: any) => {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState({
    name: "",
    color: PRESET_COLORS[0],
    icon: "Tag",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.name.trim()) return setError("Name required");
    
    setSaving(true);
    setError("");

    try {
      await authPost(API_ENDPOINTS.categories, category);
      setCategory({ name: "", color: PRESET_COLORS[0], icon: "Tag" });
      setShowForm(false);
      if (onCategoryAdded) onCategoryAdded();
    } catch (err: any) {
      setError(err.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 py-2 px-1 transition-all group"
      >
        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
          <Plus className="w-3 h-3" />
        </div>
        Quick Add Category
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">New Category</h3>
        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && <p className="text-xs text-rose-500 mb-3 font-medium bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">{error}</p>}

      <form onSubmit={handleCreate} className="space-y-4">
        {/* Name & Icon */}
        <div className="space-y-3">
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400"
              placeholder="Category Name"
              value={category.name}
              onChange={(e) => setCategory({ ...category, name: e.target.value })}
              autoFocus
            />
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center font-serif italic text-xs">i</div>
            <input
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400"
              placeholder="Icon (e.g. Coffee, Car)"
              value={category.icon}
              onChange={(e) => setCategory({ ...category, icon: e.target.value })}
            />
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-2 block flex items-center gap-1">
            <Palette className="w-3 h-3" /> Color Label
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCategory({ ...category, color })}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 relative flex items-center justify-center ${category.color === color ? 'ring-2 ring-offset-2 ring-slate-300 dark:ring-slate-600 scale-110' : ''}`}
                style={{ backgroundColor: color }}
              >
                {category.color === color && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
            {/* Custom Color Input Hidden */}
            <label className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 cursor-pointer flex items-center justify-center hover:scale-110 transition-transform">
              <Plus className="w-3 h-3 text-slate-500" />
              <input 
                type="color" 
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                value={category.color}
                onChange={(e) => setCategory({ ...category, color: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>Create Category</span>
        </button>
      </form>
    </div>
  );
};

export default QuickAddCategory;
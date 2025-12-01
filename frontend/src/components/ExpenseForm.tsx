import { useState, useEffect } from "react";
import { X, DollarSign, Tag, FileText, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Expense } from "../types";

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface Props {
  onSubmit: (amount: number, category: string, description: string, date: string, type: "expense" | "income") => void;
  onCancel: () => void;
  editingExpense: Expense | null;
  error: string;
}

export const ExpenseForm: React.FC<Props> = ({ onSubmit, onCancel, editingExpense, error }) => {
  // ✅ NEW: Fetch categories from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Form state
  const [amount, setAmount] = useState(editingExpense?.amount?.toString() || "");
  const [category, setCategory] = useState(editingExpense?.category || "");
  const [description, setDescription] = useState(editingExpense?.description || "");
  const [date, setDate] = useState(editingExpense?.date || new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"expense" | "income">(editingExpense?.type || "expense");

  // ✅ NEW: Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // ✅ NEW: Function to load categories
  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        
        // Set first category as default if not editing and no category selected
        if (!editingExpense && !category && data.length > 0) {
          setCategory(data[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(parseFloat(amount), category, description, date, type);
  };

  return (
    <div className="glass-panel p-6 animate-scale-spring">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
          {editingExpense ? "Edit Transaction" : "New Transaction"}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`p-4 rounded-xl border-2 transition-all ${
              type === "expense"
                ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
            }`}
          >
            <TrendingDown
              className={`w-6 h-6 mx-auto mb-2 ${
                type === "expense" ? "text-rose-600" : "text-slate-400"
              }`}
            />
            <p
              className={`font-semibold text-sm ${
                type === "expense" ? "text-rose-700 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Expense
            </p>
          </button>

          <button
            type="button"
            onClick={() => setType("income")}
            className={`p-4 rounded-xl border-2 transition-all ${
              type === "income"
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
            }`}
          >
            <TrendingUp
              className={`w-6 h-6 mx-auto mb-2 ${
                type === "income" ? "text-emerald-600" : "text-slate-400"
              }`}
            />
            <p
              className={`font-semibold text-sm ${
                type === "income" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Income
            </p>
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-white transition-all"
            placeholder="0.00"
          />
        </div>

        {/* ✅ UPDATED: Dynamic Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Category
          </label>
          {loadingCategories ? (
            <div className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              No categories available
            </div>
          ) : (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-white transition-all"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ✅ NEW: Visual Category Pills (Optional) */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.name)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                category === cat.name
                  ? 'ring-2 ring-indigo-500 shadow-md scale-105'
                  : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: category === cat.name ? cat.color : cat.color + '30',
                color: category === cat.name ? '#ffffff' : '#1e293b'
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-white transition-all"
            placeholder="What was this for?"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-white transition-all"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
            <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn btn-primary"
          >
            {editingExpense ? "Update" : "Add"} Transaction
          </button>
        </div>
      </form>
    </div>
  );
};
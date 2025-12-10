import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
import {
  Loader2,
  Calendar,
  Type,
  AlignLeft,
  X,
} from "lucide-react";

interface EditExpenseFormProps {
  expense: any;
  onClose: () => void;
  onUpdated?: () => void;
}

const EditExpenseForm: React.FC<EditExpenseFormProps> = ({
  expense,
  onClose,
  onUpdated,
}) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [editExpense, setEditExpense] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
    type: "expense",
  });

  // Initialize local state from passed expense
  useEffect(() => {
    if (expense) {
      setEditExpense({
        amount: String(expense.amount ?? ""),
        category: expense.category ?? "",
        description: expense.description ?? "",
        date: expense.date ?? new Date().toISOString().split("T")[0],
        type: expense.type ?? "expense",
      });
    }
  }, [expense]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(API_ENDPOINTS.categories, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error("Failed to load categories");

        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (e) {
        console.error(e);
        setCategories([]);
      }
    };
    loadCategories();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExpense.amount || !editExpense.category || !editExpense.date) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_ENDPOINTS.expenses}/${expense.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editExpense,
          amount: parseFloat(editExpense.amount),
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        console.error("Failed to update expense");
        return;
      }

      if (onUpdated) onUpdated();
      else onClose();
    } finally {
      setSaving(false);
    }
  };

  const isExpense = editExpense.type === "expense";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden w-full">
      {/* Top Decoration Bar */}
      <div
        className={`absolute top-0 left-0 w-full h-1.5 ${
          isExpense
            ? "bg-gradient-to-r from-rose-500 to-orange-500"
            : "bg-gradient-to-r from-emerald-500 to-teal-500"
        }`}
      />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-20"
      >
        <X className="w-5 h-5 text-slate-500" />
      </button>

      <form onSubmit={handleSubmit}>
        {/* Title Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span 
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                isExpense 
                  ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800"
              }`}
            >
              {isExpense ? "Expense" : "Income"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Edit Transaction
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Update details for this {isExpense ? "expense" : "income"} entry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Amount */}
          <div className="relative group sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <span
                className={`text-2xl sm:text-3xl font-bold ${
                  isExpense ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                ₹
              </span>
            </div>
            <input
              type="number"
              placeholder="0.00"
              step="0.01"
              className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-2xl sm:text-3xl font-bold bg-slate-50 dark:bg-slate-900 border-2 outline-none transition-all placeholder:text-slate-300 ${
                isExpense
                  ? "border-rose-100 focus:border-rose-500 focus:ring-rose-500/20"
                  : "border-emerald-100 focus:border-emerald-500 focus:ring-emerald-500/20"
              } dark:border-slate-700`}
              value={editExpense.amount}
              onChange={(e) =>
                setEditExpense((prev) => ({
                  ...prev,
                  amount: e.target.value,
                }))
              }
            />
          </div>

          {/* Category */}
          <div className="relative">
            <label className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5 block ml-1">
              Category
            </label>
            <div className="relative">
              <Type className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none z-10" />
              <select
                className="input-field pl-10 sm:pl-12 pr-3 appearance-none cursor-pointer text-sm sm:text-base truncate"
                value={editExpense.category}
                onChange={(e) =>
                  setEditExpense((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              >
                <option value="">Select Category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="relative">
            <label className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5 block ml-1">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none z-10" />
              <input
                type="date"
                className="input-field pl-10 sm:pl-12 pr-3 text-sm sm:text-base"
                value={editExpense.date}
                onChange={(e) =>
                  setEditExpense((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Description */}
          <div className="sm:col-span-2 relative">
            <label className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5 block ml-1">
              Note (Optional)
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="text"
                placeholder="What was this for?"
                className="input-field pl-10 sm:pl-12 text-sm sm:text-base"
                value={editExpense.description}
                onChange={(e) =>
                  setEditExpense((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3.5 rounded-xl font-semibold text-sm sm:text-base border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className={`w-2/3 py-3.5 rounded-xl text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${
              isExpense
                ? "bg-gradient-to-r from-rose-600 to-orange-600 shadow-rose-500/30"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/30"
            }`}
          >
            {saving ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : null}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditExpenseForm;
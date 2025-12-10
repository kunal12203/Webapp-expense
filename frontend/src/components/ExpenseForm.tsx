import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
import { Loader2, Plus, Calendar, Type, AlignLeft, ArrowDown, ArrowUp } from "lucide-react";

const ExpenseForm = ({ onExpenseAdded }: any) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [expense, setExpense] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    type: "expense",
  });

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

  const isExpense = expense.type === 'expense';

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Validation: Only require category if it is an Expense
    if (!expense.amount || (isExpense && !expense.category) || !expense.date) return;
    
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      await fetch(API_ENDPOINTS.expenses, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...expense,
          amount: parseFloat(expense.amount),
          // If Income, force category to 'Income' (or leave empty if your backend prefers)
          category: isExpense ? expense.category : 'Income'
        }),
      });

      // Reset form (keep the current type)
      setExpense(prev => ({ 
        ...prev, 
        amount: "", 
        description: "",
        category: "" 
      }));
      
      if (onExpenseAdded) onExpenseAdded();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
      {/* Top Decoration */}
      <div className={`absolute top-0 left-0 w-full h-1 sm:h-1.5 ${isExpense ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} />

      <form onSubmit={handleSubmit}>
        {/* Title Section */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">New Transaction</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Record your daily spending or income.</p>
        </div>

        {/* Type Toggle - Centered */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-slate-100 dark:bg-slate-900 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex relative">
            <button
              type="button"
              onClick={() => setExpense({ ...expense, type: "expense" })}
              className={`relative z-10 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-all duration-300 flex items-center gap-2 ${
                isExpense ? "bg-white dark:bg-slate-800 text-rose-600 shadow-md" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" /> Expense
            </button>
            <button
              type="button"
              onClick={() => setExpense({ ...expense, type: "income" })}
              className={`relative z-10 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-all duration-300 flex items-center gap-2 ${
                !isExpense ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-md" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" /> Income
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Amount */}
          <div className="relative group sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <span className={`text-xl sm:text-2xl font-bold ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>₹</span>
            </div>
            <input
              type="number"
              placeholder="0.00"
              step="0.01"
              className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-2xl sm:text-3xl font-bold bg-slate-50 dark:bg-slate-900 border-2 outline-none transition-all placeholder:text-slate-300 ${isExpense ? 'border-rose-100 focus:border-rose-500 focus:ring-rose-500/20' : 'border-emerald-100 focus:border-emerald-500 focus:ring-emerald-500/20'} dark:border-slate-700`}
              value={expense.amount}
              onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
            />
          </div>

          {/* Category - Only shown if Expense */}
          {isExpense && (
            <div className="relative">
              <label className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5 block ml-1">Category</label>
              <div className="relative">
                <Type className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none z-10" />
                <select
                  className="input-field pl-10 sm:pl-12 pr-3 appearance-none cursor-pointer text-sm sm:text-base truncate"
                  value={expense.category}
                  onChange={(e) => setExpense({ ...expense, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date - Spans full width if Category is hidden */}
          <div className={`relative ${!isExpense ? 'sm:col-span-2' : ''}`}>
            <label className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5 block ml-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none z-10" />
              <input
                type="date"
                className="input-field pl-10 sm:pl-12 pr-3 text-sm sm:text-base"
                value={expense.date}
                onChange={(e) => setExpense({ ...expense, date: e.target.value })}
              />
            </div>
          </div>

          {/* Note */}
          <div className="sm:col-span-2 relative">
            <label className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5 block ml-1">Note (Optional)</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="text"
                placeholder="What was this for?"
                className="input-field pl-10 sm:pl-12 text-sm sm:text-base"
                value={expense.description}
                onChange={(e) => setExpense({ ...expense, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 sm:gap-3 ${isExpense ? 'bg-gradient-to-r from-rose-600 to-orange-600 shadow-rose-500/30' : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/30'}`}
          >
            {saving ? <Loader2 className="animate-spin w-5 h-5 sm:w-6 sm:h-6" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6" />}
            <span>{isExpense ? 'Add Expense' : 'Add Income'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
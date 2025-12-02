import React, { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import { Loader2, Plus, Calendar, Type, DollarSign, AlignLeft, ArrowDown, ArrowUp } from "lucide-react";

const ExpenseForm = ({ onExpenseAdded }: any) => {
  const [categories, setCategories] = useState([]);
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
        setCategories(await res.json());
      } catch (e) { console.error(e); }
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!expense.amount || !expense.category || !expense.date) return;
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
        }),
      });

      setExpense(prev => ({ ...prev, amount: "", description: "" }));
      if (onExpenseAdded) onExpenseAdded();
    } finally {
      setSaving(false);
    }
  };

  const isExpense = expense.type === 'expense';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
      {/* Top Decoration */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${isExpense ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} />

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Transaction</h2>
            <p className="text-sm text-slate-500">Record your daily spending or income.</p>
          </div>
          
          {/* Type Toggle */}
          <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl flex relative">
            <button
              type="button"
              onClick={() => setExpense({ ...expense, type: "expense" })}
              className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                isExpense ? "bg-white dark:bg-slate-800 text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ArrowDown className="w-4 h-4" /> Expense
            </button>
            <button
              type="button"
              onClick={() => setExpense({ ...expense, type: "income" })}
              className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                !isExpense ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ArrowUp className="w-4 h-4" /> Income
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount */}
          <div className="relative group md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className={`text-2xl font-bold ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>₹</span>
            </div>
            <input
              type="number"
              placeholder="0.00"
              className={`w-full pl-10 pr-4 py-4 rounded-2xl text-3xl font-bold bg-slate-50 dark:bg-slate-900 border-2 outline-none transition-all placeholder:text-slate-300 ${isExpense ? 'border-rose-100 focus:border-rose-500 focus:ring-rose-500/20' : 'border-emerald-100 focus:border-emerald-500 focus:ring-emerald-500/20'} dark:border-slate-700`}
              value={expense.amount}
              onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
            />
          </div>

          <div className="relative">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Category</label>
            <div className="relative">
              <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                className="input-field pl-12 appearance-none cursor-pointer"
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

          <div className="relative">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                className="input-field pl-12"
                value={expense.date}
                onChange={(e) => setExpense({ ...expense, date: e.target.value })}
              />
            </div>
          </div>

          <div className="md:col-span-2 relative">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Note (Optional)</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="What was this for?"
                className="input-field pl-12"
                value={expense.description}
                onChange={(e) => setExpense({ ...expense, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 ${isExpense ? 'bg-gradient-to-r from-rose-600 to-orange-600 shadow-rose-500/30' : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/30'}`}
          >
            {saving ? <Loader2 className="animate-spin w-6 h-6" /> : <Plus className="w-6 h-6" />}
            <span>{isExpense ? 'Add Expense' : 'Add Income'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
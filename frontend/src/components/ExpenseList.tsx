import React, { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import * as Icons from "lucide-react";
import { Trash2, Loader2, CalendarClock, ArrowUpRight, ArrowDownRight, Search, Edit2 } from "lucide-react";

// Helper function
function getLucideIcon(iconName: string) {
  const pascal = iconName ? iconName.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("") : "Tag";
  return (Icons as any)[pascal] || Icons.Tag;
}

const ExpenseList = ({ refreshSignal }: any) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const [resExp, resCat] = await Promise.all([
        fetch(API_ENDPOINTS.expenses, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_ENDPOINTS.categories, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setExpenses(await resExp.json());
      setCategories(await resCat.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [refreshSignal]);

  const deleteExpense = async (id: number) => {
    if(!window.confirm("Are you sure you want to delete this transaction?")) return;
    const token = localStorage.getItem("token");
    await fetch(`${API_ENDPOINTS.expenses}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadData();
  };

  const filteredExpenses = expenses.filter((e: any) => 
    e.description?.toLowerCase().includes(filter.toLowerCase()) || 
    e.category?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none w-full sm:w-64"
            placeholder="Search transactions..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredExpenses.map((e: any) => {
          const cat: any = categories.find((c: any) => c.name === e.category);
          const Icon = cat ? getLucideIcon(cat.icon) : Icons.Tag;
          const isIncome = e.type === 'income';

          return (
            <div key={e.id} className="group relative bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300 text-white`}
                    style={{ background: cat?.color || '#6366f1' }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-base">{e.category}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-medium">{e.description || "No description"}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="flex items-center gap-1 text-xs"><CalendarClock className="w-3 h-3" /> {e.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className={`text-right ${isIncome ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                    <div className="font-black text-lg flex items-center justify-end gap-1">
                      {isIncome ? '+' : '-'}₹{e.amount}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        // TODO: Open edit modal with expense data
                        alert('Edit functionality coming soon');
                      }}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm"
                      title="Edit Transaction"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteExpense(e.id)}
                      className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all shadow-sm"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredExpenses.length === 0 && (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-3">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
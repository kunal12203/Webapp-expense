import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
import * as Icons from "lucide-react";
import { Trash2, Loader2, CalendarClock, ArrowUpRight, ArrowDownRight, Search, Edit2, ArrowRight } from "lucide-react";

// Helper function
function getLucideIcon(iconName: string) {
  const pascal = iconName ? iconName.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("") : "Tag";
  return (Icons as any)[pascal] || Icons.Tag;
}

const ExpenseList = ({ refreshSignal, showAll = false }: any) => {
  const navigate = useNavigate();
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

  // Limit to 5 on dashboard, show all on dedicated page
  const displayExpenses = showAll ? filteredExpenses : filteredExpenses.slice(0, 5);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          className="w-full pl-9 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          placeholder="Search transactions..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {displayExpenses.map((e: any) => {
          const cat: any = categories.find((c: any) => c.name === e.category);
          const Icon = cat ? getLucideIcon(cat.icon) : Icons.Tag;
          const isIncome = e.type === 'income';

          return (
            <div key={e.id} className="group relative bg-white dark:bg-slate-800/50 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Icon */}
                <div 
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300 text-white shrink-0`}
                  style={{ background: cat?.color || '#6366f1' }}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">{e.category}</div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {e.description || "No description"}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <CalendarClock className="w-3 h-3" /> 
                    <span>{e.date}</span>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className={`text-base sm:text-lg font-black ${isIncome ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                    {isIncome ? '+' : '-'}₹{e.amount}
                  </div>
                  
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        alert('Edit functionality coming soon');
                      }}
                      className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                      title="Edit Transaction"
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button 
                      onClick={() => deleteExpense(e.id)}
                      className="p-1.5 sm:p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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
        
        {!showAll && filteredExpenses.length > 5 && (
          <button
            onClick={() => navigate("/transactions")}
            className="w-full mt-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all font-semibold flex items-center justify-center gap-2"
          >
            See All Transactions
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
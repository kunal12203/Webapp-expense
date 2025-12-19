import React, { useEffect, useState } from "react";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import PendingTransactionSection from "./PendingTransactionSection";
import Charts from "./Charts";
import CategoryManager from "./CategoryManager";
import { StatsCards } from "./StatsCards";
import { API_ENDPOINTS } from "../config/api";
import { Settings, RefreshCw, Calendar } from "lucide-react";
import InstallAppBanner from "../pages/InstallAppPage";

const Dashboard = () => {
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Stats State
  // FIX: Added <any[]> to prevent 'never[]' type inference error
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });

  const updateAll = () => setRefreshSignal((prev) => prev + 1);

  // Data Fetching
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(API_ENDPOINTS.expenses, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Safety: Handle non-200 responses
        if (!res.ok) throw new Error("Failed to fetch data");

        const data = await res.json();
        
        // Ensure data is actually an array before setting state
        if (Array.isArray(data)) {
          setTransactions(data);

          // Calculate Stats
          const income = data
            .filter((t: any) => t.type === 'income')
            .reduce((acc: number, curr: any) => acc + curr.amount, 0);
          
          const expenses = data
            .filter((t: any) => t.type === 'expense')
            .reduce((acc: number, curr: any) => acc + curr.amount, 0);

          setStats({ income, expenses, balance: income - expenses });
        } else {
          console.error("API returned non-array data:", data);
          setTransactions([]);
        }
      } catch (error) {
        console.error("Failed to load stats", error);
        setTransactions([]); // Fallback to empty state
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Global Listeners
    window.addEventListener("expensesUpdated", updateAll);
    window.addEventListener("pendingTransactionsUpdated", updateAll);
    return () => {
      window.removeEventListener("expensesUpdated", updateAll);
      window.removeEventListener("pendingTransactionsUpdated", updateAll);
    };
  }, [refreshSignal]);

  return (
    <div className="min-h-screen w-full pb-12">
      {/* Main Container: Limits width on large screens for elegance */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-6">
        
        {/* --- Header Section --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-slide-up">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wide">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Overview</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-end">
            <button 
              onClick={updateAll} 
              className="group p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-600 hover:text-indigo-600 hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            </button>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <Settings className="w-4 h-4" /> 
              <span>Categories</span>
            </button>
          </div>
        </header>

        {/* --- Stats Cards --- */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <StatsCards balance={stats.balance} income={stats.income} expenses={stats.expenses} />
        </section>

        {/* --- Install App Banner --- */}
        {/* Temporarily disabled - causing white screen on iPhone */}
        {/* <section className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <InstallAppBanner />
        </section> */}

        {/* --- Main Dashboard Grid --- */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form & List */}
          <div className="lg:col-span-7 flex flex-col gap-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-full">
              <ExpenseForm onExpenseAdded={updateAll} />
            </div>
            <div className="glass-card p-4 sm:p-6 md:p-8 min-h-[400px]">
              <ExpenseList refreshSignal={refreshSignal} />
            </div>
          </div>

          {/* Right Column: Pending & Charts */}
          <div className="lg:col-span-5 flex flex-col gap-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-full">
              <PendingTransactionSection onUpdate={updateAll} />
            </div>
            <div className="glass-card p-4 sm:p-6 md:p-8 h-full min-h-[450px]">
              <Charts refreshSignal={refreshSignal} />
            </div>
          </div>

        </main>
      </div>

      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onUpdate={updateAll}
      />
    </div>
  );
};

export default Dashboard;
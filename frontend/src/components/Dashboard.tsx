import React, { useEffect, useState } from "react";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import PendingTransactionSection from "./PendingTransactionSection";
import Charts from "./Charts";
import CategoryManager from "./CategoryManager";
import { StatsCards } from "./StatsCards";
import { API_ENDPOINTS } from "../config/api";
import { Settings, Plus, RefreshCw, Calendar } from "lucide-react";

const Dashboard = () => {
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Stats State
  const [transactions, setTransactions] = useState([]);
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
        const data = await res.json();
        setTransactions(data);

        // Calculate Stats
        const income = data
          .filter((t: any) => t.type === 'income')
          .reduce((acc: number, curr: any) => acc + curr.amount, 0);
        
        const expenses = data
          .filter((t: any) => t.type === 'expense')
          .reduce((acc: number, curr: any) => acc + curr.amount, 0);

        setStats({ income, expenses, balance: income - expenses });
      } catch (error) {
        console.error("Failed to load stats", error);
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-slide-up">
        <div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Overview</span>
          </h1>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={updateAll} 
            className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-600 hover:text-indigo-600 hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCategoryManager(true)}
            className="btn-ghost"
          >
            <Settings className="w-4 h-4" /> Categories
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <StatsCards balance={stats.balance} income={stats.income} expenses={stats.expenses} />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Quick Actions & Lists (7 cols) */}
        <div className="xl:col-span-7 space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Input Area */}
          <div className="glass-card p-1">
            <ExpenseForm onExpenseAdded={updateAll} />
          </div>

          {/* Transactions List */}
          <div className="glass-card p-6 md:p-8 min-h-[500px]">
            <ExpenseList refreshSignal={refreshSignal} />
          </div>
        </div>

        {/* Right Column: Analytics & Notifications (5 cols) */}
        <div className="xl:col-span-5 space-y-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          
          {/* Pending Items (if any) */}
          <PendingTransactionSection onUpdate={updateAll} />

          {/* Charts */}
          <div className="glass-card p-6 md:p-8 h-[500px]">
            <Charts refreshSignal={refreshSignal} />
          </div>
        </div>
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
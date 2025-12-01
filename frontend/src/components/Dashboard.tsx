import React, { useState, useEffect } from "react";
import {
  Plus,
  LogOut,
  Link as LinkIcon,
  Wallet,
  Zap,
  Menu,
  Download,
  Upload
} from "lucide-react";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  generatePaymentUrl,
} from "../services/api";
import { PendingTransactionsSection } from "./PendingTransactionSection";
import { StatsCards } from "./StarCards";
import { Charts } from "./Charts";
import { ExpenseList } from "./ExpenseList";
import { ExpenseForm } from "./ExpenseForm";
import ExportModal from "./ExportModal";
import ImportModal from "./ImportModal";
import { Expense } from "../types"; // ✅ Imported shared type

interface Props {
  token: string;
  onLogout: () => void;
}

export const Dashboard: React.FC<Props> = ({ token, onLogout }) => {
  // State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [generatedUrl, setGeneratedUrl] = useState<string>("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [userName, setUserName] = useState("User");
  
  // ✅ NEW: Export/Import State
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Load Data
  useEffect(() => {
    loadExpenses();
    // Simulate getting user name from token/api
    const storedName = localStorage.getItem("username");
    if (storedName) setUserName(storedName);
  }, [filterCategory, filterType]);

  const loadExpenses = async () => {
    try {
      const data = await getExpenses(token, filterCategory, filterType);
      setExpenses(data);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateUrl = async () => {
    try {
      const data = await generatePaymentUrl(token);
      setGeneratedUrl(data.url);
      setShowUrlModal(true);
    } catch (err) { alert("Failed to generate URL"); }
  };

  const handleSubmit = async (amount: number, category: string, description: string, date: string, type: "expense" | "income") => {
    try {
      if (editingExpense) {
        await updateExpense(token, editingExpense.id, amount, category, description, date, type);
      } else {
        await createExpense(token, amount, category, description, date, type);
      }
      setShowAddModal(false);
      setEditingExpense(null);
      loadExpenses();
    } catch (err) { alert("Failed to save"); }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this?")) {
      await deleteExpense(token, id);
      loadExpenses();
    }
  };

  // ✅ NEW: Handle Import Success
  const handleImportSuccess = () => {
    loadExpenses(); // Refresh expense list after import
    setShowImportModal(false);
  };

  // Stats Calculation
  const totalExpenses = expenses.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = expenses.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Insight Calculations
  const highestExpense = expenses
    .filter(e => e.type === 'expense')
    .sort((a, b) => b.amount - a.amount)[0];
  
  const averageSpend = totalExpenses > 0 && expenses.filter(e => e.type === 'expense').length > 0
    ? totalExpenses / expenses.filter(e => e.type === 'expense').length 
    : 0;

  return (
    <div className="min-h-screen pb-20 md:pb-8 transition-colors duration-500">
      {/* 1. Navbar (Glassmorphism) */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wallet className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Expense<span className="text-indigo-600 dark:text-indigo-400">Tracker</span></h1>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Pro Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* ✅ NEW: Export/Import Buttons */}
            <button 
              onClick={() => setShowExportModal(true)} 
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-purple-50 hover:text-purple-600 dark:text-slate-300 dark:hover:bg-purple-900/20 transition-all"
              title="Export data"
            >
              <Download className="w-4 h-4" />
              <span className="hidden xl:inline">Export</span>
            </button>
            
            <button 
              onClick={() => setShowImportModal(true)} 
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-green-50 hover:text-green-600 dark:text-slate-300 dark:hover:bg-green-900/20 transition-all"
              title="Import data"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden xl:inline">Import</span>
            </button>
            
            <button onClick={handleGenerateUrl} className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all">
              <LinkIcon className="w-4 h-4" /> 
              <span className="hidden xl:inline">Quick Link</span>
            </button>
            
            <button onClick={onLogout} className="p-2.5 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 transition-all">
              <LogOut className="w-5 h-5" />
            </button>
            
            <button onClick={() => { setEditingExpense(null); setShowAddModal(true); }} className="btn btn-primary">
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">New Transaction</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Main Grid Layout (Bento) */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Welcome Message */}
        <div className="col-span-full mb-2 animate-slide-up">
           <div className="flex justify-between items-center">
             <div>
               <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                 Hello, <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{userName}</span> 👋
               </h2>
               <p className="text-slate-500 dark:text-slate-400">Here's your financial overview for today.</p>
             </div>
             
             {/* ✅ NEW: Mobile Export/Import Buttons */}
             <div className="flex lg:hidden gap-2">
               <button 
                 onClick={() => setShowExportModal(true)}
                 className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                 title="Export"
               >
                 <Download className="w-5 h-5" />
               </button>
               <button 
                 onClick={() => setShowImportModal(true)}
                 className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                 title="Import"
               >
                 <Upload className="w-5 h-5" />
               </button>
             </div>
           </div>
        </div>

        {/* Row 1: Stats Cards (Full Width) */}
        <div className="col-span-full">
          <StatsCards balance={balance} income={totalIncome} expenses={totalExpenses} />
        </div>

        {/* Row 2: Left Column (Charts & Insights) */}
        <div className="col-span-1 md:col-span-1 xl:col-span-2 flex flex-col gap-6">
          
          {/* Insights Card - Staggered Entry */}
          <div className="glass-panel p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">AI Insights</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Highest Spend</p>
                <p className="text-lg font-black text-slate-800 dark:text-slate-100 truncate">
                  {highestExpense ? `₹${highestExpense.amount}` : "—"}
                </p>
                <p className="text-xs text-slate-500 truncate mt-1">{highestExpense?.description || "No data yet"}</p>
              </div>
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Avg. Transaction</p>
                <p className="text-lg font-black text-slate-800 dark:text-slate-100">
                  ₹{averageSpend.toFixed(0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">per active expense</p>
              </div>
            </div>
          </div>

          {/* Charts Area - Staggered Entry */}
          <div className="h-96 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Charts expenses={expenses} />
          </div>
        </div>

        {/* Row 2: Right Column (Pending & Recent Transactions) */}
        <div className="col-span-1 md:col-span-1 xl:col-span-2 flex flex-col gap-6">
          
          {/* Pending Section */}
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
             <PendingTransactionsSection token={token} onUpdate={loadExpenses} />
          </div>
          
          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar animate-slide-up" style={{ animationDelay: '0.5s' }}>
            {["Food", "Transport", "Shopping", "Bills", "Entertainment"].map((cat, i) => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? "" : cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300
                  ${filterCategory === cat 
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-105" 
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-400"}`}
                style={{ animationDelay: `${0.5 + (i * 0.05)}s` }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List - The list itself has internal staggering */}
          <ExpenseList 
            expenses={expenses} 
            onEdit={(e) => { setEditingExpense(e); setShowAddModal(true); }}
            onDelete={handleDelete}
          />
        </div>

      </div>

      {/* 3. Modals (With Spring Animation) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md animate-scale-spring">
            <ExpenseForm 
              onSubmit={handleSubmit} 
              onCancel={() => setShowAddModal(false)}
              editingExpense={editingExpense}
              error=""
            />
          </div>
        </div>
      )}

      {showUrlModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-8 max-w-md w-full animate-scale-spring text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <LinkIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 dark:text-white">Your Quick Link</h3>
            <p className="text-slate-500 text-sm mb-6">Share this URL or use it to add expenses instantly without logging in.</p>
            
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-xs break-all font-mono mb-6 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {generatedUrl}
            </div>
            
            <button onClick={() => setShowUrlModal(false)} className="btn btn-primary w-full">Done</button>
          </div>
        </div>
      )}

      {/* ✅ NEW: Export Modal */}
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
      />

      {/* ✅ NEW: Import Modal */}
      <ImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};
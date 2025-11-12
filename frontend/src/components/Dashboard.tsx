import React, { useState, useEffect } from "react";
import { Expense } from "../types";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  generatePaymentUrl,
} from "../services/api";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { StatsCards } from "./StarCards";
import { Charts } from "./Charts";
import { Moon, Sun, LogOut, PlusCircle, TrendingUp, Link2, Copy } from "lucide-react";

interface DashboardProps {
  token: string;
  onLogout: () => void;
}

const categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];

export const Dashboard: React.FC<DashboardProps> = ({ token, onLogout }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true" || window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses(token, filterCategory || undefined, filterType || undefined);
      setExpenses(data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  const handleSubmitExpense = async (
    amount: number,
    category: string,
    description: string,
    date: string,
    type: "expense" | "income"
  ) => {
    setError("");
    try {
      if (editingExpense) {
        await updateExpense(token, editingExpense.id, amount, category, description, date, type);
      } else {
        await createExpense(token, amount, category, description, date, type);
      }
      await fetchExpenses();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await deleteExpense(token, id);
      await fetchExpenses();
    } catch {
      setError("Failed to delete expense");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    setError("");
  };

  const handleGenerateUrl = async () => {
    try {
      const data = await generatePaymentUrl(token);
      setGeneratedUrl(data.url);
      setShowUrlModal(true);
    } catch (err) {
      setError("Failed to generate URL");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    alert("URL copied to clipboard!");
  };

  const balance = expenses.reduce(
    (acc, exp) => (exp.type === "income" ? acc + exp.amount : acc - exp.amount),
    0
  );
  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((acc, e) => acc + e.amount, 0);
  const totalExpenses = expenses
    .filter((e) => e.type === "expense")
    .reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="min-h-screen p-4 md:p-8 animate-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card p-6 animate-slide-down">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center animate-float">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Expense Tracker
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your finances with ease
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="btn btn-ghost w-10 h-10 p-0 flex items-center justify-center"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={onLogout} className="btn btn-danger flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards balance={balance} income={totalIncome} expenses={totalExpenses} />

        {/* Charts */}
        <Charts expenses={expenses} />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary flex items-center justify-center gap-2 animate-scale-in"
            >
              <PlusCircle className="w-5 h-5" />
              Add Transaction
            </button>
          )}
          
          <button
            onClick={handleGenerateUrl}
            className="btn btn-success flex items-center justify-center gap-2"
          >
            <Link2 className="w-5 h-5" />
            Create Personalized URL
          </button>
        </div>

        {/* URL Modal */}
        {showUrlModal && (
          <div className="glass-card p-6 animate-slide-down">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Your Personalized URL</h3>
              <button 
                onClick={() => setShowUrlModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={generatedUrl}
                readOnly
                className="input flex-1 font-mono text-sm"
              />
              <button onClick={copyToClipboard} className="btn btn-primary flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                💡 Pro Tip: Add query parameters to pre-fill the form!
              </p>
              <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded block">
                {generatedUrl}?amount=500&note=Lunch at cafe
              </code>
            </div>
          </div>
        )}

        {/* Expense Form */}
        {showForm && (
          <div className="animate-slide-up">
            <ExpenseForm
              onSubmit={handleSubmitExpense}
              onCancel={resetForm}
              editingExpense={editingExpense}
              error={error}
            />
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input flex-1"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input flex-1"
            >
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <button onClick={fetchExpenses} className="btn btn-primary">
              Apply
            </button>

            {(filterCategory || filterType) && (
              <button
                onClick={() => {
                  setFilterCategory("");
                  setFilterType("");
                  setTimeout(fetchExpenses, 0);
                }}
                className="btn btn-ghost"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Expense List */}
        <ExpenseList expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
};
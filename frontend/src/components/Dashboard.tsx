import React, { useState, useEffect } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Edit2,
  Trash2,
  LogOut,
  User,
  Link as LinkIcon,
} from "lucide-react";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  generatePaymentUrl,
} from "../services/api";
import { PendingTransactionsSection } from "./PendingTransactionSection";

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: string;
}

interface Props {
  token: string;
  onLogout: () => void;
}

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Other",
];

export const Dashboard: React.FC<Props> = ({ token, onLogout }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [generatedUrl, setGeneratedUrl] = useState<string>("");
  const [showUrlModal, setShowUrlModal] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"expense" | "income">("expense");

  useEffect(() => {
    loadExpenses();
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
    } catch (err) {
      console.error("Failed to generate URL:", err);
      alert("Failed to generate URL");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingExpense) {
        await updateExpense(
          token,
          editingExpense.id,
          parseFloat(amount),
          category,
          description,
          date,
          type
        );
      } else {
        await createExpense(
          token,
          parseFloat(amount),
          category,
          description,
          date,
          type
        );
      }

      resetForm();
      loadExpenses();
    } catch (err) {
      console.error("Failed to save expense:", err);
      alert("Failed to save expense");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description);
    setDate(expense.date);
    setType(expense.type as "expense" | "income");
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this transaction?")) return;

    try {
      await deleteExpense(token, id);
      loadExpenses();
    } catch (err) {
      console.error("Failed to delete expense:", err);
      alert("Failed to delete expense");
    }
  };

  const resetForm = () => {
    setAmount("");
    setCategory("Food");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setType("expense");
    setEditingExpense(null);
    setShowAddModal(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("URL copied to clipboard!");
  };

  // Calculate statistics
  const totalExpenses = expenses
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Expense Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your finances with AI-powered insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateUrl}
              className="btn btn-secondary flex items-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Generate URL
            </button>
            <button
              onClick={onLogout}
              className="btn btn-danger flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Income */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Income
                </p>
                <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{totalIncome.toFixed(2)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Expenses
                </p>
                <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">
                  ₹{totalExpenses.toFixed(2)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Balance
                </p>
                <h3
                  className={`text-3xl font-bold ${
                    balance >= 0
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  ₹{balance.toFixed(2)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ PENDING TRANSACTIONS SECTION */}
        <div className="mb-8">
          <PendingTransactionsSection 
            token={token} 
            onUpdate={loadExpenses}
          />
        </div>

        {/* Expenses Section */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Transactions</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Filter by Category
              </label>
              <select
                className="input w-full"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Filter by Type
              </label>
              <select
                className="input w-full"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          {/* Expenses List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading transactions...
              </p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No transactions yet. Add your first one!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">
                        {expense.description}
                      </h3>
                      <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full">
                        {expense.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{expense.date}</span>
                      <span>•</span>
                      <span
                        className={
                          expense.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400 font-medium"
                            : "text-red-600 dark:text-red-400 font-medium"
                        }
                      >
                        {expense.type === "income" ? "💰 Income" : "💸 Expense"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`text-2xl font-bold ${
                        expense.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {expense.type === "income" ? "+" : "-"}₹
                      {expense.amount.toFixed(2)}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="btn btn-ghost w-10 h-10 p-0"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="btn btn-ghost w-10 h-10 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                {editingExpense ? "Edit Transaction" : "Add Transaction"}
              </h3>
              <button
                onClick={resetForm}
                className="btn btn-ghost w-10 h-10 p-0"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${
                    type === "expense"
                      ? "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  💸 Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${
                    type === "income"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  💰 Income
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input w-full"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  className="input w-full"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <input
                  type="text"
                  className="input w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  className="input w-full"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn btn-primary w-full">
                {editingExpense ? "Update Transaction" : "Add Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Generated URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Generated URL</h3>
              <button
                onClick={() => setShowUrlModal(false)}
                className="btn btn-ghost w-10 h-10 p-0"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Use this URL to quickly add expenses from anywhere:
              </p>

              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg break-all font-mono text-sm">
                {generatedUrl}
              </div>

              <button
                onClick={() => copyToClipboard(generatedUrl)}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
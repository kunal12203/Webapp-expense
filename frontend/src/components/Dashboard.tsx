import React, { useState, useEffect } from "react";
import { Expense } from "../types";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../services/api";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";

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

  useEffect(() => {
    fetchExpenses();
  }, []);

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

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

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
    <div className="max-w-6xl mx-auto p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">💰 Expense Tracker</h1>
        <button onClick={onLogout} className="btn btn-danger">
          Logout
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-1">Balance</h3>
          <p className="text-2xl font-semibold">{formatINR(balance)}</p>
        </div>
        <div className="card bg-green-100 dark:bg-green-900 text-center">
          <h3 className="text-gray-600 dark:text-gray-300 text-sm mb-1">Income</h3>
          <p className="text-2xl font-semibold text-green-700 dark:text-green-300">
            {formatINR(totalIncome)}
          </p>
        </div>
        <div className="card bg-red-100 dark:bg-red-900 text-center">
          <h3 className="text-gray-600 dark:text-gray-300 text-sm mb-1">Expenses</h3>
          <p className="text-2xl font-semibold text-red-700 dark:text-red-300">
            {formatINR(totalExpenses)}
          </p>
        </div>
      </div>

      {/* Add Transaction */}
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn btn-primary mb-6">
          + Add Transaction
        </button>
      )}

      {/* Expense Form */}
      {showForm && (
        <ExpenseForm
          onSubmit={handleSubmitExpense}
          onCancel={resetForm}
          editingExpense={editingExpense}
          error={error}
        />
      )}

      {/* Filters */}
      <div className="card mb-6 flex flex-wrap gap-3 items-center">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input sm:w-1/4"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input sm:w-1/4"
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
              fetchExpenses();
            }}
            className="btn btn-secondary"
          >
            Clear
          </button>
        )}
      </div>

      {/* Expense List */}
      <ExpenseList expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
};

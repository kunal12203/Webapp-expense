// src/components/ExpenseForm.tsx

import React, { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import * as Icons from "lucide-react";
import { Loader2, PlusCircle } from "lucide-react";

function getLucideIcon(iconName: string) {
  const pascal = iconName
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return (Icons as any)[pascal] || Icons.Tag;
}

const ExpenseForm = ({ onExpenseAdded }: any) => {
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  const [expense, setExpense] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
    type: "expense",
  });

  const loadCategories = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(API_ENDPOINTS.categories, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCategories(await res.json());
  };

  useEffect(() => {
    loadCategories();
  }, []);
  

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!expense.amount || !expense.category || !expense.date) return;

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const body = {
        amount: parseFloat(expense.amount),
        category: expense.category,
        description: expense.description,
        date: expense.date,
        type: expense.type,
      };

      const res = await fetch(API_ENDPOINTS.expenses, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      await res.json();

      setExpense({
        amount: "",
        category: "",
        description: "",
        date: "",
        type: "expense",
      });

      if (onExpenseAdded) onExpenseAdded();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-xl shadow-sm space-y-3">

      <input
        type="number"
        placeholder="Amount"
        className="w-full p-2 border rounded-md"
        value={expense.amount}
        onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
      />

      <select
        className="w-full p-2 border rounded-md"
        value={expense.category}
        onChange={(e) => setExpense({ ...expense, category: e.target.value })}
      >
        <option value="">Select Category</option>
        {categories.map((c: any) => (
          <option key={c.id} value={c.name}>{c.name}</option>
        ))}
      </select>

      <input
        type="date"
        className="w-full p-2 border rounded-md"
        value={expense.date}
        onChange={(e) => setExpense({ ...expense, date: e.target.value })}
      />

      <input
        type="text"
        placeholder="Description"
        className="w-full p-2 border rounded-md"
        value={expense.description}
        onChange={(e) => setExpense({ ...expense, description: e.target.value })}
      />

      <select
        className="w-full p-2 border rounded-md"
        value={expense.type}
        onChange={(e) => setExpense({ ...expense, type: e.target.value })}
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-indigo-600 text-white py-2 rounded-md flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="animate-spin" /> : <PlusCircle />}
        Add Transaction
      </button>
    </form>
  );
};

export default ExpenseForm;

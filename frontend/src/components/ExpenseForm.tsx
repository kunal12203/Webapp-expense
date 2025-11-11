import React, { useState, useEffect } from "react";
import { Expense } from "../types";

interface ExpenseFormProps {
  onSubmit: (
    amount: number,
    category: string,
    description: string,
    date: string,
    type: "expense" | "income"
  ) => Promise<void>;
  onCancel: () => void;
  editingExpense: Expense | null;
  error: string;
}

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Other",
];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  onSubmit,
  onCancel,
  editingExpense,
  error,
}) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"expense" | "income">("expense");

  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setDescription(editingExpense.description);
      setDate(editingExpense.date);
      setType(editingExpense.type);
    }
  }, [editingExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(parseFloat(amount), category, description, date, type);
  };

  return (
    <div className="card mb-6">
      <h3 className="text-xl font-semibold mb-4">
        {editingExpense ? "Edit Transaction" : "Add New Transaction"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Type</label>
            <select
              className="input"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "expense" | "income")
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Description</label>
          <input
            type="text"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary">
            {editingExpense ? "Update" : "Save"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

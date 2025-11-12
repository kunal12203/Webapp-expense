import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getPendingTransaction,
  confirmPendingTransaction,
  cancelPendingTransaction,
} from "../services/api";
import { X, Check, Trash2 } from "lucide-react";

interface Props {
  token: string;
  onClose: () => void;
}

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Other",
];

export const PendingTransactionModal: React.FC<Props> = ({ token, onClose }) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // ✅ Pre-fill from URL query params
    const queryAmount = searchParams.get("amount");
    const queryNote = searchParams.get("note");

    if (queryAmount) setAmount(queryAmount);
    if (queryNote) setDescription(queryNote);
  }, [searchParams]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await confirmPendingTransaction(
        token,
        parseFloat(amount),
        category,
        description,
        date,
        type
      );
      alert("Transaction added successfully!");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to confirm transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this transaction?")) return;

    try {
      await cancelPendingTransaction(token);
      onClose();
    } catch (err) {
      setError("Failed to cancel");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card max-w-md w-full p-6 animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Add Quick Expense</h3>
          <button onClick={onClose} className="btn btn-ghost w-10 h-10 p-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                type === "expense"
                  ? "bg-gradient-to-r from-red-500 to-pink-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              💸 Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                type === "income"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              💰 Income
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount (₹)</label>
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
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              className="input"
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

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {loading ? "Confirming..." : "Confirm"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  confirmPendingTransaction,
  cancelPendingTransaction,
} from "../services/api";

import { X, Check, Trash2, Sparkles } from "lucide-react";

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

export const PendingTransactionModal: React.FC<Props> = ({
  token,
  onClose,
}) => {
  const [searchParams] = useSearchParams();

  // ✅ Initialize from URL query parameters (already parsed by backend!)
  const [amount, setAmount] = useState(searchParams.get("amount") || "");
  const [category, setCategory] = useState(
    searchParams.get("category") || "Food"
  );
  const [description, setDescription] = useState(
    searchParams.get("note") || ""
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"expense" | "income">(
    (searchParams.get("type") as "expense" | "income") || "expense"
  );

  const [loading, setLoading] = useState(false);
  const [isAiParsed, setIsAiParsed] = useState(false);
  const [error, setError] = useState("");

  // Check if data was AI-parsed (has query params)
  useEffect(() => {
    const hasQueryParams =
      searchParams.get("amount") ||
      searchParams.get("note") ||
      searchParams.get("category");

    if (hasQueryParams) {
      setIsAiParsed(true);
      console.log("✅ AI-parsed data loaded from URL:", {
        amount: searchParams.get("amount"),
        note: searchParams.get("note"),
        category: searchParams.get("category"),
        type: searchParams.get("type"),
      });
    }
  }, [searchParams]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Submitting transaction:", {
        token,
        amount: parseFloat(amount),
        category,
        description,
        date,
        type,
      });

      await confirmPendingTransaction(
        token,
        parseFloat(amount),
        category,
        description,
        date,
        type
      );

      alert("✅ Transaction added successfully!");
      onClose();
    } catch (err) {
      console.error("Error confirming transaction:", err);
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
      console.error("Error canceling transaction:", err);
      setError("Failed to cancel");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card max-w-md w-full p-6 animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold">Add Quick Expense</h3>
            {isAiParsed && (
              <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            )}
          </div>

          <button onClick={onClose} className="btn btn-ghost w-10 h-10 p-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isAiParsed && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              ✨ <strong>Auto-filled from SMS!</strong> Please review and
              confirm.
            </p>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
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
            <label className="block text-sm font-medium mb-2">Category</label>
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

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
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
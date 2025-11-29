import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getPendingTransaction,
  confirmPendingTransaction,
  cancelPendingTransaction,
  parseSms,
} from "../services/api";

import { X, Check, Trash2, Sparkles } from "lucide-react";

interface Props {
  token: string;
  onClose: () => void;
  sms?: string;
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
  sms,
}) => {
  const [searchParams] = useSearchParams();

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

  // 🔥 Auto-parse SMS text through backend
  useEffect(() => {
    if (!sms || sms.trim().length < 4) return;

    const parse = async () => {
      try {
        const data = await parseSms(sms);

        setAmount(data.amount || "");
        setDescription(data.merchant || "");
        setDate(data.date || new Date().toISOString().split("T")[0]);
        setCategory("Other");

        setIsAiParsed(true);
      } catch (err) {
        console.error("SMS parsing failed:", err);
      }
    };

    parse();
  }, [sms]);

  // 🔥 Mark AI parsed if query params provided
  useEffect(() => {
    if (
      searchParams.get("amount") ||
      searchParams.get("note") ||
      searchParams.get("category")
    ) {
      setIsAiParsed(true);
    }
  }, [searchParams]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await confirmPendingTransaction(
        token,
        parseFloat(amount),
        category,
        description,
        date,
        type
      );
      alert("Transaction added!");
      onClose();
    } catch (err) {
      setError("Failed to confirm");
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card max-w-md w-full p-6 animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold">Add Quick Expense</h3>
            {isAiParsed && (
              <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                <Sparkles className="w-3 h-3" />
                AI Parsed
              </span>
            )}
          </div>

          <button className="btn btn-ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {isAiParsed && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg">
            ✨ Auto-filled from SMS. Review and confirm.
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-3 px-4 rounded-xl ${
                type === "expense"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              💸 Expense
            </button>

            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-3 px-4 rounded-xl ${
                type === "income"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              💰 Income
            </button>
          </div>

          <div>
            <label className="text-sm font-medium">Amount (₹)</label>
            <input
              type="number"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
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

          <div>
            <label className="text-sm font-medium">Description</label>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              <Check className="w-4 h-4" />
              {loading ? "Saving..." : "Confirm"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-danger"
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

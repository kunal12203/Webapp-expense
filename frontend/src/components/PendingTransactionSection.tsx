import React, { useState, useEffect } from "react";
import {
  getPendingTransactions,
  confirmPendingTransaction,
  cancelPendingTransaction,
} from "../services/api";
import { Clock, Check, X, Sparkles } from "lucide-react";

interface PendingTransaction {
  id: number;
  token: string;
  amount: number | null;
  category: string | null;
  description: string | null;
  date: string | null;
  type: string | null;
  status: string;
}

interface Props {
  token: string;
  onUpdate: () => void; // Callback to refresh main dashboard
}

export const PendingTransactionsSection: React.FC<Props> = ({
  token,
  onUpdate,
}) => {
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, [token]);

  const loadPending = async () => {
    try {
      const data = await getPendingTransactions(token);
      setPending(data);
    } catch (err) {
      console.error("Failed to load pending transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (item: PendingTransaction) => {
    if (!item.amount || !item.description) {
      alert("Please edit this transaction to add missing details");
      return;
    }

    setActionLoading(item.token);
    try {
      await confirmPendingTransaction(
        item.token,
        item.amount,
        item.category || "Other",
        item.description,
        item.date || new Date().toISOString().split("T")[0],
        item.type || "expense"
      );

      alert("✅ Transaction confirmed!");
      await loadPending();
      onUpdate(); // Refresh main dashboard to show new expense
    } catch (err) {
      console.error("Failed to confirm:", err);
      alert("Failed to confirm transaction");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (item: PendingTransaction) => {
    if (!window.confirm("Delete this pending transaction?")) return;

    setActionLoading(item.token);
    try {
      await cancelPendingTransaction(item.token);
      await loadPending();
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Failed to delete transaction");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-bold">Pending Transactions</h2>
        </div>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (pending.length === 0) {
    return null; // Don't show section if no pending transactions
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-bold">Pending Transactions</h2>
          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold rounded-full">
            {pending.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {pending.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-lg">
                  {item.description || "No description"}
                </p>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-lg">
                  ₹{item.amount?.toFixed(2) || "0.00"}
                </span>
                <span>•</span>
                <span>{item.category || "Other"}</span>
                <span>•</span>
                <span>{item.date || "Today"}</span>
                <span>•</span>
                <span
                  className={
                    item.type === "income"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {item.type === "income" ? "💰 Income" : "💸 Expense"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleConfirm(item)}
                disabled={actionLoading === item.token}
                className="btn btn-success flex items-center gap-2 px-4 py-2"
                title="Confirm and save"
              >
                {actionLoading === item.token ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm
              </button>

              <button
                onClick={() => handleDelete(item)}
                disabled={actionLoading === item.token}
                className="btn btn-danger flex items-center gap-2 px-4 py-2"
                title="Delete"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Tip:</strong> These are transactions saved from SMS but
          not yet confirmed. Review and confirm them to add to your expenses.
        </p>
      </div>
    </div>
  );
};
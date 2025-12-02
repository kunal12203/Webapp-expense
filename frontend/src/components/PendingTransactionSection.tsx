// src/components/PendingTransactionSection.tsx

import React, { useEffect, useState } from "react";
import {
  AlertTriangle, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import {
  getPendingTransactions,
  confirmPendingTransaction,
  cancelPendingTransaction,
} from "../config/api";

const PendingTransactionSection = ({ onUpdate }: any) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await getPendingTransactions();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (tx: any) => {
    if (!tx.token) return;

    setProcessingId(tx.id);
    try {
      await confirmPendingTransaction(
        tx.token,
        tx.amount,
        tx.category,
        tx.description,
        tx.date,
        tx.type
      );

      loadPending();
      if (onUpdate) onUpdate();

      window.dispatchEvent(new Event("expensesUpdated"));
      window.dispatchEvent(new Event("pendingTransactionsUpdated"));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (tx: any) => {
    setProcessingId(tx.id);
    try {
      await cancelPendingTransaction(tx.token);
      loadPending();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && transactions.length === 0)
    return (
      <div className="p-4 bg-white rounded-xl flex justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!loading && transactions.length === 0)
    return (
      <div className="p-4 bg-white rounded-xl text-sm flex gap-2 items-center">
        <CheckCircle2 className="text-emerald-600" /> No pending SMS
        transactions.
      </div>
    );

  return (
    <div className="p-4 bg-white rounded-xl space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="text-amber-500" />
        <h2 className="font-semibold text-sm">Action Required</h2>
      </div>

      {error && (
        <p className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</p>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {transactions.map((tx: any) => (
          <div
            key={tx.id}
            className="p-3 border rounded-lg bg-slate-50 space-y-1"
          >
            <div className="flex justify-between">
              <strong>₹{tx.amount ?? "—"}</strong>
              <span className="text-xs text-slate-500">{tx.date}</span>
            </div>

            <p className="text-xs text-slate-600">{tx.description}</p>

            <div className="flex justify-between items-center">
              <span className="text-[11px] bg-slate-200 px-2 py-0.5 rounded">
                {tx.category} · {tx.type}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(tx)}
                  disabled={processingId === tx.id}
                  className="px-2 py-1 text-xs bg-emerald-600 text-white rounded flex items-center gap-1"
                >
                  {processingId === tx.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  Confirm
                </button>

                <button
                  onClick={() => handleCancel(tx)}
                  disabled={processingId === tx.id}
                  className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingTransactionSection;

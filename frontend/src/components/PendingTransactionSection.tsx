import React, { useEffect, useState } from "react";
import { BellRing, Check, X, Loader2, Edit2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPendingTransactions, confirmPendingTransaction, cancelPendingTransaction } from "../config/api";

const PendingTransactionSection = ({ onUpdate, showAll = false }: any) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await getPendingTransactions();
      setTransactions(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPending(); }, []);

  const handleAction = async (tx: any, action: 'approve' | 'cancel') => {
    if (!tx.token) return;
    setProcessingId(tx.id);
    try {
      if (action === 'approve') {
        await confirmPendingTransaction(tx.token, tx.amount, tx.category, tx.description, tx.date, tx.type);
        window.dispatchEvent(new Event("expensesUpdated"));
      } else {
        await cancelPendingTransaction(tx.token);
      }
      loadPending();
      if (onUpdate) onUpdate();
    } catch (err) { console.error(err); }
    finally { setProcessingId(null); }
  };

  const handleEdit = (tx: any) => {
    navigate(`/add-expense/${tx.token}`);
  };

  if (!loading && transactions.length === 0) return null;

  // Limit to 3 on dashboard
  const displayTransactions = showAll ? transactions : transactions.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-xl text-amber-600 dark:text-amber-400">
          <BellRing className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 dark:text-white">Action Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">You have {transactions.length} pending approvals</p>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {displayTransactions.map((tx: any) => (
          <div key={tx.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-amber-100 dark:border-amber-800/30">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">₹{tx.amount}</span>
                <p className="text-xs text-slate-500">{tx.description}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                  {tx.category}
                </span>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">
                {tx.date}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAction(tx, 'approve')}
                disabled={processingId === tx.id}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Confirm
              </button>
              <button
                onClick={() => handleEdit(tx)}
                disabled={processingId === tx.id}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => handleAction(tx, 'cancel')}
                disabled={processingId === tx.id}
                className="bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}
        
        {!showAll && transactions.length > 3 && (
          <button
            onClick={() => navigate("/pending")}
            className="w-full mt-4 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-all font-semibold flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-800"
          >
            See All Pending
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PendingTransactionSection;
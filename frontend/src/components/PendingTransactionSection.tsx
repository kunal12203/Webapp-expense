import React, { useState, useEffect } from "react";
import { getPendingTransactions, confirmPendingTransaction, cancelPendingTransaction } from "../con";
import { Bell, Check, X, Sparkles, AlertCircle } from "lucide-react";

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

interface Props { token: string; onUpdate: () => void; }

export const PendingTransactionsSection: React.FC<Props> = ({ token, onUpdate }) => {
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { loadPending(); }, [token]);

  const loadPending = async () => {
    try {
      const data = await getPendingTransactions(token);
      setPending(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleConfirm = async (item: PendingTransaction) => {
    if (!item.amount || !item.description) return alert("Missing details");
    setActionLoading(item.token);
    try {
      await confirmPendingTransaction(item.token, item.amount, item.category || "Other", item.description, item.date || new Date().toISOString().split("T")[0], item.type || "expense");
      await loadPending(); onUpdate();
    } catch (err) { alert("Failed"); } 
    finally { setActionLoading(null); }
  };

  const handleDelete = async (item: PendingTransaction) => {
    if (!confirm("Discard?")) return;
    setActionLoading(item.token);
    try { await cancelPendingTransaction(item.token); await loadPending(); } 
    catch (err) { alert("Failed"); } 
    finally { setActionLoading(null); }
  };

  if (loading || pending.length === 0) return null;

  return (
    <div className="glass-panel p-6 border-indigo-100 dark:border-indigo-900/30 relative overflow-hidden">
      {/* Decorative Background Mesh */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Bell className="w-5 h-5 text-indigo-600" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Action Required</h3>
          <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">{pending.length}</span>
        </div>

        <div className="space-y-3">
          {pending.map((item, index) => (
            <div 
              key={item.id} 
              className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/20 shadow-sm backdrop-blur-sm animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-slate-900 dark:text-white text-lg">
                       ₹{item.amount?.toFixed(0)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-violet-600 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-md border border-violet-100 dark:border-violet-800">
                      <Sparkles size={10} /> AI Parsed
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.description}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                     {item.category}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleConfirm(item)} 
                    disabled={actionLoading === item.token}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                    title="Confirm"
                  >
                    {actionLoading === item.token ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(item)} 
                    disabled={actionLoading === item.token}
                    className="p-2 bg-white dark:bg-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl border border-slate-200 dark:border-slate-600 transition-all"
                    title="Delete"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
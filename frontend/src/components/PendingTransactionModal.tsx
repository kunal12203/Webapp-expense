import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_ENDPOINTS, authGet, authPost, authDelete } from "../config/api";
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Calendar, Tag, ArrowLeft } from "lucide-react";

const PendingTransactionModal = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authGet(API_ENDPOINTS.pendingGet(token!));
        setTx(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleAction = async (type: 'approve' | 'cancel') => {
    setActionLoading(true);
    try {
      if (type === 'approve') {
        await authPost(API_ENDPOINTS.pendingApprove(token!), {});
      } else {
        await authDelete(API_ENDPOINTS.pendingDelete(token!));
      }
      navigate("/");
    } catch (e) {
      console.error(e);
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
    </div>
  );

  if (!tx) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">
      <XCircle className="w-12 h-12 mb-4 text-rose-500" />
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Link Expired or Invalid</h2>
      <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 hover:underline">Go to Dashboard</button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="glass-card w-full max-w-md p-8 relative z-10 animate-slide-up border-t-4 border-indigo-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Confirm Transaction</h1>
          <p className="text-slate-500 text-sm mt-1">Please verify the details below</p>
        </div>

        {/* Receipt Card */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-8 border border-slate-100 dark:border-slate-700 relative">
          {/* Perforated edge effect using CSS gradients could go here, keeping it simple for now */}
          
          <div className="text-center mb-6">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Amount</span>
            <div className="text-4xl font-black text-slate-900 dark:text-white mt-1">
              ₹{tx.amount}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2"><Tag className="w-4 h-4" /> Category</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-600 shadow-sm">{tx.category}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{tx.date}</span>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{tx.description}"</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => handleAction('approve')}
            disabled={actionLoading}
            className="w-full btn-gradient py-3.5 text-lg shadow-emerald-500/20 from-emerald-600 to-teal-600"
          >
            {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            Confirm Transaction
          </button>

          <button
            onClick={() => handleAction('cancel')}
            disabled={actionLoading}
            className="w-full btn-ghost py-3.5 text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-900/20"
          >
            <XCircle className="w-5 h-5" /> Cancel & Delete
          </button>
        </div>

        <button onClick={() => navigate('/')} className="w-full mt-6 text-slate-400 text-xs hover:text-slate-600 flex items-center justify-center gap-1 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PendingTransactionModal;
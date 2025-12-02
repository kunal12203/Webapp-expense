import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_ENDPOINTS, authGet, authPost, authDelete, authPut } from "../config/api";
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Calendar, Tag, ArrowLeft, Edit2, FileText } from "lucide-react";

const PendingTransactionModal = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Edit form state
  const [editData, setEditData] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
    type: "expense"
  });

  useEffect(() => {
    const load = async () => {
      try {
        // Load both pending transaction and categories
        const [txRes, categoriesRes] = await Promise.all([
          authGet(API_ENDPOINTS.pendingGet(token!)),
          authGet(API_ENDPOINTS.categories)
        ]);
        
        setTx(txRes);
        setCategories(categoriesRes);
        
        // Initialize edit form with fetched data
        setEditData({
          amount: txRes.amount?.toString() || "",
          category: txRes.category || "",
          description: txRes.description || "",
          date: txRes.date || "",
          type: txRes.type || "expense"
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setEditData({
      amount: tx.amount?.toString() || "",
      category: tx.category || "",
      description: tx.description || "",
      date: tx.date || "",
      type: tx.type || "expense"
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    setActionLoading(true);
    try {
      // Update the pending transaction
      await authPut(API_ENDPOINTS.pendingUpdate(token!), {
        amount: parseFloat(editData.amount),
        category: editData.category,
        description: editData.description,
        date: editData.date,
        type: editData.type
      });
      
      // Update local state
      setTx({
        ...tx,
        amount: parseFloat(editData.amount),
        category: editData.category,
        description: editData.description,
        date: editData.date,
        type: editData.type
      });
      
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("Failed to update transaction");
    } finally {
      setActionLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? "Edit Transaction" : "Confirm Transaction"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isEditing ? "Update the details below" : "Please verify the details below"}
          </p>
        </div>

        {/* Content - View or Edit Mode */}
        {!isEditing ? (
          /* View Mode - Receipt Card */
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-8 border border-slate-100 dark:border-slate-700 relative">
            <div className="text-center mb-6">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Amount</span>
              <div className="text-4xl font-black text-slate-900 dark:text-white mt-1">
                ₹{tx.amount}
              </div>
              <span className="text-xs text-slate-400 mt-1 inline-block">
                {tx.type === 'income' ? '(Income)' : '(Expense)'}
              </span>
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
        ) : (
          /* Edit Mode - Form */
          <div className="space-y-4 mb-8">
            {/* Type Toggle */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setEditData({...editData, type: 'expense'})}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  editData.type === 'expense'
                    ? 'bg-rose-500 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setEditData({...editData, type: 'income'})}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  editData.type === 'income'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Income
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                <span className="text-base font-bold">₹</span>
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={editData.amount}
                onChange={(e) => setEditData({...editData, amount: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-bold"
                placeholder="0.00"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                <Tag className="w-3 h-3" />
                Category
              </label>
              <select
                value={editData.category}
                onChange={(e) => setEditData({...editData, category: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Description
              </label>
              <input
                type="text"
                value={editData.description}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Merchant or note"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Date
              </label>
              <input
                type="date"
                value={editData.date}
                onChange={(e) => setEditData({...editData, date: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
                className="w-full btn-gradient py-3.5 text-lg shadow-emerald-500/20 from-emerald-600 to-teal-600"
              >
                {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                Confirm & Save
              </button>

              <button
                onClick={handleEdit}
                disabled={actionLoading}
                className="w-full btn-ghost py-3.5 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-900/20"
              >
                <Edit2 className="w-5 h-5" /> Edit Details
              </button>

              <button
                onClick={() => handleAction('cancel')}
                disabled={actionLoading}
                className="w-full btn-ghost py-3.5 text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-900/20"
              >
                <XCircle className="w-5 h-5" /> Cancel & Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="w-full btn-gradient py-3.5 text-lg shadow-indigo-500/20"
              >
                {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                Save Changes
              </button>

              <button
                onClick={handleCancelEdit}
                disabled={actionLoading}
                className="w-full btn-ghost py-3.5"
              >
                <ArrowLeft className="w-5 h-5" /> Cancel Editing
              </button>
            </>
          )}
        </div>

        <button onClick={() => navigate('/')} className="w-full mt-6 text-slate-400 text-xs hover:text-slate-600 flex items-center justify-center gap-1 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PendingTransactionModal;
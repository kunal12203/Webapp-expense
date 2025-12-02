import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmPendingTransaction, cancelPendingTransaction, parseSms, createPendingTransaction } from "../config/api";
import { X, Check, Trash2, Sparkles, Loader2, ArrowRight } from "lucide-react";

interface Props { token: string; onClose: () => void; }
const categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];

export const PendingTransactionModal: React.FC<Props> = ({ token, onClose }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"expense" | "income">("expense");

  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [isAiParsed, setIsAiParsed] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  useEffect(() => {
    // ... (Keep existing useEffect logic exactly the same) ...
    const parseAndSave = async () => {
      const hasStructuredParams = searchParams.get("amount") && searchParams.get("note");
      const queryString = window.location.search;
      
      if (hasStructuredParams) {
        // ... (Keep existing) ...
        const pAmount = searchParams.get("amount") || "";
        const pNote = searchParams.get("note") || "";
        const pCat = searchParams.get("category") || "Food";
        const pType = (searchParams.get("type") as "expense" | "income") || "expense";
        setAmount(pAmount); setDescription(pNote); setCategory(pCat); setType(pType); setIsAiParsed(true);
        await autoSavePending({ amount: parseFloat(pAmount), category: pCat, description: pNote, date: date, type: pType });
        return;
      }

      const rawSms = decodeURIComponent(queryString.substring(1));
      if (rawSms.length > 10 && (rawSms.includes("debited") || rawSms.includes("credited"))) {
        setParsing(true);
        try {
          const result = await parseSms(rawSms);
          const pType = result.transaction_type === "credit" ? "income" : "expense";
          setAmount(result.amount?.toString() || "");
          setDescription(result.merchant || "");
          setCategory(result.category || "Other");
          setType(pType);
          setDate(result.date || date);
          setIsAiParsed(true);
          await autoSavePending({ amount: result.amount || 0, category: result.category || "Other", description: result.merchant || "", date: result.date || date, type: pType });
        } catch (err) { console.error("Parse failed", err); } 
        finally { setParsing(false); }
      }
    };
    parseAndSave();
  }, [searchParams]);

  const autoSavePending = async (data: any) => {
      // ... (Keep existing logic) ...
      try {
      const authToken = localStorage.getItem("token");
      if (authToken) {
        const result = await createPendingTransaction(authToken, data);
        setPendingToken(result.token);
      }
    } catch (err) { console.error("Auto-save failed", err); }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    setLoading(true);
    try {
      const tokenToUse = pendingToken || token;
      await confirmPendingTransaction(tokenToUse, parseFloat(amount), category, description, date, type);
      onClose(); navigate("/dashboard");
    } catch (err) { alert("Failed to save"); } 
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
     // ... (Keep existing logic) ...
      if (confirm("Discard transaction?")) {
      try {
        const tokenToUse = pendingToken || token;
        await cancelPendingTransaction(tokenToUse);
        onClose(); navigate("/dashboard");
      } catch (e) {}
    }
  };

  if (parsing) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in">
        <div className="relative flex flex-col items-center">
           {/* Animated Glowing Orb */}
           <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-2xl animate-pulse-glow absolute"></div>
           <div className="glass-panel p-8 flex flex-col items-center relative z-10 border-indigo-500/30">
             <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
             <h3 className="text-xl font-bold text-white">AI Analysis in Progress</h3>
             <p className="text-indigo-200 text-sm mt-2">Extracting transaction details...</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-panel w-full max-w-md p-0 overflow-hidden animate-scale-spring shadow-2xl shadow-indigo-500/20">
        
        {/* Header with Gradient */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-bold">Quick Add</h3>
                {isAiParsed && (
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-white/20">
                    <Sparkles size={12} className="text-yellow-300" /> AI Auto-Fill
                  </span>
                )}
              </div>
              <p className="text-indigo-100 text-sm font-medium opacity-90">Verify the details below</p>
            </div>
            <button onClick={() => navigate("/dashboard")} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors backdrop-blur-md">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="p-8 space-y-6 bg-white dark:bg-slate-900">
           {/* Amount Input */}
           <div className="text-center relative">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Total Amount</label>
              <div className="flex items-center justify-center gap-1 text-slate-800 dark:text-white">
                <span className="text-3xl font-light text-slate-400">₹</span>
                <input 
                  type="number" value={amount} onChange={(e) => setAmount(e.target.value)} 
                  className="bg-transparent border-b-2 border-indigo-100 focus:border-indigo-500 outline-none text-5xl font-black w-48 text-center transition-colors pb-1"
                  placeholder="0" autoFocus
                />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Category</label>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Type</label>
                 <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button type="button" onClick={() => setType("expense")} className={`py-2 rounded-lg text-xs font-bold transition-all ${type === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-slate-400"}`}>Exp</button>
                    <button type="button" onClick={() => setType("income")} className={`py-2 rounded-lg text-xs font-bold transition-all ${type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"}`}>Inc</button>
                 </div>
              </div>
           </div>

           <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Description</label>
              <input type="text" className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Starbucks, Uber, etc." />
           </div>

           <div className="grid grid-cols-2 gap-4 pt-4">
             <button type="button" onClick={handleCancel} className="btn bg-slate-100 text-slate-600 hover:bg-slate-200">
               <Trash2 size={18} /> Discard
             </button>
             <button type="submit" disabled={loading} className="btn btn-primary shadow-xl shadow-indigo-500/20">
               {loading ? <Loader2 className="animate-spin" /> : <><Check size={18} /> Confirm Transaction</>}
             </button>
           </div>
        </form>
      </div>
    </div>
  );
};
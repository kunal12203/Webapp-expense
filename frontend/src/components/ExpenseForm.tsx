import React, { useState, useEffect } from "react";
import { Expense } from "../types";
import { Save, X, Tag, Calendar, FileText, IndianRupee } from "lucide-react";

interface ExpenseFormProps {
  onSubmit: (amount: number, category: string, description: string, date: string, type: "expense" | "income") => Promise<void>;
  onCancel: () => void;
  editingExpense: Expense | null;
  error: string;
}

const categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit, onCancel, editingExpense, error }) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setDescription(editingExpense.description);
      setDate(editingExpense.date);
      setType(editingExpense.type as "expense" | "income");
    }
  }, [editingExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(parseFloat(amount), category, description, date, type);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-0 overflow-hidden shadow-2xl shadow-indigo-500/20">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
        <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
          {editingExpense ? "Edit Transaction" : "New Entry"}
        </h3>
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white/80 dark:bg-slate-900/80">
        {/* Type Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl relative">
          <div 
            className={`absolute top-1 bottom-1 w-[48%] bg-white dark:bg-slate-700 rounded-lg shadow-sm transition-all duration-300 ease-spring ${type === 'income' ? 'left-[50%]' : 'left-1'}`} 
          />
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg relative z-10 transition-colors ${type === "expense" ? "text-rose-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg relative z-10 transition-colors ${type === "income" ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Income
          </button>
        </div>

        {/* Amount */}
        <div className="relative group">
           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Amount</label>
           <div className="relative">
             <IndianRupee className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
             <input
               type="number" step="0.01" 
               className="input pl-12 text-lg font-bold"
               value={amount} onChange={(e) => setAmount(e.target.value)}
               placeholder="0.00" required autoFocus
             />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="group">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Category</label>
            <div className="relative">
              <Tag className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <select className="input pl-10" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div className="group">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input type="date" className="input pl-10" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
        </div>

        <div className="group">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Description</label>
          <div className="relative">
            <FileText className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text" className="input pl-10"
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Grocery shopping" required
            />
          </div>
        </div>

        {error && <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded-lg">{error}</p>}

        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5 shadow-xl shadow-indigo-500/20 hover:scale-[1.02]">
            {loading ? "Saving..." : <><Save size={18} /> Save Transaction</>}
          </button>
        </div>
      </form>
    </div>
  );
};
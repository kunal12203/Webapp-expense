import React from "react";
import { Expense } from "../types";
import { Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Search, Calendar, Tag } from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

const categoryStyles: Record<string, string> = {
  Food: "bg-orange-50 text-orange-600 ring-orange-500/20",
  Transport: "bg-blue-50 text-blue-600 ring-blue-500/20",
  Shopping: "bg-pink-50 text-pink-600 ring-pink-500/20",
  Bills: "bg-purple-50 text-purple-600 ring-purple-500/20",
  Entertainment: "bg-indigo-50 text-indigo-600 ring-indigo-500/20",
  Other: "bg-slate-50 text-slate-600 ring-slate-500/20",
};

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEdit, onDelete }) => {
  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (expenses.length === 0) {
    return (
      <div className="glass-panel p-16 text-center flex flex-col items-center justify-center opacity-0 animate-fade-in">
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 animate-float">
          <Search className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No transactions yet</h3>
        <p className="text-slate-500 mt-2">Start by adding a new expense</p>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Recent Activity</h3>
        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full">
          {expenses.length} Records
        </span>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {expenses.map((expense, index) => (
                <tr 
                  key={expense.id} 
                  className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-200 opacity-0 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${expense.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} group-hover:scale-110 transition-transform`}>
                        {expense.type === 'income' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{expense.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${categoryStyles[expense.category] || categoryStyles.Other}`}>
                      <Tag size={12} /> {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <Calendar size={14} />
                      {formatDate(expense.date)}
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold text-base ${expense.type === 'income' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                    {expense.type === 'income' ? '+' : '-'}{formatINR(expense.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                      <button onClick={() => onEdit(expense)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-500 shadow-sm hover:shadow-md transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => onDelete(expense.id)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-500 shadow-sm hover:shadow-md transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (Staggered Animation) */}
        <div className="md:hidden space-y-3 p-4">
          {expenses.map((expense, index) => (
            <div 
              key={expense.id} 
              className="bg-white/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between opacity-0 animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${expense.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {expense.type === 'income' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{expense.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 font-medium">{formatDate(expense.date)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${categoryStyles[expense.category]}`}>
                      {expense.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${expense.type === 'income' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                  {expense.type === 'income' ? '+' : '-'}{formatINR(expense.amount)}
                </p>
                <div className="flex justify-end gap-3 mt-2">
                  <button onClick={() => onEdit(expense)} className="text-slate-400 hover:text-indigo-500">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDelete(expense.id)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 size={16} />
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
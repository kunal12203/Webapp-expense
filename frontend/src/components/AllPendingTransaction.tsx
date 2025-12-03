import React from "react";
import ExpenseList from "./ExpenseList";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AllTransactions = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            All Transactions
          </h1>
          <p className="text-sm text-slate-500">View and manage all your transactions</p>
        </div>
      </div>

      <div className="glass-card p-4 sm:p-6 md:p-8">
        <ExpenseList refreshSignal={0} showAll={true} />
      </div>
    </div>
  );
};

export default AllTransactions;
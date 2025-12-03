import React from "react";
import PendingTransactionSection from "./PendingTransactionSection";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AllPendingTransactions = () => {
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
            Pending Transactions
          </h1>
          <p className="text-sm text-slate-500">Review and confirm pending transactions</p>
        </div>
      </div>

      <PendingTransactionSection onUpdate={() => {}} showAll={true} />
    </div>
  );
};

export default AllPendingTransactions;
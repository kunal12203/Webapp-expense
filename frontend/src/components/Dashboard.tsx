// src/components/Dashboard.tsx

import React, { useEffect, useState } from "react";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import PendingTransactionSection from "./PendingTransactionSection";
import Charts from "./Charts";
import CategoryManager from "./CategoryManager";
import { PlusCircle } from "lucide-react";

const Dashboard = () => {
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const updateAll = () => setRefreshSignal((prev) => prev + 1);

  useEffect(() => {
    window.addEventListener("expensesUpdated", updateAll);
    window.addEventListener("pendingTransactionsUpdated", updateAll);

    return () => {
      window.removeEventListener("expensesUpdated", updateAll);
      window.removeEventListener("pendingTransactionsUpdated", updateAll);
    };
  }, []);

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>

        <button
          onClick={() => setShowCategoryManager(true)}
          className="flex items-center bg-indigo-600 text-white px-3 py-1.5 text-sm rounded-lg gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Manage Categories
        </button>
      </div>

      <ExpenseForm onExpenseAdded={updateAll} />

      <PendingTransactionSection onUpdate={updateAll} />

      <Charts />

      <ExpenseList refreshSignal={refreshSignal} />

      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onUpdate={updateAll}
      />
    </div>
  );
};

export default Dashboard;

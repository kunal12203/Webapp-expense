import React from "react";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardsProps {
  balance: number;
  income: number;
  expenses: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ balance, income, expenses }) => {
  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-slide-up">
      {/* Balance Card */}
      <div className="stats-card-balance group">
        <div className="flex items-center justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          Total Balance
        </p>
        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {formatINR(balance)}
        </p>
      </div>

      {/* Income Card */}
      <div className="stats-card-income group">
        <div className="flex items-center justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          Total Income
        </p>
        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {formatINR(income)}
        </p>
      </div>

      {/* Expense Card */}
      <div className="stats-card-expense group">
        <div className="flex items-center justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          Total Expenses
        </p>
        <p className="text-3xl font-bold text-red-600 dark:text-red-400">
          {formatINR(expenses)}
        </p>
      </div>
    </div>
  );
};
import React from "react";
import { Expense } from "../types";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onEdit,
  onDelete,
}) => {
  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  if (expenses.length === 0) {
    return (
      <div className="card text-center text-gray-500 dark:text-gray-400">
        No transactions yet. Click <b>“Add Transaction”</b> to start tracking.
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Description</th>
            <th className="p-3">Category</th>
            <th className="p-3">Type</th>
            <th className="p-3 text-right">Amount</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr
              key={expense.id}
              className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <td className="p-3">{expense.date}</td>
              <td className="p-3">{expense.description}</td>
              <td className="p-3">{expense.category}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    expense.type === "income"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}
                >
                  {expense.type}
                </span>
              </td>
              <td
                className={`p-3 text-right font-semibold ${
                  expense.type === "income"
                    ? "text-green-600 dark:text-green-300"
                    : "text-red-600 dark:text-red-300"
                }`}
              >
                {expense.type === "income" ? "+" : "-"}
                {formatINR(expense.amount)}
              </td>
              <td className="p-3 text-center">
                <button
                  onClick={() => onEdit(expense)}
                  className="btn bg-yellow-400 hover:bg-yellow-500 text-white mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(expense.id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// src/components/ExpenseList.tsx

import React, { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import * as Icons from "lucide-react";
import { Trash2, Loader2 } from "lucide-react";

function getLucideIcon(iconName: string) {
  const pascal = iconName
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return (Icons as any)[pascal] || Icons.Tag;
}

const ExpenseList = ({ refreshSignal }: any) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    const res1 = await fetch(API_ENDPOINTS.expenses, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res2 = await fetch(API_ENDPOINTS.categories, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setExpenses(await res1.json());
    setCategories(await res2.json());

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [refreshSignal]);
  

  const deleteExpense = async (id: number) => {
    const token = localStorage.getItem("token");
    await fetch(`${API_ENDPOINTS.expenses}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadData();
  };

  const findCategory = (name: string): any | undefined =>
    categories.find((c: any) => c.name === name);

  if (loading)
    return (
      <div className="p-4 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-3">
      {expenses.map((e: any) => {
        const cat = findCategory(e.category);
        const Icon = cat ? getLucideIcon(cat.icon || "tag") : Icons.Tag;

        return (
          <div key={e.id} className="p-3 bg-white rounded-xl border flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: cat?.color || '#6366f1' }}
              >
                <Icon className="text-white" />
              </div>

              <div>
                <div className="font-medium">₹{e.amount}</div>
                <div className="text-xs text-slate-500">{e.description}</div>
                <div className="text-[11px] text-slate-500">{e.date}</div>
              </div>
            </div>

            <button onClick={() => deleteExpense(e.id)}>
              <Trash2 className="text-red-500" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ExpenseList;
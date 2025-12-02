// src/components/categories/CategoryMigration.tsx

import React, { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { X, ArrowRight, Loader, CheckCircle, AlertTriangle } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

function getLucideIcon(iconName: string) {
  const pascal = iconName
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return (Icons as any)[pascal] || Icons.Tag;
}

const CategoryMigration = ({ isOpen, onClose, onMigrationComplete }: any) => {
  const [categories, setCategories] = useState([]);
  const [fromCategory, setFromCategory] = useState("");
  const [toCategory, setToCategory] = useState("");
  const [expenseCount, setExpenseCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.categories, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const countExpenses = async (name: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(API_ENDPOINTS.expenses, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const all = await res.json();
    const count = all.filter((e: any) => e.category === name).length;
    setExpenseCount(count);
  };

  useEffect(() => {
    if (isOpen) loadCategories();
  }, [isOpen]);

  useEffect(() => {
    if (fromCategory) countExpenses(fromCategory);
    else setExpenseCount(null);
  }, [fromCategory]);

  const handleMigrate = async () => {
    if (!fromCategory || !toCategory) {
      setError("Select both categories");
      return;
    }
    if (fromCategory === toCategory) {
      setError("Cannot migrate to same category");
      return;
    }

    setMigrating(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.categoryMigrate, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from_category_name: fromCategory,
          to_category_name: toCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Migration failed");

      setSuccess(data.message);
      setTimeout(() => {
        onMigrationComplete();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="text-amber-600" /> Migrate Category
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-2">{success}</p>}

        <label className="text-sm font-medium">From Category</label>
        <select
          className="w-full p-2 border rounded-lg mb-4"
          value={fromCategory}
          onChange={(e) => setFromCategory(e.target.value)}
        >
          <option value="">Select</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {expenseCount !== null && (
          <p className="text-sm text-slate-600 mb-4">
            {expenseCount} transaction(s) will be moved.
          </p>
        )}

        <label className="text-sm font-medium">To Category</label>
        <select
          className="w-full p-2 border rounded-lg mb-6"
          value={toCategory}
          onChange={(e) => setToCategory(e.target.value)}
        >
          <option value="">Select</option>
          {categories
            .filter((c: any) => c.name !== fromCategory)
            .map((c: any) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
        </select>

        <button
          onClick={handleMigrate}
          disabled={migrating}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
        >
          {migrating ? <Loader className="animate-spin" /> : <ArrowRight />}
          Migrate
        </button>
      </div>
    </div>
  );
};

export default CategoryMigration;

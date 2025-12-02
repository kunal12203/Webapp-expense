// src/components/categories/QuickAddCategory.tsx

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { Plus, X } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

function getLucideIcon(iconName: string) {
  const pascal = iconName
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return (Icons as any)[pascal] || Icons.Tag;
}

const QuickAddCategory = ({ onCategoryAdded }: any) => {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState({
    name: "",
    color: "#667EEA",
    icon: "tag",
  });

  const handleCreate = async (e: any) => {
    e.preventDefault();
    if (!category.name.trim()) {
      setError("Name required");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.categories, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      setCategory({ name: "", color: "#667EEA", icon: "tag" });
      setShowForm(false);
      if (onCategoryAdded) onCategoryAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!showForm)
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-indigo-600 flex items-center gap-1 text-xs"
      >
        <Plus className="w-3 h-3" /> Quick add category
      </button>
    );

  return (
    <form
      onSubmit={handleCreate}
      className="mt-3 p-3 border rounded-lg bg-slate-50 text-xs"
    >
      {error && <p className="text-red-500 mb-1">{error}</p>}

      <input
        className="w-full p-2 border rounded mb-2"
        placeholder="Name"
        value={category.name}
        onChange={(e) => setCategory({ ...category, name: e.target.value })}
      />

      <label>Color</label>
      <input
        type="color"
        className="w-10 h-8 rounded mb-2"
        value={category.color}
        onChange={(e) => setCategory({ ...category, color: e.target.value })}
      />

      <input
        className="w-full p-2 border rounded mb-3"
        placeholder="Icon (shopping-bag)"
        value={category.icon}
        onChange={(e) => setCategory({ ...category, icon: e.target.value })}
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="text-slate-600 flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1 bg-indigo-600 text-white rounded"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
};

export default QuickAddCategory;

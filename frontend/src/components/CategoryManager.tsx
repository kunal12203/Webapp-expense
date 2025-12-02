// src/components/CategoryManager.tsx

import React, { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { X, Edit, Trash2, Plus, Loader } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

function getLucideIcon(iconName: string) {
  const pascal = iconName
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");

  return (Icons as any)[pascal] || Icons.Tag;
}

const CategoryManager = ({ isOpen, onClose, onUpdate }: any) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#667EEA",
    icon: "tag",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.categories, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadCategories();
  }, [isOpen]);

  const handleAdd = async () => {
    if (!newCategory.name.trim()) {
      setError("Category name required");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.categories, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCategory),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");

      setNewCategory({ name: "", color: "#667EEA", icon: "tag" });
      loadCategories();

      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_ENDPOINTS.categories}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await res.json();
    loadCategories();
    if (onUpdate) onUpdate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Manage Categories</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 max-h-72 overflow-y-auto">
            {categories.map((cat: any) => {
              const Icon = getLucideIcon(cat.icon);
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: cat.color }}
                    >
                      <Icon className="text-white" />
                    </div>

                    <div className="font-medium">{cat.name}</div>
                  </div>

                  <div className="flex gap-2">
                    <button className="p-2 rounded-md bg-red-50" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium mb-2">Create New</h3>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <input
            className="w-full p-2 border rounded-lg mb-2"
            placeholder="Category Name"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
          />

          <input
            type="color"
            className="w-12 h-10 rounded mb-2"
            value={newCategory.color}
            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
          />

          <input
            className="w-full p-2 border rounded-lg mb-4"
            placeholder="Icon (shopping-bag)"
            value={newCategory.icon}
            onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
          />

          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus /> {saving ? "Saving..." : "Add Category"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;

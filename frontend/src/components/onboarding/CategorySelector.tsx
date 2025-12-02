// src/components/onboarding/CategorySelector.tsx

import React, { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { API_ENDPOINTS, authGet, authPost } from "../../config/api";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function getLucideIcon(iconName: string) {
  const pascal = iconName
    .split("-")
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");

  return (Icons as any)[pascal] || Icons.Tag;
}

const CategorySelector = () => {
  const navigate = useNavigate();
  const [examples, setExamples] = useState([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const loadExamples = async () => {
    const res = await authGet(API_ENDPOINTS.exampleCategories);
    setExamples(res);
  };

  useEffect(() => loadExamples(), []);

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    if (selected.length === 0) return;

    setSaving(true);

    await authPost(API_ENDPOINTS.createCategoryBatch, {
      category_ids: selected,
    });

    await authPost(API_ENDPOINTS.completeOnboarding, {});

    setSaving(false);

    navigate("/");
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5">

      <h1 className="text-xl font-semibold">Choose Your Categories</h1>

      {examples.length === 0 ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {examples.map((cat: any) => {
            const Icon = getLucideIcon(cat.icon);
            const isSelected = selected.includes(cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => toggle(cat.id)}
                className={`p-4 border rounded-xl flex flex-col items-center gap-2 ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-300"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ background: cat.color }}
                >
                  <Icon className="text-white" />
                </div>
                <span>{cat.name}</span>
                {isSelected && <CheckCircle2 className="text-indigo-600" />}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={submit}
        disabled={saving}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg"
      >
        {saving ? "Saving..." : "Continue"}
      </button>
    </div>
  );
};

export default CategorySelector;

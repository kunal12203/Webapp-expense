import React, { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { API_ENDPOINTS, authGet, authPost } from "../../config/api";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";

function getLucideIcon(iconName: string) {
  const pascal = iconName ? iconName.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("") : "Tag";
  return (Icons as any)[pascal] || Icons.Tag;
}

const CategorySelector = () => {
  const [examples, setExamples] = useState([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await authGet(API_ENDPOINTS.exampleCategories);
      setExamples(res);
    };
    load();
  }, []);

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    await authPost(API_ENDPOINTS.createCategoryBatch, { category_ids: selected });
    await authPost(API_ENDPOINTS.completeOnboarding, {});
    setSaving(false);
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full animate-slide-up">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Let's set you up</h1>
          <p className="text-slate-500">Select categories relevant to your spending habits.</p>
        </div>

        {examples.length === 0 ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {examples.map((cat: any) => {
              const Icon = getLucideIcon(cat.icon);
              const isSelected = selected.includes(cat.id);

              return (
                <button
                  key={cat.id}
                  onClick={() => toggle(cat.id)}
                  className={`p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 border-2 ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg scale-105"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white transition-transform ${isSelected ? 'scale-110' : ''}`} style={{ background: cat.color }}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`font-bold text-sm ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                    {cat.name}
                  </span>
                  {isSelected && <div className="absolute top-2 right-2 text-indigo-600"><CheckCircle2 className="w-5 h-5" /></div>}
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={submit}
          disabled={saving || selected.length === 0}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Setting up..." : "Continue to Dashboard"} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CategorySelector;
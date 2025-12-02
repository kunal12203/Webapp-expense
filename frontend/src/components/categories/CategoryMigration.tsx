import React, { useEffect, useState } from "react";
import { X, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

const CategoryMigration = ({ isOpen, onClose, onMigrationComplete }: any) => {
  const [categories, setCategories] = useState([]);
  const [fromCategory, setFromCategory] = useState("");
  const [toCategory, setToCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(API_ENDPOINTS.categories, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
        .then(res => res.json())
        .then(data => setCategories(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleMigrate = async () => {
    if (!fromCategory || !toCategory || fromCategory === toCategory) return setError("Invalid selection");
    setMigrating(true);
    try {
      await fetch(API_ENDPOINTS.categoryMigrate, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ from_category_name: fromCategory, to_category_name: toCategory }),
      });
      onMigrationComplete(); onClose();
    } catch (e) { setError("Migration failed"); }
    finally { setMigrating(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card w-full max-w-md p-6 relative animate-slide-up bg-white dark:bg-slate-900">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" /> Migrate Transactions
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">From</label>
            <select className="input-field" value={fromCategory} onChange={e => setFromCategory(e.target.value)}>
              <option value="">Select...</option>
              {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-300 mt-6" />
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">To</label>
            <select className="input-field" value={toCategory} onChange={e => setToCategory(e.target.value)}>
              <option value="">Select...</option>
              {categories.filter((c: any) => c.name !== fromCategory).map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleMigrate} disabled={migrating} className="btn-gradient w-full from-amber-500 to-orange-600">
          {migrating ? <Loader2 className="animate-spin w-5 h-5" /> : "Move Transactions"}
        </button>
      </div>
    </div>
  );
};

export default CategoryMigration;
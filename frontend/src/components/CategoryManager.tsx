import React, { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { X, Trash2, Plus, Loader2, Tag, Palette } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

function getLucideIcon(iconName: string) {
  const pascal = iconName ? iconName.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("") : "Tag";
  return (Icons as any)[pascal] || Icons.Tag;
}

const CategoryManager = ({ isOpen, onClose, onUpdate }: any) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", color: "#667EEA", icon: "tag" });
  const [saving, setSaving] = useState(false);
  const [suggestedIcon, setSuggestedIcon] = useState("");

  // Icon suggestions based on category name
  const suggestIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    const iconMap: { [key: string]: string } = {
      // Food & Dining
      'food': 'utensils', 'restaurant': 'utensils', 'dining': 'utensils', 'meal': 'utensils',
      'grocery': 'shopping-cart', 'groceries': 'shopping-cart', 'supermarket': 'shopping-cart',
      'coffee': 'coffee', 'cafe': 'coffee', 'tea': 'coffee',
      'pizza': 'pizza', 'burger': 'burger',
      
      // Transport
      'transport': 'car', 'travel': 'plane', 'flight': 'plane', 'taxi': 'car',
      'uber': 'car', 'bus': 'bus', 'train': 'train', 'metro': 'train',
      'fuel': 'fuel', 'petrol': 'fuel', 'gas': 'fuel',
      
      // Shopping
      'shopping': 'shopping-bag', 'shop': 'shopping-bag', 'clothes': 'shirt',
      'fashion': 'shirt', 'shoes': 'footprints',
      
      // Bills & Utilities
      'bill': 'file-text', 'bills': 'file-text', 'rent': 'home',
      'electricity': 'zap', 'water': 'droplet', 'internet': 'wifi',
      'phone': 'smartphone', 'mobile': 'smartphone',
      
      // Entertainment
      'entertainment': 'film', 'movie': 'film', 'cinema': 'film',
      'music': 'music', 'spotify': 'music', 'netflix': 'tv',
      'game': 'gamepad', 'gaming': 'gamepad',
      
      // Health & Fitness
      'health': 'heart', 'medical': 'heart', 'doctor': 'stethoscope',
      'medicine': 'pill', 'pharmacy': 'pill', 'hospital': 'hospital',
      'gym': 'dumbbell', 'fitness': 'dumbbell', 'sport': 'dumbbell',
      
      // Education
      'education': 'book', 'school': 'book', 'course': 'graduation-cap',
      'study': 'book', 'books': 'book',
      
      // Finance
      'salary': 'wallet', 'income': 'indian-rupee', 'investment': 'trending-up',
      'savings': 'piggy-bank', 'bank': 'landmark',
      
      // Others
      'gift': 'gift', 'donation': 'hand-heart', 'charity': 'hand-heart',
      'insurance': 'shield', 'loan': 'banknote',
      'beauty': 'sparkles', 'salon': 'scissors',
      'pet': 'paw-print', 'subscription': 'repeat',
    };

    // Find matching icon
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(keyword)) {
        return icon;
      }
    }
    
    return 'tag'; // Default
  };

  const handleNameChange = (name: string) => {
    setNewCategory({ ...newCategory, name });
    if (name.trim().length > 2) {
      const suggested = suggestIcon(name);
      setSuggestedIcon(suggested);
      setNewCategory({ ...newCategory, name, icon: suggested });
    } else {
      setSuggestedIcon("");
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.categories, { headers: { Authorization: `Bearer ${token}` } });
      setCategories(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen) loadCategories(); }, [isOpen]);

  const handleAdd = async () => {
    if (!newCategory.name.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(API_ENDPOINTS.categories, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCategory),
      });
      setNewCategory({ name: "", color: "#667EEA", icon: "tag" });
      setSuggestedIcon("");
      loadCategories();
      if (onUpdate) onUpdate();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if(!window.confirm("Delete this category? Transactions associated with it might be affected.")) return;
    const token = localStorage.getItem("token");
    await fetch(`${API_ENDPOINTS.categories}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadCategories();
    if (onUpdate) onUpdate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="glass-card w-full max-w-lg p-0 relative animate-slide-up bg-white dark:bg-slate-900 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Tag className="w-5 h-5 text-indigo-600" /> Manage Categories
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Category List */}
        <div className="p-6 max-h-[350px] overflow-y-auto space-y-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" /></div>
          ) : (
            categories.map((cat: any) => {
              const Icon = getLucideIcon(cat.icon);
              return (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110" style={{ background: cat.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{cat.name}</div>
                      <div className="text-xs text-slate-400 font-mono">Icon: {cat.icon}</div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Add New */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Add New Category</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <input 
                className="input-field flex-1" 
                placeholder="Category Name (e.g. Travel)" 
                value={newCategory.name} 
                onChange={e => handleNameChange(e.target.value)} 
              />
              <div className="relative group">
                <div className="w-12 h-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer shadow-sm group-hover:scale-105 transition-transform" style={{ backgroundColor: newCategory.color }}>
                  <input 
                    type="color" 
                    className="opacity-0 w-full h-full cursor-pointer absolute inset-0" 
                    value={newCategory.color} 
                    onChange={e => setNewCategory({...newCategory, color: e.target.value})} 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <input 
                  className="input-field w-full" 
                  placeholder="Icon Name (e.g. Plane, Coffee, Car)" 
                  value={newCategory.icon} 
                  onChange={e => setNewCategory({...newCategory, icon: e.target.value})} 
                />
                {suggestedIcon && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-xs text-emerald-600 font-semibold">✨ Auto-suggested</span>
                  </div>
                )}
              </div>
              <button 
                onClick={handleAdd} 
                disabled={saving} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center pt-2">
              💡 Icons auto-suggest based on category name | View all at <a href="https://lucide.dev/icons" target="_blank" className="text-indigo-500 underline" rel="noreferrer">Lucide</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
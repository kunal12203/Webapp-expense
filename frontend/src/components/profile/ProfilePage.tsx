import React, { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../../config/api";
import { Loader2, Save, User, Phone, Briefcase, Calendar, Wallet } from "lucide-react";
import IOSShortcutButton from "../onboarding/IosShortcutButton";

const ProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.profile, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(await res.json());
    };
    load();
  }, []);

  const update = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    await fetch(API_ENDPOINTS.profile, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
  };

  if (!profile) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Settings & Profile</h1>
        <p className="text-slate-500 mt-2">Manage your personal information and budget preferences.</p>
      </div>

      <div className="glass-card p-8 md:p-10 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input className="input-field pl-12" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Phone Number</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input className="input-field pl-12" value={profile.phone || ""} placeholder="+91..." onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Date of Birth</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input type="date" className="input-field pl-12" value={profile.date_of_birth || ""} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Occupation</label>
            <div className="relative group">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input className="input-field pl-12" value={profile.occupation || ""} placeholder="Software Engineer" onChange={(e) => setProfile({ ...profile, occupation: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Monthly Budget Goal</label>
            <div className="relative group">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input type="number" className="input-field pl-12 font-mono" value={profile.monthly_budget || ""} placeholder="50000" onChange={(e) => setProfile({ ...profile, monthly_budget: e.target.value })} />
            </div>
            <p className="text-xs text-slate-400 ml-1">This will be used to calculate your savings rate.</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={update} disabled={saving} className="btn-gradient min-w-[180px]">
            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* iOS Shortcut Integration */}
      <div className="glass-card p-8 md:p-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <IOSShortcutButton standalone={true} />
      </div>
    </div>
  );
};

export default ProfilePage;
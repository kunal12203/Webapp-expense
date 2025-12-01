import React, { useState } from "react";
import { UserPlus, User, Mail, Lock, ArrowRight } from "lucide-react";

interface SignupProps {
  onSignup: (u: string, e: string, p: string) => Promise<void>;
  onSwitchToLogin: () => void;
  error: string;
}

export const Signup: React.FC<SignupProps> = ({ onSignup, onSwitchToLogin, error }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await onSignup(username, email, password); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-[#020617]">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-scale-spring">
        <div className="glass-panel p-10 shadow-2xl shadow-emerald-500/10 border-emerald-500/20">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-50 dark:ring-emerald-900/20">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create Account</h2>
            <p className="text-slate-500 font-medium mt-2">Start your financial journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input type="text" className="input pl-12 focus:border-emerald-500 focus:ring-emerald-500/20" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input type="email" className="input pl-12 focus:border-emerald-500 focus:ring-emerald-500/20" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input type="password" className="input pl-12 focus:border-emerald-500 focus:ring-emerald-500/20" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            {error && <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl font-bold">{error}</div>}

            <button type="submit" disabled={loading} className="btn bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/30 w-full py-4 text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Get Started <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">Already a member? <button onClick={onSwitchToLogin} className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">Sign In</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from "react";
import { LogIn, User, Lock, Sparkles, ArrowRight } from "lucide-react";

interface LoginProps {
  onLogin: (u: string, p: string) => Promise<void>;
  onSwitchToSignup: () => void;
  onForgotPassword?: () => void;
  error: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignup, onForgotPassword, error }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await onLogin(username, password); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-[#020617]">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-scale-spring">
        <div className="glass-panel p-10 shadow-2xl shadow-indigo-500/10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-50 dark:ring-indigo-900/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 font-medium mt-2">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input type="text" className="input pl-12" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input type="password" className="input pl-12" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              {onForgotPassword && (
                <div className="flex justify-end">
                  <button type="button" onClick={onForgotPassword} className="text-xs text-indigo-600 font-bold hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {error && <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl font-bold border border-rose-100 dark:border-rose-900/50">{error}</div>}

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-4 text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">Don't have an account? <button onClick={onSwitchToSignup} className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Create Account</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};
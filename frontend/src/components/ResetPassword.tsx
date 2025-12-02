import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true); setError('');

    try {
      const response = await fetch(API_ENDPOINTS.resetPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!response.ok) throw new Error('Failed to reset password');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 relative">
      <div className="glass-card w-full max-w-md p-8 relative z-10 animate-slide-up">
        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
            <p className="text-slate-500">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-center mb-2">New Password</h1>
            <p className="text-slate-500 text-center mb-8 text-sm">Create a strong password for your account.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pl-12 pr-12"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && <p className="text-rose-500 text-sm font-medium text-center">{error}</p>}
              <button type="submit" disabled={loading} className="btn-gradient w-full">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
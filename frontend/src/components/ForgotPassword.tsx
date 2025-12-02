import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email');
    setLoading(true); setError('');

    try {
      const response = await fetch(API_ENDPOINTS.forgotPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('Failed to send reset email');
      setSuccess(true);
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10" />
      
      <div className="glass-card w-full max-w-md p-8 relative z-10 animate-slide-up">
        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check Your Email</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">We've sent a recovery link to <strong>{email}</strong></p>
            <button onClick={() => navigate('/login')} className="btn-gradient w-full">Back to Login</button>
          </div>
        ) : (
          <>
            <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Forgot Password?</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">No worries, we'll send you reset instructions.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  className="input-field pl-12"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
              <button type="submit" disabled={loading} className="btn-gradient w-full">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
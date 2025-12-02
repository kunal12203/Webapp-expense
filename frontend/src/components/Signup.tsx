import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import SignupForm from "./onboarding/SignupForm";

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] rounded-full bg-indigo-500/5 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] rounded-full bg-purple-500/5 blur-[150px]" />

      <div className="glass-card p-8 md:p-12 w-full max-w-xl relative z-10 animate-slide-up border-t-4 border-indigo-500">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl shadow-xl shadow-indigo-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Join ExpenseTracker
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Start your journey towards financial freedom today.
          </p>
        </div>

        {/* Form */}
        <SignupForm onSignupSuccess={() => {
          navigate('/onboarding/categories');
        }} />

        {/* Footer */}
        <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
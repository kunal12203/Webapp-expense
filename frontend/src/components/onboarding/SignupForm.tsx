import React, { useState } from "react";
import { User, Mail, Lock, Phone, Briefcase, Calendar, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

interface SignupFormProps {
  onSignupSuccess: (token: string, userId: number) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSignupSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "", email: "", password: "", full_name: "",
    phone: "", date_of_birth: "", occupation: "", monthly_budget: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateStep1 = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
      setError("Please fill in all required fields.");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If on step 1, just validate and move to step 2
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
      return;
    }
    
    // Step 2 - actually submit the form
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        monthly_budget: formData.monthly_budget ? parseFloat(formData.monthly_budget) : null,
      };
      const res = await fetch(API_ENDPOINTS.signup, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed");
      localStorage.setItem("token", data.access_token);
      onSignupSuccess(data.access_token, 0);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
        <div className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium flex items-center gap-2 animate-shake"><span className="text-lg">⚠️</span> {error}</div>}

      <div className={`space-y-4 transition-all duration-300 ${step === 1 ? 'opacity-100 translate-x-0' : 'hidden opacity-0 -translate-x-10'}`}>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input className="input-field pl-12" placeholder="Full Name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
        </div>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input type="email" className="input-field pl-12" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input className="input-field pl-12" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
        </div>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input type="password" className="input-field pl-12" placeholder="Password (6+ chars)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
        </div>
        <button type="submit" className="btn-gradient w-full mt-4">
          Next Step <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className={`space-y-4 transition-all duration-300 ${step === 2 ? 'opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-10'}`}>
        <div className="relative group">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input className="input-field pl-12" placeholder="Phone (Optional)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div className="relative group">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="date" className="input-field pl-12" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
        </div>
        <div className="relative group">
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input className="input-field pl-12" placeholder="Occupation (Optional)" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} />
        </div>
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
          <input type="number" className="input-field pl-12" placeholder="Monthly Budget (Optional)" value={formData.monthly_budget} onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })} />
        </div>
        
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <button type="submit" disabled={loading} className="btn-gradient flex-1">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Complete Signup"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SignupForm;
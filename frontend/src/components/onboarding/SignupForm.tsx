// src/components/onboarding/SignupForm.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Lock, Phone, Briefcase, Calendar,
  DollarSign, ChevronRight, ChevronLeft
} from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";

interface SignupFormProps {
  onSignupSuccess: (token: string, userId: number) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSignupSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone: "",
    date_of_birth: "",
    occupation: "",
    monthly_budget: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateStep1 = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
      setError("Please fill in all required fields.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth || null,
        occupation: formData.occupation || null,
        monthly_budget: formData.monthly_budget
          ? parseFloat(formData.monthly_budget)
          : null,
      };

      const res = await fetch(API_ENDPOINTS.signup, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>
      )}

      {step === 1 && (
        <>
          <div>
            <label className="text-sm font-medium">Full Name *</label>
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
              <User />
              <input
                className="flex-1 outline-none"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Email *</label>
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
              <Mail />
              <input
                type="email"
                className="flex-1 outline-none"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Username *</label>
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
              <User />
              <input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="username123"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Password *</label>
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
              <Lock />
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => validateStep1() && setStep(2)}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
          >
            Continue <ChevronRight />
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
              <Phone />
              <input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Date of Birth</label>
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
              <Calendar />
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Occupation</label>
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
              <Briefcase />
              <input
                value={formData.occupation}
                onChange={(e) =>
                  setFormData({ ...formData, occupation: e.target.value })
                }
                placeholder="Designer"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Monthly Budget</label>
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
              <DollarSign />
              <input
                type="number"
                value={formData.monthly_budget}
                onChange={(e) =>
                  setFormData({ ...formData, monthly_budget: e.target.value })
                }
                placeholder="50000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border"
            >
              <ChevronLeft /> Back
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white"
            >
              {loading ? "Signing Up..." : "Create Account"} <ChevronRight />
            </button>
          </div>
        </>
      )}
    </form>
  );
};

export default SignupForm;

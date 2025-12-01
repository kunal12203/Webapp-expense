import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";

import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { Dashboard } from "./components/Dashboard";
import { PendingTransactionModal } from "./components/PendingTransactionModal";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

import { signup, login } from "./services/api";

function AppContent() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (u: string, e: string, p: string) => {
    try {
      setError("");
      const data = await signup(u, e, p);
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      navigate("/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "Signup failed"); }
  };

  const handleLogin = async (u: string, p: string) => {
    try {
      setError("");
      const data = await login(u, p);
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      navigate("/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "Login failed"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  return (
    <Routes>
      <Route path="/" element={token ? <Dashboard token={token} onLogout={handleLogout} /> : <Login onLogin={handleLogin} onSwitchToSignup={() => navigate("/signup")} onForgotPassword={() => navigate("/forgot-password")} error={error} />} />
      <Route path="/login" element={<Login onLogin={handleLogin} onSwitchToSignup={() => navigate("/signup")} onForgotPassword={() => navigate("/forgot-password")} error={error} />} />
      <Route path="/signup" element={<Signup onSignup={handleSignup} onSwitchToLogin={() => navigate("/login")} error={error} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={token ? <Dashboard token={token} onLogout={handleLogout} /> : <Login onLogin={handleLogin} onSwitchToSignup={() => navigate("/signup")} onForgotPassword={() => navigate("/forgot-password")} error={error} />} />
      
      {/* Deep link route - Wrapped in a clean container */}
      <Route path="/add-expense/:token" element={<PendingExpensePage />} />
    </Routes>
  );
}

function PendingExpensePage() {
  const { token } = useParams();
  const navigate = useNavigate();

  // If accessed directly without params, it acts as a quick entry portal
  if (!token) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <PendingTransactionModal token={token} onClose={() => navigate("/dashboard")} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
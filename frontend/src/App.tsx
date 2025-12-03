import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Signup from "./components/Signup";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import CategorySelector from "./components/onboarding/CategorySelector";
import ShortcutSetup from "./components/onboarding/ShortcutSetup";
import ProfilePage from "./components/profile/ProfilePage";
import PendingTransactionModal from "./components/PendingTransactionModal";
import SMSProcessor from "./components/SMSProcessor";
import AllTransactions from "./components/AllTransactions";
import AllPendingTransactions from "./components/AllPendingTransactions";
import AutomationGuide from "./components/AutomationGuide";
import Layout from "./components/Layout";
import { API_ENDPOINTS } from "./config/api";
import { Loader2 } from "lucide-react";

const Protected = ({ children }: any) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(API_ENDPOINTS.profile, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const profile = await res.json();
          if (!profile.onboarding_completed) setOnboardingRequired(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    checkProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/add-expense-from-sms" element={<SMSProcessor />} />
        <Route path="/add-expense/:token" element={<PendingTransactionModal />} />

        {/* Protected Dashboard Routes */}
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/" element={
            onboardingRequired ? <Navigate to="/onboarding/categories" /> : <Dashboard />
          } />
          <Route path="/transactions" element={<AllTransactions />} />
          <Route path="/pending" element={<AllPendingTransactions />} />
          <Route path="/automation-guide" element={<AutomationGuide />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/analytics" element={<Dashboard />} /> {/* Reuse dashboard for now */}
        </Route>

        {/* Onboarding Standalone */}
        <Route path="/onboarding/categories" element={
          <Protected><CategorySelector /></Protected>
        } />
        <Route path="/onboarding/shortcut" element={
          <Protected><ShortcutSetup /></Protected>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
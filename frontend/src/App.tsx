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
import AllTransactions from "./components/AllTransaction";
import AllPendingTransactions from "./components/AllPendingTransaction";
import AutomationGuide from "./components/AutomationGuide";
import UpdateShortcutURL from "./components/UpdateShortcutURL";
import InstallAppPage from "./pages/InstallAppPage";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { API_ENDPOINTS } from "./config/api";
import { Loader2 } from "lucide-react";
import SplitwiseIntegration from "./components/SplitwiseIntegration";


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
    <ErrorBoundary>
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
            <Route path="/update-shortcut" element={<UpdateShortcutURL />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/analytics" element={<Dashboard />} /> {/* Reuse dashboard for now */}
            <Route path="/splitwise" element={<SplitwiseIntegration />} />
            <Route path="/install-app" element={<InstallAppPage />} />
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
    </ErrorBoundary>
  );
};

export default App;
// src/App.tsx

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
import Layout from "./components/Layout";

import { API_ENDPOINTS } from "./config/api";

const Protected = ({ children }: any) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

const App = () => {
  const [onboardingRequired, setOnboardingRequired] = useState(false);

  const loadProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(API_ENDPOINTS.profile, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const profile = await res.json();

    if (!profile.onboarding_completed) {
      setOnboardingRequired(true);
    }
  };

  useEffect(() => {
    loadProfile();   // <-- call without returning Promise
  }, []);
  

  return (
    <BrowserRouter>
      <Routes>

        {/* Auth pages */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Onboarding */}
        <Route
          path="/onboarding/categories"
          element={
            <Protected>
              <CategorySelector />
            </Protected>
          }
        />
        <Route
          path="/onboarding/shortcut"
          element={
            <Protected>
              <ShortcutSetup />
            </Protected>
          }
        />

        {/* Protected Routes with Layout */}
        <Route element={<Protected><Layout /></Protected>}>
          <Route
            path="/"
            element={
              onboardingRequired ? (
                <Navigate to="/onboarding/categories" />
              ) : (
                <Dashboard />
              )
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Pending Transaction Page */}
        <Route path="/add-expense/:token" element={<PendingTransactionModal />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
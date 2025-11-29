import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { Dashboard } from "./components/Dashboard";
import { PendingTransactionModal } from "./components/PendingTransactionModal";

import { signup, login } from "./services/api";

function AppContent() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      setError("");
      const data = await signup(username, email, password);
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      setError("");
      const data = await login(username, password);
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          token ? (
            <Dashboard token={token} onLogout={handleLogout} />
          ) : (
            <Login
              onLogin={handleLogin}
              onSwitchToSignup={() => navigate("/signup")}
              error={error}
            />
          )
        }
      />

      <Route
        path="/login"
        element={
          <Login
            onLogin={handleLogin}
            onSwitchToSignup={() => navigate("/signup")}
            error={error}
          />
        }
      />

      <Route
        path="/signup"
        element={
          <Signup
            onSignup={handleSignup}
            onSwitchToLogin={() => navigate("/login")}
            error={error}
          />
        }
      />

      <Route
        path="/dashboard"
        element={
          token ? (
            <Dashboard token={token} onLogout={handleLogout} />
          ) : (
            <Login
              onLogin={handleLogin}
              onSwitchToSignup={() => navigate("/signup")}
              error={error}
            />
          )
        }
      />

      {/* 🔥 Deep link with SMS auto-filling */}
      <Route path="/add-expense/:token" element={<PendingExpensePage />} />
    </Routes>
  );
}

function PendingExpensePage() {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  if (!token) {
    navigate("/login");
    return null;
  }

  // 🔥 Extract SMS from URL query
  const smsText = decodeURIComponent(location.search.replace("?", ""));

  return (
    <PendingTransactionModal
      token={token}
      sms={smsText}
      onClose={() => navigate("/dashboard")}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

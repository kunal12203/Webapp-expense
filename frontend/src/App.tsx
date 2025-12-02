import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth Components
import Login from './components/Login';
import SignupForm from './components/onboarding/SignupForm';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// Onboarding Components
import CategorySelector from './components/onboarding/CategorySelector';

// Main App Components
import Dashboard from './components/Dashboard';
import ProfilePage from './components/profile/ProfilePage';

// Category Components
import CategoryManager from './components/CategoryManager';
import CategoryMigration from './components/categories/CategoryMigration';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showCategoryMigration, setShowCategoryMigration] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Handle successful signup
  const handleSignupSuccess = (newToken: string, userId?: number) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    // Show category selector after signup
    setShowCategorySelector(true);
  };

  // Handle successful login
  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            token ? 
              <Navigate to="/dashboard" /> : 
              <Login onLoginSuccess={handleLoginSuccess} />
          } 
        />
        
        <Route 
          path="/signup" 
          element={
            token ? 
              <Navigate to="/dashboard" /> : 
              <SignupForm onSignupSuccess={handleSignupSuccess} />
          } 
        />

        <Route 
          path="/forgot-password" 
          element={
            token ? 
              <Navigate to="/dashboard" /> : 
              <ForgotPassword />
          } 
        />

        <Route 
          path="/reset-password" 
          element={
            token ? 
              <Navigate to="/dashboard" /> : 
              <ResetPassword />
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            token ? 
              <Dashboard 
                onLogout={handleLogout}
                onOpenCategoryManager={() => setShowCategoryManager(true)}
              /> : 
              <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            token ? 
              <ProfilePage 
                onOpenCategoryManager={() => setShowCategoryManager(true)}
                onOpenCategoryMigration={() => setShowCategoryMigration(true)}
              /> : 
              <Navigate to="/login" />
          } 
        />

        {/* Default Route */}
        <Route 
          path="/" 
          element={
            token ? 
              <Navigate to="/dashboard" /> : 
              <Navigate to="/login" />
          } 
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Global Modals */}
      {showCategorySelector && (
        <div className="fixed inset-0 z-50">
          <CategorySelector 
            token={token!}
          />
        </div>
      )}

      {showCategoryManager && (
        <CategoryManager 
          isOpen={showCategoryManager}
          onClose={() => setShowCategoryManager(false)}
          onUpdate={() => {
            // Refresh categories in any component that needs it
            window.dispatchEvent(new Event('categoriesUpdated'));
          }}
        />
      )}

      {showCategoryMigration && (
        <CategoryMigration 
          isOpen={showCategoryMigration}
          onClose={() => setShowCategoryMigration(false)}
          onMigrationComplete={() => {
            // Refresh data after migration
            window.dispatchEvent(new Event('categoriesUpdated'));
            window.dispatchEvent(new Event('expensesUpdated'));
          }}
        />
      )}
    </BrowserRouter>
  );
}

export default App;
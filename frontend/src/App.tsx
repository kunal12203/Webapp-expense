import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Dashboard } from './components/Dashboard';
import { PendingTransactionModal } from './components/PendingTransactionModal';
import { signup, login } from './services/api';

type Page = 'login' | 'signup' | 'dashboard' | 'pending';

function App() {
  const [page, setPage] = useState<Page>('login');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [error, setError] = useState('');
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  React.useEffect(() => {
    // Check if URL contains pending transaction token
    const path = window.location.pathname;
    const match = path.match(/\/add-expense\/([^/]+)/);
    
    if (match) {
      const urlToken = match[1];
      const urlParams = new URLSearchParams(window.location.search);
      const amount = urlParams.get('amount');
      const note = urlParams.get('note');
      
      setPendingToken(urlToken);
      setPage('pending');
      
      // Store amount and note if provided
      if (amount) sessionStorage.setItem('pendingAmount', amount);
      if (note) sessionStorage.setItem('pendingNote', note);
    } else if (token) {
      setPage('dashboard');
    }
  }, [token]);

  const handleSignup = async (username: string, email: string, password: string) => {
    setError('');
    try {
      const data = await signup(username, email, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  const handleLogin = async (username: string, password: string) => {
    setError('');
    try {
      const data = await login(username, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setPage('login');
  };

  const handlePendingClose = () => {
    setPendingToken(null);
    window.history.pushState({}, '', '/');
    setPage('login');
  };

  if (page === 'pending' && pendingToken) {
    return (
      <PendingTransactionModal
        token={pendingToken}
        onClose={handlePendingClose}
      />
    );
  }

  if (page === 'dashboard' && token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  if (page === 'signup') {
    return (
      <Signup
        onSignup={handleSignup}
        onSwitchToLogin={() => setPage('login')}
        error={error}
      />
    );
  }

  return (
    <Login
      onLogin={handleLogin}
      onSwitchToSignup={() => setPage('signup')}
      error={error}
    />
  );
}

export default App;
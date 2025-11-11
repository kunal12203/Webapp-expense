import React, { useState } from 'react';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Dashboard } from './components/Dashboard';
import { signup, login } from './services/api';

type Page = 'login' | 'signup' | 'dashboard';

function App() {
  const [page, setPage] = useState<Page>('login');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (token) {
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
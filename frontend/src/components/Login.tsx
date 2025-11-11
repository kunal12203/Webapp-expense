import React, { useState } from "react";

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onSwitchToSignup: () => void;
  error: string;
}

export const Login: React.FC<LoginProps> = ({
  onLogin,
  onSwitchToSignup,
  error,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="card w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Welcome Back 👋</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Username</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="btn btn-primary w-full">
            Login
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          Don’t have an account?{" "}
          <button
            onClick={onSwitchToSignup}
            className="text-brand hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

import React, { useState } from "react";

interface SignupProps {
  onSignup: (username: string, email: string, password: string) => Promise<void>;
  onSwitchToLogin: () => void;
  error: string;
}

export const Signup: React.FC<SignupProps> = ({
  onSignup,
  onSwitchToLogin,
  error,
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSignup(username, email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="card w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">
          Create an Account 📝
        </h2>
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
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            Sign Up
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-brand hover:underline font-medium"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

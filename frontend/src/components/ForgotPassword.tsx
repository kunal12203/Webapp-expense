import { useState } from "react";
import { Mail, KeyRound, ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "../services/api";

interface ForgotPasswordProps {
  onBack: () => void;
  onResetPassword?: () => void;
}

export default function ForgotPassword({ onBack, onResetPassword }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      setToken(result.token);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center animate-float">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {success ? "Reset Token Generated" : "Forgot Password"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {success ? "Copy your reset token below" : "Enter your email to receive a reset token"}
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Get Reset Token"
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                  Token Generated Successfully
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                  Copy this token and use it on the reset password page:
                </p>
                <div className="relative">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-300 dark:border-green-700 font-mono text-sm break-all">
                    {token}
                  </div>
                  <button
                    onClick={handleCopyToken}
                    className="absolute top-2 right-2 p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    title="Copy token"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> This token expires in 1 hour and can only be used once. In a production app, this would be sent to your email.
              </div>

              <button
                onClick={onResetPassword || onBack}
                className="btn btn-primary w-full"
              >
                Continue to Reset Password
              </button>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
          Secure password recovery
        </div>
      </div>
    </div>
  );
}
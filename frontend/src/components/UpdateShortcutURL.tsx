import React, { useState, useEffect } from "react";
import { ArrowLeft, Copy, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authGet } from "../config/api";

const UpdateShortcutURL = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shortcutUrl, setShortcutUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Automatically fetch new URL when page loads
    fetchNewURL();
  }, []);

  const fetchNewURL = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authGet("/api/user/shortcut-url");
      setShortcutUrl(data.shortcut_url);
    } catch (err: any) {
      setError(err.message || "Failed to generate URL");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortcutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Update Your Shortcut URL
          </h1>
          <p className="text-sm text-slate-500">Get your new improved SMS automation URL</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        
        {/* Important Notice */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                🎉 Important Update: SMS Automation Improved!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                We've fixed a bug that caused some SMS messages to fail processing. 
                To ensure smooth automation, please update your iOS Shortcut with the new URL below.
              </p>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">✓</span>
                  <span>Your old URL will still work for 30 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">✓</span>
                  <span>New URL is more reliable and handles all SMS formats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">✓</span>
                  <span>Takes just 30 seconds to update</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* URL Display */}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-600" />
            Your New Shortcut URL
          </h3>

          {loading ? (
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Generating your personalized URL...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-xl border border-rose-200 dark:border-rose-800">
              <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{error}</p>
              <button
                onClick={fetchNewURL}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs break-all">
                {shortcutUrl}
              </div>

              <button
                onClick={copyToClipboard}
                className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy New URL
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Update Instructions */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">
            📱 How to Update Your iOS Shortcut
          </h3>
          <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Open the <strong>Shortcuts app</strong> on your iPhone</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Find your <strong>SMS Parser shortcut</strong> and tap on it</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Look for the <strong>"Get contents of URL"</strong> or <strong>"Open URLs"</strong> action</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span><strong>Delete the old URL</strong> and paste your new URL (copied above)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                ✓
              </span>
              <span>Tap <strong>Done</strong> - You're all set!</span>
            </li>
          </ol>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/automation-guide")}
            className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            View Full Automation Guide
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Go to Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateShortcutURL;
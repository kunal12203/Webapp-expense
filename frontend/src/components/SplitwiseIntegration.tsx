import React, { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import { RefreshCw, Link2, CheckCircle, Loader2, Info } from "lucide-react";

const SplitwiseIntegration: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  const token = localStorage.getItem("token");

  const loadProfile = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    
    // Check if we just came back from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('connected')) {
      setJustConnected(true);
      // Reload profile after a short delay to ensure backend has saved data
      setTimeout(() => {
        loadProfile();
        setJustConnected(false);
      }, 2000);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const connectSplitwise = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.splitwiseAuthUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        alert("Failed to get Splitwise authorization URL");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start Splitwise connection");
    }
  };

  const syncToday = async () => {
    setSyncing(true);
    try {
      const res = await fetch(API_ENDPOINTS.splitwiseSyncToday, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(`Imported ${data.imported || 0} expenses for today from Splitwise.`);
      loadProfile();
      // also notify pending section to refresh
      window.dispatchEvent(new Event("pendingTransactionsUpdated"));
    } catch (err) {
      console.error(err);
      alert("Failed to sync today's expenses.");
    } finally {
      setSyncing(false);
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const res = await fetch(API_ENDPOINTS.splitwiseSyncAll, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(`Imported ${data.imported || 0} total expenses from Splitwise.`);
      loadProfile();
      window.dispatchEvent(new Event("pendingTransactionsUpdated"));
    } catch (err) {
      console.error(err);
      alert("Failed to perform full sync.");
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = !!profile?.splitwise_user_id;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Splitwise Integration</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Auto-import shared expenses from Splitwise. Only your <b>owed share</b> is added
          as a pending expense, categorized using your own categories.
        </p>
      </div>

      {justConnected && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>
            ✔ Successfully connected to Splitwise! Loading your account details...
          </p>
        </div>
      )}

      <div className="glass-card p-6 rounded-2xl border space-y-4">
        {loading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading Splitwise status…</span>
          </div>
        ) : isConnected ? (
          <>
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500 w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold">Connected to Splitwise</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Splitwise User ID: {profile.splitwise_user_id}
                </p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400">
              Last auto-sync:{" "}
              {profile.splitwise_last_sync_at
                ? new Date(profile.splitwise_last_sync_at).toLocaleString()
                : "Never"}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={syncToday}
                disabled={syncing}
                className="btn-gradient flex items-center gap-2"
              >
                {syncing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                Fetch Today&apos;s Splitwise Expenses
              </button>

              <button
                onClick={syncAll}
                disabled={syncing}
                className="btn-ghost flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Full Sync (All Time)
              </button>
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <Info className="w-4 h-4 mt-0.5" />
              <p>
                Auto-sync is also triggered periodically in the background and right after
                you connect your account. This page lets you force a manual sync whenever
                you want.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Link2 className="text-indigo-500 w-6 h-6" />
              <h2 className="text-xl font-semibold">Not Connected</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Click below to connect your Splitwise account and start auto-importing your
              shared expenses.
            </p>
            <button
              onClick={connectSplitwise}
              className="btn-gradient flex items-center gap-2 mt-3"
            >
              <Link2 className="w-5 h-5" />
              Connect to Splitwise
            </button>
          </>
        )}
      </div>

      <div className="glass-card p-6 rounded-2xl border space-y-2">
        <h2 className="text-lg font-semibold">How it works</h2>
        <p>1️⃣ Connect Splitwise and authorize access.</p>
        <p>2️⃣ We store tokens securely and know your Splitwise user ID.</p>
        <p>3️⃣ For each expense where you are a participant, we take your <b>owed_share</b>.</p>
        <p>4️⃣ That amount is added as a Pending Transaction in your account.</p>
        <p>5️⃣ Category is chosen using AI + your own categories.</p>
        <p>6️⃣ Background cron also syncs automatically after some interval.</p>
      </div>
    </div>
  );
};

export default SplitwiseIntegration;
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";

const SMSProcessor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processSMS = async () => {
      const sms = searchParams.get("sms");
      const urlToken = searchParams.get("token");

      console.log("Raw SMS param:", sms);
      console.log("Token:", urlToken);

      if (!sms || sms.trim() === "") {
        setError("No SMS text provided");
        setProcessing(false);
        return;
      }

      if (!urlToken) {
        setError("Invalid shortcut URL - token missing");
        setProcessing(false);
        return;
      }

      try {
        // Decode the SMS text properly (searchParams.get already decodes URL encoding)
        const decodedSMS = sms.trim();
        
        console.log("Decoded SMS:", decodedSMS);

        // Call backend API to parse SMS using token from URL
        const API_BASE = import.meta.env.VITE_API_URL || "https://webapp-expense.onrender.com";
        const response = await fetch(
          `${API_BASE}/api/user/sms-parse?sms=${encodeURIComponent(decodedSMS)}`,
          {
            headers: {
              Authorization: `Bearer ${urlToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to parse SMS");
        }

        const data = await response.json();
        
        // Extract token from the returned URL
        const urlParts = data.url.split("/");
        const pendingToken = urlParts[urlParts.length - 1];

        // Temporarily store the auth token for the confirmation page
        sessionStorage.setItem("temp_auth_token", urlToken);

        // Redirect to confirmation page
        navigate(`/add-expense/${pendingToken}`);
      } catch (err: any) {
        console.error("Error processing SMS:", err);
        setError(err.message || "Failed to process SMS");
        setProcessing(false);
      }
    };

    processSMS();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <div className="glass-card max-w-md p-8 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Processing Failed
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg mb-6 text-xs text-left">
            <p className="text-slate-500 dark:text-slate-400 mb-1">Debug Info:</p>
            <p className="text-slate-600 dark:text-slate-300 break-all">
              SMS: {searchParams.get("sms")?.substring(0, 50)}...
            </p>
            <p className="text-slate-600 dark:text-slate-300 mt-1">
              Token: {searchParams.get("token") ? "✓ Present" : "✗ Missing"}
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="btn-gradient px-6 py-3"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="glass-card max-w-md p-8 text-center">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Processing SMS...
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Parsing transaction details with AI
        </p>
      </div>
    </div>
  );
};

export default SMSProcessor;
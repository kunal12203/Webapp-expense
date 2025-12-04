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
      // Try multiple ways to get SMS parameter
      const smsFromParams = searchParams.get("sms");
      const allParams = Object.fromEntries(searchParams.entries());
      
      console.log("All URL params:", allParams);
      console.log("Raw URL:", window.location.href);
      console.log("SMS from searchParams:", smsFromParams);
      
      // Try to extract from raw URL as fallback
      const urlObj = new URL(window.location.href);
      const smsFromURL = urlObj.searchParams.get("sms");
      
      console.log("SMS from URL object:", smsFromURL);
      
      const sms = smsFromParams || smsFromURL;
      const urlToken = searchParams.get("token");

      if (!sms || sms.trim() === "") {
        setError("No SMS text provided. Check if URL is correct.");
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
        
        console.log("Processing SMS:", decodedSMS.substring(0, 100));

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
    const allParams = Object.fromEntries(searchParams.entries());
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <div className="glass-card max-w-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Processing Failed
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-6 text-xs text-left space-y-2">
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-2">Debug Info:</p>
            
            <div>
              <p className="text-slate-500 dark:text-slate-400">Full URL:</p>
              <p className="text-slate-600 dark:text-slate-300 break-all text-[10px]">
                {window.location.href}
              </p>
            </div>
            
            <div>
              <p className="text-slate-500 dark:text-slate-400">All Parameters:</p>
              <pre className="text-slate-600 dark:text-slate-300 text-[10px] overflow-auto">
                {JSON.stringify(allParams, null, 2)}
              </pre>
            </div>
            
            <div>
              <p className="text-slate-500 dark:text-slate-400">SMS Parameter:</p>
              <p className="text-slate-600 dark:text-slate-300 break-all">
                {searchParams.get("sms") || "NULL/EMPTY"}
              </p>
            </div>
            
            <div>
              <p className="text-slate-500 dark:text-slate-400">Token:</p>
              <p className="text-slate-600 dark:text-slate-300">
                {searchParams.get("token") ? "✓ Present" : "✗ Missing"}
              </p>
            </div>
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
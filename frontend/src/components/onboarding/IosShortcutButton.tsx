import React, { useState } from 'react';
import { Smartphone, Download, Copy, Check, ExternalLink, AlertCircle, Link as LinkIcon } from 'lucide-react';

interface IOSShortcutButtonProps {
  onSkip?: () => void;
  standalone?: boolean;
}

const IOSShortcutButton: React.FC<IOSShortcutButtonProps> = ({ onSkip, standalone = false }) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const token = localStorage.getItem('token');
  
  const API_URL = 'https://webapp-expense.onrender.com/api/user/sms-parse';
  const SHORTCUT_LINK = 'https://www.icloud.com/shortcuts/4b61ce735779484b96688db44c7df2c7';

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const copyApiUrl = () => {
    navigator.clipboard.writeText(API_URL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const openShortcut = () => {
    window.open(SHORTCUT_LINK, '_blank');
    setShowInstructions(true);
  };

  const CardWrapper = standalone ? 
    ({ children }: any) => <div className="glass-card p-6">{children}</div> :
    ({ children }: any) => <>{children}</>;

  return (
    <CardWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
              iOS Shortcut Automation
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Parse bank SMS messages automatically and add expenses with one tap
            </p>
          </div>
        </div>

        {/* Main Action Buttons */}
        {!showInstructions ? (
          <div className="space-y-4">
            
            {/* Add Shortcut Button */}
            <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Add to iPhone Shortcuts</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">One-click setup</p>
                </div>
              </div>
              <button
                onClick={openShortcut}
                className="w-full btn-gradient py-3 text-sm shadow-lg shadow-indigo-500/30"
              >
                <ExternalLink className="w-4 h-4" />
                Open Shortcut Link
              </button>
            </div>

            {/* API Configuration Section */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Configuration Details
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                You'll need these to set up the shortcut manually
              </p>
              
              <div className="space-y-3">
                {/* Auth Token */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                    1. Your Authentication Token
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">
                      {token?.substring(0, 40)}...
                    </div>
                    <button
                      onClick={copyToken}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* API URL */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                    2. Your Personalized API URL
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">
                      {API_URL}
                    </div>
                    <button
                      onClick={copyApiUrl}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>How it works:</strong> Click "Open Shortcut Link" → Tap "Add Shortcut" → When you receive a bank SMS, share it with this shortcut to automatically create an expense.
              </p>
            </div>
          </div>
        ) : (
          /* Installation Instructions */
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-emerald-900 dark:text-emerald-100">Shortcut Opened!</h4>
              </div>
              <ol className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Tap "Add Shortcut" in the Shortcuts app</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>The shortcut is pre-configured with your token and API URL</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>When you receive a bank SMS, share it with "Expense Parser" shortcut</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>Confirm the parsed details and save!</span>
                </li>
              </ol>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full btn-ghost py-2.5 text-sm"
            >
              Back to Setup
            </button>
          </div>
        )}

        {/* Skip Button for Onboarding */}
        {onSkip && !standalone && (
          <button
            onClick={onSkip}
            className="w-full text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors py-2"
          >
            Skip for now, I'll set this up later
          </button>
        )}
      </div>
    </CardWrapper>
  );
};

export default IOSShortcutButton;
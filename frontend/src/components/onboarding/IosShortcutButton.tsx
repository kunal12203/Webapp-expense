import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Copy, Check, ExternalLink, AlertCircle, Link as LinkIcon, Loader2 } from 'lucide-react';
import { authGet } from '../../config/api';

interface IOSShortcutButtonProps {
  onSkip?: () => void;
  standalone?: boolean;
}

const IOSShortcutButton: React.FC<IOSShortcutButtonProps> = ({ onSkip, standalone = false }) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [personalizedUrl, setPersonalizedUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const token = localStorage.getItem('token');
  
  const SHORTCUT_LINK = 'https://www.icloud.com/shortcuts/d46388433ea74bc388bf43133a52165f';
  const API_BASE = import.meta.env.VITE_API_URL || "https://webapp-expense.onrender.com";

  // Fetch personalized shortcut URL on mount
  useEffect(() => {
    fetchPersonalizedUrl();
  }, []);

  const fetchPersonalizedUrl = async () => {
    setLoading(true);
    setError('');
    
    const url = `${API_BASE}/api/user/shortcut-url`;
  
    
    try {
      const response = await authGet(url);
      setPersonalizedUrl(response.shortcut_url);
    } catch (error: any) {
      console.error('❌ Failed to fetch personalized URL:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      setError(error.message || 'Failed to load URL. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const regenerateUrl = async () => {
    if (!confirm('This will invalidate your old shortcut URL. You will need to update your iOS Shortcut. Continue?')) {
      return;
    }

    setRegenerating(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/user/regenerate-shortcut-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate URL');
      }

      const data = await response.json();
      setPersonalizedUrl(data.shortcut_url);
      alert('✅ New URL generated! Old shortcut URLs are now invalid.');
    } catch (error: any) {
      setError(error.message || 'Failed to regenerate URL');
      alert('❌ Failed to regenerate URL. Please try again.');
    } finally {
      setRegenerating(false);
    }
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const copyPersonalizedUrl = () => {
    if (personalizedUrl) {
      // Replace placeholder with actual SMS variable syntax for shortcuts
      const shortcutReadyUrl = personalizedUrl.replace('{SMS_TEXT}', 'SMS Text');
      navigator.clipboard.writeText(shortcutReadyUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
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
              Parse bank SMS messages automatically with AI - just copy your personalized URL!
            </p>
          </div>
        </div>

        {/* Main Action */}
        {!showInstructions ? (
          <div className="space-y-4">
            
            {/* Personalized URL - Main Feature */}
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <LinkIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Your Personalized URL</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">One-click copy, ready for iOS Shortcut</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="ml-2 text-sm text-slate-500">Generating your URL...</span>
                </div>
              ) : error ? (
                <div className="space-y-3">
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                    <p className="text-sm text-rose-600 dark:text-rose-400 mb-2 font-semibold">
                      ⚠️ Failed to load personalized URL
                    </p>
                    <p className="text-xs text-rose-500 dark:text-rose-400 mb-3">
                      {error}
                    </p>
                    <details className="text-xs text-rose-500">
                      <summary className="cursor-pointer font-semibold mb-2">Possible causes:</summary>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Backend not deployed yet</li>
                        <li>Endpoint /api/user/shortcut-url missing</li>
                        <li>Check browser console (F12) for details</li>
                        <li>Check Render backend logs</li>
                      </ul>
                    </details>
                  </div>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full btn-ghost py-2.5 text-sm"
                  >
                    🔄 Retry
                  </button>
                  
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-semibold">
                      Manual Setup (If auto-load fails):
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      You can still use the old method with token + API URL below
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 break-all">
                    <code className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                      {personalizedUrl ? personalizedUrl.replace('{SMS_TEXT}', 'SMS Text') : 'No URL generated'}
                    </code>
                  </div>

                  <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      💡 <strong>Note:</strong> In your iOS Shortcut, you'll replace "SMS Text" with the actual Shortcut variable
                    </p>
                  </div>

                  <button
                    onClick={copyPersonalizedUrl}
                    disabled={!personalizedUrl}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>Copy Personalized URL</span>
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={fetchPersonalizedUrl}
                      disabled={loading}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          <span>🔄 Get Updated URL</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={regenerateUrl}
                      disabled={regenerating}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {regenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Regenerating...</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          <span>⚠️ Force New URL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>💡 Updated URL?</strong> Click "Get Updated URL" to fetch the new encoded version. 
                      Use "Force New URL" only if you suspect your URL was compromised.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Add Shortcut Button */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Next: Add iOS Shortcut</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                After copying your URL, add the shortcut to your iPhone
              </p>
              <button
                onClick={openShortcut}
                className="w-full btn-ghost py-2.5 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open Shortcut Link
              </button>
            </div>

            {/* Instructions */}
            <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                <p className="font-bold">How to use:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Copy your personalized URL above</li>
                  <li>Open the iOS Shortcut and paste it</li>
                  <li>When you get a bank SMS, run the shortcut!</li>
                  <li>Your browser opens with pre-filled transaction to confirm</li>
                </ol>
              </div>
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
                  <span>Paste your personalized URL when prompted</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>When you receive a bank SMS, share it with "Expense Parser" shortcut</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>The AI will parse it and open pre-filled confirmation!</span>
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
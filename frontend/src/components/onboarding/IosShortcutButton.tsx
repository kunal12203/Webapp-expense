import React, { useState } from 'react';
import { Smartphone, Download, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react';

interface IOSShortcutButtonProps {
  onSkip?: () => void;
  standalone?: boolean;
}

const IOSShortcutButton: React.FC<IOSShortcutButtonProps> = ({ onSkip, standalone = false }) => {
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const token = localStorage.getItem('token');
  
  const API_URL = 'https://webapp-expense.onrender.com/api/user/sms-parse';
  
  // iOS Shortcut configuration as JSON
  const shortcutConfig = {
    WFWorkflowActions: [
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.text",
        WFWorkflowActionParameters: {
          WFTextActionText: "Paste your SMS message here"
        }
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.urlencode",
        WFWorkflowActionParameters: {}
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.url",
        WFWorkflowActionParameters: {
          WFURLActionURL: `${API_URL}?sms=`
        }
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.downloadurl",
        WFWorkflowActionParameters: {
          WFHTTPMethod: "GET",
          WFHTTPHeaders: {
            Authorization: `Bearer ${token}`
          }
        }
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.getvalueforkey",
        WFWorkflowActionParameters: {
          WFDictionaryKey: "url"
        }
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.openurl",
        WFWorkflowActionParameters: {}
      }
    ],
    WFWorkflowClientVersion: "2302.0.4",
    WFWorkflowMinimumClientVersion: 900,
    WFWorkflowMinimumClientVersionString: "900",
    WFWorkflowTypes: ["NCWidget", "WatchKit"],
    WFWorkflowInputContentItemClasses: [
      "WFAppStoreAppContentItem",
      "WFStringContentItem"
    ]
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadShortcut = () => {
    // Create blob with shortcut configuration
    const blob = new Blob([JSON.stringify(shortcutConfig, null, 2)], {
      type: 'application/json'
    });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ExpenseTracker-SMS.shortcut';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show instructions
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

        {/* Steps */}
        {!showInstructions ? (
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">1</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">Copy Authentication Token</h4>
                <button
                  onClick={copyToken}
                  className="w-full btn-ghost py-2.5 text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Token Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Token
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">2</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">Download & Install Shortcut</h4>
                <button
                  onClick={downloadShortcut}
                  className="w-full btn-gradient py-2.5 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Shortcut
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>How it works:</strong> When you receive a bank SMS, run this shortcut. It will parse the message using AI and create an expense entry for you to approve.
              </p>
            </div>
          </div>
        ) : (
          /* Installation Instructions */
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-emerald-900 dark:text-emerald-100">Shortcut Downloaded!</h4>
              </div>
              <ol className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Open the downloaded .shortcut file on your iPhone</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Tap "Add Shortcut" in the Shortcuts app</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>The shortcut will automatically use your auth token</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>When you receive a bank SMS, share it with this shortcut</span>
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
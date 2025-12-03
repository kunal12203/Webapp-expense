import React from "react";
import { ArrowLeft, Smartphone, MessageSquare, Plus, Search, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AutomationGuide = () => {
  const navigate = useNavigate();

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
            Automation Setup Guide
          </h1>
          <p className="text-sm text-slate-500">Auto-capture expenses from bank SMS</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card p-6 sm:p-8 space-y-8">
        
        {/* Introduction */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-500 p-3 rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                What is SMS Automation?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Automatically capture expenses when you receive bank transaction SMS. No manual entry needed! 
                Your iPhone will detect bank messages and send them to your expense tracker instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Guide */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Setup Steps
          </h2>

          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Open Automation in Shortcuts App
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Launch the <span className="font-semibold">Shortcuts app</span> on your iPhone, 
                then tap on the <span className="font-semibold">"Automation"</span> tab at the bottom.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Shortcuts App → Automation Tab
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Create New Automation
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Tap the <span className="font-semibold">+ button</span> (or "Create Personal Automation") 
                in the top right corner to create a new automation.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Tap the + icon
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Select Message Trigger
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Search for <span className="font-semibold">"Message"</span> and select 
                the <span className="font-semibold">"Message"</span> automation trigger.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Search → Message
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Add Message Filter
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                In "Message Contains", add text that appears in ALL your bank transaction SMS. 
                This could be:
              </p>
              <div className="space-y-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                    ✓ Last 4 digits of account: <span className="font-mono">X1234</span>
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Example: "A/c X1234 debited"
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                    ✓ Bank name: <span className="font-mono">HDFC</span> or <span className="font-mono">SBI</span>
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Example: "debited from HDFC Bank"
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                    ✓ Keyword: <span className="font-mono">debited</span> or <span className="font-mono">spent</span>
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Example: "Rs. 500 debited"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
              5
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Choose "Run Immediately"
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Select <span className="font-semibold">"Run Immediately"</span> so the automation 
                triggers as soon as the message arrives (no manual confirmation needed).
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  ⚠️ This allows automatic processing without you having to approve each time
                </p>
              </div>
            </div>
          </div>

          {/* Step 6 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
              6
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Tap Next
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Click the <span className="font-semibold">"Next"</span> button to proceed to action selection.
              </p>
            </div>
          </div>

          {/* Step 7 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
              7
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Select Your SMS Parser Shortcut
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Search for and select the <span className="font-semibold">SMS Parser shortcut</span> from 
                your "My Shortcuts" section. This is the shortcut you created earlier from the profile page.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm">
                  <Search className="w-4 h-4 text-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Search → "SMS Parser" → Select
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 8 - Save */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
              ✓
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Save & Test!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Tap <span className="font-semibold">"Done"</span> to save your automation. 
                Now whenever you receive a bank SMS, it will automatically be processed!
              </p>
            </div>
          </div>
        </div>

        {/* Multiple Accounts Section */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Have Multiple Bank Accounts?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Create a separate automation for each account by repeating steps 1-7 with different filters:
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span><strong>Account 1:</strong> Message contains "X1234"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span><strong>Account 2:</strong> Message contains "X5678"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span><strong>Credit Card:</strong> Message contains "ending 9012" or "spent"</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            Pro Tips
          </h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>Use specific keywords that appear in ALL your transaction messages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>Test with a real bank SMS to make sure automation triggers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>You can edit/disable automation anytime from Shortcuts app</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>Check "Pending Transactions" page to confirm/edit parsed expenses</span>
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => navigate("/profile")}
            className="btn-gradient px-8 py-4 text-base"
          >
            Go to Profile to Get Shortcut URL
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutomationGuide;
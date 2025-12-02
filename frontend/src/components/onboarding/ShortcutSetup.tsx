import React from 'react';
import { useNavigate } from 'react-router-dom';
import IOSShortcutButton from './IosShortcutButton';
import { Sparkles } from 'lucide-react';

const ShortcutSetup = () => {
  const navigate = useNavigate();

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] rounded-full bg-indigo-500/5 blur-[150px]" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-xl shadow-blue-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            One More Thing...
          </h1>
          <p className="text-slate-500 text-lg">
            Set up automatic expense tracking from your bank SMS
          </p>
        </div>

        {/* Shortcut Card */}
        <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <IOSShortcutButton onSkip={handleSkip} />
        </div>

        {/* Privacy Note */}
        <p className="text-center text-xs text-slate-400 mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          🔒 Your SMS data is processed securely and never stored. Only transaction details are saved.
        </p>
      </div>
    </div>
  );
};

export default ShortcutSetup;
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * PWA Install Prompt Component
 * Shows a banner prompting users to install the app on their home screen
 * 
 * Features:
 * - Auto-detects iOS vs Android
 * - Shows custom instructions for each platform
 * - Dismissible (won't show again for 7 days)
 * - Auto-appears after 30 seconds on first visit
 */
const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (running in standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS devices
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if user already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show for 7 days after dismissal
      }
    }

    // For iOS, show prompt after 30 seconds
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
      return () => clearTimeout(timer);
    }

    // For Android/Desktop - listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after 30 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed successfully');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  // Don't render if already installed or prompt is hidden
  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-2xl p-4 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/20 transition-colors z-10"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 relative z-10">
          {/* Icon */}
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-base mb-1">Install Expense Tracker</h3>
            <p className="text-sm text-indigo-100 mb-3">
              {isIOS 
                ? "Add to your home screen for quick access. Tap the share button and select 'Add to Home Screen'"
                : "Install our app for quick access and offline support!"
              }
            </p>

            {/* Android/Desktop install button */}
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Install Now
              </button>
            )}

            {/* iOS instructions */}
            {isIOS && (
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                <span>Tap</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C11.172 2 10.5 2.672 10.5 3.5V11H7L12 16L17 11H13.5V3.5C13.5 2.672 12.828 2 12 2Z" />
                </svg>
                <span>then "Add to Home Screen"</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
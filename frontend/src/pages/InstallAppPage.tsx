import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, Check, Zap, Wifi, RefreshCw } from 'lucide-react';

const InstallAppPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isMacDevice = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsMac(isMacDevice);

    if (isIOSDevice) {
      setPlatform('iOS');
    } else if (isMacDevice) {
      setPlatform('Mac');
    } else if (/Android/.test(userAgent)) {
      setPlatform('Android');
    } else if (/Windows/.test(userAgent)) {
      setPlatform('Windows');
    } else {
      setPlatform('Desktop');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen w-full pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/30">
            <Download className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
            Install Our App
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Get instant access from your home screen. Works offline, loads faster, feels like a native app!
          </p>
        </div>

        {/* Already Installed */}
        {isInstalled && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-500 rounded-3xl p-8 text-center animate-slide-up">
            <Check className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-400 mb-2">
              🎉 App Already Installed!
            </h2>
            <p className="text-emerald-700 dark:text-emerald-300">
              You're all set! Find the app on your home screen or in your apps list.
            </p>
          </div>
        )}

        {/* Install Button - Android/Windows/Desktop */}
        {!isInstalled && !isIOS && !isMac && deferredPrompt && (
          <div className="animate-slide-up">
            <button
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xl font-bold py-6 px-8 rounded-2xl shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <div className="flex items-center justify-center gap-3">
                <Download className="w-8 h-8" />
                <span>Install Now - It's Free!</span>
              </div>
            </button>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              Detected: {platform} • One-click installation
            </p>
          </div>
        )}

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Lightning Fast
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Cached resources load instantly. No waiting for pages to load.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
              <Wifi className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Works Offline
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Access your data even without internet connection.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Auto Updates
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Always get the latest features automatically.
            </p>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* iOS Instructions */}
          {isIOS && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-8 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-4 mb-6">
                <Smartphone className="w-12 h-12 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Install on iOS
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    iPhone or iPad
                  </p>
                </div>
              </div>
              
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Tap the Share button
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Look for the (□↑) icon at the bottom of Safari
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Scroll down and tap "Add to Home Screen"
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      You'll see our app icon and name
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Tap "Add" in the top right
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Done! Find the app on your home screen 🎉
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Mac Instructions */}
          {isMac && !isIOS && (
            <div className="bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-800 dark:to-zinc-800 rounded-3xl p-8 border-2 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-6">
                <Monitor className="w-12 h-12 text-slate-700 dark:text-slate-300" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Install on Mac
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    macOS
                  </p>
                </div>
              </div>
              
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-700 dark:bg-slate-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Look for the install icon (⊕) in the address bar
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      It appears on the right side, next to the bookmark star
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-700 dark:bg-slate-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Click the icon or Menu → "Install Expense Tracker"
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      You can also find it in the browser menu (three dots)
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-700 dark:bg-slate-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Click "Install" in the dialog
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Opens as a standalone app! Find it in Applications 🎉
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Android/Desktop Instructions (if no prompt) */}
          {!isIOS && !isMac && !deferredPrompt && !isInstalled && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-8 border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-4 mb-6">
                <Download className="w-12 h-12 text-green-600" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Install on {platform}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Chrome or Edge Browser
                  </p>
                </div>
              </div>
              
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Click the Menu button (⋮) in your browser
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Usually in the top right corner
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Select "Install Expense Tracker" or "Add to Home screen"
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Look for options with our app icon
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Confirm installation
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      App appears on your home screen or desktop! 🎉
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Why Install Section */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-8 border border-purple-200 dark:border-purple-800 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why Install Our App?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Check className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  One-Tap Access
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Launch instantly from your home screen. No typing URLs!
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Check className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  No Browser Clutter
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Opens in standalone mode. Feels like a native app!
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Check className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Offline Support
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  View and manage expenses without internet connection.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Check className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Auto Updates
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Always up-to-date. No manual downloads needed.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Check className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Faster Performance
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Cached resources load 2-3x faster than web.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Check className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Less Data Usage
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Uses cached assets. Saves mobile data.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InstallAppPage;
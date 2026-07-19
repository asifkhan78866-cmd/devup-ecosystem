"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isAppInstalled = window.matchMedia("(display-mode: standalone)").matches || 
                           (window.navigator as any).standalone === true;
    setIsStandalone(isAppInstalled);

    if (isAppInstalled) return;

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    
    if (isIosDevice && isSafari) {
      setIsIOS(true);
      // Show iOS prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    }

    // Handle Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-[#111111] border border-[#c8f135]/30 rounded-2xl p-4 shadow-2xl shadow-[#c8f135]/10 flex items-start gap-4">
        <div className="w-12 h-12 bg-[#c8f135]/10 rounded-xl flex items-center justify-center shrink-0 border border-[#c8f135]/20">
          <Download className="w-6 h-6 text-[#c8f135]" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm mb-1">Install DevUp App</h3>
          
          {isIOS ? (
            <div className="text-[#a1a1a1] text-xs space-y-2">
              <p>Install this app on your iPhone for the best experience.</p>
              <p className="flex items-center gap-1 text-white bg-white/5 p-2 rounded-lg">
                Tap <Share className="w-4 h-4 text-blue-400" /> then <PlusSquare className="w-4 h-4 text-white" /> <strong>Add to Home Screen</strong>
              </p>
            </div>
          ) : (
            <p className="text-[#a1a1a1] text-xs mb-3">
              Add DevUp to your home screen for quick access and offline support.
            </p>
          )}

          {!isIOS && (
            <button 
              onClick={handleInstallClick}
              className="w-full bg-[#c8f135] text-black text-xs font-bold py-2 rounded-lg hover:bg-[#b0d62a] transition-colors"
            >
              Add to Home Screen
            </button>
          )}
        </div>

        <button 
          onClick={() => setShowPrompt(false)}
          className="text-[#6b6b6b] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

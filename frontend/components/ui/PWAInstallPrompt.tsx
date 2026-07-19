"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { usePathname } from "next/navigation";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show on the homepage
    if (pathname !== "/") return;

    // Check if dismissed previously
    if (localStorage.getItem("pwa_prompt_dismissed") === "true") return;

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
  }, [pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
      localStorage.setItem("pwa_prompt_dismissed", "true");
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-auto md:right-8 md:w-[400px] z-50 animate-in slide-in-from-bottom-full duration-500 pb-[env(safe-area-inset-bottom)]">
      <div className="bg-[#111111]/95 backdrop-blur-xl border-t md:border border-white/10 md:rounded-2xl rounded-t-3xl p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] md:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col gap-4">
        
        {/* Header with Icon and Close Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#c8f135] to-[#9dbd27] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#c8f135]/20">
              <Download className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base tracking-tight mb-0.5" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Install DevUp App</h3>
              <p className="text-[#a1a1a1] text-xs leading-relaxed">
                Add to your home screen for quick access and a better experience.
              </p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-[#a1a1a1] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Action Area */}
        <div className="w-full">
          {isIOS ? (
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-white text-xs flex items-center justify-center gap-2 font-medium">
                Tap <Share className="w-5 h-5 text-blue-500 bg-white/10 p-1 rounded-md" /> then <PlusSquare className="w-5 h-5 text-white bg-white/10 p-1 rounded-md" /> <strong>Add to Home Screen</strong>
              </p>
            </div>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="w-full bg-[#c8f135] text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#b0d62a] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(200,241,53,0.3)]"
            >
              Install App
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

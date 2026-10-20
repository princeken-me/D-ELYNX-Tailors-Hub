import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' | 'pill' }> = ({
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Suppress when already installed
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop Install Button
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className={
          variant === 'banner'
            ? 'flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase shadow-md hover:from-amber-500 hover:to-amber-600 transition-all cursor-pointer'
            : 'flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 text-xs font-medium tracking-wide transition-all cursor-pointer'
        }
        title="Install D-ELYNX as a native mobile PWA"
      >
        <Download className="w-3.5 h-3.5 text-amber-400" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari Flow
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:border-zinc-500 text-xs font-medium tracking-wide transition-all cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Add to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <span className="font-serif font-bold text-amber-400">D</span>
                  </div>
                  <h3 className="text-base font-semibold">Install D-ELYNX</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-zinc-400 hover:text-zinc-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <p className="leading-relaxed">
                  Install D-ELYNX on your iPhone/iPad for instant full-screen access and offline caching:
                </p>
                <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/80 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">1.</span>
                    <span>Tap the Safari <strong>Share</strong> button at the bottom navigation bar.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">2.</span>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">3.</span>
                    <span>Tap <strong>Add</strong> in the top-right corner.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2.5 text-xs font-semibold tracking-wider uppercase text-zinc-100 transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

import { Download, Share, X } from 'lucide-react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        title="Install CHROMASORT ∞ as an app"
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-sky-400 px-3 py-2 text-xs font-bold whitespace-nowrap text-slate-950 shadow-sm shadow-sky-400/20 transition-colors hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 shrink-0"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Install on iPhone or iPad"
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-sky-400/35 bg-sky-400/10 px-3 py-2 text-xs font-semibold whitespace-nowrap text-sky-200 transition-colors hover:bg-sky-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 shrink-0"
        >
          <Share className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            onClick={() => setShowIOSGuide(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/15 bg-slate-900 p-6 text-left shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <h3 id="ios-install-title" className="text-base font-bold text-white">
                  Install on iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close install instructions"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-300">
                <li>
                  Tap the <strong className="text-white">Share</strong> button in Safari&apos;s
                  toolbar.
                </li>
                <li>
                  Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong className="text-white">Add</strong> to launch CHROMASORT ∞ offline.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

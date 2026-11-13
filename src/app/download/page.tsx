'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import FaIcon from '@/components/FaIcon';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** App download and one-tap home-screen installation page for Android, iOS, and desktop. */
export default function DownloadAppPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installed' | 'manual'>('idle');

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallStatus('installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setInstallStatus(choice.outcome === 'accepted' ? 'installed' : 'idle');
      return;
    }
    setInstallStatus('manual');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#0f3a98] hover:underline"
        >
          <FaIcon icon="fa-solid fa-arrow-left" className="text-[11px]" />
          <span>Back to Hostels</span>
        </Link>

        {/* Hero Download Card */}
        <div className="rounded-2xl border-2 border-[#0f3a98] bg-white overflow-hidden shadow-md">
          <div className="bg-gradient-to-b from-[#0f3a98] to-[#0a2b75] px-6 py-8 text-center text-white flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-lg border-2 border-[#ffbe00] flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Hostel Connect App Icon"
                className="w-full h-full object-contain"
              />
            </div>

            <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffbe00] text-[#0f3a98] text-[11px] font-semibold">
              <FaIcon icon="fa-solid fa-mobile-screen-button" className="text-xs" />
              <span>Official Student App</span>
            </span>

            <h1 className="mt-3 text-xl sm:text-2xl font-bold text-white">
              Download the Hostel Connect App
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-blue-100 max-w-md">
              Browse verified student hostels around Makerere, MUBS, Kyambogo, and Mukono directly from your phone home screen with instant updates.
            </p>

            <button
              type="button"
              onClick={handleInstallClick}
              className="mt-6 px-6 py-3 rounded-xl bg-[#ffbe00] hover:bg-[#e5aa00] text-[#0f3a98] text-sm font-bold flex items-center justify-center gap-2 shadow-md transition"
            >
              <FaIcon icon="fa-solid fa-download" className="text-sm" />
              <span>
                {installStatus === 'installed'
                  ? 'App Installed on Your Device'
                  : 'Install Hostel Connect App'}
              </span>
            </button>

            {installStatus === 'installed' && (
              <p className="mt-3 text-xs text-[#ffbe00] font-medium">
                Hostel Connect is now ready on your home screen.
              </p>
            )}

            {installStatus === 'manual' && (
              <p className="mt-3 text-xs text-blue-100 bg-white/10 px-4 py-2 rounded-lg border border-white/20 max-w-md">
                Use the browser steps below for Android or iPhone to save the Hostel Connect app straight to your home screen in 10 seconds.
              </p>
            )}
          </div>

          {/* Device Install Steps */}
          <div className="p-5 sm:p-6 bg-[#f8fafc] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-2">
              <div className="flex items-center gap-2 text-[#0f3a98] font-semibold text-sm">
                <FaIcon icon="fa-brands fa-android" className="text-base text-[#0f3a98]" />
                <span>Android (Chrome / Edge)</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                <li>Tap <strong>Install Hostel Connect App</strong> above (or Chrome&apos;s 3-dot menu).</li>
                <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Launch anytime directly from your Android home screen.</li>
              </ol>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-2">
              <div className="flex items-center gap-2 text-[#0f3a98] font-semibold text-sm">
                <FaIcon icon="fa-brands fa-apple" className="text-base text-[#0f3a98]" />
                <span>iPhone / iPad (Safari)</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                <li>Tap the <strong>Share</strong> icon at the bottom of Safari.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top corner to install.</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


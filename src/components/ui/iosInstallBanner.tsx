'use client';

import { useEffect, useState, useRef } from 'react';

type Platform = 'ios' | 'android' | null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function IosInstallBanner() {
  const [platform, setPlatform] = useState<Platform>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as Navigator & { standalone: boolean }).standalone);
    const dismissed = localStorage.getItem('installBannerDismissed');

    if (dismissed || isInStandaloneMode) return;

    if (isIos) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setPlatform('android');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  function handleDismiss() {
    localStorage.setItem('installBannerDismissed', '1');
    setPlatform(null);
  }

  async function handleInstall() {
    if (deferredPromptRef.current) {
      await deferredPromptRef.current.prompt();
      const choice = await deferredPromptRef.current.userChoice;
      if (choice.outcome === 'accepted') {
        handleDismiss();
      }
      deferredPromptRef.current = null;
    }
  }

  if (!platform) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-orange-100 p-4 animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <img src="/icons/icon-180.png" alt="포켓미션" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800 text-sm">홈 화면에 추가하면 앱처럼 쓸 수 있어요!</p>
            {platform === 'ios' ? (
              <p className="text-gray-500 text-xs mt-1">
                하단 공유 버튼(
                <svg className="inline w-3 h-3 mx-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                ) 누르고 &ldquo;홈 화면에 추가&rdquo; 선택
              </p>
            ) : deferredPromptRef.current ? (
              <button
                onClick={handleInstall}
                className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                앱 설치하기
              </button>
            ) : (
              <p className="text-gray-500 text-xs mt-1">
                Chrome 오른쪽 상단 메뉴(&#8942;) 누르고<br />
                &ldquo;홈 화면에 추가&rdquo; 선택
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 text-lg leading-none flex-shrink-0 mt-0.5"
          aria-label="닫기"
        >
          &#10005;
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

export function IosInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode =
      'standalone' in window.navigator && (window.navigator as Navigator & { standalone: boolean }).standalone;
    const dismissed = localStorage.getItem('iosInstallDismissed');

    if (isIos && !isInStandaloneMode && !dismissed) {
      setShow(true);
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem('iosInstallDismissed', '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-orange-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <img src="/icons/icon-180.png" alt="포켓미션" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800 text-sm">홈 화면에 추가하면 앱처럼 쓸 수 있어요!</p>
            <p className="text-gray-500 text-xs mt-1">
              하단 공유 버튼(
              <svg className="inline w-3 h-3 mx-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              ) 누르고 &ldquo;홈 화면에 추가&rdquo; 선택
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 text-lg leading-none flex-shrink-0 mt-0.5"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

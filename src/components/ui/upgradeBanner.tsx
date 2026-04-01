'use client';

import { useState } from 'react';

export function UpgradeBanner() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const response = await fetch('/api/stripe/checkout', { method: 'POST' });
    const data = await response.json() as { url?: string; error?: string };

    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">프리미엄으로 업그레이드</p>
          <p className="text-purple-100 text-xs mt-0.5">미션 무제한 + 자녀 5명</p>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="bg-white text-purple-600 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-purple-50 disabled:opacity-70 transition-colors"
        >
          {loading ? '이동 중...' : '월 2,900원'}
        </button>
      </div>
    </div>
  );
}

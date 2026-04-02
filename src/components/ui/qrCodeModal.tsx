'use client';

import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QrCodeModalProps {
  inviteUrl: string;
  familyName: string;
  onClose: () => void;
}

export function QrCodeModal({ inviteUrl, familyName, onClose }: QrCodeModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(inviteUrl);
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
        <h2 className="text-lg font-bold text-gray-800 mb-1">가족 초대</h2>
        <p className="text-sm text-gray-500 mb-5">
          <span className="font-semibold text-orange-600">{familyName}</span>에 초대하기
        </p>

        <div className="bg-white p-4 rounded-xl inline-block mb-4 border border-gray-100">
          <QRCodeSVG
            value={inviteUrl}
            size={200}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
        </div>

        <p className="text-xs text-gray-400 mb-4">
          카메라로 QR코드를 스캔하면 바로 참여할 수 있어요
        </p>

        <div className="space-y-2">
          <button
            onClick={handleCopyLink}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            초대 링크 복사
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

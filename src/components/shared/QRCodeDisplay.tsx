'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';

interface QRCodeDisplayProps {
  roomCode: string;
  size?: number;
  showCopy?: boolean;
}

export default function QRCodeDisplay({ roomCode, size = 160, showCopy = true }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomCode}`
    : `/room/${roomCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 bg-white rounded-2xl shadow-rose-glow">
        <QRCodeSVG
          value={joinUrl}
          size={size}
          level="M"
          fgColor="#0b0b14"
          bgColor="#ffffff"
        />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="code-display text-white">{roomCode}</p>
        <p className="text-muted-text text-xs">{joinUrl}</p>
      </div>
      {showCopy && (
        <button onClick={handleCopy} className="btn-ghost flex items-center gap-2 text-sm">
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      )}
    </div>
  );
}

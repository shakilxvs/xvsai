'use client';
import { ModeConfig } from '@/app/lib/types';

export default function TypingIndicator({ mode }: { mode: ModeConfig }) {
  return (
    <div className="flex items-start gap-3 anim-in">
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
        style={{ background: mode.gradient }}
      >
        AI
      </div>
      <div
        className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl rounded-tl-sm"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="w-1.5 h-1.5 rounded-full dot-bounce-0" style={{ background: mode.accent }} />
        <div className="w-1.5 h-1.5 rounded-full dot-bounce-1" style={{ background: mode.accent }} />
        <div className="w-1.5 h-1.5 rounded-full dot-bounce-2" style={{ background: mode.accent }} />
      </div>
    </div>
  );
}

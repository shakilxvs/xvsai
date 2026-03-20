'use client';
import { PanelLeft } from 'lucide-react';
import { ModeConfig } from '@/app/lib/types';

export default function Header({ currentMode, sidebarOpen, onToggle }: {
  currentMode: ModeConfig; sidebarOpen: boolean; onToggle: () => void;
}) {
  return (
    <header
      className="flex-shrink-0 flex items-center px-4 gap-3 z-20"
      style={{
        height: '52px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(5,5,10,0.92)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06]"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        <PanelLeft size={16} />
      </button>

      <div className="flex items-center gap-2.5">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white transition-all duration-500"
          style={{ background: currentMode.gradient }}
        >
          X
        </div>
        <span className="text-[14px] font-semibold tracking-tight hidden sm:block" style={{ color: 'rgba(255,255,255,0.65)' }}>
          XVSai
        </span>
      </div>

      <div className="flex-1 flex justify-center">
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-500"
          style={{
            background: `${currentMode.accent}12`,
            color: currentMode.accent,
            border: `1px solid ${currentMode.accent}22`,
          }}
        >
          {currentMode.label}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] hidden sm:block" style={{ color: 'rgba(255,255,255,0.18)' }}>Online</span>
      </div>
    </header>
  );
}

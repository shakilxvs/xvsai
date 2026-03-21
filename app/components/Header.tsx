'use client';
import { PanelLeft, ArrowLeft } from 'lucide-react';
import { ModeConfig } from '@/app/lib/types';
import { User } from 'firebase/auth';
import AuthButton from './AuthButton';

interface Props {
  currentMode: ModeConfig;
  sidebarOpen: boolean;
  onToggle: () => void;
  onBack?: () => void;
  hasMessages: boolean;
  user: User | null;
  authLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Header({
  currentMode, sidebarOpen, onToggle, onBack, hasMessages,
  user, authLoading, onSignIn, onSignOut,
}: Props) {
  return (
    <header
      className="flex-shrink-0 flex items-center px-3 md:px-4 gap-3 z-20"
      style={{
        height: '52px',
        paddingTop: 'env(safe-area-inset-top)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(5,5,10,0.92)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Desktop: sidebar toggle | Mobile: back button if in chat, else nothing */}
      <div className="w-8 flex items-center">
        {/* Desktop sidebar toggle */}
        <button
          onClick={onToggle}
          className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06]"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <PanelLeft size={16} />
        </button>

        {/* Mobile back button — only when in a chat */}
        {hasMessages && (
          <button
            onClick={onBack}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors active:bg-white/[0.06]"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white transition-all duration-500"
          style={{ background: currentMode.gradient }}
        >
          X
        </div>
        <span className="text-[15px] font-semibold tracking-tight"
          style={{ color: 'rgba(255,255,255,0.7)' }}>
          XVSai
        </span>
      </div>

      {/* Mode badge — centered */}
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

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>Online</span>
        </div>
        <AuthButton user={user} loading={authLoading} onSignIn={onSignIn} onSignOut={onSignOut} />
      </div>
    </header>
  );
}

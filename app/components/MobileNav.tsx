'use client';
import { MessageSquare, Brain, Zap, Search, Code2, Image, Flame, History, Plus } from 'lucide-react';
import { Mode, ModeConfig } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';

const MODE_ICONS: Record<Mode, React.ReactNode> = {
  chat:     <MessageSquare size={18} strokeWidth={1.75} />,
  deep:     <Brain size={18} strokeWidth={1.75} />,
  fast:     <Zap size={18} strokeWidth={1.75} />,
  research: <Search size={18} strokeWidth={1.75} />,
  code:     <Code2 size={18} strokeWidth={1.75} />,
  image:    <Image size={18} strokeWidth={1.75} />,
  open:     <Flame size={18} strokeWidth={1.75} />,
};

interface Props {
  currentMode: ModeConfig;
  onOpenSidebar: () => void;
  onNewChat: () => void;
  onOpenModes: () => void;
  hasMessages: boolean;
}

export default function MobileNav({ currentMode, onOpenSidebar, onNewChat, onOpenModes, hasMessages }: Props) {
  return (
    <div
      className="md:hidden flex-shrink-0 flex items-center justify-around px-2 mobile-nav-pad pt-2"
      style={{
        background: 'rgba(5,5,10,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* History */}
      <button
        onClick={onOpenSidebar}
        className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all active:scale-95"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        <History size={20} strokeWidth={1.75} />
        <span style={{ fontSize: '10px' }}>History</span>
      </button>

      {/* New Chat */}
      <button
        onClick={onNewChat}
        className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all active:scale-95"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        <Plus size={20} strokeWidth={1.75} />
        <span style={{ fontSize: '10px' }}>New</span>
      </button>

      {/* Current mode — tap to change */}
      <button
        onClick={onOpenModes}
        className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all active:scale-95"
        style={{ color: currentMode.accent }}
      >
        <div style={{ color: currentMode.accent }}>
          {MODE_ICONS[currentMode.id]}
        </div>
        <span style={{ fontSize: '10px', fontWeight: 600 }}>{currentMode.label}</span>
      </button>
    </div>
  );
}

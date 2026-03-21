'use client';
import {
  Plus, MessageSquare, Brain, Zap, Search, Code2, Image,
  ToggleLeft, ToggleRight, Clock, ChevronRight, Sparkles,
  Trash2, LogIn, Flame,
} from 'lucide-react';
import { Mode, ModeConfig } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';
import { Conversation } from '@/app/hooks/useConversations';
import { User } from 'firebase/auth';
import React from 'react';

const ICONS: Record<Mode, React.ReactNode> = {
  chat:     <MessageSquare size={13} strokeWidth={1.75} />,
  deep:     <Brain size={13} strokeWidth={1.75} />,
  fast:     <Zap size={13} strokeWidth={1.75} />,
  research: <Search size={13} strokeWidth={1.75} />,
  code:     <Code2 size={13} strokeWidth={1.75} />,
  image:    <Image size={13} strokeWidth={1.75} />,
  open:     <Flame size={13} strokeWidth={1.75} />,
};

function timeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

interface Props {
  isOpen: boolean; currentMode: ModeConfig; onModeChange: (m: Mode) => void;
  autoRoute: boolean; onAutoRouteToggle: () => void; onNewChat: () => void;
  user: User | null; conversations: Conversation[]; activeConvId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  onDeleteConversation: (id: string) => void; onSignIn: () => void;
}

export default function Sidebar({
  isOpen, currentMode, onModeChange, autoRoute, onAutoRouteToggle, onNewChat,
  user, conversations, activeConvId, onSelectConversation, onDeleteConversation, onSignIn,
}: Props) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;

  const today     = conversations.filter(c => c.updatedAt.getTime() >= todayStart);
  const yesterday = conversations.filter(c => c.updatedAt.getTime() >= yesterdayStart && c.updatedAt.getTime() < todayStart);
  const older     = conversations.filter(c => c.updatedAt.getTime() < yesterdayStart);

  const ConvItem = ({ conv }: { conv: Conversation }) => {
    const m = MODES.find(mo => mo.id === conv.mode) ?? MODES[0];
    const isActive = activeConvId === conv.id;
    return (
      <div className="relative group/item">
        <button onClick={() => onSelectConversation(conv)}
          className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
          style={isActive ? { background: 'rgba(255,255,255,0.07)' } : {}}
          onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <span className="mt-[3px] flex-shrink-0" style={{ color: m.accent }}>{ICONS[conv.mode]}</span>
          <div className="flex-1 min-w-0 pr-5">
            <p className="text-[12.5px] leading-snug truncate font-medium"
              style={{ color: isActive ? '#e8e8f0' : 'rgba(255,255,255,0.5)' }}>{conv.title}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock size={9} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.2)' }} />
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{timeAgo(conv.updatedAt)}</span>
            </div>
          </div>
        </button>
        <button onClick={e => { e.stopPropagation(); onDeleteConversation(conv.id); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all hover:bg-white/[0.08]"
          style={{ color: 'rgba(255,255,255,0.25)' }}>
          <Trash2 size={11} strokeWidth={1.75} />
        </button>
      </div>
    );
  };

  const Section = ({ label, items }: { label: string; items: Conversation[] }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <div className="px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: 'rgba(255,255,255,0.16)' }}>{label}</span>
        </div>
        <div className="space-y-0.5">{items.map(c => <ConvItem key={c.id} conv={c} />)}</div>
      </div>
    );
  };

  return (
    <aside className="hidden md:flex flex-col h-full flex-shrink-0 overflow-hidden transition-all duration-300"
      style={{ width: isOpen ? '240px' : '0px', borderRight: isOpen ? '1px solid rgba(255,255,255,0.05)' : 'none', background: 'rgba(255,255,255,0.012)' }}>
      <div className="flex flex-col h-full w-[240px]">

        <div className="px-3 pt-4 pb-3">
          <button onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:bg-white/[0.05] border"
            style={{ color: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <Plus size={14} strokeWidth={1.75} /> New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {!user ? (
            <div className="mx-1 mt-2 px-4 py-5 rounded-xl text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Sparkles size={18} strokeWidth={1.5} className="mx-auto mb-3" style={{ color: currentMode.accent }} />
              <p className="text-[12px] font-medium text-white mb-1">Save your chats</p>
              <p className="text-[11px] mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Sign in to save your conversation history across all devices.
              </p>
              <button onClick={onSignIn}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-white transition-all"
                style={{ background: currentMode.gradient }}>
                <LogIn size={13} strokeWidth={1.75} /> Sign in with Google
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <MessageSquare size={20} strokeWidth={1.25} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>No chats yet. Start a conversation!</p>
            </div>
          ) : (
            <>
              <Section label="Today"     items={today} />
              <Section label="Yesterday" items={yesterday} />
              <Section label="Older"     items={older} />
            </>
          )}
        </div>

        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <button onClick={onAutoRouteToggle} className="w-full flex items-center justify-between gap-3">
            <div className="text-left">
              <div className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Auto-Route</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.16)' }}>AI picks best mode</div>
            </div>
            <span className="flex-shrink-0 transition-colors" style={{ color: autoRoute ? currentMode.accent : 'rgba(255,255,255,0.2)' }}>
              {autoRoute ? <ToggleRight size={22} strokeWidth={1.75} /> : <ToggleLeft size={22} strokeWidth={1.75} />}
            </span>
          </button>
        </div>

      </div>
    </aside>
  );
}

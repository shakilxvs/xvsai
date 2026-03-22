'use client';
import { useEffect } from 'react';
import {
  X, Plus, MessageSquare, Brain, Zap, Search, Code2, Image, Flame, Shield,
  Clock, Trash2, LogIn, Sparkles, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Mode, ModeConfig } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';
import { Conversation } from '@/app/hooks/useConversations';
import { User } from 'firebase/auth';
import React from 'react';

const ICONS: Record<Mode, React.ReactNode> = {
  chat:     <MessageSquare size={16} strokeWidth={1.75} />,
  deep:     <Brain size={16} strokeWidth={1.75} />,
  fast:     <Zap size={16} strokeWidth={1.75} />,
  research: <Search size={16} strokeWidth={1.75} />,
  code:     <Code2 size={16} strokeWidth={1.75} />,
  image:    <Image size={16} strokeWidth={1.75} />,
  open:     <Flame size={16} strokeWidth={1.75} />,
  security: <Shield size={18} strokeWidth={1.75} />,
};

function timeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

// ── Mode Picker Sheet ─────────────────────────────────────
export function ModePickerSheet({ currentMode, onModeChange, onClose }: {
  currentMode: ModeConfig;
  onModeChange: (m: Mode) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div
        className="absolute bottom-0 left-0 right-0 sheet-open rounded-t-3xl"
        style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div className="px-5 pb-2 pt-1 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-white">Choose Mode</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06]"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pb-6 grid grid-cols-2 gap-2.5" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          {MODES.map(m => {
            const active = currentMode.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { onModeChange(m.id); onClose(); }}
                className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-[0.97]"
                style={active
                  ? { background: `${m.accent}18`, border: `1.5px solid ${m.accent}40` }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                }
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: active ? `${m.accent}25` : 'rgba(255,255,255,0.06)', color: m.accent }}>
                  {ICONS[m.id]}
                </div>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: active ? m.accent : '#e8e8f0' }}>{m.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{m.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── History Sheet ─────────────────────────────────────────
interface HistoryProps {
  currentMode: ModeConfig;
  conversations: Conversation[];
  activeConvId: string | null;
  user: User | null;
  autoRoute: boolean;
  onAutoRouteToggle: () => void;
  onSelectConversation: (conv: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  onNewChat: () => void;
  onSignIn: () => void;
  onClose: () => void;
}

export function HistorySheet({
  currentMode, conversations, activeConvId, user, autoRoute,
  onAutoRouteToggle, onSelectConversation, onDeleteConversation,
  onNewChat, onSignIn, onClose,
}: HistoryProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
      <div className="relative group/item flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
        style={{ background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent' }}
        onClick={() => { onSelectConversation(conv); onClose(); }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${m.accent}18`, color: m.accent }}>
          {ICONS[conv.mode]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium truncate" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)' }}>
            {conv.title}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {timeAgo(conv.updatedAt)}
          </p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDeleteConversation(conv.id); }}
          className="p-2 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          <Trash2 size={13} />
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div
        className="absolute top-0 bottom-0 left-0 w-[85vw] max-w-[320px] sheet-open flex flex-col"
        style={{ background: '#0d0d14', borderRight: '1px solid rgba(255,255,255,0.07)', animation: 'slideInLeft 0.28s cubic-bezier(0.32,0.72,0,1) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ paddingTop: 'max(20px, env(safe-area-inset-top))', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold text-white"
              style={{ background: currentMode.gradient }}>X</div>
            <span className="text-[16px] font-semibold text-white">XVSai</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <X size={18} />
          </button>
        </div>

        {/* New chat button */}
        <div className="px-4 pt-3 pb-2">
          <button onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all active:scale-[0.97]"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Plus size={16} strokeWidth={1.75} /> New conversation
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-3">
          {!user ? (
            <div className="mx-1 mt-4 px-4 py-5 rounded-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Sparkles size={20} strokeWidth={1.5} className="mx-auto mb-3" style={{ color: currentMode.accent }} />
              <p className="text-[14px] font-medium text-white mb-1">Save your chats</p>
              <p className="text-[12px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Sign in to save history across devices.</p>
              <button onClick={onSignIn}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium text-white"
                style={{ background: currentMode.gradient }}>
                <LogIn size={14} /> Sign in with Google
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageSquare size={24} strokeWidth={1.25} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No chats yet.</p>
            </div>
          ) : (
            <div className="space-y-0.5 py-2">
              {today.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Today</p>
                  {today.map(c => <ConvItem key={c.id} conv={c} />)}
                </div>
              )}
              {yesterday.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Yesterday</p>
                  {yesterday.map(c => <ConvItem key={c.id} conv={c} />)}
                </div>
              )}
              {older.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Older</p>
                  {older.map(c => <ConvItem key={c.id} conv={c} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Auto-route + bottom */}
        <div className="px-5 py-4 mobile-nav-pad" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onAutoRouteToggle} className="w-full flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Auto-Route</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>AI picks best mode</p>
            </div>
            <span style={{ color: autoRoute ? currentMode.accent : 'rgba(255,255,255,0.2)' }}>
              {autoRoute ? <ToggleRight size={26} strokeWidth={1.75} /> : <ToggleLeft size={26} strokeWidth={1.75} />}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

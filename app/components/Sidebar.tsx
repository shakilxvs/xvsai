'use client';
import {
  Plus, MessageSquare, Brain, Zap, Search, Code2, Image,
  ToggleLeft, ToggleRight, Clock, ChevronRight, Sparkles,
} from 'lucide-react';
import { Mode, ModeConfig } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';
import React, { useState } from 'react';

const ICONS: Record<Mode, React.ReactNode> = {
  chat:     <MessageSquare size={13} strokeWidth={1.75} />,
  deep:     <Brain size={13} strokeWidth={1.75} />,
  fast:     <Zap size={13} strokeWidth={1.75} />,
  research: <Search size={13} strokeWidth={1.75} />,
  code:     <Code2 size={13} strokeWidth={1.75} />,
  image:    <Image size={13} strokeWidth={1.75} />,
};

const MOCK_CHATS = [
  { id: '1', title: 'Explain neural networks',  mode: 'deep'     as Mode, time: 'Just now' },
  { id: '2', title: 'Python web scraper',        mode: 'code'     as Mode, time: '2m ago'   },
  { id: '3', title: 'AI research this week',     mode: 'research' as Mode, time: '1h ago'   },
  { id: '4', title: 'Mountain lake image',       mode: 'image'    as Mode, time: '3h ago'   },
  { id: '5', title: 'Quick React question',      mode: 'fast'     as Mode, time: 'Yesterday'},
  { id: '6', title: 'Explain black holes',       mode: 'chat'     as Mode, time: 'Yesterday'},
];

export default function Sidebar({ isOpen, currentMode, onModeChange, autoRoute, onAutoRouteToggle, onNewChat }: {
  isOpen: boolean; currentMode: ModeConfig; onModeChange: (m: Mode) => void;
  autoRoute: boolean; onAutoRouteToggle: () => void; onNewChat: () => void;
}) {
  const [activeChat, setActiveChat] = useState<string | null>(null);

  return (
    <aside
      className="hidden md:flex flex-col h-full flex-shrink-0 overflow-hidden transition-all duration-300"
      style={{
        width: isOpen ? '240px' : '0px',
        borderRight: isOpen ? '1px solid rgba(255,255,255,0.05)' : 'none',
        background: 'rgba(255,255,255,0.012)',
      }}
    >
      <div className="flex flex-col h-full w-[240px]">

        {/* New chat */}
        <div className="px-3 pt-4 pb-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:bg-white/[0.05] border"
            style={{ color: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <Plus size={14} strokeWidth={1.75} />
            New chat
          </button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto px-2">

          {/* Today */}
          <div className="px-3 pt-1 pb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.16)' }}>
              Today
            </span>
          </div>

          <div className="space-y-0.5">
            {MOCK_CHATS.slice(0, 4).map(chat => {
              const m = MODES.find(mo => mo.id === chat.mode)!;
              const isActive = activeChat === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group"
                  style={isActive
                    ? { background: 'rgba(255,255,255,0.07)' }
                    : {}
                  }
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span className="mt-[3px] flex-shrink-0" style={{ color: m.accent }}>
                    {ICONS[chat.mode]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] leading-snug truncate font-medium" style={{ color: isActive ? '#e8e8f0' : 'rgba(255,255,255,0.45)' }}>
                      {chat.title}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={9} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.18)' }} />
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                        {chat.time}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={11} strokeWidth={1.75}
                    className="mt-1 flex-shrink-0 opacity-0 group-hover:opacity-30 transition-opacity"
                    style={{ color: 'rgba(255,255,255,0.6)' }} />
                </button>
              );
            })}
          </div>

          {/* Yesterday */}
          <div className="px-3 pt-4 pb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.16)' }}>
              Yesterday
            </span>
          </div>

          <div className="space-y-0.5">
            {MOCK_CHATS.slice(4).map(chat => {
              const m = MODES.find(mo => mo.id === chat.mode)!;
              const isActive = activeChat === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group"
                  style={isActive ? { background: 'rgba(255,255,255,0.07)' } : {}}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span className="mt-[3px] flex-shrink-0" style={{ color: m.accent }}>
                    {ICONS[chat.mode]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] leading-snug truncate font-medium" style={{ color: isActive ? '#e8e8f0' : 'rgba(255,255,255,0.45)' }}>
                      {chat.title}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={9} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.18)' }} />
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                        {chat.time}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={11} strokeWidth={1.75}
                    className="mt-1 flex-shrink-0 opacity-0 group-hover:opacity-30 transition-opacity"
                    style={{ color: 'rgba(255,255,255,0.6)' }} />
                </button>
              );
            })}
          </div>

          {/* Sign-in nudge */}
          <div className="mx-1 mt-4 mb-2 px-3 py-3 rounded-xl flex items-start gap-2.5"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Sparkles size={13} strokeWidth={1.75} className="mt-0.5 flex-shrink-0" style={{ color: currentMode.accent }} />
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Sign in to save your chat history. Coming in Phase 4.
            </p>
          </div>

        </div>

        {/* Auto-route — bottom */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <button onClick={onAutoRouteToggle} className="w-full flex items-center justify-between gap-3">
            <div className="text-left">
              <div className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Auto-Route</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.16)' }}>AI picks best mode</div>
            </div>
            <span className="flex-shrink-0 transition-colors" style={{ color: autoRoute ? currentMode.accent : 'rgba(255,255,255,0.2)' }}>
              {autoRoute
                ? <ToggleRight size={22} strokeWidth={1.75} />
                : <ToggleLeft size={22} strokeWidth={1.75} />
              }
            </span>
          </button>
        </div>

      </div>
    </aside>
  );
}

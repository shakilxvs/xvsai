'use client';
import {
  Plus, MessageSquare, Brain, Zap, Search, Code2, Image, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Mode, ModeConfig } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';
import React from 'react';

const ICONS: Record<Mode, React.ReactNode> = {
  chat:     <MessageSquare size={14} strokeWidth={1.75} />,
  deep:     <Brain size={14} strokeWidth={1.75} />,
  fast:     <Zap size={14} strokeWidth={1.75} />,
  research: <Search size={14} strokeWidth={1.75} />,
  code:     <Code2 size={14} strokeWidth={1.75} />,
  image:    <Image size={14} strokeWidth={1.75} />,
};

export default function Sidebar({ isOpen, currentMode, onModeChange, autoRoute, onAutoRouteToggle, onNewChat }: {
  isOpen: boolean; currentMode: ModeConfig; onModeChange: (m: Mode) => void;
  autoRoute: boolean; onAutoRouteToggle: () => void; onNewChat: () => void;
}) {
  return (
    <aside
      className="hidden md:flex flex-col h-full flex-shrink-0 overflow-hidden transition-all duration-300"
      style={{
        width: isOpen ? '224px' : '0px',
        borderRight: isOpen ? '1px solid rgba(255,255,255,0.05)' : 'none',
        background: 'rgba(255,255,255,0.012)',
      }}
    >
      <div className="flex flex-col h-full w-[224px] py-3">

        {/* New chat */}
        <div className="px-3 mb-5">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all hover:bg-white/[0.05]"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <Plus size={14} strokeWidth={1.75} />
            New chat
          </button>
        </div>

        {/* Section label */}
        <div className="px-5 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.16)' }}>
            Modes
          </span>
        </div>

        {/* Mode list */}
        <div className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {MODES.map(m => {
            const active = currentMode.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group"
                style={active
                  ? { background: `${m.accent}10`, color: m.accent }
                  : { color: 'rgba(255,255,255,0.26)' }
                }
              >
                <span className={`transition-colors ${!active ? 'group-hover:text-white/50' : ''}`}>
                  {ICONS[m.id]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium leading-none mb-0.5">{m.label}</div>
                  <div className="text-[10px] opacity-50 truncate">{m.description}</div>
                </div>
                {active && (
                  <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background: m.accent }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-4 my-3 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Auto-route toggle */}
        <div className="px-4 pb-4">
          <button onClick={onAutoRouteToggle} className="w-full flex items-center justify-between gap-3">
            <div className="text-left">
              <div className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Auto-Route</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.16)' }}>AI picks best mode</div>
            </div>
            <span className="transition-colors flex-shrink-0" style={{ color: autoRoute ? currentMode.accent : 'rgba(255,255,255,0.2)' }}>
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

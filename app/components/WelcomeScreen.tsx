'use client';
import { MessageSquare, Brain, Zap, Search, Code2, Image, ArrowRight } from 'lucide-react';
import { Mode, ModeConfig } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';
import React from 'react';

const ICONS: Record<Mode, React.ReactNode> = {
  chat:     <MessageSquare size={12} strokeWidth={1.75} />,
  deep:     <Brain size={12} strokeWidth={1.75} />,
  fast:     <Zap size={12} strokeWidth={1.75} />,
  research: <Search size={12} strokeWidth={1.75} />,
  code:     <Code2 size={12} strokeWidth={1.75} />,
  image:    <Image size={12} strokeWidth={1.75} />,
};

const PROMPTS: { text: string; mode: Mode }[] = [
  { text: 'Explain transformer architecture step by step', mode: 'deep' },
  { text: 'Write a Python web scraper for news headlines',  mode: 'code' },
  { text: "What's new in AI research this week?",           mode: 'research' },
  { text: 'A misty mountain lake at golden hour',           mode: 'image' },
];

export default function WelcomeScreen({ currentMode, onSuggestion, onModeChange }: {
  currentMode: ModeConfig;
  onSuggestion: (text: string) => void;
  onModeChange: (m: Mode) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-start md:justify-center h-full px-4 py-6 overflow-y-auto">

      {/* Hero */}
      <div className="text-center mb-7 anim-up w-full">
        <div className="relative w-12 h-12 md:w-14 md:h-14 mx-auto mb-5">
          <div className="absolute inset-0 rounded-2xl blur-2xl opacity-50 transition-all duration-700"
            style={{ background: currentMode.gradient }} />
          <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white transition-all duration-700"
            style={{ background: currentMode.gradient, border: '1px solid rgba(255,255,255,0.18)' }}>
            X
          </div>
        </div>
        <h1 className="text-[24px] md:text-[30px] font-semibold tracking-tight text-white mb-2">
          What can I help with?
        </h1>
        <p className="text-[13px] max-w-[280px] mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Select a mode and start your conversation.
        </p>
      </div>

      {/* Mode pills — all in one line, no wrap */}
      <div className="mb-6 anim-up-1 flex items-center justify-center gap-1.5 flex-nowrap overflow-x-auto w-full max-w-[600px] pb-1"
        style={{ scrollbarWidth: 'none' }}>
        {MODES.map(m => {
          const active = currentMode.id === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all duration-150 flex-shrink-0"
              style={active
                ? { background: `${m.accent}20`, color: m.accent, border: `1px solid ${m.accent}35` }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {ICONS[m.id]}
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-[500px] anim-up-2">
        {PROMPTS.map((p, i) => {
          const m = MODES.find(mo => mo.id === p.mode)!;
          return (
            <button
              key={i}
              onClick={() => { onModeChange(p.mode); onSuggestion(p.text); }}
              className="group flex items-start justify-between gap-3 p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${m.accent}30`;
                (e.currentTarget as HTMLElement).style.background = `${m.accent}08`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span style={{ color: m.accent }}>{ICONS[p.mode]}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: m.accent }}>
                    {m.label}
                  </span>
                </div>
                <p className="text-[13px] leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {p.text}
                </p>
              </div>
              <ArrowRight size={12} strokeWidth={2}
                className="mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                style={{ color: m.accent }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

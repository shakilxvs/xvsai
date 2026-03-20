'use client';
import { MessageSquare, Brain, Zap, Search, Code2, Image, ArrowRight } from 'lucide-react';
import { Mode, ModeConfig } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';
import React from 'react';

const ICONS: Record<Mode, React.ReactNode> = {
  chat:     <MessageSquare size={13} strokeWidth={1.75} />,
  deep:     <Brain size={13} strokeWidth={1.75} />,
  fast:     <Zap size={13} strokeWidth={1.75} />,
  research: <Search size={13} strokeWidth={1.75} />,
  code:     <Code2 size={13} strokeWidth={1.75} />,
  image:    <Image size={13} strokeWidth={1.75} />,
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
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 overflow-y-auto">

      {/* Hero */}
      <div className="text-center mb-10 anim-up">
        <div className="relative w-14 h-14 mx-auto mb-6">
          <div
            className="absolute inset-0 rounded-2xl blur-2xl opacity-50 transition-all duration-700"
            style={{ background: currentMode.gradient }}
          />
          <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white transition-all duration-700"
            style={{ background: currentMode.gradient, border: '1px solid rgba(255,255,255,0.18)' }}
          >
            X
          </div>
        </div>
        <h1 className="text-[30px] font-semibold tracking-tight text-white mb-2.5">
          What can I help with?
        </h1>
        <p className="text-[13px] max-w-[300px] mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.26)' }}>
          Select a mode below and start your conversation. Powered by multiple free AI models.
        </p>
      </div>

      {/* Mode pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-9 anim-up-1">
        {MODES.map(m => {
          const active = currentMode.id === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150"
              style={active
                ? { background: `${m.accent}18`, color: m.accent, border: `1px solid ${m.accent}32` }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.26)', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >
              {ICONS[m.id]}
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[500px] anim-up-2">
        {PROMPTS.map((p, i) => {
          const m = MODES.find(mo => mo.id === p.mode)!;
          return (
            <button
              key={i}
              onClick={() => { onModeChange(p.mode); onSuggestion(p.text); }}
              className="group flex items-start justify-between gap-3 p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.015]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${m.accent}28`; (e.currentTarget as HTMLElement).style.background = `${m.accent}07`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span style={{ color: m.accent }}>{ICONS[p.mode]}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: m.accent }}>
                    {m.label}
                  </span>
                </div>
                <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.36)' }}>
                  {p.text}
                </p>
              </div>
              <span
                className="mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                style={{ color: m.accent }}
              >
                <ArrowRight size={12} strokeWidth={2} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

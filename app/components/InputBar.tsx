'use client';
import { useState, useRef, KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import { ModeConfig } from '@/app/lib/types';

export default function InputBar({ currentMode, isLoading, onSend }: {
  currentMode: ModeConfig;
  isLoading: boolean;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const t = value.trim();
    if (!t || isLoading) return;
    onSend(t);
    setValue('');
    if (ref.current) ref.current.style.height = 'auto';
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const onInput = () => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = Math.min(ref.current.scrollHeight, 150) + 'px';
  };

  const active = Boolean(value.trim()) && !isLoading;

  return (
    <div className="flex-shrink-0 px-3 md:px-4 pb-4 md:pb-5 pt-2">
      <div className="max-w-[700px] mx-auto">
        <div
          className="flex items-center gap-2 px-4 rounded-2xl transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${active ? currentMode.accent + '45' : 'rgba(255,255,255,0.09)'}`,
            boxShadow: active ? `0 0 0 3px ${currentMode.accent}0a` : 'none',
            minHeight: '52px',
          }}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={e => { setValue(e.target.value); onInput(); }}
            onKeyDown={onKey}
            placeholder="Message XVSai…"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent resize-none outline-none max-h-[150px] disabled:opacity-40 py-3.5"
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#e8e8f0',
              caretColor: currentMode.accent,
            }}
          />
          <button
            onClick={send}
            disabled={!active}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150 disabled:opacity-20 flex-shrink-0 text-white"
            style={{ background: active ? currentMode.gradient : 'rgba(255,255,255,0.08)' }}
          >
            <ArrowUp size={15} strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center justify-center mt-2 gap-2">
          <div className="w-1 h-1 rounded-full" style={{ background: currentMode.accent, opacity: 0.45 }} />
          <span className="text-[10px] md:text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {currentMode.label} · Enter to send · Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}

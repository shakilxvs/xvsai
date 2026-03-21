'use client';
import { useState, useCallback, useEffect } from 'react';
import { Mode } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';

export function useMode() {
  const [mode, setMode] = useState<Mode>('chat');
  // Default auto-route to TRUE, persist in localStorage
  const [autoRoute, setAutoRouteState] = useState(true);

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('xvsai-autoroute');
    if (saved !== null) {
      setAutoRouteState(saved === 'true');
    }
  }, []);

  // Save preference whenever it changes
  const setAutoRoute = (val: boolean | ((prev: boolean) => boolean)) => {
    setAutoRouteState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      localStorage.setItem('xvsai-autoroute', String(next));
      return next;
    });
  };

  const currentMode = MODES.find(m => m.id === mode)!;

  const detectModeByKeyword = (text: string): Mode => {
    const lower = text.toLowerCase().trim();
    if (/image|draw|generate|picture|photo|illustration|artwork|painting|render|visualize/i.test(lower)) return 'image';
    if (/\bcode\b|function|bug|debug|script|programming|algorithm/i.test(lower)) return 'code';
    if (/research|latest|news|what happened|today|current|recent|who is|statistics/i.test(lower)) return 'research';
    if (/explain.*detail|analyze|think through|step by step|why does|how does|compare|reasoning/i.test(lower)) return 'deep';
    if (lower.split(/\s+/).length < 6) return 'fast';
    return 'chat';
  };

  const detectModeAI = useCallback(async (text: string): Promise<Mode> => {
    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error('routing failed');
      const data = await res.json();
      const detected = data.mode as Mode;
      if (MODES.find(m => m.id === detected)) return detected;
      return detectModeByKeyword(text);
    } catch {
      return detectModeByKeyword(text);
    }
  }, []);

  return { mode, setMode, autoRoute, setAutoRoute, currentMode, detectModeAI, detectModeByKeyword };
}

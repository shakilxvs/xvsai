'use client';
import { useState } from 'react';
import { Mode } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';

export function useMode() {
  const [mode, setMode] = useState<Mode>('chat');
  const [autoRoute, setAutoRoute] = useState(false);
  const currentMode = MODES.find(m => m.id === mode)!;

  const detectMode = (text: string): Mode => {
    if (/image of|draw|generate.*(image|picture|art)/i.test(text)) return 'image';
    if (/\bcode\b|function|bug|debug|fix this|script/i.test(text)) return 'code';
    if (/research|latest|news|what happened|today|current/i.test(text)) return 'research';
    if (/explain.*detail|analyze|think through|step by step/i.test(text)) return 'deep';
    if (text.trim().split(/\s+/).length < 12) return 'fast';
    return 'chat';
  };

  return { mode, setMode, autoRoute, setAutoRoute, currentMode, detectMode };
}

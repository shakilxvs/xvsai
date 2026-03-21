'use client';
import { useState } from 'react';
import { Mode } from '@/app/lib/types';
import { MODES } from '@/app/lib/models';

export function useMode() {
  const [mode, setMode] = useState<Mode>('chat');
  const [autoRoute, setAutoRoute] = useState(false);
  const currentMode = MODES.find(m => m.id === mode)!;

  const detectMode = (text: string): Mode => {
    const lower = text.toLowerCase().trim();

    // Image — check first, single words like "banana", "sunset" etc count
    if (/image of|draw|generate|picture|create.*image|make.*image|show.*image|photo of|illustration|artwork|painting|render|visualize/i.test(lower)) return 'image';
    // Also catch single-word image prompts when already in image mode
    if (mode === 'image') return 'image';

    // Code
    if (/\bcode\b|function|bug|debug|fix this|script|programming|syntax|error in|compile|algorithm/i.test(lower)) return 'code';

    // Research
    if (/research|latest|news|what happened|today|current|recent|who is|when did|where is|how many|statistics|facts about/i.test(lower)) return 'research';

    // Deep Think
    if (/explain.*detail|analyze|think through|step by step|why does|how does|difference between|compare|pros and cons|reasoning/i.test(lower)) return 'deep';

    // Fast — only for very short messages with no special keywords
    if (lower.split(/\s+/).length < 6) return 'fast';

    return 'chat';
  };

  return { mode, setMode, autoRoute, setAutoRoute, currentMode, detectMode };
}

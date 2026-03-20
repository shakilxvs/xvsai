'use client';
import { useState, useCallback } from 'react';
import { Message, Mode } from '@/app/lib/types';

const MOCK: Record<Mode, string> = {
  chat: "Hello! I'm **XVSai** — your premium AI assistant.\n\nPhase 2 will connect to real models:\n- **Llama 3.3 70B** via Groq — fastest\n- **Gemini 1.5 Flash** via Google\n- **DeepSeek R1** for deep reasoning\n\nExplore the interface and switch modes in the sidebar.",
  deep: "**Deep Think** mode — built for complex reasoning.\n\nPrimary model: **DeepSeek R1**\n\nBest for:\n- Step-by-step analysis\n- Math and logic problems\n- Detailed explanations\n\nFallback: **Gemini 1.5 Pro**",
  fast: "**Fast mode** — powered by Llama 3.3 70B via Groq.\n\nExpect responses in under 0.5 seconds. Perfect for quick questions.",
  research: "**Research mode** will search the web before answering.\n\nWhen connected:\n1. Searches via **Tavily API**\n2. Finds current sources\n3. Shows clickable references below the answer",
  code: "Here's a quick example:\n\n```typescript\nfunction greet(name: string): string {\n  return `Hello, ${name}! Welcome to XVSai.`;\n}\n\nconsole.log(greet('World'));\n```\n\nCode mode uses **Mixtral 8x7B** via Groq.",
  image: "**Image mode** — generate art from a text description.\n\nWhen connected:\n- Type any description\n- **Pollinations.ai** generates it for free\n- Image appears inline with a download button",
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRoutedTo, setAutoRoutedTo] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    content: string, mode: Mode, autoRoute: boolean, detectMode: (t: string) => Mode
  ) => {
    let active = mode;
    let notice: string | null = null;
    if (autoRoute) {
      const d = detectMode(content);
      if (d !== mode) {
        active = d;
        const lbl = d === 'deep' ? 'Deep Think' : d.charAt(0).toUpperCase() + d.slice(1);
        notice = `Auto-routed to ${lbl}`;
      }
    }
    setAutoRoutedTo(notice);
    setMessages(p => [...p, { id: `u-${Date.now()}`, role: 'user', content, mode: active, timestamp: new Date() }]);
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setMessages(p => [...p, {
      id: `a-${Date.now()}`, role: 'assistant', content: MOCK[active],
      mode: active, model: 'XVSai Preview', provider: 'Phase 1', timestamp: new Date(),
    }]);
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => { setMessages([]); setAutoRoutedTo(null); }, []);
  return { messages, isLoading, autoRoutedTo, sendMessage, clearMessages };
}

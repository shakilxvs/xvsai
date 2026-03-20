'use client';
import { useState, useCallback, useRef } from 'react';
import { Message, Mode } from '@/app/lib/types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRoutedTo, setAutoRoutedTo] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    mode: Mode,
    autoRoute: boolean,
    detectMode: (t: string) => Mode
  ) => {
    let activeMode = mode;
    let notice: string | null = null;
    if (autoRoute) {
      const detected = detectMode(content);
      if (detected !== mode) {
        activeMode = detected;
        const label = detected === 'deep' ? 'Deep Think' : detected.charAt(0).toUpperCase() + detected.slice(1);
        notice = `Auto-routed to ${label}`;
      }
    }
    setAutoRoutedTo(notice);

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      mode: activeMode,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const apiMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    const aiId = `a-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: aiId, role: 'assistant', content: '',
      mode: activeMode, model: '...', provider: '...', timestamp: new Date(),
    }]);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, mode: activeMode }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessages(prev => prev.map(m =>
          m.id === aiId ? { ...m, content: data.error ?? 'Something went wrong. Please try again.', model: 'Error', provider: '' } : m
        ));
        setIsLoading(false);
        return;
      }

      const model = res.headers.get('X-Model') ?? 'AI';
      const provider = res.headers.get('X-Provider') ?? '';
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, model, provider } : m));

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const raw = trimmed.slice(5).trim();
          if (raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            const delta = parsed.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              fullContent += delta;
              setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullContent } : m));
            }
          } catch { /* skip malformed */ }
        }
      }

      if (!fullContent.trim()) {
        setMessages(prev => prev.map(m =>
          m.id === aiId ? { ...m, content: 'No response received. Please try again.', model: 'Error', provider: '' } : m
        ));
      }

    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === aiId ? { ...m, content: 'Connection error. Please try again.', model: 'Error', provider: '' } : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setAutoRoutedTo(null);
  }, []);

  return { messages, isLoading, autoRoutedTo, sendMessage, clearMessages };
}

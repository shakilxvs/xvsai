'use client';
import { useState, useCallback, useRef } from 'react';
import { Message, Mode, Source } from '@/app/lib/types';

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

    const aiId = `a-${Date.now()}`;

    // ── IMAGE MODE ────────────────────────────────────────
    if (activeMode === 'image') {
      setMessages(prev => [...prev, {
        id: aiId, role: 'assistant', content: '',
        mode: activeMode, model: 'Pollinations.ai', provider: 'Free',
        imageLoading: true, timestamp: new Date(),
      }]);
      try {
        const res = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: content }),
        });
        const data = await res.json();
        if (data.error) {
          setMessages(prev => prev.map(m =>
            m.id === aiId ? { ...m, content: data.error, imageLoading: false } : m
          ));
        } else {
          setMessages(prev => prev.map(m =>
            m.id === aiId ? {
              ...m,
              content: `Here's your image: **"${content}"**`,
              imageUrl: data.imageUrl,
              imageLoading: false,
              model: data.provider,
              provider: 'Phase 3',
            } : m
          ));
        }
      } catch {
        setMessages(prev => prev.map(m =>
          m.id === aiId ? { ...m, content: 'Image generation failed. Please try again.', imageLoading: false } : m
        ));
      }
      setIsLoading(false);
      return;
    }

    // ── RESEARCH MODE ─────────────────────────────────────
    if (activeMode === 'research') {
      setMessages(prev => [...prev, {
        id: aiId, role: 'assistant', content: '',
        mode: activeMode, model: '...', provider: 'Searching...',
        timestamp: new Date(),
      }]);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: content, messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })) }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setMessages(prev => prev.map(m =>
            m.id === aiId ? { ...m, content: data.error ?? 'Research failed.', model: 'Error', provider: '' } : m
          ));
          setIsLoading(false);
          return;
        }
        const model = res.headers.get('X-Model') ?? 'AI';
        const provider = res.headers.get('X-Provider') ?? 'Research';
        let sources: Source[] = [];
        try { sources = JSON.parse(decodeURIComponent(res.headers.get('X-Sources') ?? '[]')); } catch {}
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, model, provider, sources } : m));
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
              if (delta) { fullContent += delta; setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullContent } : m)); }
            } catch {}
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'Research failed.', model: 'Error', provider: '' } : m));
      }
      setIsLoading(false);
      return;
    }

    // ── CHAT / FAST / DEEP / CODE ─────────────────────────
    const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, {
      id: aiId, role: 'assistant', content: '',
      mode: activeMode, model: '...', provider: '...', timestamp: new Date(),
    }]);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, mode: activeMode }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: data.error ?? 'Something went wrong.', model: 'Error', provider: '' } : m));
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
            if (delta) { fullContent += delta; setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullContent } : m)); }
          } catch {}
        }
      }
      if (!fullContent.trim()) {
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'No response received.', model: 'Error', provider: '' } : m));
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'Connection error. Please try again.', model: 'Error', provider: '' } : m));
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setAutoRoutedTo(null);
  }, []);

  return { messages, isLoading, autoRoutedTo, sendMessage, clearMessages, setMessages };
}

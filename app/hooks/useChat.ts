'use client';
import { useState, useCallback, useRef } from 'react';
import { Message, Mode, Source } from '@/app/lib/types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRoutedTo, setAutoRoutedTo] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([]);

  const updateMessages = (updater: (prev: Message[]) => Message[]) => {
    setMessages(prev => {
      const next = updater(prev);
      messagesRef.current = next;
      return next;
    });
  };

  const sendMessage = useCallback(async (
    content: string,
    mode: Mode,
    autoRoute: boolean,
    detectMode: (t: string) => Promise<Mode>
  ) => {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      mode,
      timestamp: new Date(),
    };
    const currentMessages = messagesRef.current;
    updateMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setAutoRoutedTo(null);

    const apiMessages = [...currentMessages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Auto-route detection (after showing message)
    let activeMode = mode;
    if (autoRoute) {
      const detected = await detectMode(content);
      if (detected !== mode) {
        activeMode = detected;
        const label = detected === 'deep' ? 'Deep Think' : detected.charAt(0).toUpperCase() + detected.slice(1);
        setAutoRoutedTo(`Auto-routed to ${label}`);
      }
    }

    const aiId = `a-${Date.now()}`;

    // ── IMAGE MODE ────────────────────────────────────────
    if (activeMode === 'image') {
      updateMessages(prev => [...prev, {
        id: aiId, role: 'assistant', content: '',
        mode: activeMode, model: '...', provider: '...',
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
          updateMessages(prev => prev.map(m =>
            m.id === aiId ? { ...m, content: data.error, imageLoading: false, model: 'Error', provider: '' } : m
          ));
        } else if (data.type === 'gallery') {
          // Multiple real photos — Pinterest grid
          updateMessages(prev => prev.map(m =>
            m.id === aiId ? {
              ...m,
              content: data.prompt,
              images: data.images,
              imageLoading: false,
              model: 'Photo Search',
              provider: 'Pexels + Unsplash',
            } : m
          ));
        } else {
          // Single AI generated image
          updateMessages(prev => prev.map(m =>
            m.id === aiId ? {
              ...m,
              content: data.prompt,
              imageUrl: data.imageUrl,
              imageLoading: false,
              model: data.provider,
              provider: 'AI Generated',
            } : m
          ));
        }
      } catch {
        updateMessages(prev => prev.map(m =>
          m.id === aiId ? { ...m, content: 'Image search failed. Please try again.', imageLoading: false, model: 'Error', provider: '' } : m
        ));
      }
      setIsLoading(false);
      return;
    }

    // ── RESEARCH MODE ─────────────────────────────────────
    if (activeMode === 'research') {
      updateMessages(prev => [...prev, {
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
          body: JSON.stringify({ query: content, messages: apiMessages }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          updateMessages(prev => prev.map(m =>
            m.id === aiId ? { ...m, content: data.error ?? 'Research failed.', model: 'Error', provider: '' } : m
          ));
          setIsLoading(false);
          return;
        }
        const model = res.headers.get('X-Model') ?? 'AI';
        const provider = res.headers.get('X-Provider') ?? 'Research';
        let sources: Source[] = [];
        try { sources = JSON.parse(decodeURIComponent(res.headers.get('X-Sources') ?? '[]')); } catch {}
        updateMessages(prev => prev.map(m => m.id === aiId ? { ...m, model, provider, sources } : m));
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
                updateMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullContent } : m));
              }
            } catch {}
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        updateMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'Research failed.', model: 'Error', provider: '' } : m));
      }
      setIsLoading(false);
      return;
    }

    // ── CHAT / FAST / DEEP / CODE / OPEN ──────────────────
    updateMessages(prev => [...prev, {
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
        updateMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: data.error ?? 'Something went wrong.', model: 'Error', provider: '' } : m));
        setIsLoading(false);
        return;
      }
      const model = res.headers.get('X-Model') ?? 'AI';
      const provider = res.headers.get('X-Provider') ?? '';
      updateMessages(prev => prev.map(m => m.id === aiId ? { ...m, model, provider } : m));
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
              updateMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullContent } : m));
            }
          } catch {}
        }
      }
      if (!fullContent.trim()) {
        updateMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'No response received.', model: 'Error', provider: '' } : m));
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      updateMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'Connection error. Please try again.', model: 'Error', provider: '' } : m));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    messagesRef.current = [];
    setMessages([]);
    setAutoRoutedTo(null);
  }, []);

  const setMessagesExternal = useCallback((msgs: Message[]) => {
    messagesRef.current = msgs;
    setMessages(msgs);
  }, []);

  return { messages, isLoading, autoRoutedTo, sendMessage, clearMessages, setMessages: setMessagesExternal };
}

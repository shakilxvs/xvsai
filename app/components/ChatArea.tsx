'use client';
import { useEffect, useRef } from 'react';
import { Message, ModeConfig, Mode } from '@/app/lib/types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';

interface Props {
  messages: Message[];
  isLoading: boolean;
  currentMode: ModeConfig;
  autoRoutedTo: string | null;
  onSuggestion: (text: string) => void;
  onModeChange: (m: Mode) => void;
}

export default function ChatArea({ messages, isLoading, currentMode, autoRoutedTo, onSuggestion, onModeChange }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <WelcomeScreen
        currentMode={currentMode}
        onSuggestion={onSuggestion}
        onModeChange={onModeChange}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[700px] mx-auto px-4 py-6 space-y-4">
        {autoRoutedTo && (
          <div className="flex justify-center anim-in">
            <span
              className="px-3 py-1 rounded-full text-[11px]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.28)',
              }}
            >
              {autoRoutedTo}
            </span>
          </div>
        )}
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        {isLoading && <TypingIndicator mode={currentMode} />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

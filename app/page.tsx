'use client';
import { useState, useCallback } from 'react';
import { Mode } from '@/app/lib/types';
import { useMode } from '@/app/hooks/useMode';
import { useChat } from '@/app/hooks/useChat';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import ChatArea from '@/app/components/ChatArea';
import InputBar from '@/app/components/InputBar';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { mode, setMode, autoRoute, setAutoRoute, currentMode, detectMode } = useMode();
  const { messages, isLoading, autoRoutedTo, sendMessage, clearMessages } = useChat();

  const handleSend = useCallback(
    (text: string) => { sendMessage(text, mode, autoRoute, detectMode); },
    [mode, autoRoute, detectMode, sendMessage]
  );

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    clearMessages();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#05050a' }}>

      {/* Ambient glow — transitions smoothly with mode */}
      <div
        className="fixed pointer-events-none z-0 transition-all duration-[900ms]"
        style={{
          top: 0, left: 0, right: 0, height: '60vh',
          background: `radial-gradient(ellipse 65% 55% at 50% -5%, ${currentMode.glow} 0%, transparent 100%)`,
        }}
      />

      {/* Dot grid texture */}
      <div className="fixed inset-0 pointer-events-none z-0 dot-grid" />

      {/* App shell */}
      <div className="relative z-10 flex flex-col h-full">
        <Header
          currentMode={currentMode}
          sidebarOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(p => !p)}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            currentMode={currentMode}
            onModeChange={handleModeChange}
            autoRoute={autoRoute}
            onAutoRouteToggle={() => setAutoRoute(p => !p)}
            onNewChat={clearMessages}
          />

          <main className="flex flex-col flex-1 overflow-hidden">
            <ChatArea
              messages={messages}
              isLoading={isLoading}
              currentMode={currentMode}
              autoRoutedTo={autoRoutedTo}
              onSuggestion={handleSend}
              onModeChange={handleModeChange}
            />
            <InputBar
              currentMode={currentMode}
              isLoading={isLoading}
              onSend={handleSend}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

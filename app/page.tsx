'use client';
import { useState, useCallback, useEffect } from 'react';
import { Mode, Message } from '@/app/lib/types';
import { useMode } from '@/app/hooks/useMode';
import { useChat } from '@/app/hooks/useChat';
import { useAuth } from '@/app/hooks/useAuth';
import { useConversations, Conversation } from '@/app/hooks/useConversations';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import ChatArea from '@/app/components/ChatArea';
import InputBar from '@/app/components/InputBar';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { mode, setMode, autoRoute, setAutoRoute, currentMode, detectMode } = useMode();
  const { messages, isLoading, autoRoutedTo, sendMessage, clearMessages, setMessages } = useChat();
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
  const {
    conversations, activeId, setActiveId,
    createConversation, saveMessages, deleteConversation,
  } = useConversations(user);

  // When user sends a message — create or update conversation
  const handleSend = useCallback(async (text: string) => {
    let convId = activeId;

    // If no active conversation — create one
    if (!convId && user) {
      convId = await createConversation(text, mode);
    }

    // Send the message (streaming)
    await sendMessage(text, mode, autoRoute, detectMode);
  }, [mode, autoRoute, detectMode, sendMessage, activeId, user, createConversation]);

  // Save messages to Firestore whenever they change (debounced)
  useEffect(() => {
    if (!user || !activeId || messages.length === 0 || isLoading) return;
    const timer = setTimeout(() => {
      saveMessages(activeId, messages, mode);
    }, 1000);
    return () => clearTimeout(timer);
  }, [messages, isLoading, user, activeId, mode, saveMessages]);

  // Load a conversation from history
  const handleSelectConversation = useCallback((conv: Conversation) => {
    setActiveId(conv.id);
    setMode(conv.mode);
    setMessages(conv.messages);
  }, [setActiveId, setMode, setMessages]);

  // New chat
  const handleNewChat = useCallback(() => {
    setActiveId(null);
    clearMessages();
  }, [setActiveId, clearMessages]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    clearMessages();
    setActiveId(null);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#05050a' }}>
      {/* Ambient glow */}
      <div className="fixed pointer-events-none z-0 transition-all duration-[900ms]"
        style={{
          top: 0, left: 0, right: 0, height: '60vh',
          background: `radial-gradient(ellipse 65% 55% at 50% -5%, ${currentMode.glow} 0%, transparent 100%)`,
        }}
      />
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none z-0 dot-grid" />

      <div className="relative z-10 flex flex-col h-full">
        <Header
          currentMode={currentMode}
          sidebarOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(p => !p)}
          user={user}
          authLoading={authLoading}
          onSignIn={signInWithGoogle}
          onSignOut={logout}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            currentMode={currentMode}
            onModeChange={handleModeChange}
            autoRoute={autoRoute}
            onAutoRouteToggle={() => setAutoRoute(p => !p)}
            onNewChat={handleNewChat}
            user={user}
            conversations={conversations}
            activeConvId={activeId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={deleteConversation}
            onSignIn={signInWithGoogle}
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

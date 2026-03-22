'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Mode, Message } from '@/app/lib/types';
import { useMode } from '@/app/hooks/useMode';
import { useChat } from '@/app/hooks/useChat';
import { useAuth } from '@/app/hooks/useAuth';
import { useConversations, Conversation } from '@/app/hooks/useConversations';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import ChatArea from '@/app/components/ChatArea';
import InputBar from '@/app/components/InputBar';
import MobileNav from '@/app/components/MobileNav';
import { HistorySheet, ModePickerSheet } from '@/app/components/MobileSheet';
import AuthScreen from '@/app/components/AuthScreen';
import ApprovalGate from '@/app/components/ApprovalGate';
import UserProfile from '@/app/components/UserProfile';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheet, setMobileSheet] = useState<'history' | 'modes' | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [authError, setAuthError] = useState('');

  const { mode, setMode, autoRoute, setAutoRoute, currentMode, detectModeAI } = useMode();
  const { messages, isLoading, autoRoutedTo, sendMessage, clearMessages, setMessages } = useChat();
  const {
    user, loading, userStatus, statusLoading, rejectionNote,
    isAdmin, isApproved,
    signInWithGoogle, registerWithEmail, signInWithEmail, resetPassword, logout,
  } = useAuth();
  const {
    conversations, activeId, setActiveId,
    createConversation, saveMessages, deleteConversation,
  } = useConversations(user);

  const activeIdRef = useRef<string | null>(null);

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const handleSend = useCallback(async (text: string) => {
    if (user && !activeIdRef.current) {
      const newId = await createConversation(text, mode);
      if (newId) activeIdRef.current = newId;
    }
    await sendMessage(text, mode, autoRoute, detectModeAI);
  }, [mode, autoRoute, detectModeAI, sendMessage, user, createConversation]);

  useEffect(() => {
    if (!user || !activeIdRef.current || messages.length === 0 || isLoading) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'assistant' || lastMsg.model === '...') return;
    saveMessages(activeIdRef.current, messages, mode);
  }, [messages, isLoading, user, mode, saveMessages]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setActiveId(conv.id);
    activeIdRef.current = conv.id;
    setMode(conv.mode);
    setMessages(conv.messages);
  }, [setActiveId, setMode, setMessages]);

  const handleNewChat = useCallback(() => {
    setActiveId(null);
    activeIdRef.current = null;
    clearMessages();
  }, [setActiveId, clearMessages]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    clearMessages();
    setActiveId(null);
    activeIdRef.current = null;
  };

  const handleBack = () => {
    clearMessages();
    setActiveId(null);
    activeIdRef.current = null;
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    setAuthError('');
    try { await signInWithEmail(email, password); }
    catch (e: any) { setAuthError(e.message ?? 'Sign in failed'); throw e; }
  };

  const handleEmailRegister = async (email: string, password: string, name: string) => {
    setAuthError('');
    try { await registerWithEmail(email, password, name); }
    catch (e: any) { setAuthError(e.message ?? 'Registration failed'); throw e; }
  };

  const hasMessages = messages.length > 0;

  // Loading state
  if (loading || statusLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#05050a' }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: currentMode.accent, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // Not logged in — show auth screen
  if (!user) {
    return (
      <AuthScreen
        currentMode={currentMode}
        onGoogleSignIn={signInWithGoogle}
        onEmailSignIn={handleEmailSignIn}
        onEmailRegister={handleEmailRegister}
        onResetPassword={resetPassword}
        error={authError}
      />
    );
  }

  // Logged in but not approved
  if (!isApproved && userStatus && userStatus !== 'approved') {
    return (
      <ApprovalGate
        status={userStatus}
        rejectionNote={rejectionNote}
        currentMode={currentMode}
        onLogout={logout}
        userEmail={user.email ?? ''}
      />
    );
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ background: '#05050a', height: '100dvh' }}>
      <div className="fixed pointer-events-none z-0 transition-all duration-[900ms]"
        style={{ top: 0, left: 0, right: 0, height: '60vh', background: `radial-gradient(ellipse 65% 55% at 50% -5%, ${currentMode.glow} 0%, transparent 100%)` }} />
      <div className="fixed inset-0 pointer-events-none z-0 dot-grid" />

      <div className="relative z-10 flex flex-col h-full">
        <Header
          currentMode={currentMode}
          sidebarOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(p => !p)}
          onBack={handleBack}
          hasMessages={hasMessages}
          user={user}
          authLoading={false}
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
            <InputBar currentMode={currentMode} isLoading={isLoading} onSend={handleSend} />
          </main>
        </div>

        <MobileNav
          currentMode={currentMode}
          onOpenSidebar={() => setMobileSheet('history')}
          onNewChat={handleNewChat}
          onOpenModes={() => setMobileSheet('modes')}
          hasMessages={hasMessages}
        />
      </div>

      {mobileSheet === 'history' && (
        <HistorySheet
          currentMode={currentMode}
          conversations={conversations}
          activeConvId={activeId}
          user={user}
          autoRoute={autoRoute}
          onAutoRouteToggle={() => setAutoRoute(p => !p)}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={deleteConversation}
          onNewChat={handleNewChat}
          onSignIn={signInWithGoogle}
          onClose={() => setMobileSheet(null)}
        />
      )}

      {mobileSheet === 'modes' && (
        <ModePickerSheet
          currentMode={currentMode}
          onModeChange={handleModeChange}
          onClose={() => setMobileSheet(null)}
        />
      )}

      {showProfile && user && (
        <UserProfile uid={user.uid} currentMode={currentMode} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, onSnapshot,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { User } from 'firebase/auth';
import { Message, Mode } from '@/app/lib/types';

export interface Conversation {
  id: string;
  title: string;
  mode: Mode;
  updatedAt: Date;
  messages: Message[];
}

export function useConversations(user: User | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Listen to Firestore in real time
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveId(null);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('uid', '==', user.uid),
      orderBy('updatedAt', 'desc'),
    );

    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? 'New chat',
          mode: data.mode ?? 'chat',
          updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
          messages: (data.messages ?? []).map((m: any) => ({
            ...m,
            timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : new Date(),
          })),
        } as Conversation;
      });
      setConversations(docs);
    });

    return unsub;
  }, [user]);

  // Create a new conversation
  const createConversation = useCallback(async (
    firstMessage: string,
    mode: Mode,
  ): Promise<string | null> => {
    if (!user) return null;
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '…' : '');
    const docRef = await addDoc(collection(db, 'conversations'), {
      uid: user.uid,
      title,
      mode,
      messages: [],
      updatedAt: serverTimestamp(),
    });
    setActiveId(docRef.id);
    return docRef.id;
  }, [user]);

  // Save messages to an existing conversation
  const saveMessages = useCallback(async (
    convId: string,
    messages: Message[],
    mode: Mode,
  ) => {
    if (!user) return;
    // Serialize messages for Firestore (remove undefined fields)
    const serialized = messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      mode: m.mode,
      model: m.model ?? null,
      provider: m.provider ?? null,
      imageUrl: m.imageUrl ?? null,
      images: m.images ?? null,
openMedia: m.openMedia ?? null,
      sources: m.sources ?? [],
      timestamp: m.timestamp,
    }));
    await updateDoc(doc(db, 'conversations', convId), {
      messages: serialized,
      mode,
      updatedAt: serverTimestamp(),
    });
  }, [user]);

  // Delete a conversation
  const deleteConversation = useCallback(async (convId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'conversations', convId));
    if (activeId === convId) setActiveId(null);
  }, [user, activeId]);

  return {
    conversations,
    activeId,
    setActiveId,
    createConversation,
    saveMessages,
    deleteConversation,
  };
}

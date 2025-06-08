'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalConversations } from '@/hooks/use-local-conversations';
import { useLocalMessages } from '@/hooks/use-local-messages';

interface LocalStorageContextType {
  conversations: any[];
  createConversation: (title: string, model: string) => Promise<string>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  isConversationsLoading: boolean;
}

const LocalStorageContext = createContext<LocalStorageContextType | undefined>(undefined);

export function LocalStorageProvider({ children }: { children: ReactNode }) {
  const {
    conversations,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    isLoading: isConversationsLoading
  } = useLocalConversations();

  const value = {
    conversations,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    isConversationsLoading
  };

  return (
    <LocalStorageContext.Provider value={value}>
      {children}
    </LocalStorageContext.Provider>
  );
}

export function useLocalStorage() {
  const context = useContext(LocalStorageContext);
  if (context === undefined) {
    throw new Error('useLocalStorage must be used within a LocalStorageProvider');
  }
  return context;
}

// Hook for messages
export function useMessages(conversationId: string | null) {
  return useLocalMessages(conversationId);
}

import { useState, useEffect, useCallback } from 'react';
import { LocalConversation, dbHelpers } from '@/lib/local-db';

export function useLocalConversations() {
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await dbHelpers.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const createConversation = useCallback(async (title: string, model: string) => {
    try {
      const id = await dbHelpers.createConversation(title, model);
      await loadConversations(); // Refresh list
      return id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }, [loadConversations]);

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    try {
      await dbHelpers.updateConversationTitle(id, title);
      await loadConversations(); // Refresh list
    } catch (error) {
      console.error('Failed to update conversation title:', error);
      throw error;
    }
  }, [loadConversations]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await dbHelpers.deleteConversation(id);
      await loadConversations(); // Refresh list
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }, [loadConversations]);

  return {
    conversations,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    isLoading,
    refresh: loadConversations
  };
}

import { useState, useEffect, useCallback } from 'react';
import { LocalMessage, dbHelpers } from '@/lib/local-db';

export function useLocalMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages for current conversation
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await dbHelpers.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const addMessage = useCallback(async (
    content: string,
    role: 'user' | 'assistant',
    model?: string
  ) => {
    if (!conversationId) throw new Error('No conversation selected');

    try {
      await dbHelpers.addMessage(conversationId, content, role, model);
      await loadMessages(); // Refresh messages
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }, [conversationId, loadMessages]);

  return {
    messages,
    addMessage,
    isLoading,
    refresh: loadMessages
  };
}

import Dexie, { Table } from 'dexie';

export interface LocalConversation {
  id?: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export interface LocalMessage {
  id?: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  model?: string;
  timestamp: number;
}

export class T3ChatDB extends Dexie {
  conversations!: Table<LocalConversation>;
  messages!: Table<LocalMessage>;

  constructor() {
    super('T3ChatDB');

    this.version(1).stores({
      conversations: '++id, title, model, createdAt, updatedAt, messageCount',
      messages: '++id, conversationId, content, role, model, timestamp'
    });
  }
}

export const db = new T3ChatDB();

// Simple helper functions (no async in constructor)
export const dbHelpers = {
  // Get conversations ordered by update time
  getConversations: async () => {
    try {
      return await db.conversations.orderBy('updatedAt').reverse().toArray();
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  },

  // Get messages for conversation
  getMessages: async (conversationId: string) => {
    try {
      return await db.messages.where('conversationId').equals(conversationId).sortBy('timestamp');
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  },

  // Create new conversation
  createConversation: async (title: string, model: string) => {
    try {
      const id = crypto.randomUUID();
      await db.conversations.add({
        id,
        title,
        model,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0
      });
      return id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  // Add message to conversation
  addMessage: async (conversationId: string, content: string, role: 'user' | 'assistant', model?: string) => {
    try {
      // Add the message
      await db.messages.add({
        id: crypto.randomUUID(),
        conversationId,
        content,
        role,
        model,
        timestamp: Date.now()
      });

      // Update conversation message count and timestamp
      const conversation = await db.conversations.get(conversationId);
      if (conversation) {
        await db.conversations.update(conversationId, {
          updatedAt: Date.now(),
          messageCount: (conversation.messageCount || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  // Update conversation title
  updateConversationTitle: async (id: string, title: string) => {
    try {
      await db.conversations.update(id, { title, updatedAt: Date.now() });
    } catch (error) {
      console.error('Error updating conversation title:', error);
      throw error;
    }
  },

  // Delete conversation and its messages
  deleteConversation: async (id: string) => {
    try {
      await db.messages.where('conversationId').equals(id).delete();
      await db.conversations.delete(id);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },

  // Clear all data
  clearAll: async () => {
    try {
      await db.messages.clear();
      await db.conversations.clear();
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }
};

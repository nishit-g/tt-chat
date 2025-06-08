'use client';

import { useChat } from 'ai/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Send, Square, RotateCcw, Plus, MessageSquare, Menu, X } from 'lucide-react';
import { useLocalStorage, useMessages } from '@/components/chat/local-storage-provider';
import { toast } from 'sonner';
import { MessageRenderer } from '../components/chat/message-renderer';

const MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', icon: '⚡' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', icon: '🤖' },
  { id: 'anthropic/claude-3-5-sonnet-20241022', name: 'Claude 3.5', icon: '🧠' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0', icon: '💎' },
];

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini');
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const { conversations, createConversation } = useLocalStorage();
  const { messages: localMessages, addMessage } = useMessages(currentConversation);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    setMessages

  } = useChat({
    api: '/api/chat',
    body: { model: selectedModel },
    onFinish: async (message) => {
      // ONLY save assistant messages (user messages already saved above)
      if (currentConversation && message.role === 'assistant') {
        await addMessage(message.content, 'assistant', selectedModel);
      }

    }
  });

  // Load messages from local storage when conversation changes
  useEffect(() => {
    if (localMessages && localMessages.length > 0) {
      const formattedMessages = localMessages.map(msg => ({
        id: msg.id || crypto.randomUUID(),
        content: msg.content,
        role: msg.role,
        createdAt: new Date(msg.timestamp)
      }));
      setMessages(formattedMessages);
    } else {
      setMessages([]);
    }
  }, [localMessages, setMessages]);

  const onModelChange = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  const startNewChat = useCallback(async () => {
    try {
      const title = `New Chat ${new Date().toLocaleTimeString()}`;
      const id = await createConversation(title, selectedModel);
      setCurrentConversation(id);
      setMessages([]);
      toast.success('New conversation started');
    } catch (error) {
      toast.error('Failed to create conversation');
    }
  }, [createConversation, selectedModel, setMessages]);

  const selectConversation = useCallback((id: string) => {
    setCurrentConversation(id);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // FIXED: Enhanced submit to prevent duplicates
  const enhancedHandleSubmit = useCallback(async (e: React.FormEvent) => {

    e.preventDefault();


    const messageContent = input.trim();
    if (!messageContent) return;

    // Create conversation if needed
    let conversationId = currentConversation;
    if (!conversationId) {
      const title = messageContent.length > 30 ? messageContent.substring(0, 30) + '...' : messageContent;
      conversationId = await createConversation(title, selectedModel);
      setCurrentConversation(conversationId);
    }

    // Save user message to local storage FIRST
    if (conversationId) {
      await addMessage(messageContent, 'user');
    }

    // THEN call the AI (this will add the message to the UI automatically)
    handleSubmit(e);
  }, [currentConversation, input, createConversation, selectedModel, addMessage, handleSubmit]);

  // Mobile responsiveness
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const currentConversationData = conversations.find(c => c.id === currentConversation);

  return (
    <div className="h-screen flex bg-white dark:bg-gray-950">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? (isMobile ? 'fixed inset-y-0 left-0 z-50 w-80' : 'w-80') : 'w-0'
      } transition-all duration-200 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden`}>

        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">New Chat</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors mb-1 ${
                  currentConversation === conversation.id
                    ? 'bg-gray-200 dark:bg-gray-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {conversation.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                      <span>{MODELS.find(m => m.id === conversation.model)?.icon}</span>
                      <span>{conversation.messageCount} messages</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                    {formatDate(new Date(conversation.updatedAt))}
                  </div>
                </div>
              </button>
            ))}

            {conversations.length === 0 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="text-2xl mb-2">💬</div>
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            T3 Chat Clone • Local-First
            {process.env.NODE_ENV === 'development' && (
              <div className="text-green-600 mt-1">🗄️ Dexie Active</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-gray-600 dark:text-gray-400" />
                <span className="font-medium">
                  {currentConversationData?.title || 'New Chat'}
                </span>
              </div>
            </div>

            {/* Model Selector */}
            <div className="flex gap-1">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onModelChange(model.id)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    selectedModel === model.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {model.icon} {model.name}
                </button>
              ))}
            </div>

            {/* Performance Indicators */}
            {process.env.NODE_ENV === 'development' && (
              <div className="flex gap-2">
                <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  🚀 React Scan
                </div>
                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  🗄️ Local-First
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-semibold mb-2">
                  {currentConversation ? 'Continue your conversation' : 'Start a new conversation'}
                </h2>
                <p className="text-sm">
                  Blazingly fast AI chat with {MODELS.find(m => m.id === selectedModel)?.icon} {MODELS.find(m => m.id === selectedModel)?.name}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  ⚡ Local-first • Zero latency • Offline capable
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}>
                  <div className="text-xs opacity-70 mb-1">
                    {message.role === 'user' ? 'You' : selectedModel.split('/')[1]}
                  </div>
                  <MessageRenderer content={message.content} role={message.role} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                  <div className="text-xs opacity-70 mb-1">{selectedModel.split('/')[1]}</div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Input Area */}
        <footer className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={enhancedHandleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder={`Message ${MODELS.find(m => m.id === selectedModel)?.name}...`}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />

              <div className="flex gap-1">
                {isLoading ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Square size={16} />
                  </button>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={16} />
                    </button>
                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={reload}
                        className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </form>

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              T3 Chat • Local-first architecture • Data stored locally
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

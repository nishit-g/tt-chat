import { memo } from 'react';

interface ConversationItemProps {
  id: string;
  title: string;
  model: string;
  messageCount: number;
  updatedAt: Date;
  isActive: boolean;
  onClick: (id: string) => void;
  modelIcon: string;
}

export const ConversationItem = memo(function ConversationItem({
  id,
  title,
  model,
  messageCount,
  updatedAt,
  isActive,
  onClick,
  modelIcon
}: ConversationItemProps) {
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

  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full text-left p-3 rounded-lg transition-colors mb-1 ${
        isActive
          ? 'bg-gray-200 dark:bg-gray-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {title}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <span>{modelIcon}</span>
            <span>{messageCount} messages</span>
          </div>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 ml-2">
          {formatDate(updatedAt)}
        </div>
      </div>
    </button>
  );
});

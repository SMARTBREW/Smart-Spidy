import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  // Memoized timestamp formatting
  const formattedTime = useMemo(() => {
    if (!message.createdAt) return '';
    const date = new Date(message.createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [message.createdAt]);

  // Memoized content processing (for future markdown support)
  const processedContent = useMemo(() => {
    return message.content; // For now, just return as-is, but could add markdown processing
  }, [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-600'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2 rounded-2xl ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-md' 
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words">
            {processedContent}
          </p>
        </div>
        
        {/* Timestamp */}
        {formattedTime && (
          <span className="text-xs text-gray-500 mt-1 px-1">
            {formattedTime}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export const ChatMessage = React.memo(ChatMessageComponent);
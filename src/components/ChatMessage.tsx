import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast }) => {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full mb-2 mt-5`}
    >
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4 max-w-xl`}>
        <div
          className={`flex flex-col ${
            isUser
              ? 'items-end self-end bg-gray-100 border border-gray-300 rounded-xl p-4 shadow-sm'
              : 'items-start self-start bg-gray-50 border border-gray-300 rounded-xl p-4 max-w-xs shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 mb-1 w-full">
            <span className="font-medium text-black text-left">
              {isUser ? 'You' : 'Assistant'}
            </span>
            <span className="text-xs text-gray-600">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="prose prose-sm max-w-none w-full">
            <p className="text-black leading-relaxed whitespace-pre-wrap text-left">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
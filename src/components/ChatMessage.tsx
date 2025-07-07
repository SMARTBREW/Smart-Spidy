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

  if (isUser) {
    // User message - boxed and positioned on the right half
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end w-full mb-2 mt-5"
      >
        <div className="w-1/2">
          <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-black">You</span>
              <span className="text-xs text-gray-600">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-black leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  } else {
    // Assistant message - no box, starts from left edge, extends to full width
    const formattedContent = message.content.replace(/\*\*(.*?)\*\*/g, '"$1"');
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-start w-full mb-2 mt-5"
      >
        <div className="w-full">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-black">Assistant</span>
            <span className="text-xs text-gray-600">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-black leading-relaxed whitespace-pre-wrap break-words">
              {formattedContent}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
};
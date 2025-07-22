import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, User, Bot } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { Chat, Message } from '../types';

interface ChatAreaProps {
  chat: Chat | null;
}

const ChatAreaComponent: React.FC<ChatAreaProps> = ({ chat }) => {
  // Memoized messages to avoid recalculation
  const sortedMessages = useMemo(() => {
    if (!chat?.messages) return [];
    return [...chat.messages].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });
  }, [chat?.messages]);

  // Memoized empty state
  const emptyState = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex items-center justify-center"
    >
      <div className="text-center">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No chat selected</h3>
        <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
      </div>
    </motion.div>
  ), []);

  if (!chat) {
    return emptyState;
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-200 p-4 bg-white"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{chat.name}</h2>
            <p className="text-sm text-gray-500">
              {sortedMessages.length} message{sortedMessages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sortedMessages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center">
              <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Start a conversation by sending a message</p>
            </div>
          </motion.div>
        ) : (
          sortedMessages.map((message, index) => (
            <ChatMessage key={message.id || index} message={message} />
          ))
        )}
      </div>
    </div>
  );
};

export const ChatArea = React.memo(ChatAreaComponent);
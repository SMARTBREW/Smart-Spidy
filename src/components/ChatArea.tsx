import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { Chat } from '../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatAreaProps {
  chat: Chat | null;
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ chat, onSendMessage, isTyping = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl w-full px-4"
        >
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <img src="https://i.pinimg.com/736x/42/b1/a9/42b1a984eb088e65428a7ec727578ece.jpg" alt="Smart Spidy" className="w-20 h-20 rounded-xl shadow-lg" />
          </div>
          <h2 className="text-3xl font-bold text-black mb-3">
            Welcome to Smart Spidy
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Your Professional AI Assistant
          </p>
          <p className="text-gray-500 mb-8 text-sm">
            Create a new chat or select an existing one to start your conversation
          </p>
          <div className="w-full max-w-3xl mx-auto">
            <ChatInput onSendMessage={onSendMessage} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-300 p-4">
        <h1 className="text-xl font-semibold text-black text-left">{chat.name}</h1>
        <p className="text-sm text-gray-600 text-left">
          {chat.messages.length} messages • Last updated {new Date(chat.updatedAt).toLocaleString()}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {chat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl w-full px-4"
            >
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <img src="https://i.pinimg.com/736x/42/b1/a9/42b1a984eb088e65428a7ec727578ece.jpg" alt="Smart Spidy" className="w-12 h-12 rounded-lg" />
              </div>
              <h3 className="text-lg font-medium text-black mb-2">
                Start the conversation
              </h3>
              <p className="text-gray-600 mb-8">
                Send a message to begin chatting
              </p>
              <div className="w-full">
                <ChatInput onSendMessage={onSendMessage} />
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {chat.messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLast={index === chat.messages.length - 1}
              />
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start w-full mb-2 mt-5"
              >
                <div className="flex flex-row gap-4 max-w-xl">
                  <div className="flex flex-col items-start self-start bg-gray-50 border border-gray-300 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1 w-full">
                      <span className="font-medium text-black text-left">Assistant</span>
                      <span className="text-xs text-gray-600">typing...</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input - Only show when there are messages */}
      {chat.messages.length > 0 && (
        <ChatInput onSendMessage={onSendMessage} />
      )}
    </div>
  );
};
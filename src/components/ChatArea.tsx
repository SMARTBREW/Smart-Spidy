import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Menu, X } from 'lucide-react';
import { Chat } from '../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatAreaProps {
  chat: Chat | null;
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isCreatingChat?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ chat, onSendMessage, isTyping = false, isSidebarOpen = true, onToggleSidebar, isCreatingChat = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        {/* Header with toggle button */}
        <div className="bg-white border-b border-gray-300 p-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group relative"
            aria-label="Toggle sidebar"
            title="Toggle sidebar (Cmd/Ctrl + B)"
          >
            <Menu className="w-5 h-5 text-gray-700" />
            
          </button>
        </div>
        
        {/* Welcome content */}
        <div className="flex-1 flex items-center justify-center">
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
              {/* ChatInput removed from welcome screen */}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-300 p-4 flex items-center gap-4">
        {/* <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group relative"
          aria-label="Toggle sidebar"
          title="Toggle sidebar (Cmd/Ctrl + B)"
        >
          <Menu className="w-5 h-5 text-gray-700" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Open sidebar (⌘B)
          </span>
        </button> */}
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-black text-left">{chat.name}</h1>
          {/* Additional chat details */}
          {(chat.instagramUsername || chat.occupation || chat.product || chat.gender) && (
            <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-4">
              {chat.instagramUsername && (
                <span>Instagram: <span className="font-medium text-gray-800">@{chat.instagramUsername}</span></span>
              )}
              {chat.occupation && (
                <span>Occupation: <span className="font-medium text-gray-800">{chat.occupation}</span></span>
              )}
              {chat.product && (
                <span>Product: <span className="font-medium text-gray-800">{chat.product}</span></span>
              )}
              {chat.gender && (
                <span>Gender: <span className="font-medium text-gray-800">{chat.gender}</span></span>
              )}
            </div>
          )}
        </div>
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
                {!isCreatingChat && <ChatInput onSendMessage={onSendMessage} />}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {chat.messages.map((message, index) => (
              <React.Fragment key={message.id}>
                {message.query && (
                  <ChatMessage
                    message={message}
                    isLast={false}
                    type="user"
                  />
                )}
                {message.answer && (
                  <ChatMessage
                    message={message}
                    isLast={index === chat.messages.length - 1}
                    type="assistant"
                  />
                )}
              </React.Fragment>
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
                      <span className="font-medium text-black text-left">Smart Spidy</span>
                      <span className="text-xs text-gray-600">typing...</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
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
      {chat.messages.length > 0 && !isCreatingChat && (
        <ChatInput onSendMessage={onSendMessage} />
      )}
    </div>
  );
};
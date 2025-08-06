import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Menu } from 'lucide-react';
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
  isMobileSidebarExpanded?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ chat, onSendMessage, isTyping = false, isSidebarOpen = true, onToggleSidebar, isCreatingChat = false, isMobileSidebarExpanded = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col bg-white min-h-0">
        {/* Header with toggle button - Responsive */}
        <div className="bg-white border-b border-gray-300 p-3 sm:p-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group relative"
            aria-label="Toggle sidebar"
            title="Toggle sidebar (Cmd/Ctrl + B)"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
              Open sidebar (⌘B)
            </span>
          </button>
        </div>
        {/* Welcome content - Responsive */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl w-full px-4 sm:px-6"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <img src="/smartspidy.png" alt="𝐒𝐌𝐀𝐑𝐓 𝐒𝐏𝐈𝐃𝐘 Logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shadow-lg" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2 sm:mb-3">
              Welcome to 𝐒𝐌𝐀𝐑𝐓 𝐒𝐏𝐈𝐃𝐘
            </h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg">
              Your Professional AI Assistant
            </p>
            <p className="text-gray-500 mb-6 sm:mb-8 text-sm">
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
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* Chat Header - Responsive */}
      <div className={`bg-white border-b border-gray-300 py-2 px-3 sm:px-4 flex items-center gap-3 sm:gap-4 min-h-[48px] sm:min-h-[56px] ${isMobileSidebarExpanded ? 'justify-center' : ''}`}>
        <div className={`min-w-0 ${isMobileSidebarExpanded ? 'text-center' : 'flex-1'}`}>
          <h1 className={`text-lg sm:text-xl font-semibold text-black truncate ${isMobileSidebarExpanded ? 'text-center' : 'text-left'}`}>{chat.name}</h1>
          <div className={`mt-1 flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm ${isMobileSidebarExpanded ? 'justify-center' : ''}`}>
            <span><span className="font-bold text-gray-600">Messages:</span> <span className="text-gray-600">{chat.messages?.length ?? 0}</span></span>
            {chat.instagramUsername && <span><span className="font-bold text-gray-600">Instagram:</span> <span className="text-gray-600 truncate">{chat.instagramUsername}</span></span>}
            {chat.executiveInstagramUsername && <span><span className="font-bold text-gray-600">Your Instagram:</span> <span className="text-gray-600 truncate">{chat.executiveInstagramUsername}</span></span>}
            {chat.occupation && <span><span className="font-bold text-gray-600">Occupation:</span> <span className="text-gray-600 truncate">{chat.occupation}</span></span>}
            {chat.product && <span><span className="font-bold text-gray-600">Product:</span> <span className="text-gray-600 truncate">{chat.product}</span></span>}
            {chat.gender && <span><span className="font-bold text-gray-600">Gender:</span> <span className="text-gray-600">{chat.gender}</span></span>}
            {chat.profession && <span><span className="font-bold text-gray-600">Profession:</span> <span className="text-gray-600 truncate">{typeof chat.profession === 'string' ? chat.profession : JSON.stringify(chat.profession)}</span></span>}
          </div>
        </div>
      </div>

      {/* Messages - Responsive */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto min-h-0">
          {chat.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-2xl w-full px-4 sm:px-6"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <img src="/smartspidy.png" alt="𝐒𝐌𝐀𝐑𝐓 𝐒𝐏𝐈𝐃𝐘 Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-black mb-2">
                  Start the conversation
                </h3>
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                  Send a message to begin chatting
                </p>
                <div className="mb-6 sm:mb-8">
                  <button
                    onClick={() => onSendMessage('First DM')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                  >
                    First DM
                  </button>
                  <p className="text-gray-500 text-xs sm:text-sm mt-2">
                    Get a personalized campaign DM template
                  </p>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-2 sm:px-4">
              {chat.messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLast={index === chat.messages.length - 1}
                  type={message.sender as 'user' | 'assistant'}
                />
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start w-full mb-2 mt-4 sm:mt-5"
                >
                  <div className="flex flex-row gap-3 sm:gap-4 max-w-xl">
                    <div className="flex flex-col items-start self-start bg-gray-50 border border-gray-300 rounded-xl p-3 sm:p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1 w-full">
                        <span className="font-medium text-black text-left text-sm sm:text-base">Smart Spidy</span>
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
        {/* Only show input at the bottom when there are messages or always if you want persistent input */}
        {!isCreatingChat && <ChatInput onSendMessage={onSendMessage} />}
      </div>
    </div>
  );
};
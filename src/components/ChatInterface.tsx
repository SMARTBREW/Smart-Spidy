import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { useChat } from '../hooks/useChat';
import { SearchModal } from './SearchModal';

interface ChatInterfaceProps {
  user: User;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ user }) => {
  const {
    chats,
    currentChat,
    currentChatId,
    isTyping,
    createChat,
    selectChat,
    sendMessage,
    deleteChat,
    logout,
  } = useChat();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-screen bg-white"
    >
      <Sidebar
        user={user}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={selectChat}
        onCreateChat={createChat}
        onDeleteChat={deleteChat}
        onLogout={logout}
        onOpenSearch={openSearch}
      />
      <ChatArea
        chat={currentChat || null}
        onSendMessage={sendMessage}
        isTyping={isTyping}
      />
      {isSearchOpen && (
        <SearchModal
          chats={chats}
          onClose={closeSearch}
          onSelectChat={selectChat}
          currentChatId={currentChatId}
        />
      )}
    </motion.div>
  );
};
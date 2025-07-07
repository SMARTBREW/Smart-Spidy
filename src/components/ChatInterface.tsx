import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open');
    return saved !== null ? saved === 'true' : true;
  });
  
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar-open', String(newState));
      return newState;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Toggle sidebar with Cmd/Ctrl + B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-screen bg-white"
    >
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <Sidebar
            user={user}
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={selectChat}
            onCreateChat={createChat}
            onDeleteChat={deleteChat}
            onLogout={logout}
            onOpenSearch={openSearch}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      <ChatArea
        chat={currentChat || null}
        onSendMessage={sendMessage}
        isTyping={isTyping}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
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
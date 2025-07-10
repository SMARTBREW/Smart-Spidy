import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { useChat } from '../hooks/useChat';
import { SearchModal } from './SearchModal';
import { Bell, Star } from 'lucide-react';

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
    pinChat,
    setChatStatus,
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

  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // For testing: static notifications
  const allNotifications = [
    { chatId: '1', name: 'Project Alpha', status: 'green', days: 3 },
    { chatId: '2', name: 'Support Ticket', status: 'yellow', days: 2 },
    { chatId: '3', name: 'VIP Client', status: 'gold', days: 2 },
    { chatId: '4', name: 'Old Chat', status: 'green', days: 1 },
  ];
  const notifications = allNotifications.filter(n => n.days === 2);

  useEffect(() => {
    // Calculate notifications for chats with status green, yellow, or gold and not updated for 2+ days
    const now = new Date();
    const notifs = chats
      .filter(chat => (chat.status === 'green' || chat.status === 'yellow' || chat.status === 'gold') && chat.updatedAt)
      .map(chat => {
        const updated = new Date(chat.updatedAt);
        const days = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
        return { chatId: chat.id, name: chat.name, status: chat.status as 'green' | 'yellow' | 'gold', days };
      })
      .filter(n => n.days >= 2);
    // setNotifications(notifs); // This line is removed as per the edit hint
  }, [chats]);

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
      {/* Notification Bell - Top Right */}
      <div className="fixed top-4 right-8 z-50">
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 transition"
          onClick={() => setShowNotifications(v => !v)}
          aria-label="Show notifications"
        >
          <Bell className="w-6 h-6 text-gray-700" />
          {notifications.length > 0 && (
            <span
              className={`absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white ${
                notifications.some(n => n.status === 'gold')
                  ? 'bg-amber-400'
                  : notifications.some(n => n.status === 'yellow')
                  ? 'bg-yellow-400'
                  : 'bg-green-500'
              }`}
            />
          )}
        </button>
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <h4 className="font-semibold mb-2">Notifications</h4>
            {notifications.length === 0 ? (
              <div className="text-gray-500 text-sm">No chat notifications.</div>
            ) : (
              <ul className="space-y-2">
                {notifications.map(n => (
                  <li key={n.chatId} className="flex items-center gap-2">
                    {n.status === 'gold' ? (
                      <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${
                        n.status === 'yellow' ? 'bg-yellow-400' : 'bg-green-500'
                      }`} />
                    )}
                    <span className="font-medium text-gray-800">{n.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">Waiting {n.days} days</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
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
            isCreatingChat={isCreatingChat}
            setIsCreatingChat={setIsCreatingChat}
            onPinChat={pinChat}
            onSetChatStatus={setChatStatus}
          />
        )}
      </AnimatePresence>
      <ChatArea
        chat={currentChat || null}
        onSendMessage={sendMessage}
        isTyping={isTyping}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        isCreatingChat={isCreatingChat}
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
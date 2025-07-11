import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chat, User } from '../types';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { useChat } from '../hooks/useChat';
import { SearchModal } from './SearchModal';
import { Bell, Star, X, Clock, MessageCircle } from 'lucide-react';

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
  
  // Enhanced notification data for better display
  const allNotifications = [
    { 
      chatId: '1', 
      name: 'Project Alpha', 
      status: 'green', 
      days: 3,
      lastMessage: 'Thanks for the update on the project timeline.',
      timestamp: '2024-01-15 14:30',
      messageCount: 12,
    },
    { 
      chatId: '2', 
      name: 'Support Ticket', 
      status: 'yellow', 
      days: 2,
      lastMessage: 'I need help with the login issue.',
      timestamp: '2024-01-15 10:30',
      messageCount: 5,
    },
    { 
      chatId: '3', 
      name: 'VIP Client', 
      status: 'gold', 
      days: 2,
      lastMessage: 'When can we schedule the next meeting?',
      timestamp: '2024-01-15 11:45',
      messageCount: 8,
    },
    { 
      chatId: '4', 
      name: 'Old Chat', 
      status: 'green', 
      days: 1,
      lastMessage: 'Looking forward to our collaboration.',
      timestamp: '2024-01-15 15:45',
      messageCount: 7,
    },
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
      </div>

      {/* Right-side notification panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowNotifications(false)}
            />
            
            {/* Side panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
              className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No chat notifications.</p>
                    <p className="text-sm text-gray-400 mt-1">You'll see notifications for chats waiting 2+ days here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map(n => (
                      <div key={n.chatId} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {n.status === 'gold' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                <Star className="w-3 h-3 mr-1" fill="currentColor" /> Gold
                              </span>
                            ) : n.status === 'green' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <span className="w-2 h-2 rounded-full mr-1 bg-green-500" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                <span className="w-2 h-2 rounded-full mr-1 bg-yellow-400" /> Pending
                              </span>
                            )}
                            <span className="text-xs text-gray-500">Waiting {n.days} days</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{n.timestamp}</span>
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            <span>{n.messageCount} messages</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
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
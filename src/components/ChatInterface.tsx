import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chat, User } from '../types';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { SearchModal } from './SearchModal';
import { Bell, Star, X, Clock, MessageCircle, CheckCircle } from 'lucide-react';
import { CreateChatModal } from './CreateChatModal';
import { ChatInput } from './ChatInput';
import { 
  getUserNotifications, 
  getNotificationStats, 
  markNotificationAsRead
} from '../services/notification';
import { Notification, NotificationStats } from '../types';

interface ChatInterfaceProps {
  user: User;
  chats: Chat[];
  currentChat: Chat | null;
  currentChatId: string | null;
  isTyping: boolean;
  createChat: (name: string, instagramUsername?: string, occupation?: string, product?: string, gender?: string, profession?: string) => string;
  selectChat: (chatId: string) => void;
  sendMessage: (query: string) => Promise<void>;
  deleteChat: (chatId: string) => void;
  logout: () => void;
  pinChat: (chatId: string, pinned: boolean) => void;
  setChatStatus: (chatId: string, status: 'green' | 'yellow' | 'red' | 'gold' | null) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  user,
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
 }) => {

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationStats, setNotificationStats] = useState<NotificationStats>({ total: 0, unread: 0, read: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [notificationsData, statsData] = await Promise.all([
        getUserNotifications(),
        getNotificationStats()
      ]);
      setNotifications(notificationsData);
      setNotificationStats(statsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      // Refresh stats
      const stats = await getNotificationStats();
      setNotificationStats(stats);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Fetch notifications on mount and when notifications panel is opened
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications, fetchNotifications]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-screen bg-white"
    >
      {/* Notification Bell */}
      <div className="fixed top-6 right-8 z-50">
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 transition"
          onClick={() => setShowNotifications(v => !v)}
          aria-label="Show notifications"
        >
          <Bell className="w-6 h-6 text-gray-700" />
          {notificationStats.unread > 0 && (
            <span
              className={`absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white ${
                notificationStats.unread > 0 && notificationStats.unread < 10 ? 'bg-blue-500' :
                notificationStats.unread >= 10 ? 'bg-red-500' : 'bg-green-500'
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
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Bell className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-gray-500">No notifications available.</p>
                    <p className="text-sm text-gray-400 mt-1">Notifications will appear here when available.</p>
                  </div>
                ) : (
                  <>
                    {/* Header with stats */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{notificationStats.total}</span> total
                        <span className="mx-2">•</span>
                        <span className="font-medium text-blue-600">{notificationStats.unread}</span> unread
                      </div>
                    </div>

                    <div className="space-y-3">
                      {notifications.map((notification: Notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            notification.isRead 
                              ? 'border-gray-200 bg-white' 
                              : 'border-blue-200 bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                                {notification.chatName && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-600">{notification.chatName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                                  title="Mark as read"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
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
            onCreateChat={() => setIsCreatingChat(true)}
            onDeleteChat={deleteChat}
            onPinChat={pinChat}
            onSetChatStatus={setChatStatus}
            onLogout={logout}
            onOpenSearch={openSearch}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      <div className="flex flex-col flex-1 h-full min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <ChatArea 
            chat={currentChat || null} 
            onSendMessage={sendMessage} 
            isTyping={isTyping}
          />
        </div>
      </div>
      {isSearchOpen && (
        <SearchModal
          chats={chats}
          onClose={closeSearch}
          onSelectChat={selectChat}
          currentChatId={currentChatId}
        />
      )}
      <CreateChatModal
        isOpen={isCreatingChat}
        onClose={() => setIsCreatingChat(false)}
        onCreateChat={({ name, instagramUsername, occupation, product, gender, profession }) => {
          createChat(name, instagramUsername, occupation, product, gender, profession);
          setIsCreatingChat(false);
        }}
      />
    </motion.div>
  );
};
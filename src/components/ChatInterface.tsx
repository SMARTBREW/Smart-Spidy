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
  createChat: (name: string, instagramUsername?: string, executiveInstagramUsername?: string, occupation?: string, product?: string, gender?: string, profession?: string) => string;
  selectChat: (chatId: string) => void;
  sendMessage: (query: string) => Promise<void>;
  deleteChat: (chatId: string) => void;
  logout: () => void;
  pinChat: (chatId: string, pinned: boolean) => void;
  setChatStatus: (chatId: string, status: 'green' | 'yellow' | 'red' | 'gold' | null) => void;
  activityTracker?: any;
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
  activityTracker,
}) => {

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open');
    // On mobile (smaller than lg), default to closed
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    return saved !== null ? saved === 'true' : !isMobile;
  });
  
  // Mobile sidebar state - collapsed vs expanded
  const [isMobileSidebarCollapsed, setIsMobileSidebarCollapsed] = useState(true);
  
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar-open', String(newState));
      return newState;
    });
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarCollapsed(prev => !prev);
  }, []);

  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationStats, setNotificationStats] = useState<NotificationStats>({ total: 0, unread: 0, read: 0 });
  const [loading, setLoading] = useState(false);
  const [clickingNotification, setClickingNotification] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

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
      setInitialLoading(false);
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

  // Handle notification click to navigate to chat
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    try {
      setClickingNotification(notification.id);
      
      // Mark as read if not already read
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, isRead: true }
              : n
          )
        );
        // Refresh stats
        const stats = await getNotificationStats();
        setNotificationStats(stats);
      }

      // Navigate to the chat if chatId exists
      if (notification.chatId) {
        selectChat(notification.chatId);
        setShowNotifications(false); // Close notification panel
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    } finally {
      setClickingNotification(null);
    }
  }, [markNotificationAsRead, selectChat]);

  // Fetch notifications on mount and when notifications panel is opened
  useEffect(() => {
    // Fetch notifications on component mount
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications, fetchNotifications]);

  // Set up periodic refresh of notification stats (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only fetch stats, not full notifications list
      getNotificationStats()
        .then(stats => setNotificationStats(stats))
        .catch(error => console.error('Error refreshing notification stats:', error));
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Refresh notifications when user returns to the tab
  useEffect(() => {
    const handleFocus = () => {
      // Refresh notification stats when user returns to the tab
      getNotificationStats()
        .then(stats => setNotificationStats(stats))
        .catch(error => console.error('Error refreshing notification stats on focus:', error));
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

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

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      if (isMobile && isSidebarOpen) {
        // On mobile, close sidebar when screen becomes small
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-screen bg-white relative pt-4 lg:pt-0"
    >
      {/* Notification Bell - Always in top-right position */}
      <div className={`fixed top-6 right-4 sm:right-6 md:right-8 z-50 ${!isMobileSidebarCollapsed ? 'hidden' : ''}`}>
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 transition"
          onClick={() => setShowNotifications(v => !v)}
          aria-label="Show notifications"
        >
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          {initialLoading && (
            <div className="absolute -top-1 -right-1 w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          {!initialLoading && notificationStats.unread > 0 && (
            <span
              className={`absolute -top-1 -right-1 min-w-[16px] sm:min-w-[20px] h-4 sm:h-5 px-1 rounded-full border-2 border-white text-xs font-bold flex items-center justify-center ${
                notificationStats.unread > 0 && notificationStats.unread < 10 ? 'bg-blue-500 text-white' :
                notificationStats.unread >= 10 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
              }`}
            >
              {notificationStats.unread > 99 ? '99+' : notificationStats.unread}
            </span>
          )}
          {!initialLoading && notificationStats.unread === 0 && notificationStats.total > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-gray-400 rounded-full border-2 border-white"></span>
          )}
        </button>
      </div>

      {/* Right-side notification panel - Responsive width */}
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
            
            {/* Side panel - Responsive width */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
              className="fixed right-0 top-0 h-full w-full sm:w-96 md:w-96 lg:w-96 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Notifications</h2>
                    {notificationStats.unread > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                        {notificationStats.unread}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2 text-sm sm:text-base">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-gray-400 mb-4">
                      <Bell className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base">No notifications available.</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">Notifications will appear here when available.</p>
                  </div>
                ) : (
                  <>
                    {/* Header with stats */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">{notificationStats.total}</span> total
                        <span className="mx-2">•</span>
                        <span className="font-medium text-blue-600">{notificationStats.unread}</span> unread
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        💡 <strong>Tip:</strong> Click on any notification to open the related chat
                      </p>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      {notifications.map((notification: Notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md group ${
                            notification.isRead 
                              ? 'border-gray-200 bg-white hover:bg-gray-50' 
                              : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                          } ${clickingNotification === notification.id ? 'opacity-75 pointer-events-none' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base">{notification.title}</h3>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                                {clickingNotification === notification.id && (
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-500"></div>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 group-hover:text-gray-700 transition-colors">{notification.message}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                                {notification.chatName && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                                      {notification.chatName}
                                      <span className="ml-1 text-xs">(Click to open)</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering the notification click
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Mark as read"
                                >
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
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
      
      {/* Mobile Sidebar - Collapsed (icon-only) sidebar in normal flow */}
      {isMobileSidebarCollapsed && (
        <div className="lg:hidden">
          <Sidebar
            user={user}
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={(chatId) => {
              selectChat(chatId);
              setIsMobileSidebarCollapsed(true);
            }}
            onCreateChat={() => {
              setIsCreatingChat(true);
              setIsMobileSidebarCollapsed(true);
            }}
            onDeleteChat={deleteChat}
            onPinChat={pinChat}
            onSetChatStatus={setChatStatus}
            onLogout={logout}
            onOpenSearch={openSearch}
            onClose={() => setIsSidebarOpen(false)}
            isMobileCollapsed={true}
            onToggleMobileCollapse={toggleMobileSidebar}
          />
        </div>
      )}

      {/* Mobile Sidebar - Expanded (overlapping) sidebar as fixed overlay */}
      {!isMobileSidebarCollapsed && (
        <>
          <div className="lg:hidden">
            <Sidebar
              user={user}
              chats={chats}
              currentChatId={currentChatId}
              onSelectChat={(chatId) => {
                selectChat(chatId);
                setIsMobileSidebarCollapsed(true);
              }}
              onCreateChat={() => {
                setIsCreatingChat(true);
                setIsMobileSidebarCollapsed(true);
              }}
              onDeleteChat={deleteChat}
              onPinChat={pinChat}
              onSetChatStatus={setChatStatus}
              onLogout={logout}
              onOpenSearch={openSearch}
              onClose={() => setIsSidebarOpen(false)}
              isMobileCollapsed={false}
              onToggleMobileCollapse={toggleMobileSidebar}
            />
          </div>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileSidebarCollapsed(true)}
          />
        </>
      )}

      {/* Desktop/Tablet Sidebar - Only visible on lg and above */}
      <div className="hidden lg:block">
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
      </div>

      {/* Chat Area - Responsive layout with mobile padding */}
      <div className={`flex flex-col flex-1 h-full min-h-0 w-full`}>
        <div className="flex-1 flex flex-col min-h-0">
          <ChatArea 
            chat={currentChat || null} 
            onSendMessage={sendMessage} 
            isTyping={isTyping}
            isMobileSidebarExpanded={!isMobileSidebarCollapsed}
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
        onCreateChat={({ name, instagramUsername, executiveInstagramUsername, occupation, product, gender, profession }) => {
          createChat(name, instagramUsername, executiveInstagramUsername, occupation, product, gender, profession);
          setIsCreatingChat(false);
        }}
      />
    </motion.div>
  );
};
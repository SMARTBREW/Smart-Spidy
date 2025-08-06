import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, User, LogOut, Trash2, X, Search, Pin, MoreVertical, Star, Shield, Settings, Filter, ChevronDown } from 'lucide-react';
import { LogoutModal } from './LogoutModal';
import { Chat, User as UserType } from '../types';
import { CreateChatModal } from './CreateChatModal';

// TypeScript type definitions
// Remove the local Chat and UserType interfaces
// interface Chat {
//   id: string;
//   name: string;
//   messages: Array<{
//     id: string;
//     content: string;
//     timestamp: Date;
//     sender: 'user' | 'assistant';
//   }>;
//   createdAt: Date;
//   pinned: boolean;
//   pinnedAt: Date | null;
//   status: 'green' | 'yellow' | 'red' | 'gold' | null;
// }

// type UserRole = 'admin' | 'user';

// interface UserType {
//   id: string;
//   name: string;
//   email: string;
//   avatar?: string;
//   role?: UserRole;
// }

// Props interface with detailed TypeScript typing
interface SidebarProps {
  user: UserType;
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onLogout: () => void;
  onOpenSearch?: () => void;
  onClose?: () => void;
  onPinChat: (chatId: string, pinned: boolean) => void;
  onSetChatStatus: (chatId: string, status: 'green' | 'yellow' | 'red' | 'gold' | null) => void;
  isMobileCollapsed?: boolean;
  onToggleMobileCollapse?: () => void;
}

// Animation transition types
interface TransitionConfig {
  type: "spring";
  stiffness: number;
  damping: number;
  mass: number;
}

const SidebarComponent: React.FC<SidebarProps> = ({
  user,
  chats,
  currentChatId,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onLogout,
  onOpenSearch,
  onClose,
  onPinChat,
  onSetChatStatus,
  isMobileCollapsed,
  onToggleMobileCollapse,
}) => {
  const navigate = useNavigate();
  
  // State with explicit TypeScript types
  const [search, setSearch] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sortBy, setSortBy] = useState<'all' | 'green' | 'yellow' | 'red' | 'fundraiser' | 'fundraiser-green' | 'fundraiser-yellow' | 'fundraiser-red'>('all');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  // Use useRef for context menu state that doesn't need to trigger re-renders
  const contextMenuRef = useRef<{ x: number; y: number; chatId: string } | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);

  // Memoized computed values to avoid recalculation on every render
  const isAdmin = useMemo(() => user.role === 'admin', [user.role]);
  
  const filteredChats = useMemo(() => {
    let filtered = chats.filter(chat => 
      chat.name.toLowerCase().includes(search.toLowerCase())
    );

    // Apply sorting filter
    if (sortBy !== 'all') {
      filtered = filtered.filter(chat => {
        if (sortBy === 'fundraiser') {
          return chat.is_gold === true;
        }
        if (sortBy === 'fundraiser-green') {
          return chat.is_gold === true && chat.status === 'green';
        }
        if (sortBy === 'fundraiser-yellow') {
          return chat.is_gold === true && chat.status === 'yellow';
        }
        if (sortBy === 'fundraiser-red') {
          return chat.is_gold === true && chat.status === 'red';
        }
        // For regular status filters (green, yellow, red), exclude fundraisers
        if (sortBy === 'green' || sortBy === 'yellow' || sortBy === 'red') {
          return chat.status === sortBy && chat.is_gold === false;
        }
        return chat.status === sortBy;
      });
    }

    return filtered;
  }, [chats, search, sortBy]);

  const pinnedChats = useMemo(() => {
    return filteredChats.filter(chat => chat.pinned);
  }, [filteredChats]);

  const unpinnedChats = useMemo(() => {
    return filteredChats.filter(chat => !chat.pinned);
  }, [filteredChats]);

  // Event handlers with proper TypeScript typing and useCallback optimization
  const handleDeleteChat = useCallback((e: React.MouseEvent<HTMLButtonElement>, chatId: string): void => {
    e.stopPropagation();
    onDeleteChat(chatId);
  }, [onDeleteChat]);

  const toggleSidebar = useCallback((): void => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  const expandSidebar = useCallback((): void => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  }, [isCollapsed]);

  // On mobile, handle collapsed state based on props
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const shouldShowCollapsed = isMobile ? isMobileCollapsed : isCollapsed;

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAdminPanelClick = useCallback((): void => {
    navigate('/admin');
  }, [navigate]);

  const handleLogoutClick = useCallback((): void => {
    setShowLogoutModal(true);
  }, []);

  const handleCloseLogoutModal = useCallback((): void => {
    setShowLogoutModal(false);
  }, []);

  // Smooth transition configuration with proper typing
  const sidebarTransition: TransitionConfig = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.8
  };

  const contentTransition: TransitionConfig = {
    type: "spring",
    stiffness: 400,
    damping: 35,
    mass: 0.6
  };

  // Context menu handlers with useCallback
  const handleContextMenu = useCallback((e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    contextMenuRef.current = { x: e.clientX, y: e.clientY, chatId };
    setContextMenuVisible(true);
  }, []);

  const closeContextMenu = useCallback(() => setContextMenuVisible(false), []);
  
  // Close dropdown when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    if (showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortDropdown]);

  return (
    <motion.div
      initial={false}
      animate={{ 
        width: shouldShowCollapsed ? 72 : (isMobile ? 280 : 320),
      }}
      transition={sidebarTransition}
      className={`h-screen flex flex-col border-r border-gray-300 shadow-lg bg-white overflow-hidden ${isMobile && !shouldShowCollapsed ? 'fixed left-0 top-0 z-40' : 'relative z-20'}`}
      style={{ minWidth: 72, maxWidth: 400 }}
    >
      {/* Header Section */}
      <div className={`flex flex-col items-center w-full transition-all duration-300 ${
        shouldShowCollapsed ? 'py-2 min-h-[100px]' : 'py-3 border-b border-gray-300 min-h-[68.5px]'
      }`}>
        {shouldShowCollapsed ? (
          // Collapsed Header
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={contentTransition}
            className="flex flex-col items-center w-full"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isMobile && onToggleMobileCollapse ? onToggleMobileCollapse : expandSidebar}
              className="w-10 h-10 flex items-center justify-center mb-4 transition-all duration-200"
              title={isMobile ? "Toggle mobile sidebar" : "Expand Sidebar"}
            >
              <img 
                src="/smartspidy.png" 
                alt="𝐒𝐌𝐀𝐑𝐓 𝐒𝐏𝐈𝐃𝐘 Logo" 
                className="w-8 h-8 rounded-lg"
              />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateChat}
              className="w-10 h-10 flex items-center justify-center mb-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200"
              title="New Chat"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                expandSidebar();
                if (onOpenSearch) onOpenSearch();
              }}
              className="w-10 h-10 flex items-center justify-center mb-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </motion.button>

            {/* Admin Panel Button - Collapsed */}
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdminPanelClick}
                className="w-10 h-10 flex items-center justify-center mb-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200"
                title="Admin Panel"
              >
                <Shield className="w-5 h-5" />
              </motion.button>
            )}
          </motion.div>
        ) : (
          // Expanded Header
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={contentTransition}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3 pl-4">
              <img 
                src="/smartspidy.png" 
                alt="𝐒𝐌𝐀𝐑𝐓 𝐒𝐏𝐈𝐃𝐘 Logo" 
                className="w-10 h-10 rounded-lg"
              />
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...contentTransition, delay: 0.1 }}
                className="text-2xl font-bold text-black"
              >
                𝐒𝐌𝐀𝐑𝐓 𝐒𝐏𝐈𝐃𝐘
              </motion.h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={isMobile && onToggleMobileCollapse ? onToggleMobileCollapse : toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              aria-label={isMobile ? "Toggle mobile sidebar" : "Collapse sidebar"}
            >
              <X className="w-5 h-5 text-gray-700" />
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* New Chat Button and Search Input */}
      <AnimatePresence>
        {!shouldShowCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={contentTransition}
            className="w-full"
          >
            <div className="p-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateChat}
                className="w-full bg-black text-white py-2 px-2 rounded-lg font-medium flex items-center justify-center gap-1 text-sm hover:bg-gray-800 transition-all duration-200"
              >
                <Plus className="w-3 h-3" />
                Start Conversation
              </motion.button>
            </div>
            
            {/* Admin Panel Button - Expanded */}
            {isAdmin && (
              <div className="px-2 pb-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdminPanelClick}
                  className="w-full flex items-center justify-center gap-1 py-2 px-2 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-all duration-200"
                >
                  <Shield className="w-3 h-3" />
                  Admin Panel
                </motion.button>
              </div>
            )}
            
            <div className="px-2 pb-1">
              <motion.input
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...contentTransition, delay: 0.1 }}
                type="text"
                readOnly
                placeholder="Search chats, questions, answers..."
                className="w-full p-1.5 bg-gray-100 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer text-sm"
                onFocus={onOpenSearch}
                onClick={onOpenSearch}
              />
            </div>
            
            {/* Sorting Dropdown */}
            <div className="px-2 pb-1 relative" ref={dropdownRef}>
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...contentTransition, delay: 0.15 }}
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="w-full flex items-center justify-between p-1.5 bg-gray-100 border border-gray-300 rounded-lg text-black hover:bg-gray-200 transition-all duration-200 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3" />
                  <span>
                    {sortBy === 'all' && 'All Chats'}
                    {sortBy === 'green' && 'Green Status'}
                    {sortBy === 'yellow' && 'Yellow Status'}
                    {sortBy === 'red' && 'Red Status'}
                    {sortBy === 'fundraiser' && 'All Fundraisers'}
                    {sortBy === 'fundraiser-green' && 'Fundraiser (Green)'}
                    {sortBy === 'fundraiser-yellow' && 'Fundraiser (Yellow)'}
                    {sortBy === 'fundraiser-red' && 'Fundraiser (Red)'}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
              </motion.button>
              
              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-2 right-2 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => { setSortBy('all'); setShowSortDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          sortBy === 'all' ? 'bg-gray-100 text-black font-medium' : 'text-gray-700'
                        }`}
                      >
                        All Chats
                      </button>
                      <button
                        onClick={() => { setSortBy('green'); setShowSortDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                          sortBy === 'green' ? 'bg-gray-100 text-black font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Green Status
                      </button>
                      <button
                        onClick={() => { setSortBy('yellow'); setShowSortDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                          sortBy === 'yellow' ? 'bg-gray-100 text-black font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                        Yellow Status
                      </button>
                      <button
                        onClick={() => { setSortBy('red'); setShowSortDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                          sortBy === 'red' ? 'bg-gray-100 text-black font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Red Status
                      </button>
                      <button
                        onClick={() => { setSortBy('fundraiser'); setShowSortDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                          sortBy === 'fundraiser' ? 'bg-gray-100 text-black font-medium' : 'text-gray-700'
                        }`}
                      >
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        All Fundraisers
                      </button>
                      <button
                        onClick={() => { setSortBy('fundraiser-green'); setShowSortDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                          sortBy === 'fundraiser-green' ? 'bg-gray-100 text-black font-medium' : 'text-gray-700'
                        }`}
                      >
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Fundraiser (Green)
                      </button>
                      <button
                        onClick={() => { setSortBy('fundraiser-yellow'); setShowSortDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                          sortBy === 'fundraiser-yellow' ? 'bg-gray-100 text-black font-medium' : 'text-gray-700'
                        }`}
                      >
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                        Fundraiser (Yellow)
                      </button>
                      <button
                        onClick={() => { setSortBy('fundraiser-red'); setShowSortDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                          sortBy === 'fundraiser-red' ? 'bg-gray-100 text-black font-medium' : 'text-gray-700'
                        }`}
                      >
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Fundraiser (Red)
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat List */}
      <AnimatePresence>
        {!shouldShowCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={contentTransition}
            className="flex-1 overflow-y-auto"
          >
            <div className="p-2 space-y-1">
              <AnimatePresence>
                {/* Pinned Chats */}
                {pinnedChats.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-medium mb-1 px-1">
                      <Pin className="w-2.5 h-2.5" />
                      PINNED
                    </div>
                    {pinnedChats
                      .map((chat, index) => (
                        <motion.div
                          key={`pinned-${chat.id || chat.name || `chat-${index}`}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ ...contentTransition, delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          className={`group relative p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            currentChatId === chat.id
                              ? 'bg-gray-100 text-black'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => onSelectChat(chat.id)}
                          onContextMenu={e => handleContextMenu(e, chat.id)}
                        >
                          <div className="flex items-center gap-2">
                            {/* Color dot or golden star */}
                            {(chat.is_gold || chat.status === 'gold') ? (
                              <>
                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                {chat.status && chat.status !== 'gold' && (
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full border border-gray-300 ml-0.5 ${
                                      chat.status === 'green'
                                        ? 'bg-green-500'
                                        : chat.status === 'yellow'
                                        ? 'bg-yellow-400'
                                        : chat.status === 'red'
                                        ? 'bg-red-500'
                                        : ''
                                    }`}
                                  />
                                )}
                              </>
                            ) : chat.status ? (
                              <span
                                className={`w-2.5 h-2.5 rounded-full border border-gray-300 ${
                                  chat.status === 'green'
                                    ? 'bg-green-500'
                                    : chat.status === 'yellow'
                                    ? 'bg-yellow-400'
                                    : chat.status === 'red'
                                    ? 'bg-red-500'
                                    : ''
                                }`}
                              />
                            ) : null}
                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0 flex items-center gap-0.5">
                              <p className="font-medium truncate text-sm">{chat.name}</p>
                              <Pin
                                className={`w-3.5 h-3.5 ml-0.5 ${currentChatId === chat.id ? 'text-black' : 'text-yellow-600'}`}
                              />
                            </div>
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ opacity: 1, scale: 1 }}
                              onClick={e => handleDeleteChat(e, chat.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200 p-0.5"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </motion.button>
                            <button
                              className="ml-1 p-0.5 rounded hover:bg-gray-200"
                              onClick={e => { e.stopPropagation(); handleContextMenu(e, chat.id); }}
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}

                {/* Other Chats */}
                {unpinnedChats.length > 0 && (
                  <div>
                    {pinnedChats.length > 0 && (
                      <div className="text-xs text-gray-500 font-medium mb-1 px-1">
                        RECENT
                      </div>
                    )}
                    {unpinnedChats
                      .map((chat, index) => (
                        <motion.div
                          key={`unpinned-${chat.id || chat.name || `chat-${index}`}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ ...contentTransition, delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          className={`group relative p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            currentChatId === chat.id
                              ? 'bg-gray-100 text-black'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => onSelectChat(chat.id)}
                          onContextMenu={e => handleContextMenu(e, chat.id)}
                        >
                          <div className="flex items-center gap-2">
                            {/* Color dot or golden star */}
                            {(chat.is_gold || chat.status === 'gold') ? (
                              <>
                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                {chat.status && chat.status !== 'gold' && (
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full border border-gray-300 ml-0.5 ${
                                      chat.status === 'green'
                                        ? 'bg-green-500'
                                        : chat.status === 'yellow'
                                        ? 'bg-yellow-400'
                                        : chat.status === 'red'
                                        ? 'bg-red-500'
                                        : ''
                                    }`}
                                  />
                                )}
                              </>
                            ) : chat.status ? (
                              <span
                                className={`w-2.5 h-2.5 rounded-full border border-gray-300 ${
                                  chat.status === 'green'
                                    ? 'bg-green-500'
                                    : chat.status === 'yellow'
                                    ? 'bg-yellow-400'
                                    : chat.status === 'red'
                                    ? 'bg-red-500'
                                    : ''
                                }`}
                              />
                            ) : null}
                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0 flex items-center gap-0.5">
                              <p className="font-medium truncate text-sm">{chat.name}</p>
                            </div>
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ opacity: 1, scale: 1 }}
                              onClick={e => handleDeleteChat(e, chat.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200 p-0.5"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </motion.button>
                            <button
                              className="ml-1 p-0.5 rounded hover:bg-gray-200"
                              onClick={e => { e.stopPropagation(); handleContextMenu(e, chat.id); }}
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}

                {/* Empty State */}
                {chats.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={contentTransition}
                    className="text-center py-8"
                  >
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">No chats yet</p>
                    <p className="text-gray-400 text-[10px]">Create your first chat to get started</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Context Menu */}
            {contextMenuVisible && contextMenuRef.current && (
              <div
                className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-1 px-2"
                style={{ top: contextMenuRef.current.y, left: contextMenuRef.current.x }}
                onMouseLeave={closeContextMenu}
              >
                <button
                  className="block w-full text-left px-1.5 py-0.5 hover:bg-gray-100 rounded text-xs"
                  onClick={() => { if (contextMenuRef.current?.chatId) onPinChat(contextMenuRef.current.chatId, true); closeContextMenu(); }}
                >Pin Chat</button>
                <button
                  className="block w-full text-left px-1.5 py-0.5 hover:bg-gray-100 rounded text-xs"
                  onClick={() => { if (contextMenuRef.current?.chatId) onPinChat(contextMenuRef.current.chatId, false); closeContextMenu(); }}
                >Unpin Chat</button>
                <div className="border-t my-1" />
                <div className="text-xs text-gray-500 px-1.5 py-0.5">Set Status</div>
                <button
                  className="block w-full text-left px-1.5 py-0.5 hover:bg-green-100 rounded text-xs"
                  onClick={() => { if (contextMenuRef.current?.chatId) onSetChatStatus(contextMenuRef.current.chatId, 'green'); closeContextMenu(); }}
                >Green (Healthy)</button>
                <button
                  className="block w-full text-left px-1.5 py-0.5 hover:bg-yellow-100 rounded text-xs"
                  onClick={() => { if (contextMenuRef.current?.chatId) onSetChatStatus(contextMenuRef.current.chatId, 'yellow'); closeContextMenu(); }}
                >Yellow (50-50)</button>
                <button
                  className="block w-full text-left px-1.5 py-0.5 hover:bg-red-100 rounded text-xs"
                  onClick={() => { if (contextMenuRef.current?.chatId) onSetChatStatus(contextMenuRef.current.chatId, 'red'); closeContextMenu(); }}
                >Red (Low chance)</button>
                <button
                  className="block w-full text-left px-1.5 py-0.5 hover:bg-yellow-100 rounded flex items-center gap-1 text-xs"
                  onClick={() => { if (contextMenuRef.current?.chatId) onSetChatStatus(contextMenuRef.current.chatId, 'gold'); closeContextMenu(); }}
                ><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> Set as Gold (Fundraiser Done)</button>
                <button
                  className="block w-full text-left px-1.5 py-0.5 hover:bg-gray-100 rounded text-xs"
                  onClick={() => { if (contextMenuRef.current?.chatId) onSetChatStatus(contextMenuRef.current.chatId, null); closeContextMenu(); }}
                >Clear Status</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Profile Section */}
      <div className="w-full mt-auto">
        {shouldShowCollapsed ? (
          // Collapsed Profile
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={contentTransition}
            className="flex flex-col items-center mb-4 w-full"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mb-1 relative"
              title={`${user.name}${isAdmin ? ` (${user.role})` : ''}`}
            >
              <User className="w-4 h-4 text-white" />
              {isAdmin && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-600 rounded-full border border-white flex items-center justify-center">
                  <Shield className="w-1.5 h-1.5 text-white" />
                </div>
              )}
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogoutClick}
              className="w-8 h-8 flex items-center justify-center bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-3 h-3" />
            </motion.button>
          </motion.div>
        ) : (
          // Expanded Profile
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={contentTransition}
              className="p-2 border-t border-gray-300"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...contentTransition, delay: 0.1 }}
                className="flex items-center gap-2 mb-2 p-2 bg-gray-100 rounded-lg"
              >
                <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center relative">
                  <User className="w-3 h-3 text-white" />
                  {isAdmin && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-600 rounded-full border border-white flex items-center justify-center">
                      <Shield className="w-1.5 h-1.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-black font-medium text-xs">{user.name}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-gray-600 text-[10px]">{user.email}</p>
                    {isAdmin && (
                      <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                        {user.role}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...contentTransition, delay: 0.15 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogoutClick}
                className="w-full flex items-center justify-center gap-1 py-2 px-2 bg-gray-700 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-all duration-200"
              >
                <LogOut className="w-3 h-3" />
                Logout
              </motion.button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleCloseLogoutModal}
        onConfirm={onLogout}
      />
    </motion.div>
  );
};

export const Sidebar = React.memo(SidebarComponent);
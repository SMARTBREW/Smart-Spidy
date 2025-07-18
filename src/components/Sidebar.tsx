import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, User, LogOut, Trash2, X, Search, Pin, MoreVertical, Star, Shield, Settings } from 'lucide-react';
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
}

// Animation transition types
interface TransitionConfig {
  type: "spring";
  stiffness: number;
  damping: number;
  mass: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
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
}) => {
  const navigate = useNavigate();
  
  // State with explicit TypeScript types
  const [search, setSearch] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chatId: string } | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Check if user is admin
  const isAdmin = user.role === 'admin';

  // Event handlers with proper TypeScript typing
  const handleDeleteChat = (e: React.MouseEvent<HTMLButtonElement>, chatId: string): void => {
    e.stopPropagation();
    onDeleteChat(chatId);
  };

  const toggleSidebar = (): void => {
    setIsCollapsed(!isCollapsed);
  };

  const expandSidebar = (): void => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  };

  const handleAdminPanelClick = (): void => {
    navigate('/admin');
  };

  const handleLogoutClick = (): void => {
    setShowLogoutModal(true);
  };

  const handleCloseLogoutModal = (): void => {
    setShowLogoutModal(false);
  };

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

  // Split chats into pinned and others
  const pinnedChats = chats
    .filter(chat => chat.pinned)
    .sort((a, b) => {
      if (!a.pinnedAt && !b.pinnedAt) return 0;
      if (!a.pinnedAt) return 1;
      if (!b.pinnedAt) return -1;
      return new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime();
    });
  const otherChats = chats.filter(chat => !chat.pinned);

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  };
  const closeContextMenu = () => setContextMenu(null);

  return (
    <motion.div
      initial={false}
      animate={{ 
        width: isCollapsed ? 72 : 320,
      }}
      transition={sidebarTransition}
      className={`h-screen flex flex-col border-r border-gray-300 shadow-lg bg-white relative z-20 overflow-hidden`}
      style={{ minWidth: 72, maxWidth: 400 }}
    >
      {/* Header Section */}
      <div className={`flex flex-col items-center w-full transition-all duration-300 ${
        isCollapsed ? 'py-4 min-h-[160px]' : 'p-6 border-b border-gray-300 min-h-[120px]'
      }`}>
        {isCollapsed ? (
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
              onClick={expandSidebar}
              className="w-10 h-10 flex items-center justify-center mb-4 transition-all duration-200"
              title="Expand Sidebar"
            >
              <img 
                src="https://i.pinimg.com/736x/42/b1/a9/42b1a984eb088e65428a7ec727578ece.jpg" 
                alt="Smart Spidy" 
                className="w-10 h-10 rounded-lg"
              />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isCollapsed) {
                  expandSidebar();
                } else {
                  onCreateChat();
                }
              }}
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
            <div className="flex items-center gap-3">
              <img 
                src="https://i.pinimg.com/736x/42/b1/a9/42b1a984eb088e65428a7ec727578ece.jpg" 
                alt="Smart Spidy" 
                className="w-10 h-10 rounded-lg"
              />
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...contentTransition, delay: 0.1 }}
                className="text-2xl font-bold text-black"
              >
                Smart Spidy
              </motion.h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              aria-label="Collapse sidebar"
            >
              <X className="w-5 h-5 text-gray-700" />
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* New Chat Button and Search Input */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={contentTransition}
            className="w-full"
          >
            <div className="p-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateChat}
                className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Start Conversation
              </motion.button>
            </div>
            
            {/* Admin Panel Button - Expanded */}
            {isAdmin && (
              <div className="px-4 pb-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdminPanelClick}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </motion.button>
              </div>
            )}
            
            <div className="px-4 pb-2">
              <motion.input
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...contentTransition, delay: 0.1 }}
                type="text"
                readOnly
                placeholder="Search chats, questions, answers..."
                className="w-full p-2 bg-gray-100 border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
                onFocus={onOpenSearch}
                onClick={onOpenSearch}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat List */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={contentTransition}
            className="flex-1 overflow-y-auto"
          >
            <div className="p-4 space-y-2">
              <AnimatePresence>
                {/* Pinned Chats */}
                {pinnedChats.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2 px-2">
                      <Pin className="w-3 h-3" />
                      PINNED
                    </div>
                    {pinnedChats
                      .filter(chat => chat.name.toLowerCase().includes(search.toLowerCase()))
                      .map((chat, index) => (
                        <motion.div
                          key={chat.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ ...contentTransition, delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                            currentChatId === chat.id
                              ? 'bg-gray-100 text-black'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => onSelectChat(chat.id)}
                          onContextMenu={e => handleContextMenu(e, chat.id)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Color dot or golden star */}
                            {chat.status === 'gold' ? (
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            ) : chat.status ? (
                              <span
                                className={`w-3 h-3 rounded-full border border-gray-300 ${
                                  chat.status === 'green' ? 'bg-green-500' : chat.status === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
                                }`}
                              />
                            ) : null}
                            <MessageSquare className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0 flex items-center gap-1">
                              <p className="font-medium truncate">{chat.name}</p>
                              <Pin
                                className={`w-4 h-4 ml-1 ${currentChatId === chat.id ? 'text-black' : 'text-yellow-600'}`}
                              />
                            </div>
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ opacity: 1, scale: 1 }}
                              onClick={e => handleDeleteChat(e, chat.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </motion.button>
                            <button
                              className="ml-2 p-1 rounded hover:bg-gray-200"
                              onClick={e => { e.stopPropagation(); handleContextMenu(e, chat.id); }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}

                {/* Other Chats */}
                {otherChats.length > 0 && (
                  <div>
                    {pinnedChats.length > 0 && (
                      <div className="text-xs text-gray-500 font-medium mb-2 px-2">
                        RECENT
                      </div>
                    )}
                    {otherChats
                      .filter(chat => chat.name.toLowerCase().includes(search.toLowerCase()))
                      .map((chat, index) => (
                        <motion.div
                          key={chat.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ ...contentTransition, delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                            currentChatId === chat.id
                              ? 'bg-gray-100 text-black'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => onSelectChat(chat.id)}
                          onContextMenu={e => handleContextMenu(e, chat.id)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Color dot or golden star */}
                            {chat.status === 'gold' ? (
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            ) : chat.status ? (
                              <span
                                className={`w-3 h-3 rounded-full border border-gray-300 ${
                                  chat.status === 'green' ? 'bg-green-500' : chat.status === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
                                }`}
                              />
                            ) : null}
                            <MessageSquare className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0 flex items-center gap-1">
                              <p className="font-medium truncate">{chat.name}</p>
                            </div>
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ opacity: 1, scale: 1 }}
                              onClick={e => handleDeleteChat(e, chat.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </motion.button>
                            <button
                              className="ml-2 p-1 rounded hover:bg-gray-200"
                              onClick={e => { e.stopPropagation(); handleContextMenu(e, chat.id); }}
                            >
                              <MoreVertical className="w-4 h-4" />
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
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No chats yet</p>
                    <p className="text-gray-400 text-xs">Create your first chat to get started</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Context Menu */}
            {contextMenu && (
              <div
                className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-2 px-3"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onMouseLeave={closeContextMenu}
              >
                <button
                  className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                  onClick={() => { onPinChat(contextMenu.chatId, true); closeContextMenu(); }}
                >Pin Chat</button>
                <button
                  className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                  onClick={() => { onPinChat(contextMenu.chatId, false); closeContextMenu(); }}
                >Unpin Chat</button>
                <div className="border-t my-1" />
                <div className="text-xs text-gray-500 px-2 py-1">Set Status</div>
                <button
                  className="block w-full text-left px-2 py-1 hover:bg-green-100 rounded"
                  onClick={() => { onSetChatStatus(contextMenu.chatId, 'green'); closeContextMenu(); }}
                >Green (Healthy)</button>
                <button
                  className="block w-full text-left px-2 py-1 hover:bg-yellow-100 rounded"
                  onClick={() => { onSetChatStatus(contextMenu.chatId, 'yellow'); closeContextMenu(); }}
                >Yellow (50-50)</button>
                <button
                  className="block w-full text-left px-2 py-1 hover:bg-red-100 rounded"
                  onClick={() => { onSetChatStatus(contextMenu.chatId, 'red'); closeContextMenu(); }}
                >Red (Low chance)</button>
                <button
                  className="block w-full text-left px-2 py-1 hover:bg-yellow-100 rounded flex items-center gap-2"
                  onClick={() => { onSetChatStatus(contextMenu.chatId, 'gold'); closeContextMenu(); }}
                ><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> Fundraiser Done</button>
                <button
                  className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                  onClick={() => { onSetChatStatus(contextMenu.chatId, null); closeContextMenu(); }}
                >Clear Status</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Profile Section */}
      <div className="w-full mt-auto">
        {isCollapsed ? (
          // Collapsed Profile
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={contentTransition}
            className="flex flex-col items-center mb-4 w-full"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mb-2 relative"
              title={`${user.name}${isAdmin ? ` (${user.role})` : ''}`}
            >
              <User className="w-5 h-5 text-white" />
              {isAdmin && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full border border-white flex items-center justify-center">
                  <Shield className="w-2 h-2 text-white" />
                </div>
              )}
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogoutClick}
              className="w-10 h-10 flex items-center justify-center bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
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
              className="p-4 border-t border-gray-300"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...contentTransition, delay: 0.1 }}
                className="flex items-center gap-3 mb-3 p-3 bg-gray-100 rounded-xl"
              >
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center relative">
                  <User className="w-4 h-4 text-white" />
                  {isAdmin && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full border border-white flex items-center justify-center">
                      <Shield className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-black font-medium text-sm">{user.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600 text-xs">{user.email}</p>
                    {isAdmin && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
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
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
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
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, User, LogOut, Trash2 } from 'lucide-react';
import { Chat, User as UserType } from '../types';

interface SidebarProps {
  user: UserType;
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: (name: string) => void;
  onDeleteChat: (chatId: string) => void;
  onLogout: () => void;
  onOpenSearch?: () => void;
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
}) => {
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [chatName, setChatName] = useState('');
  const [search, setSearch] = useState('');

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatName.trim()) {
      onCreateChat(chatName.trim());
      setChatName('');
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    onDeleteChat(chatId);
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-80 bg-white h-screen flex flex-col border-r border-gray-300"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-300">
        <div className="flex items-center gap-3">
          <img src="https://i.pinimg.com/736x/42/b1/a9/42b1a984eb088e65428a7ec727578ece.jpg" alt="Smart Spidy" className="w-10 h-10 rounded-lg" />
          <h1 className="text-2xl font-bold text-black">Smart Spidy</h1>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCreatingChat(true)}
          className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </motion.button>
      </div>

      {/* Search Input */}
      <div className="px-4 pb-2">
        <input
          type="text"
          readOnly
          placeholder="Search chats, questions, answers..."
          className="w-full p-2 bg-gray-100 border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
          onFocus={onOpenSearch}
          onClick={onOpenSearch}
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          <AnimatePresence>
            {chats
              .filter(chat => chat.name.toLowerCase().includes(search.toLowerCase()))
              .map((chat) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  whileHover={{ scale: 1.02 }}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    currentChatId === chat.id
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{chat.name}</p>
                      <p className="text-xs opacity-70 truncate">
                        {chat.messages.length} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Chat Modal */}
      <AnimatePresence>
        {isCreatingChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg"
            >
              <h3 className="text-black font-semibold mb-4">Create New Chat</h3>
              <form onSubmit={handleCreateChat}>
                <input
                  type="text"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  placeholder="Enter chat name"
                  className="w-full p-3 bg-gray-100 border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 mb-4"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingChat(false);
                      setChatName('');
                    }}
                    className="flex-1 py-2 px-4 bg-gray-300 text-black rounded-xl hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors duration-200"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Info Above Logout */}
      <div className="p-4 border-t border-gray-300">
        <div className="flex items-center gap-3 mb-3 p-3 bg-gray-100 rounded-xl">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-black font-medium text-sm">{user.name}</p>
            <p className="text-gray-600 text-xs">{user.email}</p>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </motion.div>
  );
};
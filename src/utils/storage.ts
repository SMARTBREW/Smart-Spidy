import { User, Chat } from '../types';

const STORAGE_KEYS = {
  USER: 'chat-app-user',
  CHATS: 'chat-app-chats',
  CURRENT_CHAT: 'chat-app-current-chat',
};

export const storage = {
  getUser: (): User | null => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  getChats: (): Chat[] => {
    const chats = localStorage.getItem(STORAGE_KEYS.CHATS);
    return chats ? JSON.parse(chats) : [];
  },

  setChats: (chats: Chat[]) => {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  },

  getCurrentChatId: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT);
  },

  setCurrentChatId: (chatId: string | null) => {
    if (chatId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT, chatId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
    }
  },

  clear: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
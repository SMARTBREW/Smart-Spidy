import { useState, useEffect, useCallback } from 'react';
import { User, Chat, Message, AppState } from '../types';
import { storage } from '../utils/storage';

export const useChat = () => {
  const [state, setState] = useState<AppState>({
    user: null,
    chats: [],
    currentChatId: null,
    isLoading: true,
  });

  useEffect(() => {
    const user = storage.getUser();
    const chats = storage.getChats();
    const currentChatId = storage.getCurrentChatId();

    setState({
      user,
      chats,
      currentChatId,
      isLoading: false,
    });
  }, []);

  const login = useCallback((email: string, name: string) => {
    const user: User = {
      id: crypto.randomUUID(),
      email,
      name,
    };
    
    storage.setUser(user);
    setState(prev => ({ ...prev, user }));
  }, []);

  const logout = useCallback(() => {
    storage.clear();
    setState({
      user: null,
      chats: [],
      currentChatId: null,
      isLoading: false,
    });
  }, []);

  const createChat = useCallback((name: string) => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      name,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setState(prev => {
      const updatedChats = [...prev.chats, newChat];
      storage.setChats(updatedChats);
      storage.setCurrentChatId(newChat.id);
      return {
        ...prev,
        chats: updatedChats,
        currentChatId: newChat.id,
      };
    });

    return newChat.id;
  }, []);

  const selectChat = useCallback((chatId: string) => {
    setState(prev => ({ ...prev, currentChatId: chatId }));
    storage.setCurrentChatId(chatId);
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!state.currentChatId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      content: `This is a demo response to: "${content}"`,
      sender: 'assistant',
      timestamp: new Date(),
    };

    setState(prev => {
      const updatedChats = prev.chats.map(chat => {
        if (chat.id === state.currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, userMessage, assistantMessage],
            updatedAt: new Date(),
          };
        }
        return chat;
      });

      storage.setChats(updatedChats);
      return { ...prev, chats: updatedChats };
    });
  }, [state.currentChatId]);

  const deleteChat = useCallback((chatId: string) => {
    setState(prev => {
      const updatedChats = prev.chats.filter(chat => chat.id !== chatId);
      const newCurrentChatId = prev.currentChatId === chatId 
        ? (updatedChats.length > 0 ? updatedChats[0].id : null)
        : prev.currentChatId;

      storage.setChats(updatedChats);
      storage.setCurrentChatId(newCurrentChatId);

      return {
        ...prev,
        chats: updatedChats,
        currentChatId: newCurrentChatId,
      };
    });
  }, []);

  const currentChat = state.chats.find(chat => chat.id === state.currentChatId);

  return {
    ...state,
    currentChat,
    login,
    logout,
    createChat,
    selectChat,
    sendMessage,
    deleteChat,
  };
};
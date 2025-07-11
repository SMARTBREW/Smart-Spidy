import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Chat, Message, AppState } from '../types';
import { storage } from '../utils/storage';
import { geminiService } from '../services/gemini';

export const useChat = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>({
    user: null,
    chats: [],
    currentChatId: null,
    isLoading: true,
  });

  const [isTyping, setIsTyping] = useState(false);

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

  const login = useCallback((email: string, password: string, role: 'user' | 'admin') => {
    // For demo purposes, we'll create users with predefined roles
    // In a real app, this would validate credentials with a backend
    const user: User = {
      id: crypto.randomUUID(),
      email,
      name: email.split('@')[0], // Use part before @ as name
      role: role, // Only 'admin' or 'user'
    };
    
    storage.setUser(user);
    setState(prev => ({ ...prev, user }));
  }, []);

  const logout = useCallback(() => {
    console.log('Logout function called'); // Debug log
    
    // Clear all storage first
    storage.clear();
    
    // Reset typing state
    setIsTyping(false);
    
    // Reset all state to initial values (don't use prev state)
    setState({
      user: null,
      chats: [],
      currentChatId: null,
      isLoading: false,
    });
    
    // Navigate to login page immediately
    navigate('/', { replace: true });
    console.log('Logout completed, navigated to /'); // Debug log
  }, [navigate]);

  const createChat = useCallback((name: string) => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      name,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
      status: null,
      pinnedAt: null,
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

  const sendMessage = useCallback(async (query: string) => {
    setIsTyping(true);
    try {
      // If no chat is selected, create a new one
      if (!state.currentChatId) {
        const newChatName = query.length > 50 ? query.substring(0, 50) + '...' : query;
        const newChat: Chat = {
          id: crypto.randomUUID(),
          name: newChatName,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          pinned: false,
          status: null,
          pinnedAt: null,
        };

        // Create a message with query and null answer
        const message: Message = {
          id: crypto.randomUUID(),
          query,
          answer: null,
          userId: state.user?.id,
          chatId: newChat.id,
          createdAt: new Date(),
          sender: 'user', // <-- Add this line
        };
        newChat.messages = [message];

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

        // Get AI response
        const aiResponse = await geminiService.generateResponse(query);

        // Add assistant message
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          query: '',
          answer: aiResponse,
          userId: state.user?.id,
          chatId: newChat.id,
          createdAt: new Date(),
          sender: 'assistant',
        };
        setState(prev => {
          const updatedChats = prev.chats.map(chat => {
            if (chat.id === newChat.id) {
              return {
                ...chat,
                messages: [...chat.messages, assistantMessage],
                updatedAt: new Date(),
              };
            }
            return chat;
          });
          storage.setChats(updatedChats);
          return { ...prev, chats: updatedChats };
        });
        setIsTyping(false);
        return;
      }

      // Add message to existing chat
      const message: Message = {
        id: crypto.randomUUID(),
        query,
        answer: null,
        userId: state.user?.id,
        chatId: state.currentChatId,
        createdAt: new Date(),
        sender: 'user', // <-- Add this line
      };

      setState(prev => {
        const updatedChats = prev.chats.map(chat => {
          if (chat.id === state.currentChatId) {
            return {
              ...chat,
              messages: [...chat.messages, message],
              updatedAt: new Date(),
            };
          }
          return chat;
        });
        storage.setChats(updatedChats);
        return { ...prev, chats: updatedChats };
      });

      // Get AI response
      const aiResponse = await geminiService.generateResponse(query);

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        query: '',
        answer: aiResponse,
        userId: state.user?.id,
        chatId: state.currentChatId,
        createdAt: new Date(),
        sender: 'assistant',
      };
      setState(prev => {
        const updatedChats = prev.chats.map(chat => {
          if (chat.id === state.currentChatId) {
            return {
              ...chat,
              messages: [...chat.messages, assistantMessage],
              updatedAt: new Date(),
            };
          }
          return chat;
        });
        storage.setChats(updatedChats);
        return { ...prev, chats: updatedChats };
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
    setIsTyping(false);
  }, [state.currentChatId, state.chats, state.user]);

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

  // Pin or unpin a chat
  const pinChat = useCallback((chatId: string, pinned: boolean) => {
    setState(prev => {
      const updatedChats = prev.chats.map(chat =>
        chat.id === chatId
          ? { ...chat, pinned, pinnedAt: pinned ? new Date() : null }
          : chat
      );
      storage.setChats(updatedChats);
      return { ...prev, chats: updatedChats };
    });
  }, []);

  // Set chat status (color dot)
  const setChatStatus = useCallback((chatId: string, status: 'green' | 'yellow' | 'red' | 'gold' | null) => {
    setState(prev => {
      const updatedChats = prev.chats.map(chat =>
        chat.id === chatId ? { ...chat, status } : chat
      );
      storage.setChats(updatedChats);
      return { ...prev, chats: updatedChats };
    });
  }, []);

  const currentChat = state.chats.find(chat => chat.id === state.currentChatId);

  return {
    ...state,
    currentChat,
    isTyping,
    login,
    logout,
    createChat,
    selectChat,
    sendMessage,
    deleteChat,
    pinChat,
    setChatStatus,
  };
};
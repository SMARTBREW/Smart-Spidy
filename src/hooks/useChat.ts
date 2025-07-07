import { useState, useEffect, useCallback } from 'react';
import { User, Chat, Message, AppState } from '../types';
import { storage } from '../utils/storage';
import { geminiService } from '../services/gemini';

export const useChat = () => {
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
    
    console.log('Logout completed'); // Debug log
  }, []);

  const createChat = useCallback((name: string) => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      name,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
      status: null,
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

  const sendMessage = useCallback(async (content: string) => {
    setIsTyping(true);
    
    try {
      // If no chat is selected, create a new one
      if (!state.currentChatId) {
        const newChatName = content.length > 50 ? content.substring(0, 50) + '...' : content;
        const newChat: Chat = {
          id: crypto.randomUUID(),
          name: newChatName,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          pinned: false,
          status: null,
        };

        const userMessage: Message = {
          id: crypto.randomUUID(),
          content,
          sender: 'user',
          timestamp: new Date(),
        };

        // Add user message immediately
        newChat.messages = [userMessage];

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
        const aiResponse = await geminiService.generateResponse(content);
        
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          content: aiResponse,
          sender: 'assistant',
          timestamp: new Date(),
        };

        // Add assistant message
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

      const userMessage: Message = {
        id: crypto.randomUUID(),
        content,
        sender: 'user',
        timestamp: new Date(),
      };

      // Add user message immediately
      setState(prev => {
        const updatedChats = prev.chats.map(chat => {
          if (chat.id === state.currentChatId) {
            return {
              ...chat,
              messages: [...chat.messages, userMessage],
              updatedAt: new Date(),
            };
          }
          return chat;
        });

        storage.setChats(updatedChats);
        return { ...prev, chats: updatedChats };
      });

      // Get conversation history for context
      const currentChatData = state.chats.find(chat => chat.id === state.currentChatId);
      const conversationHistory = currentChatData?.messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })) || [];

      // Get AI response with context
      const aiResponse = await geminiService.generateChatResponse(conversationHistory, content);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: aiResponse,
        sender: 'assistant',
        timestamp: new Date(),
      };

      // Add assistant message
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
      
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };

      setState(prev => {
        const updatedChats = prev.chats.map(chat => {
          if (chat.id === state.currentChatId) {
            return {
              ...chat,
              messages: [...chat.messages, errorMessage],
              updatedAt: new Date(),
            };
          }
          return chat;
        });

        storage.setChats(updatedChats);
        return { ...prev, chats: updatedChats };
      });
    }
    
    setIsTyping(false);
  }, [state.currentChatId, state.chats]);

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
        chat.id === chatId ? { ...chat, pinned } : chat
      );
      storage.setChats(updatedChats);
      return { ...prev, chats: updatedChats };
    });
  }, []);

  // Set chat status (color dot)
  const setChatStatus = useCallback((chatId: string, status: 'green' | 'yellow' | 'red' | null) => {
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
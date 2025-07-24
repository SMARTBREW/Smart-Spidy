import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Chat, Message, AppState, ProfessionType } from '../types';
import { openaiService } from '../services/openai';
import { fetchInstagramAccountDetails } from '../services/instagram';
import authService from '../services/auth';
import { chatApi } from '../services/chat';
import { messageApi } from '../services/message';

export const useChat = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>({
    user: null,
    chats: [],
    currentChatId: null,
    isLoading: true,
  });
  
  // Use useRef for values that don't need to trigger re-renders
  const isTypingRef = useRef(false);
  const setIsTyping = useCallback((value: boolean) => {
    isTypingRef.current = value;
  }, []);

  // Memoized current chat to avoid unnecessary computations
  const currentChat = useMemo(() => {
    return state.chats.find(chat => chat.id === state.currentChatId) || null;
  }, [state.chats, state.currentChatId]);

  // Fetch chats from API
  const fetchChats = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        setState(prev => ({ ...prev, isLoading: false, user: null }));
        navigate('/');
        return;
      }
      // Only fetch chats created by the current user, even for admins
      const { chats } = await chatApi.getChats({ user_id: currentUser.id });
      
      // Fetch messages for each chat
      const chatsWithMessages = await Promise.all(
        chats.map(async (chat) => {
          try {
            const { messages } = await messageApi.getMessages(chat.id, { limit: 100 });
            return {
              ...chat,
              messages: messages || [],
              is_gold: chat.is_gold ?? (chat as any).isGold ?? false,
            };
          } catch (error) {
            console.error(`Error fetching messages for chat ${chat.id}:`, error);
            return {
              ...chat,
              messages: [],
              is_gold: chat.is_gold ?? (chat as any).isGold ?? false,
            };
          }
        })
      );

      setState(prev => ({
        ...prev,
        user: currentUser,
        chats: chatsWithMessages,
        currentChatId: chatsWithMessages.length > 0 ? chatsWithMessages[0].id : null,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      console.error('Error fetching chats:', error);
      // If it's an authentication error, redirect to login
      if (error.message?.includes('Authentication expired') || error.message?.includes('401')) {
        authService.logout();
        navigate('/');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const initializeChats = async () => {
      await fetchChats();
    };
    initializeChats();
  }, []); // Remove fetchChats from dependency array

  // Fetch chats when user becomes available after login
  // useEffect(() => {
  //   if (state.user && state.chats.length === 0) {
  //     fetchChats();
  //   }
  // }, [state.user, state.chats.length, fetchChats]);

  const login = useCallback((user: User) => {
    setState(prev => ({ 
      ...prev, 
      user,
      isLoading: false 
    }));
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setIsTyping(false);
    setState({
      user: null,
      chats: [],
      currentChatId: null,
      isLoading: false,
    });
    navigate('/', { replace: true });
  }, [navigate]);

  const createChat = useCallback(async (name: string, instagramUsername?: string, occupation?: string, product?: string, gender?: string, profession?: string): Promise<string | null> => {
    try {
      const currentUser = authService.getCurrentUser();
      const chatData: any = {
        name,
        user_id: currentUser?.id,
        instagram_username: instagramUsername,
        profession: profession as ProfessionType,
        product,
        gender,
      };
      const newChat = await chatApi.createChat(chatData);
      await fetchChats();
      if (typeof newChat?.id === 'string') {
        setState(prev => ({ ...prev, currentChatId: newChat.id }));
        return newChat.id;
      } else {
        setState(prev => ({ ...prev, currentChatId: null }));
        return null;
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }, [fetchChats]);

  const selectChat = useCallback(async (chatId: string) => {
    if (!chatId) return;
    
    setState(prev => ({ ...prev, currentChatId: chatId }));
    
    // Load messages for the selected chat if not already loaded
    const currentChat = state.chats.find(chat => chat.id === chatId);
    if (currentChat && (!currentChat.messages || currentChat.messages.length === 0)) {
      try {
        const { messages } = await messageApi.getMessages(chatId, { limit: 100 });
        setState(prev => ({
          ...prev,
          chats: prev.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, messages: messages || [] }
              : chat
          ),
        }));
      } catch (error) {
        console.error(`Error loading messages for chat ${chatId}:`, error);
      }
    }
  }, [state.chats]);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await chatApi.deleteChat(chatId);
      await fetchChats();
      // If the deleted chat was current, select the first available chat
      if (state.currentChatId === chatId) {
        const remainingChats = state.chats.filter(chat => chat.id !== chatId);
        setState(prev => ({ 
          ...prev, 
          currentChatId: remainingChats.length > 0 ? remainingChats[0].id : null 
        }));
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }, [state.chats, state.currentChatId]);

  const pinChat = useCallback(async (chatId: string, pinned: boolean) => {
    try {
      await chatApi.pinChat(chatId, pinned);
      await fetchChats();
    } catch (error) {
      console.error('Error pinning chat:', error);
    }
  }, []);

  const setChatStatus = useCallback(async (chatId: string, status: 'green' | 'yellow' | 'red' | 'gold' | null) => {
    try {
      const currentChat = state.chats.find(chat => chat.id === chatId);
      let makeGold: boolean | undefined = undefined;
      let colorStatus: 'green' | 'yellow' | 'red' | null = null;
      if (status === 'gold') {
        makeGold = true;
        colorStatus = null;
      } else {
        colorStatus = status;
        if (currentChat?.is_gold) makeGold = true;
      }
      const apiResponse = await chatApi.updateChatStatus(chatId, colorStatus, makeGold);
      await fetchChats();
    } catch (error) {
      console.error('Error updating chat status:', error);
    }
  }, [fetchChats, state.chats]);

  // Send message with backend integration
  const sendMessage = useCallback(async (query: string) => {
    setIsTyping(true);
    try {
      let chatId = state.currentChatId;
      // Create new chat if none exists
      if (!chatId) {
        const newChatName = query.length > 50 ? query.substring(0, 50) + '...' : query;
        chatId = await createChat(newChatName);
        if (!chatId) {
          throw new Error('Failed to create new chat');
        }
      }
      // Get current message order
      const currentChat = state.chats.find(chat => chat.id === chatId);
      const messageOrder = (currentChat?.messages?.length || 0);
      // Save user message to backend and get both user and assistant messages
      const response = await messageApi.createMessage({
        content: query,
        sender: 'user',
        chat_id: chatId,
        message_order: messageOrder,
      });
      // Add both messages to the chat
      setState(prev => ({
        ...prev,
        chats: prev.chats.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...(chat.messages || []), ...(response.messages || [])],
                messageCount: (chat.messageCount || 0) + (response.messages?.length || 0),
                updatedAt: new Date(),
              }
            : chat
        ),
      }));
      // Optionally handle Instagram account info (response.instagramAccount)
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  }, [state.currentChatId, state.chats, createChat]);

  return {
    ...state,
    currentChat,
    isTyping: isTypingRef.current,
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

// Helper to normalize createdAt for safe subtraction
function getTimestamp(dateVal: Date | string | number | undefined): number {
  if (!dateVal) return 0;
  if (typeof dateVal === 'number') return dateVal;
  if (typeof dateVal === 'string') return new Date(dateVal).getTime();
  if (dateVal instanceof Date) return dateVal.getTime();
  return 0;
}
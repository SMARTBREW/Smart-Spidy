import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Chat, Message, AppState, ProfessionType } from '../types';
import { openaiService } from '../services/openai';
import { fetchInstagramAccountDetails } from '../services/instagram';
import authService from '../services/auth';
import { chatApi } from '../services/chat';

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
        // No user found, redirect to login
        navigate('/');
        return;
      }
      const { chats } = await chatApi.getChats();
      // Normalize gold field for all chats
      const normalizedChats = chats.map(chat => ({
        ...chat,
        is_gold: chat.is_gold ?? (chat as any).isGold ?? false,
      }));
      setState(prev => ({
        ...prev,
        user: currentUser,
        chats: normalizedChats,
        currentChatId: normalizedChats.length > 0 ? normalizedChats[0].id : null,
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
  useEffect(() => {
    if (state.user && state.chats.length === 0) {
      fetchChats();
    }
  }, [state.user, state.chats.length, fetchChats]);

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

  const selectChat = useCallback((chatId: string) => {
    if (!chatId) return;
    setState(prev => ({ ...prev, currentChatId: chatId }));
  }, []);

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

  // For now, keep sendMessage as a local operation (AI logic)
  const sendMessage = useCallback(async (query: string) => {
    setIsTyping(true);
    try {
      if (!state.currentChatId) {
        const newChatName = query.length > 50 ? query.substring(0, 50) + '...' : query;
        const newChat: Chat = {
          id: crypto.randomUUID(),
          name: newChatName,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          pinned: false,
          pinnedAt: null,
          status: null,
          userId: state.user?.id || '',
          instagramUsername: '',
          profession: '' as ProfessionType,
          product: '',
          gender: '',
          messageCount: 0,
        };

        setState(prev => ({
          ...prev,
          chats: [newChat, ...prev.chats],
          currentChatId: newChat.id,
        }));
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: query,
        createdAt: new Date(),
        sender: 'user',
        messageOrder: 0,
        chatId: state.currentChatId || '',
        userId: state.user?.id || '',
      };

      setState(prev => ({
        ...prev,
        chats: prev.chats.map(chat =>
          chat.id === state.currentChatId
            ? {
                ...chat,
                messages: [...(chat.messages || []), userMessage],
                messageCount: (chat.messageCount || 0) + 1,
                updatedAt: new Date(),
              }
            : chat
        ),
      }));

      // Get AI response
      const response = await openaiService.generateResponse(query);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: response,
        createdAt: new Date(),
        sender: 'assistant',
        messageOrder: 1,
        chatId: state.currentChatId || '',
        userId: state.user?.id || '',
      };

      setState(prev => ({
        ...prev,
        chats: prev.chats.map(chat =>
          chat.id === state.currentChatId
            ? {
                ...chat,
                messages: [...(chat.messages || []), assistantMessage],
                messageCount: (chat.messageCount || 0) + 1,
                updatedAt: new Date(),
              }
            : chat
        ),
      }));
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  }, [state.currentChatId, state.user?.id, setIsTyping]);

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
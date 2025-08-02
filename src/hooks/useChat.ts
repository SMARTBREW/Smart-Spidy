import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Chat, Message, AppState, ProfessionType } from '../types';
import authService from '../services/auth';
import { chatApi } from '../services/chat';
import { messageApi } from '../services/message';

// Helper function to extract Instagram username from message content
const extractInstagramUsername = (content: string): {username: string, forceLive?: boolean} | null => {
  const igPattern = /(?:ig|instagram)\s*:\s*([a-zA-Z0-9._]+)/i;
  const match = content.match(igPattern);
  return match ? { username: match[1].trim() } : null;
};

export const useChat = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>({
    user: null,
    chats: [],
    currentChatId: null,
    isLoading: false, // Changed to false since loading is now handled globally
  });
  
  // Use useState for isTyping to trigger re-renders when typing state changes
  const [isTyping, setIsTyping] = useState(false);

  // Memoized current chat to avoid unnecessary computations
  const currentChat = useMemo(() => {
    return state.chats.find(chat => chat.id === state.currentChatId) || null;
  }, [state.chats, state.currentChatId]);

  // Fetch chats from API
  const fetchChats = useCallback(async () => {
    // Removed local loading state - now handled globally
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        setState(prev => ({ ...prev, user: null }));
        navigate('/');
        return;
      }
      // Only fetch chats created by the current user, even for admins
      const { chats } = await chatApi.getChats({ user_id: currentUser.id });
      
      // Fetch messages for each chat
      const chatsWithMessages = await Promise.all(
        chats.map(async (chat) => {
          try {
            const response = await messageApi.getMessages(chat.id, { limit: 100 });
            const { messages, instagramTriggers } = response;
            console.log(`Chat ${chat.id} - Instagram Accounts:`, instagramTriggers?.length || 0, 'found');
            
            let messagesWithInstagram = messages || [];
            if (instagramTriggers && instagramTriggers.length > 0) {
              let finalMessages: Message[] = [];
              for (let i = 0; i < messagesWithInstagram.length; i++) {
                const message = messagesWithInstagram[i];
                finalMessages.push(message);
                // For each trigger, if it matches this message, insert the card
                instagramTriggers.forEach((trigger, idx) => {
                  if (trigger.messageId === message.id) {
                    finalMessages.push({
                      id: `${chat.id}-ig-${trigger.username}-${Date.now()}-${i}-${idx}`,
                      content: '',
                      sender: 'assistant' as 'assistant',
                      createdAt: new Date(message.createdAt || new Date()),
                      instagramAccount: {
                        ...trigger.account,
                        followersCount: Number(trigger.account.followersCount),
                        mediaCount: Number(trigger.account.mediaCount)
                      }
                    } as Message);
                  }
                });
              }
              messagesWithInstagram = finalMessages;
            }
            
            return {
              ...chat,
              messages: messagesWithInstagram,
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
      }));
    } catch (error: any) {
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
      user
    }));
    fetchChats(); // Fetch chats after login
  }, [fetchChats]);

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
        const response = await messageApi.getMessages(chatId, { limit: 100 });
        console.log('API Response:', response);
        const { messages, instagramAccounts } = response;
        console.log('Messages:', messages);
        console.log('Instagram Accounts:', instagramAccounts);
        
        // Insert Instagram cards right after the messages that triggered them
        let messagesWithInstagram = messages || [];
        
        if (instagramAccounts && instagramAccounts.length > 0) {
          // Create a map of Instagram usernames to their accounts
          const accountMap = new Map();
          instagramAccounts.forEach(account => {
            accountMap.set(account.username, account);
          });
          
          // Track which Instagram cards we've already added to avoid duplicates
          const addedAccounts = new Set();
          
          // Go through messages and insert Instagram cards after relevant messages
          const finalMessages: Message[] = [];
          
          for (let i = 0; i < messagesWithInstagram.length; i++) {
            const message = messagesWithInstagram[i];
            finalMessages.push(message);
            
            // Check if this message mentions an Instagram username
            const extractedUsername = extractInstagramUsername(message.content);
            if (extractedUsername && accountMap.has(extractedUsername.username) && !addedAccounts.has(extractedUsername.username)) {
              const instagramAccount = accountMap.get(extractedUsername.username);
              console.log(`Adding Instagram card for ${extractedUsername.username} after message ${i}`);
              
              finalMessages.push({
                id: `${chatId}-ig-${instagramAccount.username}-${Date.now()}`,
                content: '',
                sender: 'assistant' as 'assistant',
                createdAt: new Date(message.createdAt || new Date()),
                instagramAccount: {
                  ...instagramAccount,
                  followersCount: Number(instagramAccount.followersCount),
                  mediaCount: Number(instagramAccount.mediaCount)
                }
              } as Message);
              
              addedAccounts.add(extractedUsername.username);
            }
          }
          
          messagesWithInstagram = finalMessages;
          console.log('Final messages with Instagram:', messagesWithInstagram);
        }
        
        setState(prev => ({
          ...prev,
          chats: prev.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, messages: messagesWithInstagram }
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
      let colorStatus: 'green' | 'yellow' | 'red' | null | undefined = undefined;
      
      if (status === 'gold') {
        makeGold = true;
        // Don't set colorStatus to null when making gold - preserve existing status
        // Only set colorStatus if we're explicitly changing it
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
    // Check if this is an Instagram fetch request
    const isInstagramRequest = /(?:ig|instagram)\s*:?\s*([a-zA-Z0-9._]+)/i.test(query);
    
    if (!isInstagramRequest) {
      setIsTyping(true);
    }
    
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
                messages: [
                  ...(chat.messages || []),
                  ...(
                    response.instagramAccount
                      ? [{
                          id: `${chatId}-ig-${Date.now()}`,
                          content: '',
                          sender: 'assistant' as 'assistant',
                          createdAt: new Date(),
                          instagramAccount: {
                            ...response.instagramAccount,
                            followersCount: Number(response.instagramAccount.followersCount),
                            mediaCount: Number(response.instagramAccount.mediaCount)
                          }
                        } as Message]
                      : (response.messages || [])
                  )
                ],
                messageCount:
                  (chat.messageCount || 0) +
                  (response.messages?.length || 0) +
                  (response.instagramAccount ? 1 : 0),
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

// Helper to normalize createdAt for safe subtraction
function getTimestamp(dateVal: Date | string | number | undefined): number {
  if (!dateVal) return 0;
  if (typeof dateVal === 'number') return dateVal;
  if (typeof dateVal === 'string') return new Date(dateVal).getTime();
  if (dateVal instanceof Date) return dateVal.getTime();
  return 0;
}
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Chat, Message, AppState } from '../types';
import { storage } from '../utils/storage';
import { openaiService } from '../services/openai';
import { fetchInstagramAccountDetails } from '../services/instagram';

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

  const createChat = useCallback((name: string, instagramUsername?: string, occupation?: string, product?: string, gender?: string) => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      name,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
      status: null,
      pinnedAt: null,
      instagramUsername,
      occupation,
      product,
      gender,
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

        // Intercept Instagram ID queries
        let igMatch = query.match(/^(instagram|ig)\s*:\s*([a-zA-Z0-9_.]+)/i);
        let aiResponse = '';
        if (igMatch) {
          const igUsername = igMatch[2];
          try {
            // Use the new IG User ID as the base for the business_discovery endpoint
            const details = await fetchInstagramAccountDetails('17841475777137453', igUsername);
            aiResponse =
              `Instagram details for @${details.username}:\n` +
              (details.name ? `Name: ${details.name}\n` : '') +
              (details.account_type ? `Account type: ${details.account_type}\n` : '') +
              (details.biography ? `Bio: ${details.biography}\n` : '') +
              (typeof details.followers_count === 'number' ? `Followers: ${details.followers_count}\n` : '') +
              (typeof details.media_count === 'number' ? `Posts: ${details.media_count}\n` : '') +
              (details.website ? `Website: ${details.website}\n` : '');
          } catch (err: any) {
            aiResponse = `Could not fetch Instagram details: ${err.message}`;
          }
        } else {
          aiResponse = await openaiService.generateResponse(query);
        }

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
              // AUTOMATIC STATUS CLASSIFICATION - COMMENTED OUT FOR MANUAL CONTROL
              // Get recent queries (last 24h, up to 10 most recent)
              // const now = Date.now();
              // const msWindow = 24 * 60 * 60 * 1000;
              // const recentQueries = chat.messages
              //   .filter(msg => msg.sender === 'user' && now - getTimestamp(msg.createdAt) < msWindow)
              //   .slice(-10)
              //   .map(msg => msg.query);
              // if (recentQueries.length === 0) return chat;
              // const prompt = `Given these queries from the last 24 hours, classify the chat as:
              // - 'green' if the conversation is now going well, positive, and there are no recent unresolved issues.
              // - 'yellow' if there are some issues or uncertainty, but not critical.
              // - 'red' if the chat is unlikely to succeed or is very negative.

              // Only respond with one of these words.

              // Queries:
              // ${recentQueries.map((q, i) => `${i + 1}. \"${q}\"`).join('\n')}
              // `;
              // openaiService.classifyStatus(prompt).then(status => {
              //   const cleanStatus = status.trim().toLowerCase();
              //   // Only allow valid status values
              //   const allowed: Array<'green' | 'yellow' | 'red'> = ['green', 'yellow', 'red'];
              //   const finalStatus = allowed.includes(cleanStatus as any) ? (cleanStatus as 'green' | 'yellow' | 'red') : null;
              //   setState(prev2 => {
              //     const finalChats = prev2.chats.map(c =>
              //       c.id === chat.id ? { ...c, status: finalStatus } : c
              //     );
              //     storage.setChats(finalChats);
              //     return { ...prev2, chats: finalChats };
              //   });
              // });
            }
            return chat;
          });
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

      // Intercept Instagram ID queries
      let igMatch = query.match(/^(instagram|ig)\s*:\s*([a-zA-Z0-9_.]+)/i);
      let aiResponse = '';
      if (igMatch) {
        const igUsername = igMatch[2];
        try {
          // Use the new IG User ID as the base for the business_discovery endpoint
          const details = await fetchInstagramAccountDetails('17841475777137453', igUsername);
          aiResponse =
            `Instagram details for @${details.username}:\n` +
            (details.name ? `Name: ${details.name}\n` : '') +
            (details.account_type ? `Account type: ${details.account_type}\n` : '') +
            (details.biography ? `Bio: ${details.biography}\n` : '') +
            (typeof details.followers_count === 'number' ? `Followers: ${details.followers_count}\n` : '') +
            (typeof details.media_count === 'number' ? `Posts: ${details.media_count}\n` : '') +
            (details.website ? `Website: ${details.website}\n` : '');
        } catch (err: any) {
          aiResponse = `Could not fetch Instagram details: ${err.message}`;
        }
      } else {
        aiResponse = await openaiService.generateResponse(query);
      }

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

      // --- AUTOMATIC CHAT STATUS CLASSIFICATION FOR EXISTING CHAT - COMMENTED OUT FOR MANUAL CONTROL ---
      // setState(prev => {
      //   const updatedChats = prev.chats.map(chat => {
      //     if (chat.id === state.currentChatId) {
      //       // Get recent queries (last 24h, up to 10 most recent)
      //       const now = Date.now();
      //       const msWindow = 24 * 60 * 60 * 1000;
      //       const recentQueries = chat.messages
      //         .filter(msg => msg.sender === 'user' && now - getTimestamp(msg.createdAt) < msWindow)
      //         .slice(-10)
      //         .map(msg => msg.query);
      //       if (recentQueries.length === 0) return chat;
      //       const prompt = `Given these queries from the last 24 hours, classify the chat as:
      // - 'green' if the conversation is now going well, positive, and there are no recent unresolved issues.
      // - 'yellow' if there are some issues or uncertainty, but not critical.
      // - 'red' if the chat is unlikely to succeed or is very negative.

      // Only respond with one of these words.

      // Queries:
      // ${recentQueries.map((q, i) => `${i + 1}. \"${q}\"`).join('\n')}
      // `;
      //       openaiService.classifyStatus(prompt).then(status => {
      //         const cleanStatus = status.trim().toLowerCase();
      //         // Only allow valid status values
      //         const allowed: Array<'green' | 'yellow' | 'red'> = ['green', 'yellow', 'red'];
      //         const finalStatus = allowed.includes(cleanStatus as any) ? (cleanStatus as 'green' | 'yellow' | 'red') : null;
      //         setState(prev2 => {
      //           const finalChats = prev2.chats.map(c =>
      //             c.id === chat.id ? { ...c, status: finalStatus } : c
      //           );
      //           storage.setChats(finalChats);
      //           return { ...prev2, chats: finalChats };
      //         });
      //       });
      //     }
      //     return chat;
      //   });
      //   return { ...prev, chats: updatedChats };
      // });
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

// Helper to normalize createdAt for safe subtraction
function getTimestamp(dateVal: Date | string | number | undefined): number {
  if (!dateVal) return 0;
  if (typeof dateVal === 'number') return dateVal;
  if (typeof dateVal === 'string') return new Date(dateVal).getTime();
  if (dateVal instanceof Date) return dateVal.getTime();
  return 0;
}
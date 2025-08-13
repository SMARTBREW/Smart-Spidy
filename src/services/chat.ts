import { Chat } from '../types';
import authService from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ;

// Global loading wrapper for chat API calls
let withLoading: any = null;

export const setChatLoadingWrapper = (loadingWrapper: any) => {
  withLoading = loadingWrapper;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Authentication expired. Please login again.');
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const chatApi = {
  async getChats(params?: {
    page?: number;
    limit?: number;
    name?: string;
    status?: string;
    pinned?: boolean;
    user_id?: string;
    profession?: string;
    product?: string;
    gender?: string;
    is_gold?: boolean;
  }): Promise<{ chats: Chat[]; pagination: any; totalPinnedChats?: number; totalGoldChats?: number }> {
    const getChatsFn = async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.name) searchParams.append('name', params.name);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.pinned !== undefined) searchParams.append('pinned', params.pinned.toString());
      if (params?.user_id) searchParams.append('user_id', params.user_id);
      if (params?.profession) searchParams.append('profession', params.profession);
      if (params?.product) searchParams.append('product', params.product);
      if (params?.gender) searchParams.append('gender', params.gender);
      if (params?.is_gold !== undefined) searchParams.append('is_gold', params.is_gold.toString());
      const url = `${API_BASE_URL}/chats?${searchParams}`;
      const response = await authService.authenticatedRequest(url, { method: 'GET' });
      return handleResponse(response);
    };

    if (withLoading) {
      return withLoading('chat-get-chats', getChatsFn)();
    }
    return getChatsFn();
  },

  async getChatById(id: string): Promise<Chat> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/chats/${id}`, { method: 'GET' });
    return handleResponse(response);
  },

  async getAllChats(params?: {
    user_id?: string;
  }): Promise<{ chats: Chat[]; total: number }> {
    const getAllChatsFn = async () => {
      const searchParams = new URLSearchParams();
      if (params?.user_id) searchParams.append('user_id', params.user_id);
      const url = `${API_BASE_URL}/chats/all?${searchParams}`;
      const response = await authService.authenticatedRequest(url, { method: 'GET' });
      return handleResponse(response);
    };

    if (withLoading) {
      return withLoading('chat-get-all-chats', getAllChatsFn)();
    }
    return getAllChatsFn();
  },

  async createChat(chatData: Partial<Chat>): Promise<Chat> {
    const createChatFn = async () => {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/chats`, {
        method: 'POST',
        body: JSON.stringify(chatData),
      });
      return handleResponse(response);
    };

    if (withLoading) {
      return withLoading('chat-create', createChatFn)();
    }
    return createChatFn();
  },

  async updateChat(id: string, chatData: Partial<Chat>): Promise<Chat> {
    const updateChatFn = async () => {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/chats/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(chatData),
      });
      return handleResponse(response);
    };

    if (withLoading) {
      return withLoading('chat-update', updateChatFn)();
    }
    return updateChatFn();
  },

  async deleteChat(id: string): Promise<void> {
    const deleteChatFn = async () => {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/chats/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    };

    if (withLoading) {
      return withLoading('chat-delete', deleteChatFn)();
    }
    return deleteChatFn();
  },

  async updateChatStatus(id: string, status: 'green' | 'yellow' | 'red' | null | undefined, makeGold?: boolean): Promise<any> {
    const updateStatusFn = async () => {
      const body: any = {};
      if (status !== undefined) body.status = status;
      if (makeGold !== undefined) body.makeGold = makeGold;
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/chats/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      return handleResponse(response);
    };

    if (withLoading) {
      return withLoading('chat-update-status', updateStatusFn)();
    }
    return updateStatusFn();
  },

  async pinChat(id: string, pinned: boolean): Promise<Chat> {
    const pinChatFn = async () => {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/chats/${id}/pin`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned }),
      });
      return handleResponse(response);
    };

    if (withLoading) {
      return withLoading('chat-pin', pinChatFn)();
    }
    return pinChatFn();
  },

  async getChatStats(): Promise<any> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/chats/stats`, { method: 'GET' });
    return handleResponse(response);
  },

  async searchChats(params: {
    q: string;
    page?: number;
    limit?: number;
    include_messages?: boolean;
  }): Promise<{
    results: Array<{
      chat: Chat;
      messages: Array<{
        id: string;
        content: string;
        sender: 'user' | 'assistant';
        created_at: string;
        message_order: number;
      }>;
    }>;
    pagination: any;
    query: string;
  }> {
    const searchChatsFn = async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('q', params.q);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.include_messages !== undefined) searchParams.append('include_messages', params.include_messages.toString());
      
      const url = `${API_BASE_URL}/chats/search?${searchParams}`;
      const response = await authService.authenticatedRequest(url, { method: 'GET' });
      return handleResponse(response);
    };

    if (withLoading) {
      return withLoading('chat-search', searchChatsFn)();
    }
    return searchChatsFn();
  },
}; 
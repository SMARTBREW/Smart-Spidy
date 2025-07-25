import authService from './auth';
import { Message } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Global loading wrapper for message API calls
let withLoading: any = null;

export const setMessageLoadingWrapper = (loadingWrapper: any) => {
  withLoading = loadingWrapper;
};

interface CreateMessageRequest {
  content: string;
  sender: 'user' | 'assistant';
  chat_id: string;
  message_order?: number;
  feedback?: string;
}

interface CreateMessageResponse {
  message?: Message;
  messages?: Message[];
  instagramAccount?: {
    id: string;
    username: string;
    fullName: string;
    biography: string;
    followersCount: number | null;
    mediaCount: number | null;
  } | null;
}

interface MessagesResponse {
  messages: Message[];
  instagramAccount?: {
    id: string;
    igUserId?: string;
    username: string;
    name?: string;
    biography?: string;
    website?: string;
    followersCount?: number;
    followsCount?: number;
    mediaCount?: number;
    accountType?: string;
    isVerified?: boolean;
    igId?: string;
    audienceGenderAge?: any;
    audienceCountry?: any;
    audienceCity?: any;
    audienceLocale?: any;
    insights?: any;
    mentions?: any;
    media?: any[];
    fetchedAt?: string;
    hasDetailedAccess?: boolean;
    totalLikesCount?: number | null;
    totalCommentsCount?: number | null;
    lastPostDate?: string | null;
    aiAnalysisScore?: number | null;
    aiAnalysisDetails?: any;
    rawJson?: any;
    source?: 'database' | 'live';
  } | null;
  instagramAccounts?: Array<{
    id: string;
    igUserId?: string;
    username: string;
    name?: string;
    biography?: string;
    website?: string;
    followersCount?: number;
    followsCount?: number;
    mediaCount?: number;
    accountType?: string;
    isVerified?: boolean;
    igId?: string;
    audienceGenderAge?: any;
    audienceCountry?: any;
    audienceCity?: any;
    audienceLocale?: any;
    insights?: any;
    mentions?: any;
    media?: any[];
    fetchedAt?: string;
    hasDetailedAccess?: boolean;
    totalLikesCount?: number | null;
    totalCommentsCount?: number | null;
    lastPostDate?: string | null;
    aiAnalysisScore?: number | null;
    aiAnalysisDetails?: any;
    rawJson?: any;
    source?: 'database' | 'live';
  }>;
  instagramTriggers?: Array<{
    messageId: string;
    username: string;
    account: any;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  totalUserMessages?: number;
  totalAssistantMessages?: number;
}

interface CreateMessagesRequest {
  chat_id: string;
  messages: Array<{
    content: string;
    sender: 'user' | 'assistant';
    message_order?: number;
    feedback?: string;
  }>;
}

interface CreateMessagesResponse {
  messages: Message[];
  instagramAccounts: Array<{
    id: string;
    username: string;
    fullName: string;
    biography: string;
    followersCount: number | null;
    mediaCount: number | null;
  }>;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
};

export const messageApi = {
  // Create a single message
  async createMessage(data: CreateMessageRequest): Promise<CreateMessageResponse> {
    const createMessageFn = async () => {
      const response = await authService.authenticatedRequest(
        `${API_BASE_URL}/messages`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return handleResponse(response);
    };

    if (withLoading) {
      return withLoading('message-create', createMessageFn)();
    }
    return createMessageFn();
  },

  // Get messages for a specific chat
  async getMessages(
    chatId: string,
    params?: { page?: number; limit?: number }
  ): Promise<MessagesResponse> {
    const getMessagesFn = async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const url = `${API_BASE_URL}/messages/chat/${chatId}${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await authService.authenticatedRequest(url, {
        method: 'GET',
      });
      return handleResponse(response);
    };

    if (withLoading) {
      return withLoading('message-get-messages', getMessagesFn)();
    }
    return getMessagesFn();
  },

  // Get a specific message
  async getMessage(messageId: string): Promise<Message> {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/messages/${messageId}`,
      {
        method: 'GET',
      }
    );
    return handleResponse(response);
  },

  // Update a message
  async updateMessage(
    messageId: string,
    data: { content?: string; feedback?: string }
  ): Promise<Message> {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/messages/${messageId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    return handleResponse(response);
  },

  // Delete a message (admin only)
  async deleteMessage(messageId: string): Promise<void> {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/messages/${messageId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Delete failed' }));
      throw new Error(error.message || 'Delete failed');
    }
  },

  // Bulk create messages
  async createMessages(data: CreateMessagesRequest): Promise<CreateMessagesResponse> {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/messages/bulk`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleResponse(response);
  },

  // Get all messages (admin only)
  async getAllMessages(params?: { page?: number; limit?: number }): Promise<MessagesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const url = `${API_BASE_URL}/messages${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await authService.authenticatedRequest(url, { method: 'GET' });
    return handleResponse(response);
  },
};

export default messageApi; 
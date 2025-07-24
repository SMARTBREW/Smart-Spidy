import authService from './auth';
import { Message } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleResponse(response);
  },

  // Get messages for a specific chat
  async getMessages(
    chatId: string,
    params?: { page?: number; limit?: number }
  ): Promise<MessagesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const url = `${API_BASE_URL}/messages/chat/${chatId}${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await authService.authenticatedRequest(url, {
      method: 'GET',
    });
    return handleResponse(response);
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
};

export default messageApi; 
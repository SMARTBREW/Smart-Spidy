import { Fundraiser } from '../types';
import authService from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpires');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Authentication expired. Please login again.');
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const fundraiserApi = {
  async getFundraisers(params?: {
    page?: number;
    limit?: number;
    name?: string;
    created_by?: string;
    chat_id?: string;
  }): Promise<{ fundraisers: Fundraiser[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.name) searchParams.append('name', params.name);
    if (params?.created_by) searchParams.append('created_by', params.created_by);
    if (params?.chat_id) searchParams.append('chat_id', params.chat_id);
    const url = `${API_BASE_URL}/fundraisers?${searchParams}`;
    const response = await authService.authenticatedRequest(url, { method: 'GET' });
    return handleResponse(response);
  },

  async getFundraiserById(id: string): Promise<Fundraiser> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/fundraisers/${id}`, { method: 'GET' });
    return handleResponse(response);
  },

  async createFundraiser(fundraiserData: Partial<Fundraiser>): Promise<Fundraiser> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/fundraisers`, {
      method: 'POST',
      body: JSON.stringify(fundraiserData),
    });
    return handleResponse(response);
  },

  async updateFundraiser(id: string, fundraiserData: Partial<Fundraiser>): Promise<Fundraiser> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/fundraisers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(fundraiserData),
    });
    return handleResponse(response);
  },

  async deleteFundraiser(id: string): Promise<void> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/fundraisers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  },

  async getFundraiserStats(): Promise<any> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/fundraisers/stats`, { method: 'GET' });
    return handleResponse(response);
  },
}; 
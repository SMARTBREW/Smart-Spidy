import { User, AdminStats } from '../types';
import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ;

// Global loading wrapper for admin API calls
let withLoading: any = null;

export const setAdminLoadingWrapper = (loadingWrapper: any) => {
  withLoading = loadingWrapper;
};



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

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isActive: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  totalActiveUsers?: number;
  totalInactiveUsers?: number;
}

export interface UserStatsResponse {
  overall: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    users: number;
  };
}

export interface UserSession {
  id: string;
  userId: string;
  loginTime: string;
  logoutTime: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionDuration: number | null;
  isActive: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SessionsResponse {
  sessions: UserSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  totalActiveSessions?: number;
  totalEndedSessions?: number;
}

export interface SessionStatsResponse {
  total: number;
  active: number;
  inactive: number;
  today: number;
}


export const adminApi = {
  async getUsers(params?: {
    page?: number;
    limit?: number;
    name?: string;
    role?: string;
  }): Promise<UsersResponse> {
    const getUsersFn = async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.name) searchParams.append('name', params.name);
      if (params?.role) searchParams.append('role', params.role);

      const url = `${API_BASE_URL}/users?${searchParams}`;
      
      const response = await authService.authenticatedRequest(url, {
        method: 'GET',
      });
      return handleResponse(response);
    };

    if (withLoading) {
      return withLoading('admin-get-users', getUsersFn)();
    }
    return getUsersFn();
  },

  async getUserById(id: string): Promise<User> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
    });
    return handleResponse(response);
  },

  async createUser(userData: CreateUserData): Promise<User> {
    const createUserFn = async () => {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/users`, {
        method: 'POST',
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          is_active: userData.isActive,
        }),
      });

      return handleResponse(response);
    };

    if (withLoading) {
      return withLoading('admin-create-user', createUserFn)();
    }
    return createUserFn();
  },

  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...(userData.name && { name: userData.name }),
        ...(userData.email && { email: userData.email }),
        ...(userData.role && { role: userData.role }),
        ...(userData.isActive !== undefined && { is_active: userData.isActive }),
      }),
    });

    return handleResponse(response);
  },

  async deleteUser(id: string): Promise<void> {
    const deleteUserFn = async () => {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    };

    if (withLoading) {
      return withLoading('admin-delete-user', deleteUserFn)();
    }
    return deleteUserFn();
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });

    return handleResponse(response);
  },

  async getUserStats(): Promise<UserStatsResponse> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/users/stats`, {
      method: 'GET',
    });

    return handleResponse(response);
  },

  async getAdminStats(): Promise<AdminStats> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/users/stats`, {
      method: 'GET',
    });

    const stats = await handleResponse(response);
    
    return {
      totalUsers: stats.overall.total,
      activeUsers: stats.overall.active,
      totalChats: 0, // TODO: Implement when chat stats endpoint is available
      totalMessages: 0, // TODO: Implement when message stats endpoint is available
      trainingDataCount: 0, // TODO: Implement when message stats endpoint is available
      activeSessions: 0, // TODO: Implement when session stats endpoint is available
    };
  },

  async getSessions(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    isActive?: boolean;
  }): Promise<SessionsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.userId) searchParams.append('user_id', params.userId);
    if (params?.isActive !== undefined) searchParams.append('is_active', params.isActive.toString());

    const response = await authService.authenticatedRequest(`${API_BASE_URL}/users/sessions?${searchParams}`, {
      method: 'GET',
    });

    return handleResponse(response);
  },

  async getSessionStats(): Promise<SessionStatsResponse> {
    const response = await authService.authenticatedRequest(`${API_BASE_URL}/users/sessions/stats`, {
      method: 'GET',
    });

    return handleResponse(response);
  },
}; 
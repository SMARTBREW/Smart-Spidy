interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  tokens: {
    access: {
      token: string;
      expires: string;
    };
    refresh: {
      token: string;
      expires: string;
    };
  };
  session_id?: string;
}

interface AuthTokens {
  access: {
    token: string;
    expires: string;
  };
  refresh: {
    token: string;
    expires: string;
  };
}

class AuthService {
  private baseURL = 'http://localhost:3000/api';

  // Store tokens in localStorage
  private setTokens(tokens: AuthTokens) {
    localStorage.setItem('accessToken', tokens.access.token);
    localStorage.setItem('refreshToken', tokens.refresh.token);
    localStorage.setItem('tokenExpires', tokens.access.expires);
  }

    // Get stored tokens
  private async getTokens(): Promise<AuthTokens | null> {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const tokenExpires = localStorage.getItem('tokenExpires');

    if (!accessToken || !refreshToken) {
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    if (tokenExpires) {
      const expirationTime = new Date(tokenExpires);
      const currentTime = new Date();
      const bufferTime = new Date(Date.now() + 5 * 60 * 1000);
      
      if (expirationTime < bufferTime) {
        // Token expires within 5 minutes, try to refresh
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          this.logout();
          return null;
        }
        // Get the new tokens after refresh
        const newAccessToken = localStorage.getItem('accessToken');
        const newRefreshToken = localStorage.getItem('refreshToken');
        const newTokenExpires = localStorage.getItem('tokenExpires');
        
        if (newAccessToken && newRefreshToken) {
          return {
            access: { token: newAccessToken, expires: newTokenExpires! },
            refresh: { token: newRefreshToken, expires: '' }
          };
        }
      }
    }

    return {
      access: { token: accessToken, expires: tokenExpires! },
      refresh: { token: refreshToken, expires: '' }
    };
  }

  // Clear tokens
  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpires');
    localStorage.removeItem('user');
  }

  // Login user
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data: LoginResponse = await response.json();
      
      // Store tokens and user data
      this.setTokens(data.tokens);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      const tokens = await this.getTokens();
      if (tokens) {
        await fetch(`${this.baseURL}/users/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.access.token}`,
          },
          body: JSON.stringify({
            session_id: localStorage.getItem('sessionId')
          }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getTokens();
    return tokens !== null;
  }

  // Get access token for API calls
  async getAccessToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.access.token || null;
  }

  // Refresh token
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}/users/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      this.setTokens(data.tokens);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
      return false;
    }
  }

  // Make authenticated API calls
  async authenticatedRequest(url: string, options: RequestInit = {}) {
    let accessToken = await this.getAccessToken();
    
    if (!accessToken) {
      // Try to refresh token
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        throw new Error('Authentication expired. Please login again.');
      }
      accessToken = await this.getAccessToken();
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // If we get a 401, try to refresh token once more
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const newAccessToken = await this.getAccessToken();
        if (newAccessToken) {
          // Retry the request with new token
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newAccessToken}`,
              'Content-Type': 'application/json',
            },
          });
        }
      }
      // If refresh failed, clear tokens and throw error
      this.logout();
      throw new Error('Authentication expired. Please login again.');
    }

    return response;
  }
}

export const authService = new AuthService();
export default authService; 
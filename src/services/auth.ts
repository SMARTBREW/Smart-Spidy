// NOTE: This service now integrates with the global loading context
// All API calls are automatically wrapped with loading states

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
  private withLoading: any = null;

  // Method to set the loading wrapper from the context
  setLoadingWrapper(withLoading: any) {
    this.withLoading = withLoading;
  }

  private setTokens(tokens: AuthTokens) {
    localStorage.setItem('accessToken', tokens.access.token);
    localStorage.setItem('refreshToken', tokens.refresh.token);
    localStorage.setItem('tokenExpires', tokens.access.expires);
  }

  private async getTokens(): Promise<AuthTokens | null> {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const tokenExpires = localStorage.getItem('tokenExpires');

    if (!accessToken || !refreshToken) {
      return null;
    }

    if (tokenExpires) {
      const expirationTime = new Date(tokenExpires);
      const currentTime = new Date();
      const bufferTime = new Date(Date.now() + 5 * 60 * 1000);
      
      if (expirationTime < bufferTime) {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          this.logout();
          return null;
        }
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

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpires');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const loginFn = async () => {
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
        
        this.setTokens(data.tokens);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.session_id) {
          localStorage.setItem('sessionId', data.session_id);
        }
        return data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    };

    if (this.withLoading) {
      return this.withLoading('auth-login', loginFn)();
    }
    return loginFn();
  }

  async logout(): Promise<void> {
    const logoutFn = async () => {
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
    };

    if (this.withLoading) {
      return this.withLoading('auth-logout', logoutFn)();
    }
    return logoutFn();
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getTokens();
    return tokens !== null;
  }

  async getAccessToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.access.token || null;
  }

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


  async authenticatedRequest(url: string, options: RequestInit = {}) {
    let accessToken = await this.getAccessToken();
    if (!accessToken) {
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

    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const newAccessToken = await this.getAccessToken();
        if (newAccessToken) {
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
      this.logout();
      throw new Error('Authentication expired. Please login again.');
    }

    return response;
  }
}

export const authService = new AuthService();
export default authService; 
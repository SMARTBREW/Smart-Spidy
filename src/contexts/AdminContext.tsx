import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminStats, User } from '../types';
import { adminApi } from '../services/admin';

interface AdminContextType {
  // Stats
  stats: AdminStats | null;
  isStatsLoading: boolean;
  
  // Users
  users: User[];
  isUsersLoading: boolean;
  usersPagination: any;
  
  // Shared data
  allUsers: User[];
  isAllUsersLoading: boolean;
  
  // Methods
  refreshStats: () => Promise<void>;
  fetchUsers: (params?: any) => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  
  // Cache management
  clearCache: () => void;
  lastFetch: {
    stats?: number;
    users?: number;
    allUsers?: number;
  };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: React.ReactNode;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  // Stats state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersPagination, setUsersPagination] = useState<any>(null);
  
  // All users for selectors
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isAllUsersLoading, setIsAllUsersLoading] = useState(false);
  
  // Cache timestamps
  const [lastFetch, setLastFetch] = useState<{
    stats?: number;
    users?: number;
    allUsers?: number;
  }>({});

  // Check if cache is fresh
  const isCacheFresh = (key: keyof typeof lastFetch): boolean => {
    const timestamp = lastFetch[key];
    return timestamp ? (Date.now() - timestamp) < CACHE_DURATION : false;
  };

  // Track ongoing requests to prevent duplicates
  const [ongoingRequests, setOngoingRequests] = useState<Set<string>>(new Set());

  // Refresh admin stats
  const refreshStats = useCallback(async () => {
    if (isCacheFresh('stats') || ongoingRequests.has('stats')) return;
    
    setOngoingRequests(prev => new Set(prev).add('stats'));
    try {
      setIsStatsLoading(true);
      const fetchedStats = await adminApi.getAdminStats();
      setStats(fetchedStats);
      setLastFetch(prev => ({ ...prev, stats: Date.now() }));
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsStatsLoading(false);
      setOngoingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete('stats');
        return newSet;
      });
    }
  }, [isCacheFresh, ongoingRequests]);

  // Fetch users with pagination
  const fetchUsers = useCallback(async (params: any = {}) => {
    try {
      setIsUsersLoading(true);
      const response = await adminApi.getUsers(params);
      setUsers(response.users);
      setUsersPagination(response.pagination);
      setLastFetch(prev => ({ ...prev, users: Date.now() }));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  // Fetch all users for selectors (cached)
  const fetchAllUsers = useCallback(async () => {
    if ((isCacheFresh('allUsers') && allUsers.length > 0) || ongoingRequests.has('allUsers')) return;
    
    setOngoingRequests(prev => new Set(prev).add('allUsers'));
    try {
      setIsAllUsersLoading(true);
      const response = await adminApi.getUsers({ limit: 100 }); // Respect backend limit
      setAllUsers(response.users);
      setLastFetch(prev => ({ ...prev, allUsers: Date.now() }));
    } catch (error) {
      console.error('Error fetching all users:', error);
    } finally {
      setIsAllUsersLoading(false);
      setOngoingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete('allUsers');
        return newSet;
      });
    }
  }, [isCacheFresh, allUsers.length, ongoingRequests]);

  // Clear cache
  const clearCache = useCallback(() => {
    setLastFetch({});
    setStats(null);
    setUsers([]);
    setAllUsers([]);
  }, []);

  // Auto-fetch stats on mount
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const value: AdminContextType = {
    // Stats
    stats,
    isStatsLoading,
    
    // Users
    users,
    isUsersLoading,
    usersPagination,
    
    // Shared data
    allUsers,
    isAllUsersLoading,
    
    // Methods
    refreshStats,
    fetchUsers,
    fetchAllUsers,
    clearCache,
    lastFetch,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

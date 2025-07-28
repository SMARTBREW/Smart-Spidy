import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Activity,
  Clock,
  MapPin,
  Monitor,
  Calendar,
  User,
  Wifi,
  WifiOff,
  Globe,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { UserSession, AdminStats } from '../../types';
import { adminApi, UserSession as ApiUserSession } from '../../services/admin';

interface UserSessionsTableProps {
  stats: AdminStats | null;
  isLoading: boolean;
}

export const UserSessionsTable: React.FC<UserSessionsTableProps> = ({ stats }) => {
  const [sessions, setSessions] = useState<ApiUserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [selectedSession, setSelectedSession] = useState<ApiUserSession | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalActiveSessions, setTotalActiveSessions] = useState(0);
  const [totalEndedSessions, setTotalEndedSessions] = useState(0);
  const SESSIONS_PER_PAGE = 10;

  const fetchSessions = async (pageNum = page) => {
    try {
      setIsLoading(true);
      const response = await adminApi.getSessions({
        page: pageNum,
        limit: SESSIONS_PER_PAGE,
      });
      setSessions(response.sessions);
      setTotalPages(response.pagination.pages || 1);
      setTotalSessions(response.pagination.total || 0);
      setTotalActiveSessions(response.totalActiveSessions || 0);
      setTotalEndedSessions(response.totalEndedSessions || 0);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(page);
  }, [page]);

  // Auto-refresh active sessions every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessions.some(s => s.isActive)) {
        fetchSessions();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [sessions]);

  // Pagination controls
  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const handlePageClick = (p: number) => setPage(p);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.ipAddress?.includes(searchTerm) ||
                         session.userAgent?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && session.isActive) ||
                         (statusFilter === 'ended' && !session.isActive);
    return matchesSearch && matchesStatus;
  });

  const localStats = {
    total: sessions.length,
    active: sessions.filter(s => s.isActive).length,
    avgDuration: sessions.length > 0 ? 
      Math.round(sessions.filter(s => s.sessionDuration).reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / sessions.filter(s => s.sessionDuration).length) : 0,
    uniqueUsers: new Set(sessions.map(s => s.userId)).size
  };

  const StatCard: React.FC<{ 
    title: string; 
    value: number | string; 
    icon: React.ElementType; 
    color: string;
    bgColor: string;
    trend?: string;
  }> = ({ title, value, icon: Icon, color, bgColor, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColor} p-6 rounded-xl shadow-sm border border-gray-100`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className="text-green-600 text-sm font-medium mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-white/50 ${color}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </motion.div>
  );

  const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
      isActive 
        ? 'bg-green-100 text-green-800 border-green-200' 
        : 'bg-gray-100 text-gray-800 border-gray-200'
    }`}>
      {isActive ? (
        <>
          <Wifi className="w-3 h-3 mr-1.5" />
          Active
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 mr-1.5" />
          Ended
        </>
      )}
    </span>
  );

  const formatDuration = (seconds: number | null, isActive: boolean, loginTime: string | null, logoutTime: string | null) => {
    if (isActive) {
      // For active sessions, show live duration
      if (!seconds || seconds <= 0) return 'N/A';
      
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      } else {
        return `${remainingSeconds}s`;
      }
    } else {
      // For ended sessions, calculate duration from login and logout times
      if (logoutTime && loginTime) {
        const loginTimeDate = new Date(loginTime);
        const logoutTimeDate = new Date(logoutTime);
        const durationSeconds = Math.floor((logoutTimeDate.getTime() - loginTimeDate.getTime()) / 1000);
        
        if (durationSeconds <= 0) return 'N/A';
        
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const remainingSeconds = durationSeconds % 60;
        
        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
          return `${minutes}m ${remainingSeconds}s`;
        } else {
          return `${remainingSeconds}s`;
        }
      }
      return 'N/A';
    }
  };

  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    
    // Simple browser detection
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const getOSInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Other';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Analytics Header
  const avgDuration = sessions.length > 0 ? 
    Math.round(sessions.filter(s => s.sessionDuration).reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / sessions.filter(s => s.sessionDuration).length) : 0;

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Sessions"
          value={totalSessions}
          icon={Activity}
          color="text-teal-600"
          bgColor="bg-gradient-to-br from-teal-50 to-teal-100"
        />
        <StatCard
          title="Active Sessions"
          value={totalActiveSessions}
          icon={Wifi}
          color="text-green-600"
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
        />
        <StatCard
          title="Ended Sessions"
          value={totalEndedSessions}
          icon={WifiOff}
          color="text-gray-600"
          bgColor="bg-gradient-to-br from-gray-50 to-gray-100"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Sessions</h1>
          <p className="text-gray-600 mt-2">Monitor user login sessions and activity patterns</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => fetchSessions()}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by user, IP address, or device..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'ended')}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="all">All Sessions</option>
              <option value="active">Active Sessions</option>
              <option value="ended">Ended Sessions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Duration</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Login Time</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Logout Time</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <Activity className="w-16 h-16 text-gray-300" />
                      <p className="text-lg font-medium">No sessions found</p>
                      {searchTerm && (
                        <p className="text-sm text-gray-400">Try adjusting your search terms</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <motion.tr
                    key={session.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="py-5 px-6">
                      {session.user ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-sm font-semibold">
                              {session.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{session.user.name}</p>
                            <p className="text-sm text-gray-500">{session.user.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-md">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-500">Unknown User</p>
                            <p className="text-sm text-gray-400">ID: {session.userId}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      <StatusBadge isActive={session.isActive} />
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 font-medium">
                          {formatDuration(session.sessionDuration, session.isActive, session.loginTime, session.logoutTime)}
                        </span>
                        {session.isActive && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Live
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 text-sm">
                          {session.loginTime ? new Date(session.loginTime).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 text-sm">
                          {session.logoutTime ? new Date(session.logoutTime).toLocaleString() : 
                           session.isActive ? 'Active' : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                          title="View session details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination UI */}
      <div className="flex justify-center items-center space-x-2 my-4">
        <button onClick={handlePrevPage} disabled={page === 1} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Prev</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => handlePageClick(i + 1)}
            className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            {i + 1}
          </button>
        ))}
        <button onClick={handleNextPage} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}; 
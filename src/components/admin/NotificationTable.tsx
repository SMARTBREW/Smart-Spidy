import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Clock, 
  MessageCircle, 
  CheckCircle, 
  X,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { Notification, NotificationStats } from '../../types';
import { getAllNotifications, deleteNotification, getAdminNotificationStats } from '../../services/notification';

interface NotificationTableProps {
  stats?: any;
  isLoading?: boolean;
}

export const NotificationTable: React.FC<NotificationTableProps> = ({ 
  stats, 
  isLoading 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationStats, setNotificationStats] = useState<NotificationStats>({ total: 0, unread: 0, read: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const [notificationsData, statsData] = await Promise.all([
        getAllNotifications(),
        getAdminNotificationStats()
      ]);
      setNotifications(notificationsData);
      setNotificationStats(statsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Refresh stats
      const stats = await getAdminNotificationStats();
      setNotificationStats(stats);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    // Apply status filter first
    let passesStatusFilter = true;
    if (filter === 'unread') passesStatusFilter = !notification.isRead;
    if (filter === 'read') passesStatusFilter = notification.isRead;
    
    // If it doesn't pass status filter, exclude it
    if (!passesStatusFilter) return false;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const userName = notification.userName?.toLowerCase() || '';
      const userEmail = notification.userEmail?.toLowerCase() || '';
      const chatName = notification.chatName?.toLowerCase() || '';
      const title = notification.title?.toLowerCase() || '';
      const message = notification.message?.toLowerCase() || '';
      
      const matchesSearch = userName.includes(searchLower) || 
                           userEmail.includes(searchLower) || 
                           chatName.includes(searchLower) || 
                           title.includes(searchLower) || 
                           message.includes(searchLower);
      
      return matchesSearch;
    }
    
    // If no search term, include all that passed status filter
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            Manage system notifications and alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{notificationStats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-red-600">{notificationStats.unread}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Read</p>
              <p className="text-2xl font-bold text-green-600">{notificationStats.read}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'read', label: 'Read' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                } ${searchTerm ? 'ring-1 ring-blue-200' : ''}`}
              >
                {label}
                {searchTerm && filter === key && (
                  <span className="ml-1 text-xs bg-blue-200 text-blue-700 px-1 rounded">
                    {filteredNotifications.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {searchTerm && (
            <div className="text-sm text-blue-600 font-medium">
              Search active
            </div>
          )}
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username, email, chat name, title, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
                
      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {searchTerm ? (
                  <>
                    {filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Read'} Notifications for "{searchTerm}"
                  </>
                ) : (
                  filter === 'all' ? 'All Notifications' : 
                  filter === 'unread' ? 'Unread Notifications' : 'Read Notifications'
                )}
              </h3>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filter === 'all' ? 'all' : filter === 'unread' ? 'unread' : 'read'} notifications matching your search
                </p>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {searchTerm ? `${filteredNotifications.length} results` : 
               `${filteredNotifications.length} of ${notifications.length} notifications`}
            </div>
          </div>
        </div>
                  
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? (
                `No ${filter === 'all' ? '' : filter === 'unread' ? 'unread ' : 'read '}notifications found for "${searchTerm}"`
              ) : (
                'No notifications found'
              )}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm ? (
                `Try adjusting your search terms or check the ${filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Read'} tab`
              ) : (
                filter === 'all' ? 'No notifications available' :
                filter === 'unread' ? 'No unread notifications' : 'No read notifications'
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 transition-colors ${
                  notification.isRead ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {searchTerm ? (
                          <span dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(notification.title, searchTerm) 
                          }} />
                        ) : (
                          notification.title
                        )}
                      </h4>
                      {!notification.isRead && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          New
                        </span>
                      )}
                      {notification.notificationType && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {notification.notificationType}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">
                      {searchTerm ? (
                        <span dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerm(notification.message, searchTerm) 
                        }} />
                      ) : (
                        notification.message
                      )}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      </div>
                      {notification.userName && (
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span className="text-green-600 font-medium">{notification.userName}</span>
                        </div>
                      )}
                      {notification.userEmail && (
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span className="text-gray-600">{notification.userEmail}</span>
                        </div>
                      )}
                      {notification.chatName && (
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span className="text-blue-600">{notification.chatName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
    </motion.div>
  );
}; 
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ThumbsUp, 
  ThumbsDown,
  Eye,
  Calendar,
  User,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3
} from 'lucide-react';
import { MessageFeedback, AdminStats } from '../../types';

interface MessageFeedbackTableProps {
  stats: AdminStats | null;
  isLoading: boolean;
}

export const MessageFeedbackTable: React.FC<MessageFeedbackTableProps> = ({ stats }) => {
  const [feedback, setFeedback] = useState<MessageFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'up' | 'down'>('all');

  useEffect(() => {
    // TODO: Fetch feedback from API
    const fetchFeedback = async () => {
      try {
        // Placeholder data for now
        setFeedback([]);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = item.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.message?.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFeedback = feedbackFilter === 'all' || item.feedbackType === feedbackFilter;
    return matchesSearch && matchesFeedback;
  });

  const feedbackStats = {
    total: feedback.length,
    positive: feedback.filter(f => f.feedbackType === 'up').length,
    negative: feedback.filter(f => f.feedbackType === 'down').length,
    ratio: feedback.length > 0 ? (feedback.filter(f => f.feedbackType === 'up').length / feedback.length * 100).toFixed(1) : '0'
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

  const FeedbackBadge: React.FC<{ type: 'up' | 'down' }> = ({ type }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
      type === 'up' 
        ? 'bg-green-100 text-green-800 border-green-200' 
        : 'bg-red-100 text-red-800 border-red-200'
    }`}>
      {type === 'up' ? (
        <>
          <ThumbsUp className="w-3 h-3 mr-1.5" />
          Positive
        </>
      ) : (
        <>
          <ThumbsDown className="w-3 h-3 mr-1.5" />
          Negative
        </>
      )}
    </span>
  );

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

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Feedback"
          value={stats?.totalFeedback || 0}
          icon={MessageCircle}
          color="text-blue-600"
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
        />
        <StatCard
          title="Positive Feedback"
          value={feedbackStats.positive}
          icon={ThumbsUp}
          color="text-green-600"
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
          trend="+15% this week"
        />
        <StatCard
          title="Negative Feedback"
          value={feedbackStats.negative}
          icon={ThumbsDown}
          color="text-red-600"
          bgColor="bg-gradient-to-br from-red-50 to-red-100"
        />
        <StatCard
          title="Positive Rate"
          value={`${feedbackStats.ratio}%`}
          icon={BarChart3}
          color="text-purple-600"
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Message Feedback</h1>
          <p className="text-gray-600 mt-2">Monitor user feedback on assistant responses</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by user or message content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={feedbackFilter}
              onChange={(e) => setFeedbackFilter(e.target.value as 'all' | 'up' | 'down')}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="all">All Feedback</option>
              <option value="up">Positive Only</option>
              <option value="down">Negative Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Message Preview</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Feedback</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Date</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFeedback.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <ThumbsUp className="w-16 h-16 text-gray-300" />
                      <p className="text-lg font-medium">No feedback found</p>
                      {searchTerm && (
                        <p className="text-sm text-gray-400">Try adjusting your search terms</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFeedback.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="py-5 px-6">
                      {item.user ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-sm font-semibold">
                              {item.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.user.name}</p>
                            <p className="text-sm text-gray-500">{item.user.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Unknown user</span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      <div className="max-w-md">
                        {item.message ? (
                          <>
                            <p className="text-gray-900 truncate font-medium">
                              {item.message.content.length > 80 
                                ? `${item.message.content.substring(0, 80)}...` 
                                : item.message.content
                              }
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.message.content.length} characters
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">Message not available</span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <FeedbackBadge type={item.feedbackType} />
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 text-sm">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => console.log('View feedback details:', item.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                          title="View feedback details"
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
    </div>
  );
}; 
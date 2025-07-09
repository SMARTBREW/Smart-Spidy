import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  MessageSquare,
  Pin,
  PinOff,
  Calendar,
  User,
  MoreHorizontal,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Chat, AdminStats } from '../../types';

interface ChatsTableProps {
  stats: AdminStats | null;
  isLoading: boolean;
}

export const ChatsTable: React.FC<ChatsTableProps> = ({ stats, isLoading: statsLoading }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'yellow' | 'red' | 'gold'>('all');
  const [pinnedFilter, setPinnedFilter] = useState<'all' | 'pinned' | 'unpinned'>('all');

  useEffect(() => {
    // TODO: Fetch chats from API
    const fetchChats = async () => {
      try {
        // Placeholder data for now
        setChats([]);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, []);

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
    const matchesPinned = pinnedFilter === 'all' || 
                         (pinnedFilter === 'pinned' && chat.pinned) ||
                         (pinnedFilter === 'unpinned' && !chat.pinned);
    return matchesSearch && matchesStatus && matchesPinned;
  });

  const handleDeleteChat = async (chatId: string) => {
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      // TODO: Implement delete chat API call
      console.log('Delete chat:', chatId);
    }
  };

  const handleViewChat = (chatId: string) => {
    // TODO: Implement view chat details
    console.log('View chat:', chatId);
  };

  const handleTogglePin = async (chatId: string, isPinned: boolean) => {
    // TODO: Implement toggle pin API call
    console.log('Toggle pin for chat:', chatId, 'to:', !isPinned);
  };

  const StatCard: React.FC<{ 
    title: string; 
    value: number; 
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
          <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
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

  const StatusBadge: React.FC<{ status: string | null }> = ({ status }) => {
    if (!status) return <span className="text-gray-400 text-sm">None</span>;
    
    const statusConfig = {
      green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'Good' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', label: 'Warning' },
      red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'Issue' },
      gold: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'Premium' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <span className="text-gray-400 text-sm">Unknown</span>;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        <div className={`w-2 h-2 rounded-full mr-1.5 ${status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-yellow-500' : status === 'red' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
        {config.label}
      </span>
    );
  };

  const PinnedBadge: React.FC<{ isPinned: boolean }> = ({ isPinned }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
      isPinned 
        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
        : 'bg-gray-100 text-gray-600 border border-gray-200'
    }`}>
      {isPinned ? (
        <>
          <Pin className="w-3 h-3 mr-1.5" />
          Pinned
        </>
      ) : (
        <>
          <PinOff className="w-3 h-3 mr-1.5" />
          Unpinned
        </>
      )}
    </span>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Chats"
          value={stats?.totalChats || 0}
          icon={MessageSquare}
          color="text-orange-600"
          bgColor="bg-gradient-to-br from-orange-50 to-orange-100"
          trend="+12% this week"
        />
        <StatCard
          title="Active Chats"
          value={filteredChats.filter(chat => chat.status === 'green').length || 0}
          icon={TrendingUp}
          color="text-green-600"
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
        />
        <StatCard
          title="Pinned Chats"
          value={filteredChats.filter(chat => chat.pinned).length || 0}
          icon={Pin}
          color="text-indigo-600"
          bgColor="bg-gradient-to-br from-indigo-50 to-indigo-100"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chats Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage all user conversations</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col xl:flex-row space-y-4 xl:space-y-0 xl:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search chats by name or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="all">All Status</option>
                <option value="green">Good</option>
                <option value="yellow">Warning</option>
                <option value="red">Issue</option>
                <option value="gold">Premium</option>
              </select>
            </div>
            <select
              value={pinnedFilter}
              onChange={(e) => setPinnedFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="all">All Chats</option>
              <option value="pinned">Pinned</option>
              <option value="unpinned">Unpinned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chats Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Chat</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Messages</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Pinned</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Last Activity</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredChats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <MessageSquare className="w-16 h-16 text-gray-300" />
                      <p className="text-lg font-medium">No chats found</p>
                      {searchTerm && (
                        <p className="text-sm text-gray-400">Try adjusting your search terms</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredChats.map((chat) => (
                  <motion.tr
                    key={chat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 max-w-xs truncate">{chat.name}</p>
                          <p className="text-sm text-gray-500">
                            Created {new Date(chat.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      {chat.user ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-sm font-semibold">
                              {chat.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{chat.user.name}</p>
                            <p className="text-sm text-gray-500">{chat.user.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No user assigned</span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 font-medium">{chat.messageCount || chat.messages?.length || 0}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <StatusBadge status={chat.status} />
                    </td>
                    <td className="py-5 px-6">
                      <PinnedBadge isPinned={chat.pinned} />
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 text-sm">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewChat(chat.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                          title="View chat details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePin(chat.id, chat.pinned)}
                          className={`p-2 rounded-lg transition-colors duration-150 ${
                            chat.pinned 
                              ? 'text-indigo-600 hover:bg-indigo-50' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          title={chat.pinned ? 'Unpin chat' : 'Pin chat'}
                        >
                          {chat.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteChat(chat.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          title="Delete chat"
                        >
                          <Trash2 className="w-4 h-4" />
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
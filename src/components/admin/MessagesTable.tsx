import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  MessageCircle,
  User,
  Bot,
  Calendar,
  Hash,
  Clock,
  TrendingUp,
  X
} from 'lucide-react';
import { Message, AdminStats, Chat, TrainingData, QAPair } from '../../types';

interface MessagesTableProps {
  stats: AdminStats | null;
}

export const MessagesTable: React.FC<MessagesTableProps> = ({ stats }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [senderFilter, setSenderFilter] = useState<'all' | 'user' | 'assistant'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    // TODO: Replace with real API calls
    const fetchAll = async () => {
      try {
        setMessages([]); // Placeholder
        setChats([]); // Placeholder
        setTrainingData([]); // Placeholder
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Helper: Map chatId to chat name
  const chatIdToName: Record<string, string> = {};
  chats.forEach(chat => {
    chatIdToName[chat.id] = chat.name;
  });

  // Helper: Map messageId to feedback (qualityScore or improvementNotes)
  const messageIdToFeedback: Record<string, string> = {};
  trainingData.forEach(td => {
    if (td.messageId) {
      messageIdToFeedback[td.messageId] = td.improvementNotes || `Score: ${td.qualityScore}`;
    }
  });

  // Filter only user messages for queries
  const userMessages = messages.filter(
    m => m.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group messages into QAPairs
  const qaPairs: QAPair[] = [];
  let i = 0;
  const sortedMessages = messages.slice().sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });
  while (i < sortedMessages.length) {
    if (sortedMessages[i].sender === 'user') {
      const query = sortedMessages[i];
      let answer: typeof query | undefined = undefined;
      if (
        i + 1 < sortedMessages.length &&
        sortedMessages[i + 1].sender === 'assistant' &&
        sortedMessages[i + 1].chatId === query.chatId
      ) {
        answer = sortedMessages[i + 1];
        i += 1;
      }
      qaPairs.push({ query, answer });
    }
    i += 1;
  }

  // Build rows: each QAPair
  const rows: Array<{
    query: QAPair;
    users: string;
    chats: string;
    feedbacks: string;
    timestamp: string;
  }> = [];
  qaPairs.forEach(pair => {
    const chats = chatIdToName[pair.query.chatId || ''] || 'Unknown';
    const feedbacks = messageIdToFeedback[pair.query.id] || '-';
    const users = pair.query.userId || 'User';
    rows.push({ query: pair, users, chats, feedbacks, timestamp: pair.query.createdAt ? new Date(pair.query.createdAt).toLocaleString() : '' });
  });

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      // TODO: Implement delete message API call
      console.log('Delete message:', messageId);
    }
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

  const SenderBadge: React.FC<{ sender: 'user' | 'assistant' }> = ({ sender }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
      sender === 'user' 
        ? 'bg-blue-100 text-blue-800 border-blue-200' 
        : 'bg-green-100 text-green-800 border-green-200'
    }`}>
      {sender === 'user' ? (
        <>
          <User className="w-3 h-3 mr-1.5" />
          User
        </>
      ) : (
        <>
          <Bot className="w-3 h-3 mr-1.5" />
          Assistant
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

  // Analytics Header
  const totalMessages = messages.length;
  const userMessagesCount = messages.filter(m => m.sender === 'user').length;
  const assistantMessages = messages.filter(m => m.sender === 'assistant').length;

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Messages"
          value={totalMessages}
          icon={MessageCircle}
          color="text-purple-600"
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
        />
        <StatCard
          title="User Messages"
          value={userMessagesCount}
          icon={User}
          color="text-blue-600"
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
        />
        <StatCard
          title="Assistant Messages"
          value={assistantMessages}
          icon={Bot}
          color="text-green-600"
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages Overview</h1>
          <p className="text-gray-600 mt-2">Monitor all queries and answers</p>
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
              placeholder="Search messages by question..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value as 'all' | 'user' | 'assistant')}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="all">All Feedbacks</option>
              <option value="user">Thumbs Up</option>
              <option value="assistant">Thumbs Down</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Query</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Spidy Answer</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Users</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Chats</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Feedbacks</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <MessageCircle className="w-16 h-16 text-gray-300" />
                      <p className="text-lg font-medium">No queries found</p>
                      {searchTerm && (
                        <p className="text-sm text-gray-400">Try adjusting your search terms</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row.query.query.id}>
                    <td className="py-5 px-6 align-top">
                      <div className="max-w-md">
                        <p className="text-gray-900 truncate font-medium mt-1">{row.query.query.content}</p>
                      </div>
                    </td>
                    <td className="py-5 px-6 align-top">
                      <div className="max-w-md">
                        <p className="text-gray-900 truncate font-medium mt-1">{row.query.answer ? row.query.answer.content : <span className='text-gray-400'>No answer</span>}</p>
                      </div>
                    </td>
                    <td className="py-5 px-6 align-top">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
                        {row.users}
                      </span>
                    </td>
                    <td className="py-5 px-6 align-top">
                      <div className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">{row.chats}</div>
                    </td>
                    <td className="py-5 px-6 align-top">
                      <span className="text-gray-600 font-medium">{row.feedbacks}</span>
                    </td>
                    <td className="py-5 px-6 align-top">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 text-sm">{row.timestamp}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Message Details</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sender</label>
                  <SenderBadge sender={selectedMessage.sender} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </div>
                
                {/* The following block was removed as per the edit hint to remove usage of query/answer fields */}
                {/*
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assistant Answer</label>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.answer}</p>
                  </div>
                </div>
                */}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chat ID</label>
                    <p className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-2 rounded">
                      {selectedMessage.chatId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                    <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                      {selectedMessage.messageOrder || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timestamp</label>
                 
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}; 
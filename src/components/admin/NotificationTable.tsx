import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Chat } from '../../types';
import { Star, X, Calendar, MessageCircle, Clock } from 'lucide-react';

// Extended demo data for demonstration
const notifications = [
  {
    id: 1,
    chatName: 'Project Alpha',
    user: { name: 'Alice Johnson', email: 'alice@example.com' },
    status: 'green',
    days: 2,
    lastMessage: 'Thanks for the update on the project timeline.',
    timestamp: '2024-01-15 14:30',
    messageCount: 12,
    is_read: false,
  },
  {
    id: 2,
    chatName: 'VIP Client',
    user: { name: 'Bob Smith', email: 'bob@example.com' },
    status: 'gold',
    days: 2,
    lastMessage: 'When can we schedule the next meeting?',
    timestamp: '2024-01-15 11:45',
    messageCount: 8,
    is_read: false,
  },
  {
    id: 3,
    chatName: 'Support Ticket',
    user: { name: 'Charlie Brown', email: 'charlie@example.com' },
    status: 'yellow',
    days: 3,
    lastMessage: 'I need help with the login issue.',
    timestamp: '2024-01-14 16:20',
    messageCount: 5,
    is_read: false,
  },
  {
    id: 4,
    chatName: 'Marketing Campaign',
    user: { name: 'Diana Prince', email: 'diana@example.com' },
    status: 'green',
    days: 2,
    lastMessage: 'The campaign results look promising!',
    timestamp: '2024-01-15 09:15',
    messageCount: 15,
    is_read: false,
  },
  {
    id: 5,
    chatName: 'Product Launch',
    user: { name: 'Ethan Hunt', email: 'ethan@example.com' },
    status: 'gold',
    days: 2,
    lastMessage: 'Everything is ready for the launch.',
    timestamp: '2024-01-15 13:22',
    messageCount: 20,
    is_read: false,
  },
  {
    id: 6,
    chatName: 'Bug Report',
    user: { name: 'Fiona Gallagher', email: 'fiona@example.com' },
    status: 'yellow',
    days: 2,
    lastMessage: 'Found a critical bug in the checkout process.',
    timestamp: '2024-01-15 10:30',
    messageCount: 3,
    is_read: false,
  },
  {
    id: 7,
    chatName: 'Partnership Discussion',
    user: { name: 'George Washington', email: 'george@example.com' },
    status: 'green',
    days: 2,
    lastMessage: 'Looking forward to our collaboration.',
    timestamp: '2024-01-15 15:45',
    messageCount: 7,
    is_read: false,
  },
  {
    id: 8,
    chatName: 'Premium Support',
    user: { name: 'Helen Troy', email: 'helen@example.com' },
    status: 'gold',
    days: 2,
    lastMessage: 'Thank you for the priority support.',
    timestamp: '2024-01-15 12:10',
    messageCount: 18,
    is_read: false,
  },
  {
    id: 9,
    chatName: 'Feature Request',
    user: { name: 'Ivan Drago', email: 'ivan@example.com' },
    status: 'yellow',
    days: 2,
    lastMessage: 'Can we add dark mode to the application?',
    timestamp: '2024-01-15 08:55',
    messageCount: 4,
    is_read: false,
  },
  {
    id: 10,
    chatName: 'Sales Inquiry',
    user: { name: 'Julia Roberts', email: 'julia@example.com' },
    status: 'green',
    days: 2,
    lastMessage: 'Interested in the enterprise package.',
    timestamp: '2024-01-15 16:30',
    messageCount: 6,
    is_read: false,
  },
  {
    id: 11,
    chatName: 'Technical Support',
    user: { name: 'Kevin Costner', email: 'kevin@example.com' },
    status: 'gold',
    days: 2,
    lastMessage: 'Server optimization is working great!',
    timestamp: '2024-01-15 14:15',
    messageCount: 11,
    is_read: false,
  },
  {
    id: 12,
    chatName: 'Training Session',
    user: { name: 'Lisa Simpson', email: 'lisa@example.com' },
    status: 'yellow',
    days: 2,
    lastMessage: 'When is the next training scheduled?',
    timestamp: '2024-01-15 11:20',
    messageCount: 9,
    is_read: false,
  },
];

export const NotificationTable: React.FC = () => {
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [notificationList, setNotificationList] = useState(notifications.map(n => ({ ...n, is_read: n.is_read || false })));

  // Only show notifications for exactly 2 days ago
  const filtered = notificationList.filter(n => n.days === 2);

  const markAsRead = (id: number) => {
    setNotificationList(list => list.map(n => n.id === id ? { ...n, is_read: true } : n));
    // TODO: Call backend API to mark as read
  };

  return (
    <div className="space-y-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <span className="text-gray-500">Showing chats for exactly 2 days ago</span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[calc(100vh-200px)] overflow-hidden">
        <div className="h-full overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chat Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">No notifications for 2 days ago.</td>
                </tr>
              ) : (
                filtered.map((n) => (
                  <tr 
                    key={n.id} 
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${n.is_read ? 'opacity-60' : ''}`}
                    onClick={() => setSelectedNotification(n)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{n.chatName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {n.user.name} <span className="text-xs text-gray-400">({n.user.email})</span>
                    </td>
                    <td className="px-6 py-4">
                      {n.status === 'gold' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          <Star className="w-3 h-3 mr-1.5 text-amber-400" fill="currentColor" />
                          {n.status && n.status !== 'gold' && (
                            <span className={`w-2 h-2 rounded-full mr-1.5 ${n.status === 'green' ? 'bg-green-500' : n.status === 'yellow' ? 'bg-yellow-400' : n.status === 'red' ? 'bg-red-500' : ''}`}></span>
                          )}
                          Gold
                        </span>
                      ) : n.status === 'green' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <span className="w-2 h-2 rounded-full mr-1.5 bg-green-500" /> Green
                        </span>
                      ) : n.status === 'yellow' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border-yellow-200">
                          <span className="w-2 h-2 rounded-full mr-1.5 bg-yellow-400" /> Yellow
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{n.lastMessage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {n.timestamp}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {n.is_read ? (
                        <span className="text-xs text-green-600 font-semibold">Read</span>
                      ) : (
                        <span className="text-xs text-yellow-600 font-semibold">Pending</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right-side notification panel */}
      <AnimatePresence>
        {selectedNotification && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSelectedNotification(null)}
            />
            
            {/* Side panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
              className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Notification Details</h2>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chat Name</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedNotification.chatName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <p className="text-gray-900">{selectedNotification.user.name}</p>
                    <p className="text-sm text-gray-500">{selectedNotification.user.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="mt-1">
                      {selectedNotification.status === 'gold' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          <Star className="w-4 h-4 mr-1.5 text-amber-400" fill="currentColor" /> Gold Member
                        </span>
                      ) : selectedNotification.status === 'green' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                          <span className="w-3 h-3 rounded-full mr-1.5 bg-green-500" /> Active
                        </span>
                      ) : selectedNotification.status === 'yellow' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <span className="w-3 h-3 rounded-full mr-1.5 bg-yellow-400" /> Pending
                        </span>
                      ) : null}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Message</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedNotification.lastMessage}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="text-sm">{selectedNotification.timestamp}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Messages</label>
                      <div className="flex items-center text-gray-600">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">{selectedNotification.messageCount} messages</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      View Full Chat
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}; 
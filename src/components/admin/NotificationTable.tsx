import React from 'react';
import { motion } from 'framer-motion';
import { User, Chat } from '../../types';
import { Star } from 'lucide-react';

// Example static data for demonstration
const notifications = [
  {
    chatName: 'Project Alpha',
    user: { name: 'Alice', email: 'alice@example.com' },
    status: 'green',
    days: 2,
  },
  {
    chatName: 'VIP Client',
    user: { name: 'Bob', email: 'bob@example.com' },
    status: 'gold',
    days: 2,
  },
  {
    chatName: 'Support Ticket',
    user: { name: 'Charlie', email: 'charlie@example.com' },
    status: 'yellow',
    days: 3, // will be filtered out
  },
];

export const NotificationTable: React.FC = () => {
  // Only show notifications for exactly 2 days ago
  const filtered = notifications.filter(n => n.days === 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <span className="text-gray-500">Showing chats for exactly 2 days ago</span>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chat Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-gray-400 py-8">No notifications for 2 days ago.</td>
              </tr>
            ) : (
              filtered.map((n, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{n.chatName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{n.user.name} <span className="text-xs text-gray-400">({n.user.email})</span></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {n.status === 'gold' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        <Star className="w-3 h-3 mr-1.5 text-amber-400" fill="currentColor" /> Gold
                      </span>
                    ) : n.status === 'green' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <span className="w-2 h-2 rounded-full mr-1.5 bg-green-500" /> Green
                      </span>
                    ) : n.status === 'yellow' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <span className="w-2 h-2 rounded-full mr-1.5 bg-yellow-400" /> Yellow
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 
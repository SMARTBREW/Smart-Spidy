import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  MessageSquare, 
  MessageCircle, 
  ThumbsUp, 
  Database, 
  Activity
} from 'lucide-react';
import { AdminStats } from '../../types';
import { UsersTable } from './UsersTable';
import { ChatsTable } from './ChatsTable';
import { MessagesTable } from './MessagesTable';
import { UserSessionsTable } from './UserSessionsTable';
import { FundraisersTable } from './FundraisersTable';
import { NotificationTable } from './NotificationTable';

interface AdminDashboardProps {
  userRole: 'admin';
}

type AdminView = 'users' | 'fundraisers' | 'chats' | 'messages' | 'sessions' | 'notifications';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ userRole }) => {
  const [currentView, setCurrentView] = useState<AdminView>('users');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch admin stats from API
    const fetchStats = async () => {
      try {
        // Placeholder data for now
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalChats: 0,
          totalMessages: 0,
          trainingDataCount: 0,
          activeSessions: 0
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const navigationItems = [
    { id: 'users', label: 'Users', icon: Users, color: 'text-green-600' },
    { id: 'fundraisers', label: 'Fundraisers', icon: Database, color: 'text-blue-600' },
    { id: 'chats', label: 'Chats', icon: MessageSquare, color: 'text-orange-600' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, color: 'text-red-600' },
    { id: 'sessions', label: 'User Sessions', icon: Activity, color: 'text-teal-600' },
    { id: 'notifications', label: 'Notifications', icon: ThumbsUp, color: 'text-yellow-600' },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return <UsersTable stats={stats} isLoading={isLoading} />;
      case 'fundraisers':
        return <FundraisersTable />;
      case 'chats':
        return <ChatsTable stats={stats} isLoading={isLoading} />;
      case 'messages':
        return <MessagesTable stats={stats}  />;
      case 'sessions':
        return <UserSessionsTable stats={stats} isLoading={isLoading} />;
      case 'notifications':
        return <NotificationTable />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200 ">
          <h2 className="text-lg font-semibold text-black">Admin Panel</h2>
          <p className="text-gray-500 text-sm capitalize mt-1">{userRole.replace('_', ' ')}</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id as AdminView)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-blue-600' : item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}; 
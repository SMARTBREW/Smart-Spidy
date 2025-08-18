import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  MessageSquare, 
  MessageCircle, 
  ThumbsUp, 
  Database, 
  Activity,
  ArrowLeft
} from 'lucide-react';
import { AdminProvider, useAdminContext } from '../../contexts/AdminContext';
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

const AdminDashboardContent: React.FC<AdminDashboardProps> = ({ userRole }) => {
  const [currentView, setCurrentView] = useState<AdminView>('users');
  const { stats, isStatsLoading } = useAdminContext();

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
        return <UsersTable stats={stats} isLoading={isStatsLoading} />;
      case 'fundraisers':
        return <FundraisersTable />;
      case 'chats':
        return <ChatsTable stats={stats} isLoading={isStatsLoading} />;
      case 'messages':
        return <MessagesTable stats={stats} />;
      case 'sessions':
        return <UserSessionsTable stats={stats} isLoading={isStatsLoading} />;
      case 'notifications':
        return <NotificationTable stats={stats} isLoading={isStatsLoading} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200 ">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 text-sm font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
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

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  return (
    <AdminProvider>
      <AdminDashboardContent {...props} />
    </AdminProvider>
  );
}; 
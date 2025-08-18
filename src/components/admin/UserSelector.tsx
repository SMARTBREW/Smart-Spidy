import React, { useEffect } from 'react';
import { User } from 'lucide-react';
import { useAdminContext } from '../../contexts/AdminContext';

interface UserSelectorProps {
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
  placeholder?: string;
  className?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUserId,
  onUserChange,
  placeholder = "Filter by user...",
  className = ""
}) => {
  const { allUsers, isAllUsersLoading, fetchAllUsers } = useAdminContext();

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  return (
    <div className={`relative ${className}`}>
      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <select
        value={selectedUserId || ''}
        onChange={(e) => onUserChange(e.target.value || null)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
        disabled={isAllUsersLoading}
      >
        <option value="">{isAllUsersLoading ? 'Loading users...' : placeholder}</option>
        {allUsers.map(user => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

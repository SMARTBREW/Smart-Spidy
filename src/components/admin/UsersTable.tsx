import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX,
  MoreHorizontal,
  Calendar,
  MessageSquare,
  Users,
  Activity,
  X,
  Mail,
  User as UserIcon,
  Shield,
  Save,
  AlertCircle
} from 'lucide-react';
import { User, AdminStats } from '../../types';
import { adminApi, CreateUserData, UpdateUserData } from '../../services/admin';

interface UsersTableProps {
  stats: AdminStats | null;
  isLoading: boolean;
}

export const UsersTable: React.FC<UsersTableProps> = ({ stats: _stats, isLoading: _statsLoading }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const USERS_PER_PAGE = 10;
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalActiveUsers, setTotalActiveUsers] = useState(0);
  const [totalInactiveUsers, setTotalInactiveUsers] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await adminApi.getUsers({
          page,
          limit: USERS_PER_PAGE,
        });
        setUsers(response.users);
        setTotalPages(response.pagination.pages || 1);
        setTotalUsers(response.pagination.total || 0);
        setTotalActiveUsers(response.totalActiveUsers || 0);
        setTotalInactiveUsers(response.totalInactiveUsers || 0);
      } catch (error) {
        console.error('Error fetching users:', error);
        // You might want to show a toast notification here
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [page]);

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        password: '', // Reset password on edit
        role: selectedUser.role || 'user',
        isActive: selectedUser.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        isActive: true
      });
    }
    setFormErrors({});
  }, [selectedUser]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    return matchesSearch && matchesStatus;
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!selectedUser && !formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (!selectedUser && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setSelectedUser(null);
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (selectedUser) {
        // Update existing user
        const updateData: UpdateUserData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive
        };
        await adminApi.updateUser(selectedUser.id, updateData);
      } else {
        // Create new user
        const createData: CreateUserData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          isActive: formData.isActive
        };
        await adminApi.createUser(createData);
      }
      
      handleCloseModal();
      // Refresh users list
      const response = await adminApi.getUsers({
        page: 1,
        limit: USERS_PER_PAGE,
      });
      setUsers(response.users);
    } catch (error) {
      console.error('Error saving user:', error);
      // You might want to show a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminApi.deleteUser(userId);
        // Refresh users list
        const response = await adminApi.getUsers({
          page: 1,
          limit: USERS_PER_PAGE,
        });
        setUsers(response.users);
      } catch (error) {
        console.error('Error deleting user:', error);
        // You might want to show a toast notification here
      }
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await adminApi.updateUserStatus(userId, !currentStatus);
      // Refresh users list
      const response = await adminApi.getUsers({
        page: 1,
        limit: USERS_PER_PAGE,
      });
      setUsers(response.users);
    } catch (error) {
      console.error('Error toggling user status:', error);
      // You might want to show a toast notification here
    }
  };

  // Pagination controls
  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const handlePageClick = (p: number) => setPage(p);

  // StatCard component for analytics
  const StatCard: React.FC<{ 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    color: string;
    bgColor: string;
  }> = ({ title, value, icon: Icon, color, bgColor }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColor} p-6 rounded-xl shadow-sm border border-gray-100`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-lg bg-white/50 ${color}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </motion.div>
  );

  const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {isActive ? (
        <>
          <UserCheck className="w-3 h-3 mr-1.5" />
          Active
        </>
      ) : (
        <>
          <UserX className="w-3 h-3 mr-1.5" />
          Inactive
        </>
      )}
    </span>
  );

  const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const roleConfig = {
      user: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      admin: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' }
    };
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

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
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="text-green-600"
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
        />
        <StatCard
          title="Active Users"
          value={totalActiveUsers}
          icon={UserCheck}
          color="text-blue-600"
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
        />
        <StatCard
          title="Inactive Users"
          value={totalInactiveUsers}
          icon={UserX}
          color="text-red-600"
          bgColor="bg-gradient-to-br from-red-50 to-red-100"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-2">Manage all users and their permissions</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add User</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Role</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Last Login</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Created</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <Users className="w-16 h-16 text-gray-300" />
                      <p className="text-lg font-medium">No users found</p>
                      {searchTerm && (
                        <p className="text-sm text-gray-400">Try adjusting your search terms</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-semibold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <RoleBadge role={user.role || 'user'} />
                    </td>
                    <td className="py-5 px-6">
                      <StatusBadge isActive={user.isActive || false} />
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 text-sm">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-gray-500 text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.isActive || false)}
                          className={`p-2 rounded-lg transition-colors duration-150 ${
                            user.isActive 
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.isActive ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          title="Delete user"
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

      {/* User Form Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedUser ? 'Edit User' : 'Add New User'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter full name"
                  />
                  {formErrors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {formErrors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Password field only for create */}
                {!selectedUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter password"
                    />
                    {formErrors.password && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {formErrors.password}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active User</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-8">
                    Active users can log in and use the application
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{selectedUser ? 'Update User' : 'Create User'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}; 
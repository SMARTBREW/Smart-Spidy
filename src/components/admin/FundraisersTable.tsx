import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Calendar, User as UserIcon, Search, Filter } from 'lucide-react';
import { Fundraiser } from '../../types';

export const FundraisersTable: React.FC = () => {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'month'>('all');

  // Analytics calculations
  const totalFundraisers = fundraisers.length;
  const now = new Date();
  const fundraisersThisMonth = fundraisers.filter(f => {
    const created = new Date(f.createdAt);
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;

  useEffect(() => {
    // TODO: Fetch fundraisers from API
    const fetchFundraisers = async () => {
      try {
        // Placeholder data for now
        setFundraisers([]);
      } catch (error) {
        console.error('Error fetching fundraisers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFundraisers();
  }, []);

  // Remove handleCreateFundraiser and handleEditFundraiser
  const handleDeleteFundraiser = async (fundraiserId: string) => {
    if (window.confirm('Are you sure you want to delete this fundraiser?')) {
      // TODO: Implement delete fundraiser API call
      console.log('Delete fundraiser:', fundraiserId);
    }
  };

  // StatCard component for analytics
  const StatCard: React.FC<{ title: string; value: number; icon: React.ElementType; color: string; bgColor: string }> = ({ title, value, icon: Icon, color, bgColor }) => (
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

  // Filter fundraisers by search and filter
  const filteredFundraisers = fundraisers.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const created = new Date(f.createdAt);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'month' && created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth());
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Total Fundraisers"
          value={totalFundraisers}
          icon={UserIcon}
          color="text-blue-600"
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
        />
        <StatCard
          title="Created This Month"
          value={fundraisersThisMonth}
          icon={Calendar}
          color="text-green-600"
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
        />
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fundraisers</h1>
          <p className="text-gray-500 mt-1">Manage all fundraisers</p>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search fundraisers by name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as 'all' | 'month')}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="all">All</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>
      {/* Fundraisers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Fundraiser</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Created By</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Created At</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFundraisers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <UserIcon className="w-12 h-12 text-gray-300" />
                      <p>No fundraisers found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFundraisers.map((fundraiser) => (
                  <motion.tr
                    key={fundraiser.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="py-4 px-4 font-medium text-gray-900">{fundraiser.name}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 text-sm">{fundraiser.createdBy.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 text-sm">
                          {new Date(fundraiser.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Only keep delete action for now */}
                        <button
                          onClick={() => handleDeleteFundraiser(fundraiser.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete fundraiser"
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
      {/* Removed CreateFundraiserModal */}
    </div>
  );
}; 
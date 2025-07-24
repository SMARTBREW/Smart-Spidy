import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Calendar, User as UserIcon, Search, Filter } from 'lucide-react';
import { Fundraiser } from '../../types';
import { fundraiserApi } from '../../services/fundraiser';

export const FundraisersTable: React.FC = () => {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'month' | 'last_week' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const totalFundraisers = fundraisers.length;
  const now = new Date();
  const fundraisersThisMonth = fundraisers.filter(f => {
    const created = new Date(f.createdAt);
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;

  const fetchFundraisers = async (filterValue = filter, startDate = customStartDate, endDate = customEndDate) => {
    try {
      setIsLoading(true);
      let params: any = { page: 1, limit: 100 };
      if (filterValue === 'month') {
        // No backend filter, filter on frontend
      } else if (filterValue === 'last_week') {
        params.last_week = true;
      } else if (filterValue === 'custom') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }
      const response = await fundraiserApi.getFundraisers(params);
      setFundraisers(response.fundraisers);
    } catch (error) {
      console.error('Error fetching fundraisers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFundraisers();
    // eslint-disable-next-line
  }, []);

  const refreshFundraisers = async () => {
    await fetchFundraisers();
  };

  const handleFilterChange = (value: 'all' | 'month' | 'last_week' | 'custom') => {
    setFilter(value);
    if (value !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
      fetchFundraisers(value);
    }
  };

  const handleCustomDateSearch = () => {
    if (customStartDate || customEndDate) {
      fetchFundraisers('custom', customStartDate, customEndDate);
    }
  };

  const handleDeleteFundraiser = async (fundraiserId: string) => {
    if (window.confirm('Are you sure you want to delete this fundraiser?')) {
      try {
        await fundraiserApi.deleteFundraiser(fundraiserId);
        await refreshFundraisers();
      } catch (error) {
        console.error('Error deleting fundraiser:', error);
      }
    }
  };

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

  const filteredFundraisers = fundraisers.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const created = new Date(f.createdAt);
    let matchesFilter = true;
    if (filter === 'month') {
      matchesFilter = created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fundraisers</h1>
          <p className="text-gray-500 mt-1">Manage all fundraisers</p>
        </div>
        <button
          onClick={refreshFundraisers}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-700"
        >
          Refresh
        </button>
      </div>
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
              onChange={e => handleFilterChange(e.target.value as 'all' | 'month' | 'last_week' | 'custom')}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="all">All</option>
              <option value="month">This Month</option>
              <option value="last_week">Last Week</option>
              <option value="custom">Custom Date</option>
            </select>
            {filter === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-2"
                  placeholder="Start Date"
                />
                <span>-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-2"
                  placeholder="End Date"
                />
                <button
                  onClick={handleCustomDateSearch}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
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
                        <span className="text-gray-700 text-sm">{fundraiser.user?.name || 'Unknown'}</span>
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
    </div>
  );
}; 
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Calendar, User as UserIcon, Search, Filter } from 'lucide-react';
import { Fundraiser } from '../../types';
import { fundraiserApi } from '../../services/fundraiser';
import { UserSelector } from './UserSelector';
import { TimeFilter, TimeFilterType } from './TimeFilter';

export const FundraisersTable: React.FC = () => {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'month' | 'last_week' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const FUNDRAISERS_PER_PAGE = 10;
  const [totalFundraisers, setTotalFundraisers] = useState(0);
  const [totalFundraisersMonth, setTotalFundraisersMonth] = useState(0);
  const [totalFundraisersWeek, setTotalFundraisersWeek] = useState(0);

  const now = new Date();
  const fundraisersThisMonth = fundraisers.filter(f => {
    const created = new Date(f.createdAt);
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;

  // Debounce search term
  useEffect(() => {
    if (searchTerm.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchFundraisers = async (filterValue = filter, startDate = customStartDate, endDate = customEndDate) => {
    try {
      if (!isSearching) {
        setIsLoading(true);
      }
      const response = await fundraiserApi.getFundraisers({
        page,
        limit: FUNDRAISERS_PER_PAGE,
        filter: filterValue,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: debouncedSearchTerm || undefined,
        user_id: selectedUserId || undefined,
        time_filter: timeFilter !== 'all' ? timeFilter : undefined,
      });
      setFundraisers(response.fundraisers);
      setTotalPages(response.pagination.pages || 1);
      setTotalFundraisers(response.pagination.total || 0);
      setTotalFundraisersMonth(response.totalFundraisersMonth || 0);
      setTotalFundraisersWeek(response.totalFundraisersWeek || 0);
    } catch (error) {
      console.error('Error fetching fundraisers:', error);
    } finally {
      if (!isSearching) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFundraisers();
  }, [page, filter, customStartDate, customEndDate, debouncedSearchTerm, selectedUserId, timeFilter]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filter, customStartDate, customEndDate, selectedUserId, timeFilter]);

  const refreshFundraisers = async () => {
    await fetchFundraisers();
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

  // Pagination controls
  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const handlePageClick = (p: number) => setPage(p);

  // Better pagination logic
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
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

  const filteredFundraisers = fundraisers; // No need for frontend filtering since backend handles it

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Fundraisers"
          value={totalFundraisers}
          icon={UserIcon}
          color="text-blue-600"
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
        />
        <StatCard
          title="This Month"
          value={totalFundraisersMonth}
          icon={Calendar}
          color="text-green-600"
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
        />
        <StatCard
          title="This Week"
          value={totalFundraisersWeek}
          icon={Calendar}
          color="text-yellow-600"
          bgColor="bg-gradient-to-br from-yellow-50 to-yellow-100"
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
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <UserSelector
              selectedUserId={selectedUserId}
              onUserChange={setSelectedUserId}
              placeholder="All Users"
              className="min-w-[200px]"
            />
            <TimeFilter
              selectedFilter={timeFilter}
              onFilterChange={setTimeFilter}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartDateChange={setCustomStartDate}
              onCustomEndDateChange={setCustomEndDate}
            />
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
      {/* Pagination UI */}
      <div className="flex justify-center items-center space-x-2 my-4">
        <button 
          onClick={handlePrevPage} 
          disabled={page === 1} 
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300 transition-colors"
        >
          Prev
        </button>
        
        {getVisiblePages().map((pageNum, index) => (
          <React.Fragment key={index}>
            {pageNum === '...' ? (
              <span className="px-3 py-1 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => handlePageClick(pageNum as number)}
                className={`px-3 py-1 rounded transition-colors ${
                  page === pageNum 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {pageNum}
              </button>
            )}
          </React.Fragment>
        ))}
        
        <button 
          onClick={handleNextPage} 
          disabled={page === totalPages} 
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}; 
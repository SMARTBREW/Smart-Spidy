import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

export type TimeFilterType = 'all' | 'today' | 'last_week' | 'last_month' | 'custom';

interface TimeFilterProps {
  selectedFilter: TimeFilterType;
  onFilterChange: (filter: TimeFilterType) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomStartDateChange: (date: string) => void;
  onCustomEndDateChange: (date: string) => void;
  className?: string;
}

export const TimeFilter: React.FC<TimeFilterProps> = ({
  selectedFilter,
  onFilterChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
  className = ""
}) => {
  const [showCustomDates, setShowCustomDates] = useState(selectedFilter === 'custom');

  useEffect(() => {
    setShowCustomDates(selectedFilter === 'custom');
  }, [selectedFilter]);

  const handleFilterChange = (filter: TimeFilterType) => {
    onFilterChange(filter);
    if (filter !== 'custom') {
      // Clear custom dates when switching away from custom
      onCustomStartDateChange('');
      onCustomEndDateChange('');
    }
  };

  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      <div className="flex items-center space-x-3">
        <Clock className="w-5 h-5 text-gray-400" />
        <select
          value={selectedFilter}
          onChange={(e) => handleFilterChange(e.target.value as TimeFilterType)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="last_week">Last 7 Days</option>
          <option value="last_month">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {showCustomDates && (
        <div className="flex items-center space-x-3 ml-8">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomStartDateChange(e.target.value)}
              max={customEndDate || getMaxDate()}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomEndDateChange(e.target.value)}
              min={customStartDate}
              max={getMaxDate()}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};

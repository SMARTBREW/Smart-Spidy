import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  MessageCircle, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Repeat,
  Calendar,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Reminder, Chat } from '../types';
import { 
  getUserReminders, 
  deleteReminder, 
  toggleReminderStatus 
} from '../services/reminder';
import { ReminderModal } from './ReminderModal';

interface RemindersListProps {
  chats: Chat[];
  onReminderClick?: (reminder: Reminder) => void;
}

export const RemindersList: React.FC<RemindersListProps> = ({
  chats,
  onReminderClick
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserReminders();
      setReminders(data);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleCreateReminder = () => {
    setEditingReminder(null);
    setShowModal(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowModal(true);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    try {
      setDeletingId(reminderId);
      await deleteReminder(reminderId);
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (err) {
      console.error('Error deleting reminder:', err);
      alert('Failed to delete reminder');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (reminderId: string) => {
    try {
      setTogglingId(reminderId);
      const updatedReminder = await toggleReminderStatus(reminderId);
      setReminders(prev => 
        prev.map(r => r.id === reminderId ? updatedReminder : r)
      );
    } catch (err) {
      console.error('Error toggling reminder status:', err);
      alert('Failed to update reminder status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleModalSuccess = () => {
    fetchReminders();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeUntilReminder = (dateString: string) => {
    const now = new Date();
    const reminderTime = new Date(dateString);
    const diff = reminderTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Due now';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const isDue = (reminder: Reminder) => {
    return new Date(reminder.reminderTime) <= new Date() && !reminder.isSent;
  };

  const isOverdue = (reminder: Reminder) => {
    return new Date(reminder.reminderTime) < new Date() && !reminder.isSent;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading reminders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchReminders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reminders</h2>
          <p className="text-sm text-gray-500">
            {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleCreateReminder}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Reminder
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        <AnimatePresence>
          {reminders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reminders yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first reminder to stay on top of your chats
              </p>
              <button
                onClick={handleCreateReminder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Reminder
              </button>
            </motion.div>
          ) : (
            reminders.map((reminder) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                  isOverdue(reminder) ? 'border-red-200 bg-red-50' :
                  isDue(reminder) ? 'border-yellow-200 bg-yellow-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {reminder.title}
                      </h3>
                      {reminder.isRecurring && (
                        <Repeat className="w-4 h-4 text-blue-600" title="Recurring" />
                      )}
                      {!reminder.isActive && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{reminder.message}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDateTime(reminder.reminderTime)}
                      </div>
                      
                      {reminder.chatName && (
                        <div className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {reminder.chatName}
                        </div>
                      )}
                      
                      <div className={`flex items-center ${
                        isOverdue(reminder) ? 'text-red-600' :
                        isDue(reminder) ? 'text-yellow-600' : 'text-gray-500'
                      }`}>
                        <Clock className="w-4 h-4 mr-1" />
                        {getTimeUntilReminder(reminder.reminderTime)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Toggle Status */}
                    <button
                      onClick={() => handleToggleStatus(reminder.id)}
                      disabled={togglingId === reminder.id}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={reminder.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {togglingId === reminder.id ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : reminder.isActive ? (
                        <ToggleRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    {/* Edit */}
                    <button
                      onClick={() => handleEditReminder(reminder)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      disabled={deletingId === reminder.id}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      {deletingId === reminder.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        reminder={editingReminder}
        chats={chats}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MessageCircle, Repeat, Calendar, AlertCircle } from 'lucide-react';
import { Reminder, Chat } from '../types';
import { createReminder, updateReminder } from '../services/reminder';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder?: Reminder | null;
  chats: Chat[];
  onSuccess: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  reminder,
  chats,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    reminderTime: '',
    chatId: '',
    isRecurring: false,
    recurrencePattern: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!reminder;

  useEffect(() => {
    if (reminder) {
      setFormData({
        title: reminder.title,
        message: reminder.message,
        reminderTime: new Date(reminder.reminderTime).toISOString().slice(0, 16),
        chatId: reminder.chatId || '',
        isRecurring: reminder.isRecurring,
        recurrencePattern: reminder.recurrencePattern || 'daily',
        isActive: reminder.isActive
      });
    } else {
      setFormData({
        title: '',
        message: '',
        reminderTime: '',
        chatId: '',
        isRecurring: false,
        recurrencePattern: 'daily',
        isActive: true
      });
    }
    setErrors({});
  }, [reminder, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (!formData.reminderTime) {
      newErrors.reminderTime = 'Reminder time is required';
    } else {
      const selectedTime = new Date(formData.reminderTime);
      const now = new Date();
      if (selectedTime <= now) {
        newErrors.reminderTime = 'Reminder time must be in the future';
      }
    }

    if (formData.isRecurring && !formData.recurrencePattern) {
      newErrors.recurrencePattern = 'Recurrence pattern is required for recurring reminders';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const reminderData = {
        ...formData,
        chatId: formData.chatId || undefined
      };

      if (isEditing && reminder) {
        await updateReminder(reminder.id, reminderData);
      } else {
        await createReminder(reminderData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving reminder:', error);
      setErrors({ submit: 'Failed to save reminder. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Reminder' : 'Create Reminder'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEditing ? 'Update your reminder settings' : 'Set a new reminder for your chats'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter reminder title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.message ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter reminder message"
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.message}
                </p>
              )}
            </div>

            {/* Chat Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageCircle className="w-4 h-4 inline mr-1" />
                Chat (Optional)
              </label>
              <select
                value={formData.chatId}
                onChange={(e) => handleInputChange('chatId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">General Reminder</option>
                {chats.map((chat) => (
                  <option key={chat.id} value={chat.id}>
                    {chat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reminder Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Reminder Time *
              </label>
              <input
                type="datetime-local"
                value={formData.reminderTime}
                onChange={(e) => handleInputChange('reminderTime', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.reminderTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.reminderTime && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.reminderTime}
                </p>
              )}
            </div>

            {/* Recurring Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700">
                  <Repeat className="w-4 h-4 inline mr-1" />
                  Recurring Reminder
                </label>
              </div>

              {formData.isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recurrence Pattern *
                  </label>
                  <select
                    value={formData.recurrencePattern}
                    onChange={(e) => handleInputChange('recurrencePattern', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.recurrencePattern ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  {errors.recurrencePattern && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.recurrencePattern}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                Active Reminder
              </label>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  isEditing ? 'Update Reminder' : 'Create Reminder'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

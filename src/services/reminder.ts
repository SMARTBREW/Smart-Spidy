import { Reminder, ReminderStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }
  return token;
};

// Create a new reminder
export const createReminder = async (reminderData: {
  chatId?: string;
  title: string;
  message: string;
  reminderTime: string;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isActive?: boolean;
}): Promise<Reminder> => {
  try {
    const token = getAuthToken();
    
    // Convert camelCase to snake_case for backend
    const backendData = {
      chat_id: reminderData.chatId,
      title: reminderData.title,
      message: reminderData.message,
      reminder_time: reminderData.reminderTime,
      is_recurring: reminderData.isRecurring,
      recurrence_pattern: reminderData.recurrencePattern,
      is_active: reminderData.isActive
    };

    const response = await fetch(`${API_BASE_URL}/reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw error;
  }
};

// Get user's reminders
export const getUserReminders = async (): Promise<Reminder[]> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/reminders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.reminders || [];
  } catch (error) {
    console.error('Error fetching reminders:', error);
    throw error;
  }
};

// Get a specific reminder
export const getReminder = async (reminderId: string): Promise<Reminder> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reminder:', error);
    throw error;
  }
};

// Update a reminder
export const updateReminder = async (
  reminderId: string,
  updateData: Partial<{
    title: string;
    message: string;
    reminderTime: string;
    isRecurring: boolean;
    recurrencePattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    isActive: boolean;
  }>
): Promise<Reminder> => {
  try {
    const token = getAuthToken();
    
    // Convert camelCase to snake_case for backend
    const backendData: any = {};
    if (updateData.title !== undefined) backendData.title = updateData.title;
    if (updateData.message !== undefined) backendData.message = updateData.message;
    if (updateData.reminderTime !== undefined) backendData.reminder_time = updateData.reminderTime;
    if (updateData.isRecurring !== undefined) backendData.is_recurring = updateData.isRecurring;
    if (updateData.recurrencePattern !== undefined) backendData.recurrence_pattern = updateData.recurrencePattern;
    if (updateData.isActive !== undefined) backendData.is_active = updateData.isActive;

    const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
};

// Delete a reminder
export const deleteReminder = async (reminderId: string): Promise<void> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
};

// Toggle reminder status
export const toggleReminderStatus = async (reminderId: string): Promise<Reminder> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}/toggle`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error toggling reminder status:', error);
    throw error;
  }
};

// Get reminder stats
export const getReminderStats = async (): Promise<ReminderStats> => {
  try {
    const reminders = await getUserReminders();
    const now = new Date();
    
    const total = reminders.length;
    const active = reminders.filter(r => r.isActive).length;
    const inactive = total - active;
    const due = reminders.filter(r => 
      r.isActive && 
      !r.isSent && 
      new Date(r.reminderTime) <= now
    ).length;

    return {
      total,
      active,
      inactive,
      due
    };
  } catch (error) {
    console.error('Error calculating reminder stats:', error);
    throw error;
  }
};

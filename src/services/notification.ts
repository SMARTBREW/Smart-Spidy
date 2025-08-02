
import { Notification, NotificationStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ;

// Get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }
  return token;
};

// Get user notifications
export const getUserNotifications = async (): Promise<Notification[]> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications`, {
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
    return data.notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get all notifications (admin only)
export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications/all`, {
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
    return data.notifications || [];
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    throw error;
  }
};

// Get admin notification stats (all notifications across users)
export const getAdminNotificationStats = async (): Promise<NotificationStats> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications/all`, {
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
    const notifications = data.notifications || [];
    
    const total = notifications.length;
    const unread = notifications.filter((n: Notification) => !n.isRead).length;
    const read = total - unread;

    return {
      total,
      unread,
      read,
    };
  } catch (error) {
    console.error('Error fetching admin notification stats:', error);
    throw error;
  }
};

// Get notification stats
export const getNotificationStats = async (): Promise<NotificationStats> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications/stats`, {
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
    return {
      total: data.total || 0,
      unread: data.unread || 0,
      read: data.read || 0,
    };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
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
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Delete notification (admin only)
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
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
    console.error('Error deleting notification:', error);
    throw error;
  }
}; 
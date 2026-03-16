import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  BellIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  StarIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NotificationsPanel = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/notifications?page=${page}&limit=10`);
      
      if (page === 1) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }
      
      setUnreadCount(response.data.unreadCount);
      setHasMore(page < response.data.pages);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <ClipboardDocumentListIcon className="h-5 w-5 text-blue-500" />;
      case 'quiz':
        return <AcademicCapIcon className="h-5 w-5 text-purple-500" />;
      case 'grade':
        return <StarIcon className="h-5 w-5 text-yellow-500" />;
      case 'submission':
        return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.link) return notification.link;
    
    // Default links based on type
    switch (notification.type) {
      case 'assignment':
        return '/student/assignments';
      case 'quiz':
        return '/student/quizzes';
      case 'grade':
        return '/student/assignments';
      case 'submission':
        return '/teacher/submissions';
      default:
        return '#';
    }
  };

  return (
    <div className="w-96 max-h-[32rem] bg-white rounded-lg shadow-xl border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BellIcon className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckIcon className="h-4 w-4" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-500">
            <BellIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-primary-50/30' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={getNotificationLink(notification)}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification._id);
                        onClose();
                      }}
                      className="block"
                    >
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        {!notification.read && (
                          <span className="h-2 w-2 bg-primary-600 rounded-full"></span>
                        )}
                      </div>
                    </Link>
                  </div>
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full p-3 text-sm text-primary-600 hover:text-primary-800 hover:bg-gray-50 transition-colors border-t"
          >
            Load more
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-center">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-sm text-primary-600 hover:text-primary-800"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationsPanel;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TwoFactorSetup from './Settings/TwoFactorSetup';
import api from '../utils/axios.jsx';
import {
  Cog6ToothIcon,
  BellIcon,
  LockClosedIcon,
  UserIcon,
  EnvelopeIcon,
  MoonIcon,
  SunIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  ClockIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [twoFAStatus, setTwoFAStatus] = useState({ enabled: false, method: 'app' });
  const [loading2FA, setLoading2FA] = useState(false);
  
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: ''
  });
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    assignmentReminders: true,
    quizReminders: true,
    gradeAlerts: true,
    announcementAlerts: true,
    pushNotifications: false,
    smsNotifications: false,
    reminderTiming: '1hour',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    quietHoursEnabled: false
  });
  
  const [preferences, setPreferences] = useState({
    language: 'english',
    timezone: 'UTC+5'
  });

  // CRITICAL: Only fetch when user is authenticated
  useEffect(() => {
    if (user) {
      fetch2FAStatus();
    } else {
      setTwoFAStatus({ enabled: false, method: 'app' });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'notifications' && user) {
      fetchNotificationSettings();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (passwordData.newPassword) {
      checkPasswordStrength(passwordData.newPassword);
      checkPasswordRequirements(passwordData.newPassword);
    } else {
      setPasswordRequirements({
        minLength: false,
        hasUppercase: false,
        hasNumber: false,
        hasSpecialChar: false
      });
      setPasswordStrength({ score: 0, message: '', color: '' });
    }
  }, [passwordData.newPassword]);

  const checkPasswordRequirements = (password) => {
    setPasswordRequirements({
      minLength: password.length >= 6,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password)
    });
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = '';
    let color = '';

    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch(score) {
      case 0:
      case 1:
        message = 'Weak';
        color = 'bg-red-500';
        break;
      case 2:
        message = 'Fair';
        color = 'bg-orange-500';
        break;
      case 3:
        message = 'Good';
        color = 'bg-yellow-500';
        break;
      case 4:
        message = 'Strong';
        color = 'bg-blue-500';
        break;
      case 5:
        message = 'Very Strong';
        color = 'bg-green-500';
        break;
      default:
        message = '';
        color = '';
    }

    setPasswordStrength({ score, message, color });
  };

  const fetch2FAStatus = async () => {
    if (!user) return;
    
    try {
      setLoading2FA(true);
      const response = await api.get('/2fa/status');
      setTwoFAStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    } finally {
      setLoading2FA(false);
    }
  };

  const fetchNotificationSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await api.get('/notification-settings/settings');
      if (response.data.success) {
        setNotifications(response.data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await api.get('/auth/active-sessions');
      setActiveSessions(response.data.sessions || []);
      setShowSessionsModal(true);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch active sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      toast.success('Session terminated successfully');
      fetchActiveSessions();
    } catch (error) {
      console.error('Failed to terminate session:', error);
      toast.error(error.response?.data?.message || 'Failed to terminate session');
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      await api.delete('/auth/sessions/others');
      toast.success('All other sessions terminated');
      fetchActiveSessions();
    } catch (error) {
      console.error('Failed to terminate sessions:', error);
      toast.error(error.response?.data?.message || 'Failed to terminate sessions');
    }
  };

  const getDeviceIcon = (deviceType) => {
    if (deviceType?.toLowerCase().includes('mobile') || deviceType?.toLowerCase().includes('phone')) {
      return DevicePhoneMobileIcon;
    }
    return ComputerDesktopIcon;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (!passwordData.newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (!/[A-Z]/.test(passwordData.newPassword)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(passwordData.newPassword)) {
      toast.error('Password must contain at least one number');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(passwordData.newPassword)) {
      toast.error('Password must contain at least one special character');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from your current password');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key, value) => {
    try {
      let updatedNotifications;
      
      if (value !== undefined) {
        updatedNotifications = {
          ...notifications,
          [key]: value
        };
      } else {
        updatedNotifications = {
          ...notifications,
          [key]: !notifications[key]
        };
      }
      
      setNotifications(updatedNotifications);
      
      const response = await api.put('/notification-settings/settings', updatedNotifications);
      
      if (response.data.success) {
        toast.success('Notification preferences updated');
      } else {
        setNotifications(notifications);
        toast.error('Failed to update preferences');
      }
    } catch (error) {
      setNotifications(notifications);
      console.error('Failed to update notification settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update preferences');
    }
  };

  const handlePreferenceChange = async (key, value) => {
    try {
      const updatedPreferences = {
        ...preferences,
        [key]: value
      };
      
      setPreferences(updatedPreferences);
      toast.success('Preferences updated');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  const resetNotificationSettings = async () => {
    try {
      const response = await api.post('/notification-settings/settings/reset');
      if (response.data.success) {
        setNotifications(response.data.settings);
        toast.success('Settings reset to default');
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast.error('Failed to reset settings');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile Settings', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: LockClosedIcon },
    { id: '2fa', name: 'Two-Factor Auth', icon: ShieldCheckIcon },
    { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{tab.name}</span>
                {tab.id === '2fa' && twoFAStatus.enabled && (
                  <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                    Enabled
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Profile Settings Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    className="input-field bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contact admin to change name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="input-field bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 flex-1"
                      readOnly
                    />
                    <span className="text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="h-5 w-5" />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    className="input-field bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 capitalize"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Member Since
                  </label>
                  <input
                    type="text"
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                    className="input-field bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notification Preferences</h2>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <EnvelopeIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications.emailNotifications}
                          onChange={() => handleNotificationChange('emailNotifications')}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Assignment Reminders</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about upcoming deadlines</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications.assignmentReminders}
                          onChange={() => handleNotificationChange('assignmentReminders')}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AcademicCapIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Quiz Reminders</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about available quizzes</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications.quizReminders}
                          onChange={() => handleNotificationChange('quizReminders')}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Grade Alerts</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when assignments are graded</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications.gradeAlerts}
                          onChange={() => handleNotificationChange('gradeAlerts')}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Receive browser push notifications</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications.pushNotifications}
                          onChange={() => handleNotificationChange('pushNotifications')}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Advanced Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reminder Timing
                        </label>
                        <select
                          value={notifications.reminderTiming || '1hour'}
                          onChange={(e) => handleNotificationChange('reminderTiming', e.target.value)}
                          className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        >
                          <option value="15min">15 minutes before</option>
                          <option value="30min">30 minutes before</option>
                          <option value="1hour">1 hour before</option>
                          <option value="1day">1 day before</option>
                        </select>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Quiet Hours
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notifications.quietHoursEnabled || false}
                              onChange={() => handleNotificationChange('quietHoursEnabled')}
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                        
                        {notifications.quietHoursEnabled && (
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Start Time
                              </label>
                              <input
                                type="time"
                                value={notifications.quietHoursStart || '22:00'}
                                onChange={(e) => handleNotificationChange('quietHoursStart', e.target.value)}
                                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                End Time
                              </label>
                              <input
                                type="time"
                                value={notifications.quietHoursEnd || '08:00'}
                                onChange={(e) => handleNotificationChange('quietHoursEnd', e.target.value)}
                                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={resetNotificationSettings}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        Reset to Defaults
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Security Settings</h2>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <LockClosedIcon className="h-5 w-5" />
                  Change Password
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {twoFAStatus.enabled 
                      ? 'Two-factor authentication is enabled on your account.'
                      : 'Add an extra layer of security to your account with 2FA.'}
                  </p>
                  <button 
                    onClick={() => setActiveTab('2fa')}
                    className="btn-secondary dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 text-sm flex items-center gap-2"
                  >
                    <ShieldCheckIcon className="h-4 w-4" />
                    {twoFAStatus.enabled ? 'Manage 2FA Settings' : 'Enable 2FA'}
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Active Sessions</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Manage your active sessions and devices
                  </p>
                  <button 
                    onClick={fetchActiveSessions}
                    className="btn-secondary dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 text-sm flex items-center gap-2"
                    disabled={loadingSessions}
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${loadingSessions ? 'animate-spin' : ''}`} />
                    {loadingSessions ? 'Loading...' : 'View Active Sessions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2FA Tab */}
          {activeTab === '2fa' && (
            <TwoFactorSetup />
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Preferences</h2>
              
              <div className="space-y-4">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        theme === 'light'
                          ? 'bg-primary-50 dark:bg-primary-900/50 border-primary-500 text-primary-700 dark:text-primary-300'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <SunIcon className="h-5 w-5" />
                      Light
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-primary-50 dark:bg-primary-900/50 border-primary-500 text-primary-700 dark:text-primary-300'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <MoonIcon className="h-5 w-5" />
                      Dark
                    </button>
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                  </select>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="UTC-12">UTC-12</option>
                    <option value="UTC-11">UTC-11</option>
                    <option value="UTC-10">UTC-10</option>
                    <option value="UTC-9">UTC-9</option>
                    <option value="UTC-8">UTC-8</option>
                    <option value="UTC-7">UTC-7</option>
                    <option value="UTC-6">UTC-6</option>
                    <option value="UTC-5">UTC-5</option>
                    <option value="UTC-4">UTC-4</option>
                    <option value="UTC-3">UTC-3</option>
                    <option value="UTC-2">UTC-2</option>
                    <option value="UTC-1">UTC-1</option>
                    <option value="UTC+0">UTC+0</option>
                    <option value="UTC+1">UTC+1</option>
                    <option value="UTC+2">UTC+2</option>
                    <option value="UTC+3">UTC+3</option>
                    <option value="UTC+4">UTC+4</option>
                    <option value="UTC+5">UTC+5</option>
                    <option value="UTC+6">UTC+6</option>
                    <option value="UTC+7">UTC+7</option>
                    <option value="UTC+8">UTC+8</option>
                    <option value="UTC+9">UTC+9</option>
                    <option value="UTC+10">UTC+10</option>
                    <option value="UTC+11">UTC+11</option>
                    <option value="UTC+12">UTC+12</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Password Requirements Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Password Requirements:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <span className="text-blue-500">•</span> At least 6 characters long
                  </li>
                  <li className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <span className="text-blue-500">•</span> At least one uppercase letter (A-Z)
                  </li>
                  <li className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <span className="text-blue-500">•</span> At least one number (0-9)
                  </li>
                  <li className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <span className="text-blue-500">•</span> At least one special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
              placeholder="Enter current password"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
              placeholder="Enter new password"
            />
            
            {passwordData.newPassword && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Password strength:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.message === 'Weak' ? 'text-red-500' :
                    passwordStrength.message === 'Fair' ? 'text-orange-500' :
                    passwordStrength.message === 'Good' ? 'text-yellow-500' :
                    passwordStrength.message === 'Strong' ? 'text-blue-500' :
                    passwordStrength.message === 'Very Strong' ? 'text-green-500' : ''
                  }`}>
                    {passwordStrength.message}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Requirements:</p>
                  <ul className="space-y-1 text-xs">
                    <li className={passwordRequirements.minLength ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}>
                      {passwordRequirements.minLength ? '✓' : '○'} At least 6 characters
                    </li>
                    <li className={passwordRequirements.hasUppercase ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}>
                      {passwordRequirements.hasUppercase ? '✓' : '○'} One uppercase letter
                    </li>
                    <li className={passwordRequirements.hasNumber ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}>
                      {passwordRequirements.hasNumber ? '✓' : '○'} One number
                    </li>
                    <li className={passwordRequirements.hasSpecialChar ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}>
                      {passwordRequirements.hasSpecialChar ? '✓' : '○'} One special character
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
              placeholder="Confirm new password"
            />
            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> Passwords do not match
              </p>
            )}
            {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword && (
              <p className="text-xs text-green-500 dark:text-green-400 mt-1 flex items-center gap-1">
                <span>✓</span> Passwords match
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
              }}
              className="btn-secondary dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Active Sessions Modal */}
      <Modal
        isOpen={showSessionsModal}
        onClose={() => setShowSessionsModal(false)}
        title="Active Sessions"
        size="lg"
      >
        <div className="space-y-4">
          {loadingSessions ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-12">
              <ComputerDesktopIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No active sessions found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Sessions will appear here when you log in from other devices</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {activeSessions.map((session) => {
                  const DeviceIcon = getDeviceIcon(session.device);
                  return (
                    <div
                      key={session.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <DeviceIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {session.device || 'Unknown Device'}
                                </span>
                                {session.isCurrent && (
                                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                                    Current Session
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 ml-8">
                            <div className="flex items-center gap-2">
                              <GlobeAltIcon className="h-3.5 w-3.5" />
                              <span>{session.location || 'Unknown location'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ComputerDesktopIcon className="h-3.5 w-3.5" />
                              <span>{session.browser || 'Unknown browser'} on {session.os || 'Unknown OS'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ClockIcon className="h-3.5 w-3.5" />
                              <span>Last active: {session.lastActive ? new Date(session.lastActive).toLocaleString() : 'Now'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">IP: {session.ipAddress || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2 md:col-span-2">
                              <span>Logged in: {new Date(session.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        {!session.isCurrent && (
                          <button
                            onClick={() => terminateSession(session.id)}
                            className="ml-4 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Terminate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {activeSessions.length > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <button
                    onClick={terminateAllOtherSessions}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Terminate all other sessions
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    This will log you out from all devices except this one
                  </p>
                </div>
              )}
            </>
          )}
          
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowSessionsModal(false)}
              className="btn-secondary dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
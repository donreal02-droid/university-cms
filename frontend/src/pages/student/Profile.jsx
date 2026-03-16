import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  UserCircleIcon,
  PencilIcon,
  CameraIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  IdentificationIcon,
  AcademicCapIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const { user: currentUser, updateUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [stats, setStats] = useState({
    assignmentsCompleted: 0,
    averageScore: 0,
    quizzesTaken: 0,
    attendance: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching profile from API...');
      const response = await api.get(`/auth/profile?t=${Date.now()}`);
      console.log('✅ Profile API response status:', response.status);
      console.log('✅ Profile data received:', response.data);
      console.log('✅ Profile image path:', response.data?.profileImage);
      
      setUserProfile(response.data);
      setFormData(prev => ({
        ...prev,
        name: response.data.name || '',
        phone: response.data.phone || '',
        address: response.data.address || ''
      }));
      setImageError(false);
      setImageKey(Date.now());
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      if (error.response) {
        console.error('❌ Error status:', error.response.status);
        console.error('❌ Error data:', error.response.data);
      }
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/student/stats');
      setStats(response.data || {
        assignmentsCompleted: 0,
        averageScore: 0,
        quizzesTaken: 0,
        attendance: 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // ✅ FIXED: Clean function to get image URL
  const getImageUrl = (filename) => {
    if (!filename) return null;
    
    // If it's already a full URL, return as is
    if (filename.startsWith('http')) {
      return filename;
    }
    
    // If it starts with /uploads, add base URL
    if (filename.startsWith('/uploads')) {
      return `http://localhost:5000${filename}`;
    }
    
    // Otherwise, assume it's just a filename
    return `http://localhost:5000/uploads/profiles/${filename}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/auth/profile', {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      });

      setUserProfile(response.data);
      updateUser(response.data);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setPasswordErrors({});
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('profile', file);

    try {
      setLoading(true);
      console.log('Uploading image...', file.name);
      
      const response = await api.post('/auth/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Upload response:', response.data);
      
      setUserProfile(response.data);
      updateUser(response.data);
      setImageError(false);
      setImageKey(Date.now());
      
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Failed to upload image:', error);
      
      if (error.response?.status === 404) {
        toast.error('Image upload endpoint not found. Please check backend.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to upload image');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load image:', userProfile?.profileImage);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      await api.delete('/auth/account');
      toast.success('Account deleted successfully');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !userProfile) return <LoadingSpinner />;

  const getAcademicYear = () => {
    const year = Math.ceil((userProfile?.semester || 1) / 2);
    return `Year ${year}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Profile</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PencilIcon className="h-5 w-5" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-green-500 to-blue-600 dark:from-green-600 dark:to-blue-700"></div>
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex justify-between items-start -mt-12">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden shadow-lg">
                {userProfile?.profileImage && !imageError ? (
                  <img
                    key={imageKey}
                    src={getImageUrl(userProfile.profileImage)}
                    alt={userProfile.name}
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                    onLoad={() => console.log('Image loaded successfully')}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 flex items-center justify-center">
                    <UserCircleIcon className="h-16 w-16 text-green-600 dark:text-green-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary-600 dark:bg-primary-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg">
                <CameraIcon className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Role Badge */}
            <div className="mt-12">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium flex items-center gap-1">
                <AcademicCapIcon className="h-4 w-4" />
                Student
              </span>
            </div>
          </div>

          {/* Profile Form or Display */}
          {editing ? (
            <form onSubmit={handleProfileUpdate} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userProfile?.email || ''}
                    className="input-field bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                    disabled
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enrollment Number
                  </label>
                  <input
                    type="text"
                    value={userProfile?.enrollmentNumber || ''}
                    className="input-field bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Semester
                  </label>
                  <input
                    type="text"
                    value={`Semester ${userProfile?.semester || 'N/A'} (${getAcademicYear()})`}
                    className="input-field bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                    disabled
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: userProfile?.name || '',
                      phone: userProfile?.phone || '',
                      address: userProfile?.address || ''
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <UserCircleIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{userProfile?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{userProfile?.email}</p>
                    {userProfile?.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                        <CheckCircleSolid className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        <XCircleIcon className="h-4 w-4" />
                        Not Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <IdentificationIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enrollment Number</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{userProfile?.enrollmentNumber}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {userProfile?.phone || <span className="text-gray-400 dark:text-gray-600">Not provided</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {userProfile?.department?.name || 'Not assigned'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Semester</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      Semester {userProfile?.semester} ({getAcademicYear()})
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {userProfile?.address || <span className="text-gray-400 dark:text-gray-600">Not provided</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {formatDate(userProfile?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Academic Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Academic Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center border border-blue-100 dark:border-blue-800">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.assignmentsCompleted || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Assignments Done</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center border border-green-100 dark:border-green-800">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.averageScore || 0}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Average Score</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center border border-purple-100 dark:border-purple-800">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.quizzesTaken || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Quizzes Taken</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center border border-orange-100 dark:border-orange-800">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.attendance || 0}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Attendance</p>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Settings</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <KeyIcon className="h-5 w-5" />
            Change Password
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Add an extra layer of security to your student account.
            </p>
            <button className="btn-secondary text-sm">
              Enable 2FA
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium border border-red-200 dark:border-red-800"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordErrors({});
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
        }}
        title="Change Password"
        size="md"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              className={`input-field dark:bg-gray-800 dark:text-white dark:border-gray-600 ${passwordErrors.currentPassword ? 'border-red-500 dark:border-red-500' : ''}`}
            />
            {passwordErrors.currentPassword && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{passwordErrors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className={`input-field dark:bg-gray-800 dark:text-white dark:border-gray-600 ${passwordErrors.newPassword ? 'border-red-500 dark:border-red-500' : ''}`}
            />
            {passwordErrors.newPassword && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{passwordErrors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`input-field dark:bg-gray-800 dark:text-white dark:border-gray-600 ${passwordErrors.confirmPassword ? 'border-red-500 dark:border-red-500' : ''}`}
            />
            {passwordErrors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="btn-secondary"
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

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirm('');
        }}
        title="Delete Account"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-400">
              <strong>Warning:</strong> This action is permanent and cannot be undone. 
              All your data, including assignments, submissions, and progress will be permanently deleted.
            </p>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            Please type <span className="font-bold">DELETE</span> to confirm:
          </p>

          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder="Type DELETE here"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE' || loading}
              className="bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentProfile;
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
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const AdminProfile = () => {
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auth/profile?t=${Date.now()}`);
      setProfile(response.data);
      setFormData(prev => ({
        ...prev,
        name: response.data.name || '',
        phone: response.data.phone || '',
        address: response.data.address || ''
      }));
      setImageError(false);
      setImageKey(Date.now());
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
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

      setProfile(response.data);
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

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach(err => {
          toast.error(err);
        });
      } else {
        toast.error('Failed to change password');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Clean function to get image URL using environment variable
  const getImageUrl = (filename) => {
    if (!filename) return null;

    // If it's already a full URL, return as is
    if (filename.startsWith('http')) {
      return filename;
    }

    // Get base URL from environment variable
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // If it starts with /uploads, add base URL
    if (filename.startsWith('/uploads')) {
      return `${baseUrl}${filename}`;
    }

    // Otherwise, assume it's just a filename
    return `${baseUrl}/uploads/profiles/${filename}`;
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
      setProfile(response.data);
      updateUser(response.data);
      setImageError(false);
      setImageKey(Date.now());
      toast.success('Profile image updated successfully');
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
    console.error('Failed to load image:', profile?.profileImage);
  };

  if (loading && !profile) return <LoadingSpinner />;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin Profile</h1>
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
        <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex justify-between items-start -mt-12">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden shadow-lg">
                {profile?.profileImage && !imageError ? (
                  <img
                    key={imageKey}
                    src={getImageUrl(profile.profileImage)}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                    onLoad={() => console.log('Image loaded successfully')}
                  />
                ) : (
                  <div className="h-full w-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <UserCircleIcon className="h-16 w-16 text-primary-600 dark:text-primary-400" />
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
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-sm font-medium flex items-center gap-1">
                <ShieldCheckIcon className="h-4 w-4" />
                Administrator
              </span>
            </div>
          </div>

          {/* Profile Form */}
          {editing ? (
            <form onSubmit={handleProfileUpdate} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                    value={profile?.email}
                    className="input-field bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                    disabled
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
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
                      name: profile?.name || '',
                      phone: profile?.phone || '',
                      address: profile?.address || ''
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
                    <p className="text-base font-medium text-gray-900 dark:text-white">{profile?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{profile?.email}</p>
                    {profile?.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                        <CheckCircleIcon className="h-4 w-4" />
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
                  <PhoneIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {profile?.phone || <span className="text-gray-400 dark:text-gray-600">Not provided</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {profile?.department?.name || 'University Administration'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPinIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {profile?.address || <span className="text-gray-400 dark:text-gray-600">Not provided</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {formatDate(profile?.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ArrowPathIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {formatDate(profile?.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Settings</h2>

        <div className="space-y-4">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn-secondary"
          >
            Change Password
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <button className="btn-secondary text-sm">
              Enable 2FA
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
    </div>
  );
};

export default AdminProfile;
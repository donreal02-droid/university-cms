import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api'; // Use api utility instead of axios
import { UserCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/auth/profile', formData);
      updateUser(response.data);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Profile Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Personal details and settings.</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-colors"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          )}
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-6">
              <div className="h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <UserCircleIcon className="h-16 w-16 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    value={user?.email}
                    className="mt-1 input-field bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                  <textarea
                    name="address"
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                {user?.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Enrollment Number</label>
                      <input
                        type="text"
                        value={user?.enrollmentNumber}
                        className="mt-1 input-field bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Semester</label>
                      <input
                        type="text"
                        value={user?.semester}
                        className="mt-1 input-field bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                        disabled
                      />
                    </div>
                  </>
                )}

                {user?.role === 'teacher' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                    <input
                      type="text"
                      value={user?.department?.name}
                      className="mt-1 input-field bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                      disabled
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.name}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone number</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.phone || 'Not provided'}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.address || 'Not provided'}</dd>
                </div>

                {user?.role === 'student' && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Enrollment Number</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.enrollmentNumber}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Semester</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.semester}</dd>
                    </div>
                  </>
                )}

                {user?.department && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.department.name}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Member since</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
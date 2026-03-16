import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { PhoneIcon, CalendarIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import UserForm from '../../components/forms/UserForm';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalMode, setModalMode] = useState('add');
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const usersPerPage = 10;
  const API_URL = import.meta.env.VITE_API_URL;
const SOMETHING = import.meta.env.VITE_SOMETHING;

  // Check URL parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const role = params.get('role');
    
    if (action === 'add') {
      if (role && (role === 'student' || role === 'teacher' || role === 'admin')) {
        setRoleFilter(role);
      }
      setTimeout(() => {
        handleAddUser();
      }, 100);
    }
  }, [location]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, statusFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', usersPerPage);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter === 'active');
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/users?${params.toString()}`);
      
      // 🔍 DEBUG: Log what's coming from backend
      console.log('=== USERS FROM BACKEND ===');
      response.data.users.forEach((user, index) => {
        console.log(`User ${index + 1}: ${user.name}`);
        console.log(`  - profileImage:`, user.profileImage);
        console.log(`  - has image:`, !!user.profileImage);
        console.log(`  - image type:`, typeof user.profileImage);
      });
      console.log('==========================');

      setUsers(response.data.users);
      setTotalPages(response.data.pages);
      setTotalUsers(response.data.total);
      setError('');
      setImageErrors({}); // Reset image errors
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
    toast.success('Users refreshed');
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setModalMode('add');
    setShowModal(true);
    
    const params = new URLSearchParams(location.search);
    const role = params.get('role');
    if (role) {
      toast.success(`Adding new ${role}`);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}`, 
        { isActive: !currentStatus }
      );
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingUser(null);
    
    const params = new URLSearchParams(location.search);
    if (params.has('action')) {
      params.delete('action');
      params.delete('role');
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  };

  const handleModalSuccess = () => {
    fetchUsers();
  };

  const handleImageError = (userId) => {
    setImageErrors(prev => ({ ...prev, [userId]: true }));
    console.log(`Image failed to load for user ID: ${userId}`);
  };

  // ✅ FIXED: getImageUrl function matching Navbar version
  const getImageUrl = (filename) => {
    if (!filename) return null;
    
    // If it's already a full URL, use it
    if (filename.startsWith('http')) return filename;
    
    // If it starts with /uploads, just prepend the base URL
    if (filename.startsWith('/uploads')) {
      return `${API_BASE_URL}${filename}`;
    }
    
    // Otherwise, assume it's just a filename in the uploads/profiles folder
    return `${API_BASE_URL}/uploads/profiles/${filename}`;
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case 'teacher': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'student': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
  };

  const getAvatarColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-500';
      case 'teacher': return 'bg-blue-500';
      case 'student': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manage Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total {totalUsers} user{totalUsers !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleAddUser}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, email, or enrollment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const imageUrl = getImageUrl(user.profileImage);
                  const hasImage = user.profileImage && !imageErrors[user._id];
                  
                  return (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {hasImage ? (
                              <img 
                                src={imageUrl} 
                                alt={user.name} 
                                className="h-10 w-10 rounded-full object-cover"
                                onError={() => handleImageError(user._id)}
                              />
                            ) : (
                              <div className={`h-10 w-10 rounded-full ${getAvatarColor(user.role)} flex items-center justify-center text-white font-medium text-sm`}>
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.department?.name || '-'}
                        </div>
                        {user.semester && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Semester {user.semester}
                          </div>
                        )}
                        {user.enrollmentNumber && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user.enrollmentNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.phone ? (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <PhoneIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
                            {user.phone}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.isActive)}`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-3 transition-colors"
                          title="Edit user"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {user._id !== currentUser?._id && (
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                            title="Delete user"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span>
                  {' '}-{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * usersPerPage, totalUsers)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Last
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={modalMode === 'add' ? 'Add New User' : 'Edit User'}
        size="lg"
      >
        <UserForm
          user={editingUser}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      </Modal>
    </div>
  );
};

export default ManageUsers;
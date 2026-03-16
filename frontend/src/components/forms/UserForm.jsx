import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const UserForm = ({ user, onClose, onSuccess }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: user || {
      name: '',
      email: '',
      password: '',
      role: 'student',
      department: '',
      semester: '',
      enrollmentNumber: '',
      phone: '',
      address: '',
      isActive: true
    }
  });

  const selectedRole = watch('role');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      console.log('Departments fetched:', response.data);
      
      if (Array.isArray(response.data)) {
        setDepartments(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setDepartments(response.data.data);
      } else if (response.data.departments && Array.isArray(response.data.departments)) {
        setDepartments(response.data.departments);
      } else {
        console.error('Unexpected departments format:', response.data);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        department: data.department || null,
        semester: data.role === 'student' ? data.semester : undefined,
        enrollmentNumber: data.role === 'student' ? data.enrollmentNumber : undefined,
        phone: data.phone || '',
        address: data.address || '',
        isActive: data.isActive
      };

      if (user) {
        await api.put(`/users/${user._id}`, userData);
        toast.success('User updated successfully');
      } else {
        await api.post('/auth/register', userData);
        toast.success('User created successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('User operation failed:', error);
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
          {errors.name && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                message: 'Invalid email address'
              }
            })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
          {errors.email && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password (only for new users) */}
        {!user && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>
        )}

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role *
          </label>
          <select
            {...register('role', { required: 'Role is required' })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Department
          </label>
          <select
            {...register('department')}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>

        {/* Student-specific fields */}
        {selectedRole === 'student' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Semester
              </label>
              <select
                {...register('semester')}
                className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
              >
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6,7,8].map(num => (
                  <option key={num} value={num}>Semester {num}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enrollment Number
              </label>
              <input
                type="text"
                {...register('enrollmentNumber')}
                className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>
          </>
        )}

        {/* Phone */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            {...register('phone')}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>

        {/* Address */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Address
          </label>
          <textarea
            {...register('address')}
            rows="3"
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>

        {/* Active Status */}
        <div className="col-span-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active Account</span>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
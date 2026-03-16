import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const DepartmentForm = ({ department, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: department || {
      name: '',
      code: '',
      faculty: '',
      totalSemesters: 8,
      description: '',
      headOfDepartment: '',
      isActive: true
    }
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/users', {
        params: { role: 'teacher', limit: 100 }
      });
      setTeachers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      toast.error('Failed to load teachers');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const departmentData = {
        name: data.name,
        code: data.code.toUpperCase(),
        faculty: data.faculty,
        totalSemesters: parseInt(data.totalSemesters) || 8,
        description: data.description || '',
        headOfDepartment: data.headOfDepartment || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      };

      console.log('Submitting department data:', departmentData);

      if (department) {
        await api.put(`/departments/${department._id}`, departmentData);
        toast.success('Department updated successfully');
      } else {
        await api.post('/departments', departmentData);
        toast.success('Department created successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Department operation failed:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach(err => {
          toast.error(err);
        });
      } else {
        toast.error('Operation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Basic Information</h3>
        </div>

        {/* Department Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Department Name *
          </label>
          <input
            type="text"
            {...register('name', { required: 'Department name is required' })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder="e.g., Computer Science"
          />
          {errors.name && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Department Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Department Code *
          </label>
          <input
            type="text"
            {...register('code', { 
              required: 'Department code is required',
              pattern: {
                value: /^[A-Za-z]{2,4}$/,
                message: 'Code must be 2-4 letters'
              }
            })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder="e.g., CS"
          />
          {errors.code && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.code.message}</p>
          )}
        </div>

        {/* Faculty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Faculty *
          </label>
          <input
            type="text"
            {...register('faculty', { required: 'Faculty is required' })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder="e.g., Engineering, Science, Business"
          />
          {errors.faculty && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.faculty.message}</p>
          )}
        </div>

        {/* Total Semesters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Number of Semesters *
          </label>
          <select
            {...register('totalSemesters', { required: 'Number of semesters is required' })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            {semesterOptions.map(num => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Semester' : 'Semesters'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Maximum 8 semesters (4 years program)
          </p>
        </div>

        {/* Head of Department */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Head of Department
          </label>
          <select
            {...register('headOfDepartment')}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            <option value="">-- Select Head of Department (Optional) --</option>
            {teachers.map(teacher => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name} - {teacher.email}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows="3"
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder="Enter department description..."
          />
        </div>

        {/* Active Status */}
        <div className="md:col-span-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active Department</span>
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
          {loading ? 'Saving...' : department ? 'Update Department' : 'Create Department'}
        </button>
      </div>
    </form>
  );
};

export default DepartmentForm;
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SubjectForm = ({ subject, departments, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: subject || {
      name: '',
      code: '',
      description: '',
      department: '',
      semester: '',
      credits: 3,
      teacher: '',
      syllabus: '',
      isActive: true
    }
  });

  const watchDepartment = watch('department');

  useEffect(() => {
    if (watchDepartment) {
      fetchTeachersByDepartment(watchDepartment);
    }
  }, [watchDepartment]);

  useEffect(() => {
    if (subject?.department) {
      setSelectedDepartment(subject.department._id || subject.department);
    }
  }, [subject]);

  const fetchTeachersByDepartment = async (departmentId) => {
    try {
      const response = await api.get('/users', {
        params: {
          role: 'teacher',
          department: departmentId,
          limit: 100
        }
      });

      if (response.data.users && Array.isArray(response.data.users)) {
        setTeachers(response.data.users);
      } else if (Array.isArray(response.data)) {
        setTeachers(response.data);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      toast.error('Failed to load teachers');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const subjectData = {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || '',
        department: data.department,
        semester: parseInt(data.semester),
        credits: parseInt(data.credits),
        teacher: data.teacher || null,
        syllabus: data.syllabus || '',
        isActive: data.isActive !== undefined ? data.isActive : true
      };

      console.log('Submitting subject data:', subjectData);

      if (subject) {
        await api.put(`/subjects/${subject._id}`, subjectData);
        toast.success('Subject updated successfully');
      } else {
        await api.post('/subjects', subjectData);
        toast.success('Subject created successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Subject operation failed:', error);

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

  const getSemesterOptions = () => {
    const selectedDept = departments.find(d => d._id === watchDepartment);
    const totalSemesters = selectedDept?.totalSemesters || 8;
    return Array.from({ length: totalSemesters }, (_, i) => i + 1);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject Name *
          </label>
          <input
            type="text"
            {...register('name', { required: 'Subject name is required' })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder="e.g., Data Structures"
          />
          {errors.name && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Subject Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject Code *
          </label>
          <input
            type="text"
            {...register('code', {
              required: 'Subject code is required',
              pattern: {
                value: /^[A-Za-z0-9]{3,8}$/,
                message: 'Code must be 3-8 alphanumeric characters'
              }
            })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder="e.g., CS201"
          />
          {errors.code && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.code.message}</p>
          )}
        </div>

        {/* Credits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Credits *
          </label>
          <select
            {...register('credits', { required: 'Credits are required' })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            <option value="2">2 Credits</option>
            <option value="3">3 Credits</option>
            <option value="4">4 Credits</option>

          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Department *
          </label>
          <select
            {...register('department', { required: 'Department is required' })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
          {errors.department && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.department.message}</p>
          )}
        </div>

        {/* Semester */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Semester *
          </label>
          <select
            {...register('semester', { required: 'Semester is required' })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            disabled={!watchDepartment}
          >
            <option value="">Select Semester</option>
            {getSemesterOptions().map(num => (
              <option key={num} value={num}>Semester {num}</option>
            ))}
          </select>
          {errors.semester && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.semester.message}</p>
          )}
        </div>

        {/* Teacher */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assign Teacher
          </label>
          <select
            {...register('teacher')}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            <option value="">-- Select Teacher (Optional) --</option>
            {teachers.map(teacher => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name} - {teacher.email}
              </option>
            ))}
          </select>
          {teachers.length === 0 && watchDepartment && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              No teachers available in this department
            </p>
          )}
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
            placeholder="Enter subject description..."
          />
        </div>

        {/* Syllabus URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Syllabus URL
          </label>
          <input
            type="url"
            {...register('syllabus')}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder="https://example.com/syllabus.pdf"
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
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active Subject</span>
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
          {loading ? 'Saving...' : subject ? 'Update Subject' : 'Create Subject'}
        </button>
      </div>
    </form>
  );
};

export default SubjectForm;
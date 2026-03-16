import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  UsersIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import DepartmentForm from '../../components/forms/DepartmentForm';
import toast from 'react-hot-toast';

const ManageDepartments = () => {
  const { user: currentUser } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [modalMode, setModalMode] = useState('add');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [departmentStats, setDepartmentStats] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      
      let departmentsData = [];
      if (Array.isArray(response.data)) {
        departmentsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        departmentsData = response.data.data;
      } else if (response.data.departments && Array.isArray(response.data.departments)) {
        departmentsData = response.data.departments;
      }
      
      setDepartments(departmentsData);
      setError('');
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setError('Failed to load departments');
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentDetails = async (departmentId) => {
    try {
      const response = await api.get(`/departments/${departmentId}`);
      setDepartmentStats(response.data);
    } catch (error) {
      console.error('Failed to fetch department details:', error);
      toast.error('Failed to load department details');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDepartments();
    setRefreshing(false);
    toast.success('Departments refreshed');
  };

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleViewDetails = async (department) => {
    setSelectedDepartment(department);
    await fetchDepartmentDetails(department._id);
    setShowDetailsModal(true);
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) return;

    try {
      await api.delete(`/departments/${departmentId}`);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      console.error('Failed to delete department:', error);
      toast.error(error.response?.data?.message || 'Failed to delete department');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingDepartment(null);
  };

  const handleDetailsModalClose = () => {
    setShowDetailsModal(false);
    setSelectedDepartment(null);
    setDepartmentStats(null);
  };

  const handleModalSuccess = () => {
    fetchDepartments();
  };

  const filteredDepartments = departments.filter(dept => 
    dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.faculty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manage Departments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total {departments.length} department{departments.length !== 1 ? 's' : ''}
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
            onClick={handleAddDepartment}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Department
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search departments by name, code, or faculty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No departments found</h3>
            <p className="text-gray-500 dark:text-gray-400">Get started by adding your first department</p>
            <button
              onClick={handleAddDepartment}
              className="mt-4 btn-primary inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Department
            </button>
          </div>
        ) : (
          filteredDepartments.map((department) => (
            <div
              key={department._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <BuildingOfficeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{department.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Code: {department.code}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    department.isActive 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  }`}>
                    {department.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Faculty:</span> {department.faculty || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Duration:</span> {department.duration || 4} years
                  </p>
                  {department.headOfDepartment && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Head:</span> {department.headOfDepartment.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{department.totalStudents || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{department.totalTeachers || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Teachers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{department.semesters?.length || 8}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Semesters</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => handleViewDetails(department)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <AcademicCapIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEditDepartment(department)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="Edit Department"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(department._id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Department"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Department Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={modalMode === 'add' ? 'Add New Department' : 'Edit Department'}
        size="lg"
      >
        <DepartmentForm
          department={editingDepartment}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      </Modal>

      {/* Department Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={handleDetailsModalClose}
        title={`${selectedDepartment?.name} - Details`}
        size="lg"
      >
        {departmentStats ? (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Students</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-500">{departmentStats.totalStudents || 0}</p>
                  </div>
                  <UsersIcon className="h-8 w-8 text-blue-400 dark:text-blue-600" />
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Teachers</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-500">{departmentStats.totalTeachers || 0}</p>
                  </div>
                  <AcademicCapIcon className="h-8 w-8 text-green-400 dark:text-green-600" />
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Subjects</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-500">
                      {departmentStats.semesters?.reduce((acc, sem) => acc + sem.subjects.length, 0) || 0}
                    </p>
                  </div>
                  <BookOpenIcon className="h-8 w-8 text-purple-400 dark:text-purple-600" />
                </div>
              </div>
            </div>

            {/* Semester-wise Subjects */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Semester-wise Subjects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departmentStats.semesters?.map((semester) => (
                  <div key={semester.number} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Semester {semester.number}</h4>
                    {semester.subjects.length > 0 ? (
                      <ul className="space-y-1">
                        {semester.subjects.map((subject) => (
                          <li key={subject._id} className="text-sm text-gray-600 dark:text-gray-300">
                            • {subject.name} ({subject.code}) - {subject.credits} credits
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500">No subjects assigned</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Department Info */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Code:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedDepartment?.code}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Faculty:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedDepartment?.faculty}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedDepartment?.duration} years</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Head:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {selectedDepartment?.headOfDepartment?.name || 'Not assigned'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <LoadingSpinner />
        )}
      </Modal>
    </div>
  );
};

export default ManageDepartments;
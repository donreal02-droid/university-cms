import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  UserIcon,
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import toast from 'react-hot-toast';

const AdminSchedule = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    teacher: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    semester: 1,
    department: '',
    academicYear: new Date().getFullYear().toString()
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    teachers: 0
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const timeSlots = [];
  for (let hour = 8; hour <= 16; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
    timeSlots.push({ start, end });
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [schedulesRes, subjectsRes, teachersRes, deptsRes] = await Promise.all([
        api.get('/schedule/admin'),
        api.get('/subjects'),
        api.get('/users/teachers'),
        api.get('/departments')
      ]);

      let schedulesData = [];
      if (Array.isArray(schedulesRes.data)) {
        schedulesData = schedulesRes.data;
      } else if (schedulesRes.data?.data && Array.isArray(schedulesRes.data.data)) {
        schedulesData = schedulesRes.data.data;
      }
      setSchedules(schedulesData);

      let subjectsData = [];
      if (Array.isArray(subjectsRes.data)) {
        subjectsData = subjectsRes.data;
      } else if (subjectsRes.data?.data && Array.isArray(subjectsRes.data.data)) {
        subjectsData = subjectsRes.data.data;
      }
      setSubjects(subjectsData);

      let teachersData = [];
      if (Array.isArray(teachersRes.data)) {
        teachersData = teachersRes.data;
      } else if (teachersRes.data?.data && Array.isArray(teachersRes.data.data)) {
        teachersData = teachersRes.data.data;
      }
      setTeachers(teachersData);

      let deptsData = [];
      if (Array.isArray(deptsRes.data)) {
        deptsData = deptsRes.data;
      } else if (deptsRes.data?.data && Array.isArray(deptsRes.data.data)) {
        deptsData = deptsRes.data.data;
      }
      setDepartments(deptsData);

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayCount = schedulesData.filter(s => s.day === today).length;

      const uniqueTeachers = new Set(schedulesData.map(s => s.teacher?._id)).size;

      setStats({
        total: schedulesData.length,
        today: todayCount,
        thisWeek: schedulesData.length,
        teachers: uniqueTeachers
      });

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleAddClick = () => {
    setEditingSchedule(null);
    setFormData({
      subject: '',
      teacher: '',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      room: '',
      semester: 1,
      department: '',
      academicYear: new Date().getFullYear().toString()
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditClick = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      subject: schedule.subject?._id || schedule.subject || '',
      teacher: schedule.teacher?._id || schedule.teacher || '',
      day: schedule.day || 'Monday',
      startTime: schedule.startTime || '09:00',
      endTime: schedule.endTime || '10:00',
      room: schedule.room || '',
      semester: schedule.semester || 1,
      department: schedule.department?._id || schedule.department || '',
      academicYear: schedule.academicYear || new Date().getFullYear().toString()
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDeleteClick = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormErrors({});
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSchedule) return;

    try {
      await api.delete(`/schedule/${selectedSchedule._id}`);
      setSchedules(prev => prev.filter(s => s._id !== selectedSchedule._id));
      toast.success('Schedule deleted successfully');
      setShowDeleteModal(false);
      setSelectedSchedule(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast.error(error.response?.data?.message || 'Failed to delete schedule');
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.subject) errors.subject = 'Subject is required';
    if (!formData.teacher) errors.teacher = 'Teacher is required';
    if (!formData.day) errors.day = 'Day is required';
    if (!formData.startTime) errors.startTime = 'Start time is required';
    if (!formData.endTime) errors.endTime = 'End time is required';
    if (!formData.room) errors.room = 'Room is required';
    if (!formData.semester) errors.semester = 'Semester is required';
    if (!formData.department) errors.department = 'Department is required';
    if (!formData.academicYear) errors.academicYear = 'Academic year is required';

    if (formData.startTime && formData.endTime) {
      const start = parseInt(formData.startTime.split(':')[0]);
      const end = parseInt(formData.endTime.split(':')[0]);
      if (end <= start) {
        errors.endTime = 'End time must be after start time';
      }
      if (end - start > 2) {
        errors.endTime = 'Class cannot be longer than 2 hours';
      }
    }

    const selectedSubject = subjects.find(s => s._id === formData.subject);
    if (selectedSubject) {
      const existingClasses = schedules.filter(s =>
        s.subject?._id === formData.subject &&
        s._id !== editingSchedule?._id &&
        s.academicYear === formData.academicYear
      ).length;

      if (existingClasses >= selectedSubject.credits) {
        errors.subject = `This subject requires ${selectedSubject.credits} classes per week. Already scheduled ${existingClasses}.`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkConflicts = async () => {
    try {
      const teacherCheck = await api.get(`/schedule/teacher/${formData.teacher}/availability`, {
        params: {
          day: formData.day,
          startTime: formData.startTime,
          endTime: formData.endTime,
          academicYear: formData.academicYear,
          excludeId: editingSchedule?._id
        }
      });

      if (!teacherCheck.data.available) {
        toast.error(`Teacher already has a class on ${formData.day} at this time`);
        return false;
      }

      const roomCheck = await api.get('/schedule/room/availability', {
        params: {
          room: formData.room,
          day: formData.day,
          startTime: formData.startTime,
          endTime: formData.endTime,
          academicYear: formData.academicYear,
          excludeId: editingSchedule?._id
        }
      });

      if (!roomCheck.data.available) {
        toast.error(`Room already booked on ${formData.day} at this time`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const noConflicts = await checkConflicts();
    if (!noConflicts) return;

    setSubmitting(true);

    try {
      if (editingSchedule) {
        const response = await api.put(`/schedule/${editingSchedule._id}`, formData);
        setSchedules(prev => prev.map(s =>
          s._id === editingSchedule._id ? response.data : s
        ));
        toast.success('Schedule updated successfully');
      } else {
        const response = await api.post('/schedule', formData);
        setSchedules(prev => [...prev, response.data]);
        toast.success('Schedule created successfully');
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast.error(error.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'subject') {
      const selectedSubject = subjects.find(s => s._id === value);
      if (selectedSubject) {
        setFormData(prev => ({
          ...prev,
          subject: value,
          department: selectedSubject.department?._id || selectedSubject.department || '',
          semester: selectedSubject.semester || prev.semester
        }));
      }
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (selectedDepartment !== 'all') {
      const deptId = schedule.department?._id || schedule.department;
      if (deptId !== selectedDepartment) return false;
    }

    if (selectedSemester !== 'all' && schedule.semester !== parseInt(selectedSemester)) return false;

    if (selectedDay !== 'all' && schedule.day !== selectedDay) return false;

    if (searchTerm) {
      const subjectName = schedule.subject?.name || '';
      const teacherName = schedule.teacher?.name || '';
      const room = schedule.room || '';
      const matchesSearch = subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
    }

    return true;
  });

  const schedulesByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = filteredSchedules
      .filter(s => s.day === day)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    return acc;
  }, {});

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Schedule Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage class schedules for all departments
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Classes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.today}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Today's Classes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <AcademicCapIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.thisWeek}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Classes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <UserIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.teachers}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Teachers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by subject, teacher, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDay === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            All Days
          </button>
          {daysOfWeek.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDay === day
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          {daysOfWeek.map(day => (
            <div key={day} className="p-4 text-center font-medium text-gray-700 dark:text-gray-300 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[600px]">
          {daysOfWeek.map(day => (
            <div key={day} className="border-r last:border-r-0 p-2 space-y-2">
              {schedulesByDay[day]?.map((schedule, idx) => {
                const subjectName = schedule.subject?.name || 'Unknown';
                const teacherName = schedule.teacher?.name || 'Unknown';
                const deptName = schedule.department?.name || 'Unknown';
                const semester = schedule.semester || 1;

                return (
                  <div
                    key={schedule._id || idx}
                    className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 hover:shadow-md transition-shadow group relative"
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => handleEditClick(schedule)}
                        className="p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(schedule)}
                        className="p-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="font-medium text-gray-900 dark:text-white pr-16">{subjectName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <UserIcon className="h-3 w-3" />
                      {teacherName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <BuildingOfficeIcon className="h-3 w-3" />
                      {deptName} - Sem {semester}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPinIcon className="h-3 w-3" />
                      {schedule.room}
                    </p>
                    <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mt-2">
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                  </div>
                );
              })}

              {schedulesByDay[day]?.length === 0 && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 dark:text-gray-600">No classes</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${formErrors.subject ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} (Sem {subject.semester}, {subject.credits} Credits)
                  </option>
                ))}
              </select>
              {formErrors.subject && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.subject}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teacher <span className="text-red-500">*</span>
              </label>
              <select
                name="teacher"
                value={formData.teacher}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${formErrors.teacher ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                <option value="">Select Teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} - {teacher.department?.name || 'No Dept'}
                  </option>
                ))}
              </select>
              {formErrors.teacher && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.teacher}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day <span className="text-red-500">*</span>
              </label>
              <select
                name="day"
                value={formData.day}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${formErrors.day ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              {formErrors.day && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.day}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Room <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleInputChange}
                placeholder="e.g., LH-101"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${formErrors.room ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
              />
              {formErrors.room && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.room}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <select
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${formErrors.startTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                {timeSlots.map(slot => (
                  <option key={slot.start} value={slot.start}>{slot.start}</option>
                ))}
              </select>
              {formErrors.startTime && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time <span className="text-red-500">*</span>
              </label>
              <select
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${formErrors.endTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                {timeSlots.map(slot => (
                  <option key={slot.end} value={slot.end}>{slot.end}</option>
                ))}
              </select>
              {formErrors.endTime && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.endTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${formErrors.semester ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
              {formErrors.semester && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.semester}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
                placeholder="e.g., 2024"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${formErrors.academicYear ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
              />
              {formErrors.academicYear && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.academicYear}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={departments.find(d => d._id === formData.department)?.name || 'Auto-filled from subject'}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  {editingSchedule ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {editingSchedule ? <PencilIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSchedule(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Schedule"
        message={`Are you sure you want to delete the schedule for "${selectedSchedule?.subject?.name}" on ${selectedSchedule?.day}?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminSchedule;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  UsersIcon,
  BookOpenIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TeacherStudents = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalDepartments: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch teacher's subjects
      const subjectsRes = await api.get('/subjects/teacher');
      const subjectsData = subjectsRes.data?.data || subjectsRes.data || [];
      setSubjects(subjectsData);

      // Get unique departments and semesters from subjects
      const deptMap = new Map();
      const semSet = new Set();
      
      subjectsData.forEach(subject => {
        if (subject.department) {
          const deptId = subject.department._id || subject.department;
          const deptName = subject.department.name || 'Unknown Department';
          deptMap.set(deptId, { _id: deptId, name: deptName });
        }
        if (subject.semester) {
          semSet.add(subject.semester);
        }
      });

      const departmentsArray = Array.from(deptMap.values());
      const semestersArray = Array.from(semSet).sort((a, b) => a - b);
      
      setDepartments(departmentsArray);
      setSemesters(semestersArray);

      // Fetch students from the endpoint
      const studentsRes = await api.get('/teacher/students');
      const studentsData = studentsRes.data?.data || studentsRes.data || [];
      
      // Create a map of subject enrollments
      const subjectEnrollments = new Map();
      
      // For each subject, determine which students are enrolled based on department & semester
      subjectsData.forEach(subject => {
        const deptId = subject.department?._id || subject.department;
        const semester = subject.semester;
        
        studentsData.forEach(student => {
          const studentDept = student.department?._id || student.department;
          const studentSem = student.semester;
          
          if (studentDept === deptId && studentSem === semester) {
            const studentId = student._id.toString();
            if (!subjectEnrollments.has(studentId)) {
              subjectEnrollments.set(studentId, new Set());
            }
            subjectEnrollments.get(studentId).add(subject._id.toString());
          }
        });
      });

      // Process students
      const processedStudents = studentsData.map(student => ({
        ...student,
        departmentName: student.department?.name || 'N/A',
        semesterValue: student.semester || 0,
        enrolledSubjects: Array.from(subjectEnrollments.get(student._id.toString()) || [])
      }));

      console.log('Processed students:', processedStudents);
      setStudents(processedStudents);
      
      setStats({
        totalStudents: processedStudents.length,
        totalSubjects: subjectsData.length,
        totalDepartments: departmentsArray.length
      });

    } catch (error) {
      console.error('Failed to fetch students data:', error);
      toast.error('Failed to load students');
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

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (student.enrollmentNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === 'all' || 
      student.department?._id === selectedDepartment || 
      student.department === selectedDepartment;

    const matchesSemester = selectedSemester === 'all' || 
      student.semester === parseInt(selectedSemester);

    const matchesSubject = selectedSubject === 'all' || 
      student.enrolledSubjects.includes(selectedSubject);

    return matchesSearch && matchesDepartment && matchesSemester && matchesSubject;
  });

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Students</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You have {stats.totalStudents} unique student{stats.totalStudents !== 1 ? 's' : ''} across {stats.totalSubjects} subject{stats.totalSubjects !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <UsersIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</span>
          </div>
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Unique Students</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <BookOpenIcon className="h-8 w-8 text-green-500 dark:text-green-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSubjects}</span>
          </div>
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Subjects Taught</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <BuildingOfficeIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{departments.length}</span>
          </div>
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Departments</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <AcademicCapIcon className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {students.reduce((acc, s) => acc + (s.enrolledSubjects?.length || 0), 0)}
            </span>
          </div>
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Total Enrollments</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-4">
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

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <UsersIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No students found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || selectedDepartment !== 'all' || selectedSemester !== 'all' || selectedSubject !== 'all'
                ? 'Try adjusting your filters'
                : 'No students found in your subjects'}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 text-lg font-medium">
                          {student.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span>{student.email}</span>
                          <span>•</span>
                          <span>{student.enrollmentNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Department & Semester */}
                    <div className="ml-15 mt-2 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        {student.departmentName}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-full">
                        <AcademicCapIcon className="h-4 w-4" />
                        Semester {student.semesterValue}
                      </span>
                    </div>

                    {/* Subjects */}
                    {student.enrolledSubjects && student.enrolledSubjects.length > 0 && (
                      <div className="ml-15 mt-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Enrolled in:</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {student.enrolledSubjects.map(subjectId => {
                            const subject = subjects.find(s => s._id === subjectId);
                            return subject ? (
                              <span
                                key={subjectId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                              >
                                <BookOpenIcon className="h-3 w-3" />
                                {subject.name} (Sem {subject.semester})
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/teacher/submissions?student=${student._id}`}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm text-center"
                    >
                      View Submissions
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherStudents;
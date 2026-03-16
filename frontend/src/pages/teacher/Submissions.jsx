import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  DocumentTextIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  StarIcon,
  PencilSquareIcon,
  TrashIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import GradeForm from '../../components/forms/GradeForm';
import GradeQuizForm from '../../components/forms/GradeQuizForm';
import toast from 'react-hot-toast';

const TeacherSubmissions = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for both assignment and quiz submissions
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState(searchParams.get('assignment') || 'all');
  const [quizFilter, setQuizFilter] = useState(searchParams.get('quiz') || 'all');
  const [submissionType, setSubmissionType] = useState('assignment'); // 'assignment' or 'quiz'
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Stats for both types
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    graded: 0,
    late: 0,
    averageScore: 0
  });

  useEffect(() => {
    fetchData();
    fetchSubjects();
  }, [submissionType]);

  useEffect(() => {
    const params = {};
    if (submissionType === 'assignment') {
      if (assignmentFilter !== 'all') params.assignment = assignmentFilter;
    } else {
      if (quizFilter !== 'all') params.quiz = quizFilter;
    }
    if (subjectFilter !== 'all') params.subject = subjectFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    setSearchParams(params);
  }, [assignmentFilter, quizFilter, subjectFilter, statusFilter, submissionType, setSearchParams]);

  useEffect(() => {
    const quizParam = searchParams.get('quiz');
    if (quizParam) {
      setSubmissionType('quiz');
      setQuizFilter(quizParam);
    }
  }, [searchParams]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects/teacher');
      const subjectsData = response.data?.data || response.data || [];
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchAssignmentSubmissions = async () => {
    try {
      const [submissionsRes, assignmentsRes] = await Promise.all([
        api.get('/submissions/teacher'),
        api.get('/assignments/teacher')
      ]);

      const submissionsData = Array.isArray(submissionsRes.data) 
        ? submissionsRes.data 
        : submissionsRes.data?.submissions || [];
      
      const assignmentsData = Array.isArray(assignmentsRes.data) 
        ? assignmentsRes.data 
        : assignmentsRes.data?.assignments || [];

      return { submissionsData, itemsData: assignmentsData };
    } catch (error) {
      console.error('Failed to fetch assignment submissions:', error);
      throw error;
    }
  };

 const fetchQuizSubmissions = async () => {
  try {
    console.log('Fetching quiz submissions...');
    
    const [submissionsRes, quizzesRes] = await Promise.all([
      api.get('/quiz-submissions/teacher'),
      api.get('/quizzes/teacher')
    ]);

    console.log('Submissions response:', submissionsRes);
    console.log('Quizzes response:', quizzesRes);

    const submissionsData = submissionsRes.data?.data || submissionsRes.data || [];
    const quizzesData = quizzesRes.data?.data || quizzesRes.data || [];

    console.log('Processed submissions data:', submissionsData);
    console.log('Processed quizzes data:', quizzesData);

    // Create a map of quizzes for quick lookup
    const quizMap = {};
    quizzesData.forEach(quiz => {
      quizMap[quiz._id] = quiz;
    });

    // Process submissions to ensure quiz data is complete
    const processedSubmissions = submissionsData.map(sub => {
      // If submission has quiz ID but not full data, use the map
      if (sub.quiz && typeof sub.quiz === 'string') {
        return {
          ...sub,
          quiz: quizMap[sub.quiz] || { _id: sub.quiz, subject: { name: 'Unknown' } }
        };
      }
      // If quiz exists but subject is missing, try to get full quiz data
      if (sub.quiz && sub.quiz._id && !sub.quiz.subject) {
        const fullQuiz = quizMap[sub.quiz._id];
        if (fullQuiz) {
          return {
            ...sub,
            quiz: fullQuiz
          };
        }
      }
      return sub;
    });

    console.log('Processed submissions:', processedSubmissions);

    return { submissionsData: processedSubmissions, itemsData: quizzesData };
  } catch (error) {
    console.error('Failed to fetch quiz submissions:', error);
    console.error('Error details:', error.response?.data);
    throw error;
  }
};

  const fetchData = async () => {
    try {
      setLoading(true);
      
      let submissionsData = [];
      let itemsData = [];

      if (submissionType === 'assignment') {
        const result = await fetchAssignmentSubmissions();
        submissionsData = result.submissionsData;
        itemsData = result.itemsData;
        setAssignments(itemsData);
      } else {
        const result = await fetchQuizSubmissions();
        submissionsData = result.submissionsData;
        itemsData = result.itemsData;
        setQuizzes(itemsData);
      }

      setSubmissions(submissionsData);

      // Calculate stats based on submission type
      if (submissionType === 'assignment') {
        const pending = submissionsData.filter(s => s?.status === 'submitted').length;
        const graded = submissionsData.filter(s => s?.status === 'graded').length;
        const late = submissionsData.filter(s => s?.status === 'late').length;
        
        const gradedSubmissions = submissionsData.filter(s => s?.marks != null);
        const avgScore = gradedSubmissions.length > 0
          ? Math.round(gradedSubmissions.reduce((acc, s) => acc + s.marks, 0) / gradedSubmissions.length)
          : 0;

        setStats({
          total: submissionsData.length,
          pending,
          graded,
          late,
          averageScore: avgScore
        });
      } else {
        const pending = submissionsData.filter(s => !s.isFullyGraded).length;
        const graded = submissionsData.filter(s => s.isFullyGraded).length;
        
        const gradedSubmissions = submissionsData.filter(s => s.totalMarksObtained != null);
        const avgScore = gradedSubmissions.length > 0
          ? Math.round(gradedSubmissions.reduce((acc, s) => acc + (s.totalMarksObtained / s.totalMarks * 100), 0) / gradedSubmissions.length)
          : 0;

        setStats({
          total: submissionsData.length,
          pending,
          graded,
          late: 0,
          averageScore: avgScore
        });
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await fetchSubjects(); // Also refresh subjects
    setRefreshing(false);
    toast.success('Submissions refreshed');
  };

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setShowDetailsModal(true);
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowGradeModal(true);
  };

  const handleDeleteSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedSubmission) return;
    
    try {
      const endpoint = submissionType === 'assignment' 
        ? `/submissions/${selectedSubmission._id}`
        : `/quiz-submissions/${selectedSubmission._id}`;
      
      await api.delete(endpoint);
      toast.success('Submission deleted successfully');
      
      // Refresh all data
      await fetchData();
      await fetchSubjects();
      
      setShowDeleteConfirm(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Failed to delete submission:', error);
      toast.error(error.response?.data?.message || 'Failed to delete submission');
    }
  };

  const handleDownloadFile = async (submission) => {
    try {
      const endpoint = submissionType === 'assignment' 
        ? `/submissions/${submission._id}/download`
        : `/quiz-submissions/${submission._id}/download`;
      
      const response = await api.get(endpoint, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `submission_${submission.student?.name}_${submissionType}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('Failed to download submission');
    }
  };

  const handleGradeSuccess = () => {
    fetchData();
    setShowGradeModal(false);
    setSelectedSubmission(null);
  };

  const filteredSubmissions = submissions.filter(submission => {
    const studentName = submission.student?.name?.toLowerCase() || '';
    const studentEmail = submission.student?.email?.toLowerCase() || '';
    const studentEnrollment = submission.student?.enrollmentNumber?.toLowerCase() || '';
    
    const matchesSearch = 
      studentName.includes(searchTerm.toLowerCase()) ||
      studentEmail.includes(searchTerm.toLowerCase()) ||
      studentEnrollment.includes(searchTerm.toLowerCase());

    // FIXED: Subject filter now works for both types
    let matchesSubject = true;
    if (subjectFilter !== 'all') {
      if (submissionType === 'assignment') {
        matchesSubject = submission.assignment?.subject?._id === subjectFilter;
      } else {
        // For quizzes, check if the quiz's subjectId matches - FIXED LINE 290
        matchesSubject = submission.quiz?.subjectId?._id === subjectFilter;
      }
    }

    if (submissionType === 'assignment') {
      const matchesAssignment = assignmentFilter === 'all' || submission.assignment?._id === assignmentFilter;
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
      return matchesSearch && matchesSubject && matchesAssignment && matchesStatus;
    } else {
      const matchesQuiz = quizFilter === 'all' || submission.quiz?._id === quizFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'pending' && !submission.isFullyGraded) ||
        (statusFilter === 'graded' && submission.isFullyGraded);
      return matchesSearch && matchesSubject && matchesQuiz && matchesStatus;
    }
  });

  const getAssignmentStatusBadge = (status) => {
    switch(status) {
      case 'graded':
        return {
          text: 'Graded',
          className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
          icon: CheckCircleIcon
        };
      case 'late':
        return {
          text: 'Late',
          className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
          icon: ClockIcon
        };
      case 'submitted':
      default:
        return {
          text: 'Pending',
          className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
          icon: ClockIcon
        };
    }
  };

  const getQuizStatusBadge = (submission) => {
    if (submission.isFullyGraded) {
      return {
        text: 'Graded',
        className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
        icon: CheckCircleIcon
      };
    } else {
      return {
        text: 'Pending',
        className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
        icon: ClockIcon
      };
    }
  };

  // Helper function to get subject name safely
  const getSubjectName = (submission) => {
    if (submissionType === 'assignment') {
      return submission.assignment?.subject?.name || 'Unknown Subject';
    } else {
      return submission.quiz?.subjectId?.name || 'Unknown Subject';
    }
  };

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Student Submissions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
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
        </div>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <button
          onClick={() => setSubmissionType('assignment')}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            submissionType === 'assignment'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Assignment Submissions
        </button>
        <button
          onClick={() => setSubmissionType('quiz')}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            submissionType === 'quiz'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Quiz Submissions
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            {submissionType === 'assignment' ? (
              <DocumentTextIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            ) : (
              <AcademicCapIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            )}
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {submissionType === 'assignment' ? 'Total Submissions' : 'Total Quiz Submissions'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <ClockIcon className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pending Review</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <CheckCircleIcon className="h-8 w-8 text-green-500 dark:text-green-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.graded}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Graded</p>
        </div>

        {submissionType === 'assignment' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <XCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.late}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Late Submissions</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <StarIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageScore}%</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Average Score</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by student name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>

          {/* Subject Filter - FIXED */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Subjects</option>
              {subjects && subjects.length > 0 ? (
                subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>No subjects</option>
              )}
            </select>
          </div>

          {/* Assignment/Quiz Filter */}
          <div>
            {submissionType === 'assignment' ? (
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
              >
                <option value="all">All Assignments</option>
                {assignments.map(assignment => (
                  <option key={assignment._id} value={assignment._id}>
                    {assignment.title}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={quizFilter}
                onChange={(e) => setQuizFilter(e.target.value)}
                className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
              >
                <option value="all">All Quizzes</option>
                {quizzes.map(quiz => (
                  <option key={quiz._id} value={quiz._id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Status</option>
              {submissionType === 'assignment' ? (
                <>
                  <option value="submitted">Pending</option>
                  <option value="graded">Graded</option>
                  <option value="late">Late</option>
                </>
              ) : (
                <>
                  <option value="pending">Pending</option>
                  <option value="graded">Graded</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No submissions found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || subjectFilter !== 'all' || (submissionType === 'assignment' ? assignmentFilter !== 'all' : quizFilter !== 'all') || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : `No ${submissionType} submissions have been received yet`}
            </p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => {
            const status = submissionType === 'assignment' 
              ? getAssignmentStatusBadge(submission.status)
              : getQuizStatusBadge(submission);
            const StatusIcon = status.icon;
            const subjectName = getSubjectName(submission);

            return (
              <div
                key={submission._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-800 transition-all"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {submission.student?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {submission.student?.name || 'Unknown Student'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {submission.student?.email}
                          </p>
                        </div>
                      </div>
                      
                      {/* Assignment/Quiz Details with Subject - FIXED */}
                      <div className="ml-13 mt-2 space-y-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {submissionType === 'assignment' 
                            ? submission.assignment?.title
                            : submission.quiz?.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <BookOpenIcon className="h-3 w-3" />
                            <span>
                            {submissionType === 'assignment' 
                              ? submission.assignment?.subject?.name 
                            : submission.quiz?.subjectId?.name || 'Unknown Subject'}
                              </span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {submissionType === 'assignment' 
                            ? `Due: ${submission.assignment?.deadline ? new Date(submission.assignment.deadline).toLocaleDateString() : 'N/A'}`
                            : `${submission.quiz?.questions?.length || 0} questions · Total Marks: ${submission.totalMarks}`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Submission Info */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${status.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.text}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>

                      {submissionType === 'assignment' ? (
                        // Assignment marks display
                        submission.marks && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              star <= Math.round(submission.marks / 20) ? (
                                <StarIconSolid key={star} className="h-4 w-4 text-yellow-400 dark:text-yellow-500" />
                              ) : (
                                <StarIcon key={star} className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                              )
                            ))}
                            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {submission.marks}/{submission.assignment?.maxMarks}
                            </span>
                          </div>
                        )
                      ) : (
                        // Quiz marks display
                        submission.totalMarksObtained ? (
                          <>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const percentage = (submission.totalMarksObtained / submission.totalMarks) * 100;
                                return star <= Math.round(percentage / 20) ? (
                                  <StarIconSolid key={star} className="h-4 w-4 text-yellow-400 dark:text-yellow-500" />
                                ) : (
                                  <StarIcon key={star} className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                                );
                              })}
                              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {submission.totalMarksObtained}/{submission.totalMarks}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {Math.round((submission.totalMarksObtained / submission.totalMarks) * 100)}%
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            Not graded yet
                          </span>
                        )
                      )}

                      {submission.feedback && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic max-w-md text-right">
                          "{submission.feedback}"
                        </p>
                      )}
                    </div>

                    {/* Actions - Added Delete Button */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(submission)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownloadFile(submission)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="Download File"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      {submissionType === 'assignment' 
                        ? submission.status !== 'graded' && (
                            <button
                              onClick={() => handleGradeSubmission(submission)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Grade Submission"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )
                        : !submission.isFullyGraded && (
                            <button
                              onClick={() => handleGradeSubmission(submission)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Grade Quiz"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                          )
                      }
                      {/* Delete Button - NEW */}
                      <button
                        onClick={() => handleDeleteSubmission(submission)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Submission"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submission Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Submission Details"
        size="lg"
      >
        {selectedSubmission && (
          <div className="space-y-6">
            {/* Student Info */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 text-xl font-medium">
                  {selectedSubmission.student?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedSubmission.student?.name || 'Unknown Student'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedSubmission.student?.email}
                </p>
              </div>
            </div>

            {/* Assignment/Quiz Info - FIXED to show subject */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {submissionType === 'assignment' ? 'Assignment' : 'Quiz'}
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="font-medium text-gray-900 dark:text-white">
                  {submissionType === 'assignment' 
                    ? selectedSubmission.assignment?.title
                    : selectedSubmission.quiz?.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {submissionType === 'assignment' 
                    ? selectedSubmission.assignment?.description
                    : selectedSubmission.quiz?.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Subject: {submissionType === 'assignment' 
                    ? selectedSubmission.assignment?.subject?.name || 'Unknown'
                    : selectedSubmission.quiz?.subjectId?.name || 'Unknown'}
                  </span>
                  {submissionType === 'assignment' ? (
                    <>
                      <span>Max Marks: {selectedSubmission.assignment?.maxMarks}</span>
                      <span>Due: {selectedSubmission.assignment?.deadline ? new Date(selectedSubmission.assignment.deadline).toLocaleDateString() : 'N/A'}</span>
                    </>
                  ) : (
                    <>
                      <span>Duration: {selectedSubmission.quiz?.duration} min</span>
                      <span>Questions: {selectedSubmission.quiz?.questions?.length || 0}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ... rest of the modal remains the same ... */}
          </div>
        )}
      </Modal>

      {/* Grade Modal */}
      <Modal
        isOpen={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        title={submissionType === 'assignment' ? "Grade Submission" : "Grade Quiz"}
        size="lg"
      >
        {selectedSubmission && (
          submissionType === 'assignment' ? (
            <GradeForm
              submission={selectedSubmission}
              onClose={() => setShowGradeModal(false)}
              onSuccess={handleGradeSuccess}
            />
          ) : (
            <GradeQuizForm
              submission={selectedSubmission}
              onClose={() => setShowGradeModal(false)}
              onSuccess={handleGradeSuccess}
            />
          )
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Submission"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this submission? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherSubmissions;
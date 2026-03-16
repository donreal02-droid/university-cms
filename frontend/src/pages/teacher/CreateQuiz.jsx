import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  AcademicCapIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  LightBulbIcon,
  ListBulletIcon,
  PencilSquareIcon,
  EyeIcon,
  UsersIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const CreateQuiz = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // List view state
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'list'
  
  // Create quiz state
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([
    {
      id: Date.now(),
      type: 'multiple', // 'multiple' or 'text'
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0, // for multiple choice
      correctAnswerText: '', // for text answer
      marks: 1
    }
  ]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    duration: 30,
    startDate: '',
    endDate: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalSubmissions: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    setLoading(true);
    
    const [quizzesRes, subjectsRes] = await Promise.all([
      api.get('/quizzes/teacher'),
      api.get('/subjects/teacher')
    ]);

    const quizzesData = quizzesRes.data?.data || [];
    setQuizzes(quizzesData);

    const subjectsData = subjectsRes.data?.data || [];
    setSubjects(subjectsData);

    const now = new Date();
    const active = quizzesData.filter(q => 
      q.isActive && new Date(q.endDate) > now
    ).length;
    const expired = quizzesData.filter(q => 
      !q.isActive || new Date(q.endDate) <= now
    ).length;

    setStats({
      total: quizzesData.length,
      active,
      expired,
      totalSubmissions: 0
    });

  } catch (error) {
    console.error('Failed to fetch data:', error);
    toast.error(error.response?.data?.message || 'Failed to load quizzes');
  } finally {
    setLoading(false);
  }
};

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects/teacher');
      
      let subjectsData = [];
      if (response.data && response.data.data) {
        subjectsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        subjectsData = response.data;
      }
      
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Quizzes refreshed');
  };

  const handleViewDetails = (quiz) => {
    setSelectedQuiz(quiz);
    setShowDetailsModal(true);
  };

  const handleDeleteQuiz = async (quizId) => {
  if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;

  try {
    await api.delete(`/quizzes/${quizId}`);
    toast.success('Quiz deleted successfully');
    
    // Refetch quizzes to update the dropdown
    const quizzesRes = await api.get('/quizzes/teacher');
    const quizzesData = quizzesRes.data?.data || [];
    setQuizzes(quizzesData);
    
    // Also refetch the current list
    fetchData();
  } catch (error) {
    console.error('Failed to delete quiz:', error);
    toast.error(error.response?.data?.message || 'Failed to delete quiz');
  }
};

  const handleDetailsModalClose = () => {
    setShowDetailsModal(false);
    setSelectedQuiz(null);
  };

  // Create Quiz Functions
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleQuestionTypeChange = (index, type) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].type = type;
    if (type === 'multiple') {
      updatedQuestions[index].options = ['', '', '', ''];
      updatedQuestions[index].correctAnswer = 0;
      updatedQuestions[index].correctAnswerText = '';
    } else {
      updatedQuestions[index].correctAnswerText = '';
    }
    setQuestions(updatedQuestions);
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].correctAnswer = optionIndex;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now() + Math.random(),
        type: 'multiple',
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        correctAnswerText: '',
        marks: 1
      }
    ]);
  };

  const duplicateQuestion = (index) => {
    const questionToDuplicate = { 
      ...questions[index], 
      id: Date.now() + Math.random() 
    };
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index + 1, 0, questionToDuplicate);
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      toast.error('You must have at least one question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const moveQuestionUp = (index) => {
    if (index === 0) return;
    const updatedQuestions = [...questions];
    [updatedQuestions[index - 1], updatedQuestions[index]] = [updatedQuestions[index], updatedQuestions[index - 1]];
    setQuestions(updatedQuestions);
  };

  const moveQuestionDown = (index) => {
    if (index === questions.length - 1) return;
    const updatedQuestions = [...questions];
    [updatedQuestions[index], updatedQuestions[index + 1]] = [updatedQuestions[index + 1], updatedQuestions[index]];
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options.length < 6) {
      updatedQuestions[questionIndex].options.push('');
      setQuestions(updatedQuestions);
    } else {
      toast.error('Maximum 6 options per question');
    }
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options.length <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }
    
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    
    if (updatedQuestions[questionIndex].correctAnswer === optionIndex) {
      updatedQuestions[questionIndex].correctAnswer = 0;
    } else if (updatedQuestions[questionIndex].correctAnswer > optionIndex) {
      updatedQuestions[questionIndex].correctAnswer--;
    }
    
    setQuestions(updatedQuestions);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Quiz title is required';
    }
    if (!formData.subjectId) {
      newErrors.subjectId = 'Please select a subject';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    if (formData.duration < 1 || formData.duration > 180) {
      newErrors.duration = 'Duration must be between 1 and 180 minutes';
    }

    let hasQuestionErrors = false;
    questions.forEach((q, index) => {
      if (!q.questionText.trim()) {
        newErrors[`q${index}`] = `Question ${index + 1} text is required`;
        hasQuestionErrors = true;
      }
      
      if (q.type === 'multiple') {
        q.options.forEach((opt, optIndex) => {
          if (!opt.trim()) {
            newErrors[`q${index}opt${optIndex}`] = `Option ${optIndex + 1} for question ${index + 1} is required`;
            hasQuestionErrors = true;
          }
        });
      }

      if (q.marks < 1 || q.marks > 10) {
        newErrors[`q${index}marks`] = `Marks for question ${index + 1} must be between 1 and 10`;
        hasQuestionErrors = true;
      }
    });

    if (hasQuestionErrors) {
      newErrors.questions = 'Please fix all question errors';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalMarks = () => {
    return questions.reduce((total, q) => total + (parseInt(q.marks) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    const quizData = {
      title: formData.title,
      description: formData.description,
      subject: formData.subjectId,
      duration: parseInt(formData.duration),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      questions: questions.map(q => {
        if (q.type === 'multiple') {
          return {
            type: 'multiple',
            questionText: q.questionText,
            options: q.options.filter(opt => opt.trim() !== ''),
            correctAnswer: q.correctAnswer,
            marks: parseInt(q.marks)
          };
        } else {
          return {
            type: 'text',
            questionText: q.questionText,
            marks: parseInt(q.marks)
          };
        }
      }),
      isActive: formData.isActive
    };

    setSubmitting(true);
    try {
      const response = await api.post('/quizzes', quizData);
      toast.success('Quiz created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        subjectId: '',
        duration: 30,
        startDate: '',
        endDate: '',
        isActive: true
      });
      setQuestions([
        {
          id: Date.now(),
          type: 'multiple',
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          correctAnswerText: '',
          marks: 1
        }
      ]);
      
      // Refresh the list
      fetchData();
      
      // Switch to list tab
      setActiveTab('list');
      
    } catch (error) {
      console.error('ERROR:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (quiz) => {
    const now = new Date();
    const startDate = new Date(quiz.startDate);
    const endDate = new Date(quiz.endDate);

    if (!quiz.isActive) {
      return {
        text: 'Inactive',
        className: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
      };
    } else if (now < startDate) {
      return {
        text: 'Upcoming',
        className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
      };
    } else if (now > endDate) {
      return {
        text: 'Expired',
        className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
      };
    } else {
      return {
        text: 'Active',
        className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      };
    }
  };
  
const filteredQuizzes = quizzes.filter(quiz => {
  const matchesSearch = 
    quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.subjectId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

  // FIXED: Use quiz.subjectId?._id instead of quiz.subject?._id
  const matchesSubject = subjectFilter === 'all' || quiz.subjectId?._id === subjectFilter;
  
  if (!matchesSearch || !matchesSubject) return false;
  
  const now = new Date();
  const endDate = new Date(quiz.endDate);
  const startDate = new Date(quiz.startDate);
  
  let status = 'active';
  if (!quiz.isActive) {
    status = 'inactive';
  } else if (now < startDate) {
    status = 'upcoming';
  } else if (now > endDate) {
    status = 'expired';
  }
  
  if (statusFilter === 'all') return true;
  
  return status === statusFilter;
});

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create and manage your quizzes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'create'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Create Quiz
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'list'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          My Quizzes ({stats.total})
        </button>
      </div>

      {/* Create Quiz Tab */}
      {activeTab === 'create' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <PlusIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            Create New Quiz
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quiz Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quiz Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`input-field dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="e.g., Mid-Term Assessment"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="Add instructions for students..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  className={`input-field dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.subjectId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {errors.subjectId && <p className="text-red-500 text-xs mt-1">{errors.subjectId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    max="180"
                    className={`input-field pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.duration ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={`input-field pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.startDate ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={`input-field pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.endDate ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active (students can attempt)</span>
                </label>
              </div>
            </div>

            {/* Questions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Questions (Total Marks: {calculateTotalMarks()})
                </h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Question
                </button>
              </div>

              {errors.questions && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.questions}</p>
                </div>
              )}

              <div className="space-y-4">
                {questions.map((question, qIndex) => (
                  <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-3 py-1 rounded-full text-sm font-medium">
                          Q{qIndex + 1}
                        </span>
                        <select
                          value={question.type}
                          onChange={(e) => handleQuestionTypeChange(qIndex, e.target.value)}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="multiple">Multiple Choice</option>
                          <option value="text">Free Text</option>
                        </select>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => moveQuestionUp(qIndex)}
                            disabled={qIndex === 0}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-30"
                          >
                            <ChevronUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveQuestionDown(qIndex)}
                            disabled={qIndex === questions.length - 1}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-30"
                          >
                            <ChevronDownIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateQuestion(qIndex)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600"
                          title="Duplicate question"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <textarea
                        value={question.questionText}
                        onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                        className={`input-field w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors[`q${qIndex}`] ? 'border-red-500' : ''}`}
                        placeholder="Enter your question..."
                        rows="2"
                      />
                      {errors[`q${qIndex}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`q${qIndex}`]}</p>
                      )}
                    </div>

                    {question.type === 'multiple' && (
                      <div className="space-y-2 mb-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Options
                        </label>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correctAnswer === oIndex}
                              onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                              className="h-4 w-4 text-primary-600"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                              className={`input-field flex-1 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors[`q${qIndex}opt${oIndex}`] ? 'border-red-500' : ''}`}
                              placeholder={`Option ${oIndex + 1}`}
                            />
                            {question.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(qIndex, oIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {question.options.length < 6 && (
                          <button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1 mt-2"
                          >
                            <PlusIcon className="h-4 w-4" />
                            Add Option
                          </button>
                        )}
                      </div>
                    )}

                    {question.type === 'text' && (
                      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-400">
                          Free text question - students will type their answer. Grade manually.
                        </p>
                      </div>
                    )}

                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Marks
                      </label>
                      <input
                        type="number"
                        value={question.marks}
                        onChange={(e) => handleQuestionChange(qIndex, 'marks', e.target.value)}
                        min="1"
                        max="10"
                        className={`input-field dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors[`q${qIndex}marks`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`q${qIndex}marks`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`q${qIndex}marks`]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <LightBulbIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-1">Quiz Creation Tips</h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Each question must have at least 2 options for multiple choice</li>
                    <li>Maximum 6 options per multiple choice question</li>
                    <li>Free text questions are manually graded by teachers - no correct answer needed</li>
                    <li>Marks per question can be from 1 to 10</li>
                    <li>Set appropriate start and end dates for the quiz</li>
                    <li>Duration should be reasonable for the number of questions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: '',
                    description: '',
                    subjectId: '',
                    duration: 30,
                    startDate: '',
                    endDate: '',
                    isActive: true
                  });
                  setQuestions([{
                    id: Date.now(),
                    type: 'multiple',
                    questionText: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    correctAnswerText: '',
                    marks: 1
                  }]);
                }}
                className="btn-secondary"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center gap-2"
              >
                {submitting ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Quizzes Tab */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <AcademicCapIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  Total
                </span>
              </div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400">Total Quizzes</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircleIcon className="h-8 w-8 text-green-500 dark:text-green-400" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400">Active Quizzes</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <XCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />
                <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
                  Expired
                </span>
              </div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400">Expired Quizzes</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expired}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <UsersIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                  Total
                </span>
              </div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400">Total Submissions</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSubmissions}</p>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search quizzes by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  />
                </div>
              </div>

            <div>
                <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}
                className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600">
                <option value="all">All Subjects</option>
                {subjects && subjects.length > 0 ? (subjects.map(subject => (
                <option key={subject._id} value={subject._id}> {subject.name} </option>))) : (
                <option value="" disabled>Loading subjects...</option>)}
              </select>
            </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quizzes List */}
          <div className="space-y-4">
            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No quizzes found</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || subjectFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first quiz above'}
                </p>
              </div>
            ) : (
              filteredQuizzes.map((quiz) => {
                const status = getStatusBadge(quiz);
                const totalQuestions = quiz.questions?.length || 0;
                const totalMarks = quiz.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0;

                return (
                  <div
                    key={quiz._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <AcademicCapIcon className="h-6 w-6 text-primary-600" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${status.className}`}>
                              {status.text}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                            {quiz.description || 'No description'}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <DocumentTextIcon className="h-4 w-4" />
                              {/* FIXED: Changed from quiz.subject?.name to quiz.subjectId?.name */}
                              {quiz.subjectId?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              {quiz.duration} min
                            </span>
                            <span className="flex items-center gap-1">
                              <DocumentTextIcon className="h-4 w-4" />
                              {totalQuestions} questions
                            </span>
                            <span className="font-medium">
                              Marks: {totalMarks}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/teacher/quiz-submissions?quiz=${quiz._id}`}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Submissions"
                          >
                            <UsersIcon className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleViewDetails(quiz)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(quiz._id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Quiz"
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
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={handleDetailsModalClose}
        title="Quiz Details"
        size="lg"
      >
        {selectedQuiz && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-primary-100 rounded-lg">
                <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedQuiz.title}</h2>
                <p className="text-sm text-gray-500">
                  {/* FIXED: Changed from selectedQuiz.subject?.name to selectedQuiz.subjectId?.name */}
                  {selectedQuiz.subjectId?.name} · {selectedQuiz.duration} minutes
                </p>
              </div>
            </div>

            {selectedQuiz.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
                  {selectedQuiz.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Start Date</p>
                <p className="font-medium">{new Date(selectedQuiz.startDate).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">End Date</p>
                <p className="font-medium">{new Date(selectedQuiz.endDate).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Questions</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedQuiz.questions?.map((q, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-sm font-medium mb-1">
                      Q{index + 1}: {q.questionText}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      Type: {q.type === 'multiple' ? 'Multiple Choice' : 'Free Text'} · Marks: {q.marks}
                    </p>
                    {q.type === 'multiple' && q.options && (
                      <div className="space-y-1">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 text-xs">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              optIndex === q.correctAnswer 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className={optIndex === q.correctAnswer ? 'font-medium text-green-600' : ''}>
                              {opt}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link
                to={`/teacher/quiz-submissions?quiz=${selectedQuiz._id}`}
                className="btn-primary"
                onClick={handleDetailsModalClose}
              >
                View Submissions
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CreateQuiz;
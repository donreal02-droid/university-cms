import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  AcademicCapIcon,
  ClockIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TakeQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/quizzes/student/${id}`);
      console.log('Quiz data:', response.data);
      
      const quizData = response.data?.data || response.data;
      setQuiz(quizData);
      
      // Initialize answers array
      if (quizData.questions) {
        setAnswers(new Array(quizData.questions.length).fill(''));
      }
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to load quiz');
      navigate('/student/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = answers.some(a => !a || a.trim() === '');
    if (unanswered) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/quizzes/submit', {
        quizId: quiz._id,
        answers
      });
      toast.success('Quiz submitted successfully!');
      navigate('/student/quizzes');
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Quiz not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/student/quizzes')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {quiz.subject?.name} • {quiz.duration} minutes • {quiz.questions?.length} questions
          </p>
        </div>
      </div>

      {/* Quiz Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
          <ClockIcon className="h-5 w-5" />
          <span className="font-medium">Time Limit: {quiz.duration} minutes</span>
        </div>
        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
          Complete all questions and submit before the time runs out.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions?.map((question, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 w-8 h-8 rounded-full flex items-center justify-center font-medium">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {question.questionText}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Marks: {question.marks}
                </p>
              </div>
            </div>

            {question.type === 'multiple' ? (
              <div className="space-y-3 ml-11">
                {question.options?.map((option, optIndex) => (
                  <label key={optIndex} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      checked={answers[index] === option}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="ml-11">
                <textarea
                  value={answers[index] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Type your answer here..."
                  rows="4"
                  className="input-field w-full dark:bg-gray-800 dark:text-white dark:border-gray-600"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          {submitting ? (
            <>
              <LoadingSpinner />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              Submit Quiz
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TakeQuiz;
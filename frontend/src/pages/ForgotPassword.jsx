import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { HiMiniSquare3Stack3D } from "react-icons/hi2";
import api from '../utils/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send reset code to email
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset code sent to your email!');
      
      // After 2 seconds, redirect to reset password page
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
        >
          <FiArrowLeft className="h-4 w-4" />
          <span>Back to login</span>
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary-50 dark:bg-gray-800 rounded-xl mb-4">
            <HiMiniSquare3Stack3D className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Forgot password?</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {sent 
              ? 'Check your email for the reset code' 
              : 'Enter your email to receive a reset code'}
          </p>
        </div>

        {sent ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
            <FiCheckCircle className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-3" />
            <p className="text-green-700 dark:text-green-300 font-medium mb-2">Email Sent!</p>
            <p className="text-sm text-green-600 dark:text-green-400">
              We've sent a reset code to <span className="font-medium">{email}</span>
            </p>
            <p className="text-xs text-green-500 dark:text-green-500 mt-4">
              Redirecting to reset password...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-800 dark:text-white transition-all"
                  placeholder="admin@university.com"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
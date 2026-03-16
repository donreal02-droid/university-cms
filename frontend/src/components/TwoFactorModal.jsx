// components/TwoFactorModal.jsx
import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { ShieldCheckIcon, KeyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TwoFactorModal = ({ isOpen, onClose, onSuccess, tempToken, method, userData }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const { verify2FA } = useAuth();
  const navigate = useNavigate();

  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen && !useBackupCode) {
      setCountdown(30);
      setCanResend(false);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, useBackupCode]);

  const handleVerify = async () => {
    // Validate code based on type
    if (useBackupCode) {
      // Backup codes format: XXXX-XXXX or XXXXXXXX
      const cleanCode = code.replace(/[^A-Za-z0-9]/g, '');
      if (cleanCode.length !== 8) {
        toast.error('Backup code must be 8 characters');
        return;
      }
    } else {
      // TOTP code: 6 digits
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        toast.error('Please enter a valid 6-digit code');
        return;
      }
    }

    setLoading(true);
    try {
      console.log('Verifying 2FA code...', { useBackupCode, code });
      
      const result = await verify2FA(tempToken, code, useBackupCode);
      
      if (result.success) {
        toast.success('2FA verification successful!');
        onSuccess();
        onClose();
        
        // Redirect based on role
        setTimeout(() => {
          switch (result.role) {
            case 'admin': navigate('/admin/dashboard'); break;
            case 'teacher': navigate('/teacher/dashboard'); break;
            case 'student': navigate('/student/dashboard'); break;
            default: navigate('/');
          }
        }, 500);
      }
    } catch (error) {
      console.error('Verification error:', error);
      // Error is already handled in verify2FA function
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    // For app-based 2FA, you can't resend - user must wait for new code
    if (method === 'app') {
      toast.error('Please wait for the code to refresh in your authenticator app');
      setCountdown(30);
      setCanResend(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </Dialog.Title>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {useBackupCode 
                ? 'Enter one of your backup codes' 
                : `Enter the 6-digit code from your authenticator app`}
            </p>
            {userData && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Logging in as <span className="font-medium">{userData.email}</span>
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  let value = e.target.value;
                  if (!useBackupCode) {
                    // For TOTP: only digits, max 6
                    value = value.replace(/\D/g, '').slice(0, 6);
                  } else {
                    // For backup codes: allow letters and numbers, auto-format
                    value = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
                    if (value.length > 4) {
                      value = value.slice(0, 4) + '-' + value.slice(4);
                    }
                  }
                  setCode(value);
                }}
                placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
                className="w-full text-center text-2xl tracking-widest input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                maxLength={useBackupCode ? 9 : 6}
                autoFocus
              />
              
              {/* Code timer for app-based 2FA */}
              {!useBackupCode && method === 'app' && (
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Code refreshes in:</span>
                  <span className="font-mono">{countdown}s</span>
                </div>
              )}
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || code.length < (useBackupCode ? 9 : 6)}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying...</span>
                </span>
              ) : (
                'Verify'
              )}
            </button>

            {/* Toggle between TOTP and backup code */}
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode('');
              }}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 w-full"
            >
              {useBackupCode 
                ? 'Use authenticator app instead' 
                : 'Use a backup code instead'}
            </button>

            {/* Resend option (only for SMS/email) */}
            {method !== 'app' && (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 w-full flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Resend Code
              </button>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default TwoFactorModal;
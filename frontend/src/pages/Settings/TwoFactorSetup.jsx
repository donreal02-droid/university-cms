// pages/Settings/TwoFactorSetup.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  ShieldCheckIcon, 
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const TwoFactorSetup = ({ onStatusChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: intro, 2: setup, 3: verify, 4: enabled
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [copied, setCopied] = useState(false);
  const [twoFAStatus, setTwoFAStatus] = useState({ enabled: false, method: 'app' });
  
  // Disable 2FA states
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [useBackupForDisable, setUseBackupForDisable] = useState(false);

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const response = await api.get('/2fa/status');
      setTwoFAStatus(response.data);
      if (response.data.enabled) {
        setStep(4);
      }
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const response = await api.post('/2fa/setup');
      setSetupData(response.data);
      setStep(2);
    } catch (error) {
      toast.error('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/2fa/verify', {
        token: verificationCode
      });
      
      setBackupCodes(response.data.backupCodes);
      setStep(3);
      toast.success('2FA enabled successfully!');
      check2FAStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast.error('Please enter your password');
      return;
    }

    if (!useBackupForDisable && (!disableCode || disableCode.length !== 6)) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    if (useBackupForDisable && (!disableCode || disableCode.replace(/-/g, '').length !== 8)) {
      toast.error('Please enter a valid backup code');
      return;
    }

    setDisableLoading(true);
    try {
      await api.post('/2fa/disable', {
        password: disablePassword,
        token: useBackupForDisable ? disableCode.replace(/-/g, '').toUpperCase() : disableCode,
      });

      toast.success('2FA disabled successfully');
      setShowDisableModal(false);
      setDisablePassword('');
      setDisableCode('');
      setUseBackupForDisable(false);
      
      // Reset to intro step
      setStep(1);
      check2FAStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setDisableLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Backup codes copied!');
  };

  const downloadBackupCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `backup-codes-${user?.email || 'user'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateNewBackupCodes = async () => {
    const code = prompt('Enter your current 2FA code to generate new backup codes:');
    if (!code) return;

    try {
      const response = await api.post('/2fa/backup-codes', { token: code });
      setBackupCodes(response.data.backupCodes);
      setStep(3);
      toast.success('New backup codes generated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate new codes');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Two-Factor Authentication (2FA)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {twoFAStatus.enabled 
                ? '2FA is currently enabled on your account' 
                : 'Add an extra layer of security to your account'}
            </p>
          </div>
        </div>
        
        {/* Disable button - only show when enabled */}
        {twoFAStatus.enabled && (
          <button
            onClick={() => setShowDisableModal(true)}
            className="btn-secondary text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 flex items-center gap-2"
          >
            <NoSymbolIcon className="h-4 w-4" />
            Disable 2FA
          </button>
        )}
      </div>

      {/* Step 1: Intro (2FA disabled) */}
      {step === 1 && !twoFAStatus.enabled && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              Why enable 2FA?
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Protects your account even if your password is stolen</li>
              <li>• Requires a verification code from your phone</li>
              <li>• Supports Google Authenticator, Authy, and similar apps</li>
            </ul>
          </div>

          <button
            onClick={handleSetup}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
          </button>
        </div>
      )}

      {/* Step 2: Setup - Show QR Code */}
      {step === 2 && setupData && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              1. Scan this QR code with your authenticator app
            </p>
            <div className="inline-block p-4 bg-white rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <img 
                src={setupData.qrCode} 
                alt="2FA QR Code" 
                className="w-48 h-48 mx-auto"
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              2. Or manually enter this secret key:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                {setupData.secret}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(setupData.secret);
                  toast.success('Secret copied!');
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              3. Enter the 6-digit code from your app
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-widest input-field"
              maxLength="6"
              autoFocus
            />
            <button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="btn-primary w-full mt-4"
            >
              {loading ? 'Verifying...' : 'Verify and Enable'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 3 && backupCodes.length > 0 && (
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                  Save these backup codes!
                </h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Each code can only be used once. Keep them in a safe place.
                  If you lose your phone, you'll need these to access your account.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm text-center border border-gray-200 dark:border-gray-600"
              >
                {code}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyBackupCodes}
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy Codes'}
            </button>
            <button
              onClick={downloadBackupCodes}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Download
            </button>
          </div>

          <button
            onClick={() => {
              setStep(4);
              check2FAStatus();
            }}
            className="w-full btn-primary mt-2"
          >
            I've Saved My Backup Codes
          </button>
        </div>
      )}

      {/* Step 4: Already Enabled */}
      {step === 4 && twoFAStatus.enabled && (
        <div className="text-center py-4">
          <div className="inline-flex p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            2FA is Enabled
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Your account is protected with two-factor authentication.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={generateNewBackupCodes}
              className="btn-secondary flex items-center gap-2"
            >
              <KeyIcon className="h-4 w-4" />
              New Backup Codes
            </button>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      <Modal
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false);
          setDisablePassword('');
          setDisableCode('');
          setUseBackupForDisable(false);
        }}
        title="Disable Two-Factor Authentication"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-400">
              ⚠️ Disabling 2FA will make your account less secure. 
              You will need to confirm your identity to proceed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {useBackupForDisable ? 'Backup Code' : '2FA Code'} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setUseBackupForDisable(!useBackupForDisable);
                  setDisableCode('');
                }}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                {useBackupForDisable ? 'Use authenticator app' : 'Use backup code'}
              </button>
            </div>
            <input
              type="text"
              value={disableCode}
              onChange={(e) => {
                let value = e.target.value;
                if (!useBackupForDisable) {
                  value = value.replace(/\D/g, '').slice(0, 6);
                } else {
                  value = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
                  if (value.length > 4) {
                    value = value.slice(0, 4) + '-' + value.slice(4);
                  }
                }
                setDisableCode(value);
              }}
              placeholder={useBackupForDisable ? 'XXXX-XXXX' : '000000'}
              className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              maxLength={useBackupForDisable ? 9 : 6}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowDisableModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDisable2FA}
              disabled={disableLoading || !disablePassword || !disableCode}
              className="btn-primary bg-red-600 hover:bg-red-700"
            >
              {disableLoading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TwoFactorSetup;
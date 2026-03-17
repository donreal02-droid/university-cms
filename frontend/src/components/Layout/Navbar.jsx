import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { HiMiniSquare3Stack3D } from "react-icons/hi2";
import { Fragment } from 'react';
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationsPanel from '../Notifications/NotificationsPanel';
import api from '../../utils/api';

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchProfileImage();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications?unreadOnly=true&limit=1');
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // ✅ Fetch profile image
  const fetchProfileImage = async () => {
    try {
      const response = await api.get(`/auth/profile?t=${Date.now()}`);
      if (response.data?.profileImage) {
        setProfileImage(response.data.profileImage);
      }
    } catch (error) {
      console.error('Failed to fetch profile image:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle logo click based on authentication
  const handleLogoClick = (e) => {
    e.preventDefault();
    if (user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        default:
          navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  // Helper function to get image URL
const getImageUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  
  // Get base URL from environment variable
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  if (filename.startsWith('/uploads')) {
    return `${baseUrl}${filename}`;
  }
  return `${baseUrl}/uploads/profiles/${filename}`;
};

  return (
    <nav className="fixed top-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex ml-2 md:mr-24 items-center focus:outline-none"
            >
              <HiMiniSquare3Stack3D  className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-primary-600 dark:text-primary-400 ml-2">
                UNIVERSITY OF SHANGLA CMS
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-5 h-5" />
              ) : (
                <SunIcon className="w-5 h-5" />
              )}
            </button>

            {/* Notifications - Only show if logged in */}
            {user && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                >
                  <BellIcon className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 z-50">
                    <NotificationsPanel onClose={() => setShowNotifications(false)} />
                  </div>
                )}
              </div>
            )}

            {/* Profile dropdown - Only show if logged in */}
            {user ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center text-sm">
                  <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    {/* Profile Image - FIXED */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {profileImage ? (
                        <img
                          src={getImageUrl(profileImage)}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Failed to load profile image, showing fallback');
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '<div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"><svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <UserCircleIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to={`/${user.role}/profile`}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } flex px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                        >
                          <UserCircleIcon className="w-5 h-5 mr-3" />
                          Your Profile
                        </Link>
                      )}
                    </Menu.Item>
                    
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/settings"
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } flex px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                        >
                          <Cog6ToothIcon className="w-5 h-5 mr-3" />
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                    
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                        >
                          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              /* Show login button if not logged in */
              <Link
                to="/login"
                className="btn-primary text-sm px-4 py-2"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
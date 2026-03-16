import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowLeftOnRectangleIcon,
  AcademicCapIcon,
  UserGroupIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();

  const adminLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Manage Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Departments', href: '/admin/departments', icon: BuildingOfficeIcon },
    { name: 'Subjects', href: '/admin/subjects', icon: BookOpenIcon },
    { name: 'Schedule Management', href: '/admin/schedule', icon: CalendarIcon },
    { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
    { name: 'Profile', href: '/settings', icon: Cog6ToothIcon },
  ];

  const teacherLinks = [
    { name: 'Dashboard', href: '/teacher/dashboard', icon: HomeIcon },
    { name: 'My Subjects', href: '/teacher/subjects', icon: BookOpenIcon },
    { name: 'My Students', href: '/teacher/students', icon: UserGroupIcon },
    { name: 'Assignments', href: '/teacher/assignments', icon: ClipboardDocumentListIcon },
    { name: 'Submissions', href: '/teacher/submissions', icon: DocumentTextIcon },
    { name: 'Upload Notes', href: '/teacher/notes/upload', icon: DocumentTextIcon },
    { name: 'Create Quiz', href: '/teacher/quizzes/create', icon: AcademicCapIcon },
    { name: 'My Schedule', href: '/teacher/schedule', icon: CalendarIcon }, // 👈 ADDED SCHEDULE HERE
    { name: 'Profile', href: '/settings', icon: Cog6ToothIcon },
  ];

  const studentLinks = [
    { name: 'Dashboard', href: '/student/dashboard', icon: HomeIcon },
    { name: 'My Subjects', href: '/student/subjects', icon: BookOpenIcon },
    { name: 'Study Materials', href: '/student/notes', icon: DocumentTextIcon },
    { name: 'Assignments', href: '/student/assignments', icon: ClipboardDocumentListIcon },
    { name: 'Quizzes', href: '/student/quizzes', icon: AcademicCapIcon },
    { name: 'Schedule', href: '/student/schedule', icon: CalendarIcon },
    { name: 'Profile', href: '/settings', icon: Cog6ToothIcon },
  ];

  const getLinks = () => {
    if (user?.role === 'admin') return adminLinks;
    if (user?.role === 'teacher') return teacherLinks;
    if (user?.role === 'student') return studentLinks;
    return [];
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto">
          <ul className="space-y-1 font-medium">
            {links.map((link) => (
              <li key={link.name}>
                <NavLink
                  to={link.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 group ${
                      isActive 
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <link.icon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200" />
                  <span className="ml-3 font-medium">{link.name}</span>
                </NavLink>
              </li>
            ))}

            <li className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={logout}
                className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200" />
                <span className="ml-3 font-medium">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
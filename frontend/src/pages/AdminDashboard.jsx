// import React from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import {
//   UsersIcon,
//   BuildingOfficeIcon,
//   BookOpenIcon,
//   ChartBarIcon,
//   ArrowRightOnRectangleIcon,
//   UserCircleIcon
// } from '@heroicons/react/24/outline';

// const AdminDashboard = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   const stats = [
//     { name: 'Total Users', value: '156', icon: UsersIcon, change: '+12%' },
//     { name: 'Departments', value: '8', icon: BuildingOfficeIcon, change: '+2' },
//     { name: 'Subjects', value: '42', icon: BookOpenIcon, change: '+8' },
//     { name: 'Reports', value: '24', icon: ChartBarIcon, change: '+15%' },
//   ];

//   const quickActions = [
//     {
//       title: 'Manage Users',
//       description: 'Add, edit, or remove users',
//       icon: UsersIcon,
//       link: '/admin/users',
//       color: 'bg-blue-500',
//       hoverColor: 'hover:bg-blue-600'
//     },
//     {
//       title: 'Manage Departments',
//       description: 'Create and manage departments',
//       icon: BuildingOfficeIcon,
//       link: '/admin/departments',
//       color: 'bg-green-500',
//       hoverColor: 'hover:bg-green-600'
//     },
//     {
//       title: 'Manage Subjects',
//       description: 'Add subjects and assign teachers',
//       icon: BookOpenIcon,
//       link: '/admin/subjects',
//       color: 'bg-purple-500',
//       hoverColor: 'hover:bg-purple-600'
//     },
//     {
//       title: 'View Reports',
//       description: 'Analytics and insights',
//       icon: ChartBarIcon,
//       link: '/admin/reports',
//       color: 'bg-orange-500',
//       hoverColor: 'hover:bg-orange-600'
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
//       {/* Navigation */}
//       <nav className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between h-16">
//             <div className="flex items-center">
//               <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
//             </div>
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center space-x-3">
//                 <UserCircleIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
//                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                   Welcome, {user?.name || 'Admin'}
//                 </span>
//               </div>
//               <button
//                 onClick={handleLogout}
//                 className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
//               >
//                 <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {stats.map((stat, index) => {
//             const Icon = stat.icon;
//             return (
//               <div
//                 key={index}
//                 className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all"
//               >
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
//                     <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
//                   </div>
//                   <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
//                     <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
//                   </div>
//                 </div>
//                 <div className="mt-4">
//                   <span className="text-sm font-medium text-green-600 dark:text-green-400">{stat.change}</span>
//                   <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">from last month</span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Quick Actions Grid */}
//         <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {quickActions.map((action, index) => {
//             const Icon = action.icon;
//             return (
//               <Link
//                 key={index}
//                 to={action.link}
//                 className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all group cursor-pointer"
//               >
//                 <div className="flex items-center mb-4">
//                   <div className={`p-3 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
//                     <Icon className="h-6 w-6 text-white" />
//                   </div>
//                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">{action.title}</h3>
//                 </div>
//                 <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{action.description}</p>
//                 <span className="text-primary-600 dark:text-primary-400 text-sm font-medium group-hover:underline">
//                   Go to section →
//                 </span>
//               </Link>
//             );
//           })}
//         </div>

//         {/* Recent Activity Section */}
//         <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
//           <div className="space-y-4">
//             {[1, 2, 3].map((item) => (
//               <div key={item} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                   <div>
//                     <p className="text-sm font-medium text-gray-900 dark:text-white">
//                       New user registered
//                     </p>
//                     <p className="text-xs text-gray-500 dark:text-gray-400">
//                       5 minutes ago
//                     </p>
//                   </div>
//                 </div>
//                 <span className="text-xs text-gray-500 dark:text-gray-400">System</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;
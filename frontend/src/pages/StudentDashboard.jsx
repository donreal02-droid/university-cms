// import React from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';

// const StudentDashboard = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <nav className="bg-white shadow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between h-16">
//             <div className="flex items-center">
//               <h1 className="text-xl font-semibold">Student Dashboard</h1>
//             </div>
//             <div className="flex items-center">
//               <span className="mr-4">Welcome, {user?.name}</span>
//               <button
//                 onClick={handleLogout}
//                 className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-lg shadow">
//             <h2 className="text-lg font-semibold mb-4">My Subjects</h2>
//             <p className="text-gray-600">View enrolled subjects</p>
//           </div>
          
//           <div className="bg-white p-6 rounded-lg shadow">
//             <h2 className="text-lg font-semibold mb-4">Download Notes</h2>
//             <p className="text-gray-600">Access study materials</p>
//           </div>
          
//           <div className="bg-white p-6 rounded-lg shadow">
//             <h2 className="text-lg font-semibold mb-4">Submit Assignments</h2>
//             <p className="text-gray-600">Upload your work</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StudentDashboard;
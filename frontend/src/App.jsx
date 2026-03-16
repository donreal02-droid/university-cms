import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ThemeWrapper from './components/ThemeWrapper';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Layout Components
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/PrivateRoute';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageSubjects from './pages/admin/ManageSubjects';
import Reports from './pages/admin/Reports';
import AdminProfile from './pages/admin/Profile';
import AdminSchedule from './pages/admin/AdminSchedule';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherSubjects from './pages/teacher/Subjects';
import TeacherAssignments from './pages/teacher/Assignments';
import TeacherSubmissions from './pages/teacher/Submissions';
import UploadNotes from './pages/teacher/UploadNotes';
import CreateQuiz from './pages/teacher/CreateQuiz';
import TeacherStudents from './pages/teacher/Students';
import TeacherSchedule from './pages/teacher/TeacherSchedule';
import TeacherProfile from './pages/teacher/Profile';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentSubjects from './pages/student/Subjects';
import StudentNotes from './pages/student/Notes';
import StudentAssignments from './pages/student/Assignments';
import StudentQuizzes from './pages/student/Quizzes';
import TakeQuiz from './pages/student/TakeQuiz';
import StudentSchedule from './pages/student/Schedule';
import StudentProfile from './pages/student/Profile';

// Common Pages
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// ✅ FIXED: Helper function to get dashboard path based on user role
const getDashboardPath = () => {
  try {
    // Safe way to get and parse user data
    const userStr = localStorage.getItem('user');
    
    // If no user data exists, redirect to login
    if (!userStr) {
      return '/login';
    }
    
    // Parse the user data
    const user = JSON.parse(userStr);
    const role = user?.role;
    
    // Return appropriate dashboard based on role
    switch(role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/login';
    }
  } catch (error) {
    // If any error occurs (like invalid JSON), redirect to login
    console.error('Error getting dashboard path:', error);
    return '/login';
  }
};

// Optional: Create a reusable safe parse function
const safeJsonParse = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error parsing ${key}:`, error);
    return null;
  }
};

// Alternative implementation using safeJsonParse
const getDashboardPathAlt = () => {
  const user = safeJsonParse('user');
  const role = user?.role;
  
  switch(role) {
    case 'admin': return '/admin/dashboard';
    case 'teacher': return '/teacher/dashboard';
    case 'student': return '/student/dashboard';
    default: return '/login';
  }
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            <ThemeWrapper>
              <Toaster position="top-right" />
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Root path redirect */}
                <Route 
                  path="/" 
                  element={<Navigate to={getDashboardPath()} replace />} 
                />
                
                {/* Protected Routes */}
                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                  {/* Admin Routes */}
                  <Route path="admin">
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<ManageUsers />} />
                    <Route path="departments" element={<ManageDepartments />} />
                    <Route path="subjects" element={<ManageSubjects />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="schedule" element={<AdminSchedule />} />
                  </Route>
                  
                  {/* Teacher Routes */}
                  <Route path="teacher">
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<TeacherDashboard />} />
                    <Route path="subjects" element={<TeacherSubjects />} />
                    <Route path="subjects/:id" element={<TeacherSubjects />} />
                    <Route path="assignments" element={<TeacherAssignments />} />
                    <Route path="assignments/:id" element={<TeacherAssignments />} />
                    <Route path="submissions" element={<TeacherSubmissions />} />
                    <Route path="submissions/:id" element={<TeacherSubmissions />} />
                    <Route path="quiz-submissions" element={<TeacherSubmissions />} />
                    <Route path="notes/upload" element={<UploadNotes />} />
                    <Route path="quizzes/create" element={<CreateQuiz />} />
                    <Route path="students" element={<TeacherStudents />} />
                    <Route path="students/:id" element={<TeacherStudents />} />
                    <Route path="/teacher/schedule" element={<TeacherSchedule />} />
                    <Route path="profile" element={<TeacherProfile />} />
                  </Route>
                  
                  {/* Student Routes */}
                  <Route path="student">
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="subjects" element={<StudentSubjects />} />
                    <Route path="subjects/:id" element={<StudentSubjects />} />
                    <Route path="notes" element={<StudentNotes />} />
                    <Route path="notes/:id" element={<StudentNotes />} />
                    <Route path="assignments" element={<StudentAssignments />} />
                    <Route path="assignments/:id" element={<StudentAssignments />} />
                    <Route path="quizzes" element={<StudentQuizzes />} />
                    <Route path="quiz/:id" element={<TakeQuiz />} />
                    <Route path="schedule" element={<StudentSchedule />} />
                    <Route path="profile" element={<StudentProfile />} />
                  </Route>
                  
                  {/* Common Routes */}
                  <Route path="settings" element={<Settings />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ThemeWrapper>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
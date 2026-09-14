import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Main App Pages
import Dashboard from './pages/dashboard/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeDetail from './pages/employees/EmployeeDetail';
import DepartmentList from './pages/departments/DepartmentList';
import ProjectList from './pages/projects/ProjectList';
import ProjectDetail from './pages/projects/ProjectDetail';
import TaskList from './pages/tasks/TaskList';
import KanbanBoard from './pages/kanban/KanbanBoard';
import CalendarView from './pages/calendar/CalendarView';
import ChatPage from './pages/chat/ChatPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import ActivityPage from './pages/activity/ActivityPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotificationsPage from './pages/notifications/NotificationsPage';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Loading SphereOps...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Guard (Redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Protected Application Workspace */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="departments" element={<DepartmentList />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="kanban" element={<KanbanBoard />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<ProfilePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

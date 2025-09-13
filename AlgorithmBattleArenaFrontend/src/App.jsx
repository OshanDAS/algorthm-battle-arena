import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import LobbyPage from "./pages/LobbyPage";
import MatchPage from "./pages/MatchPage";
import { AuthProvider, useAuth } from "./services/auth.jsx";

function PrivateRoute({ children, allowedRoles }) {
  const { token, user } = useAuth();
  
  if (!token) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function RoleBasedRedirect() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/" replace />;
  
  switch (user.role) {
    case 'Admin':
      return <Navigate to="/admin" replace />;
    case 'Teacher':
      return <Navigate to="/teacher" replace />;
    case 'Student':
      return <Navigate to="/lobby" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<RoleBasedRedirect />} />
        
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/teacher"
          element={
            <PrivateRoute allowedRoles={['Teacher']}>
              <TeacherDashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/lobby"
          element={
            <PrivateRoute allowedRoles={['Student', 'Admin']}>
              <LobbyPage />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/match"
          element={
            <PrivateRoute allowedRoles={['Student', 'Admin']}>
              <MatchPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

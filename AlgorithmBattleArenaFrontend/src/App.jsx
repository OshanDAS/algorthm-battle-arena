import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './services/auth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManageStudentsPage from './pages/ManageStudentsPage';
import LobbyPage from './pages/LobbyPage';
import LobbyInstancePage from './pages/LobbyInstancePage';
import MatchPage from './pages/MatchPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/manage-students" element={<ManageStudentsPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/lobby/:lobbyId" element={<LobbyInstancePage />} />
        <Route path="/match/:matchId" element={<MatchPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

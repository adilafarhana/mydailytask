import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import Welcome from './components.jsx/Welcome';
import Login from './components.jsx/Login';
import Register from './components.jsx/Register';
import DailyLogDashboard from './components.jsx/DailyLogDashboard';
import ProtectedRoute from './components.jsx/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Welcome Landing Page */}
          <Route path="/" element={<Welcome />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Daily Task Dashboard */}
          <Route
            path="/daily-logs"
            element={
              <ProtectedRoute>
                <DailyLogDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

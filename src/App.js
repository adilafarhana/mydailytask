import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import CareerLaunchpadDashboard from './components.jsx/CareerLaunchpadDashboard';
import Login from './components.jsx/Login';
import Register from './components.jsx/Register';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Primary Career Launchpad Standard Website */}
          <Route path="/" element={<CareerLaunchpadDashboard />} />
          <Route path="/daily-logs" element={<CareerLaunchpadDashboard />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

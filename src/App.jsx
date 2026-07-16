import React, { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import PanelDashboard from './components/PanelDashboard';
import PlcConnectionPanel from './components/PlcConnectionPanel';

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (user) => {
    setAuthenticatedUser(user);
    navigate('/');
  };

  const handleLogout = () => {
    setAuthenticatedUser(null);
    navigate('/login');
  };

  if (!authenticatedUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<PanelDashboard username={authenticatedUser?.username} userRole={authenticatedUser?.role} onLogout={handleLogout} />} />
      <Route path="/panel/:panelId" element={<PanelDashboard username={authenticatedUser?.username} userRole={authenticatedUser?.role} onLogout={handleLogout} />} />
      <Route path="/thresholds" element={<PanelDashboard username={authenticatedUser?.username} userRole={authenticatedUser?.role} onLogout={handleLogout} />} />
      <Route path="/plc" element={<PlcConnectionPanel />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

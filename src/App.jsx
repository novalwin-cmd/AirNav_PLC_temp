import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import PanelDashboard from './components/PanelDashboard';

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  if (authenticatedUser) {
    return <PanelDashboard username={authenticatedUser} onLogout={() => setAuthenticatedUser(null)} />;
  }

  return <LoginScreen onLogin={setAuthenticatedUser} />;
}

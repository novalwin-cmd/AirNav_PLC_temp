import React, { useState } from 'react';
import CommissioningWizard from './components/CommissioningWizard';
import PanelRoomMonitor from './components/PanelRoomMonitor';

export default function App() {
  const [monitorConfig, setMonitorConfig] = useState(null);

  if (monitorConfig) {
    return <PanelRoomMonitor rooms={monitorConfig.rooms} thresholds={monitorConfig.thresholds} />;
  }

  return <CommissioningWizard onComplete={setMonitorConfig} />;
}

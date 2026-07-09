import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'airnav_controls_v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function save(obj) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch (e) {}
}

export default function ControlsPanel({ panelId, mode = 'monitoring' }) {
  const [state, setState] = useState(() => load()[panelId] || { acb: 'closed', mccb: 'closed', light: 'off' });
  const isMonitoring = mode === 'monitoring';

  useEffect(() => {
    const all = load();
    all[panelId] = state;
    save(all);
  }, [panelId, state]);

  function Button({ active, onClick, children }) {
    return (
      <button
        onClick={onClick}
        disabled={isMonitoring}
        style={{
          padding: '10px 14px',
          borderRadius: 12,
          border: '1px solid var(--surface-border)',
          background: active ? 'var(--brand)' : 'var(--bg-strong)',
          color: active ? '#07111d' : 'var(--text)',
          cursor: isMonitoring ? 'not-allowed' : 'pointer',
          opacity: isMonitoring ? 0.6 : 1,
          minWidth: 78,
          transition: 'opacity 0.2s ease',
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {isMonitoring && (
        <div
          style={{
            background: 'rgba(245, 184, 76, 0.1)',
            border: '1px solid #F5B84C',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 12,
            color: '#F5B84C',
            marginBottom: 4,
          }}
        >
          📊 Monitoring mode — view only
        </div>
      )}
      <div>
        <div style={{ color: '#8C97A8', fontSize: 13, marginBottom: 6 }}>ACB</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button active={state.acb === 'open'} onClick={() => setState((s) => ({ ...s, acb: 'open' }))}>Open</Button>
          <Button active={state.acb === 'closed'} onClick={() => setState((s) => ({ ...s, acb: 'closed' }))}>Closed</Button>
        </div>
      </div>

      <div>
        <div style={{ color: '#8C97A8', fontSize: 13, marginBottom: 6 }}>MCCB</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button active={state.mccb === 'tripped'} onClick={() => setState((s) => ({ ...s, mccb: 'tripped' }))}>Trip</Button>
          <Button active={state.mccb === 'closed'} onClick={() => setState((s) => ({ ...s, mccb: 'closed' }))}>Close</Button>
        </div>
      </div>

      <div>
        <div style={{ color: '#8C97A8', fontSize: 13, marginBottom: 6 }}>Light</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button active={state.light === 'off'} onClick={() => setState((s) => ({ ...s, light: 'off' }))}>Off</Button>
          <Button active={state.light === 'on'} onClick={() => setState((s) => ({ ...s, light: 'on' }))}>On</Button>
        </div>
      </div>
    </div>
  );
}

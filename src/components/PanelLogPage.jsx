import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function PanelLogPage({ panelId, panel = null, logs = null, onBack }) {
  const [metric, setMetric] = useState('temp');
  const [localLogs, setLocalLogs] = useState([]);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem('airnav_panel_logs_v1');
        const parsed = raw ? JSON.parse(raw) : [];
        setLocalLogs(parsed);
      } catch (e) {
        setLocalLogs([]);
      }
    }
    load();
    const t = window.setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const source = logs || localLogs;
  const filtered = useMemo(() => source.filter((r) => r.panelId === panelId), [source, panelId]);

  const panelFallback = panel ? [panel] : [];
  const series = filtered.length > 0
    ? filtered.map((r) => ({ timestamp: r.timestamp, value: Number((r.metrics[metric]?.value ?? 0)) }))
    : panelFallback.map((p, index) => ({ timestamp: p.metrics[metric]?.history?.[index]?.label ?? `T${index + 1}`, value: p.metrics[metric]?.history?.[index]?.value ?? 0 }));

  const currentLabel = panel?.metrics?.[metric]?.value ?? (filtered[filtered.length - 1]?.metrics?.[metric]?.value ?? 'n/a');

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>Panel history</div>
          <h2 style={{ margin: 0 }}>{panel?.name || `Panel ${panelId}`}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={metric} onChange={(e) => setMetric(e.target.value)} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)' }}>
            <option value="voltage">Voltage</option>
            <option value="current">Current</option>
            <option value="frequency">Frequency</option>
            <option value="cosphi">Power factor</option>
            <option value="power">Power</option>
            <option value="temp">Temperature</option>
          </select>
          {onBack && (
            <button type="button" onClick={onBack} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--bg-strong)', color: 'var(--text)' }}>Back</button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12, background: 'var(--bg)', border: '1px solid var(--surface-border)', borderRadius: 16, padding: 18 }}>
        {series.length === 0 ? (
          <div style={{ color: '#8C97A8', padding: 24 }}>No saved log samples found yet. Use the main log terminal or wait for the next panel snapshot.</div>
        ) : (
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid stroke="#203041" vertical={false} />
                <XAxis dataKey="timestamp" tick={false} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2DD4BF" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Current snapshot</div>
        <div style={{ color: '#E7ECF3' }}>{metric}: {currentLabel}</div>
      </div>

      {filtered.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <strong>Recent entries ({filtered.length})</strong>
          <ul>
            {filtered.slice(-50).map((r) => (
              <li key={`${r.panelId}-${r.timestamp}`} style={{ wordBreak: 'break-word' }}>
                {new Date(r.timestamp).toLocaleString()}: {metric} = {r.metrics[metric]?.value ?? 'n/a'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

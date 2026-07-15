import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';

function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportPanelLogsCSV(filtered, panel) {
  const rows = [];
  const headers = ['Timestamp', 'Voltage', 'Current', 'Frequency', 'Power factor', 'Power', 'Temperature', 'Alarm', 'Alarm detail'];
  rows.push(headers.join(','));

  (filtered || []).forEach((r) => {
    const metrics = r.metrics || {};
    const alarmInfo = r.isAlarm ? (r.alarmInfo?.param || 'alarm') : '';
    const alarmDetail = r.isAlarm ? JSON.stringify(r.alarmInfo || {}) : '';
    const row = [
      new Date(r.timestamp).toISOString(),
      metrics.voltage?.value ?? '',
      metrics.current?.value ?? '',
      metrics.frequency?.value ?? '',
      metrics.cosphi?.value ?? '',
      metrics.power?.value ?? '',
      metrics.temp?.value ?? '',
      alarmInfo,
      `"${String(alarmDetail).replace(/"/g, '""')}`,
    ];
    rows.push(row.join(','));
  });

  const fileName = `${(panel?.name || 'panel')}_logs_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(fileName, rows.join('\n'));
}

function exportPanelLogsExcel(filtered, panel) {
  const data = (filtered || []).map((r) => ({
    Timestamp: new Date(r.timestamp).toISOString(),
    Voltage: r.metrics?.voltage?.value ?? '',
    Current: r.metrics?.current?.value ?? '',
    Frequency: r.metrics?.frequency?.value ?? '',
    'Power factor': r.metrics?.cosphi?.value ?? '',
    Power: r.metrics?.power?.value ?? '',
    Temperature: r.metrics?.temp?.value ?? '',
    Alarm: r.isAlarm ? (r.alarmInfo?.param || 'alarm') : '',
    'Alarm detail': r.isAlarm ? JSON.stringify(r.alarmInfo || {}) : '',
  }));

  if (data.length === 0) {
    alert('No log entries to export');
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Logs');
  const fileName = `${(panel?.name || 'panel')}_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function exportPanelLogsPDF(filtered, panel) {
  // Simple fallback: export CSV as a PDF-friendly format (for now)
  exportPanelLogsCSV(filtered, panel);
}

export default function PanelLogPage({ panelId, panel = null, logs = null, onBack }) {
  const [metric, setMetric] = useState('temp');
  const [localLogs, setLocalLogs] = useState([]);
  const [entryMode, setEntryMode] = useState('all');

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
    // Poll more frequently so immediate alarm snapshots appear quickly
    const t = window.setInterval(load, 1500);
    return () => clearInterval(t);
  }, []);

  const source = logs || localLogs;
  const filtered = useMemo(() => source.filter((r) => r.panelId === panelId), [source, panelId]);
  const visibleEntries = useMemo(() => {
    if (entryMode === 'alarms') return filtered.filter((r) => r.isAlarm === true);
    if (entryMode === 'normal') return filtered.filter((r) => r.isAlarm !== true);
    return filtered;
  }, [filtered, entryMode]);

  const panelFallback = panel ? [panel] : [];
  const series = filtered.length > 0
    ? filtered.map((r) => ({ timestamp: r.timestamp, value: Number((r.metrics[metric]?.value ?? 0)), isAlarm: !!r.isAlarm, alarmInfo: r.alarmInfo }))
    : panelFallback.map((p, index) => ({ timestamp: p.metrics[metric]?.history?.[index]?.label ?? `T${index + 1}`, value: p.metrics[metric]?.history?.[index]?.value ?? 0 }));

  const currentLabel = panel?.metrics?.[metric]?.value ?? (filtered[filtered.length - 1]?.metrics?.[metric]?.value ?? 'n/a');

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: '0 auto', maxHeight: 'calc(90vh - 80px)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>Panel history</div>
          <h2 style={{ margin: 0 }}>{panel?.name || `Panel ${panelId}`}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={metric} onChange={(e) => setMetric(e.target.value)} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)' }}>
            <option value="voltage">Voltage</option>
            <option value="current">Current</option>
            <option value="frequency">Frequency</option>
            <option value="cosphi">Power factor</option>
            <option value="power">Power</option>
            <option value="temp">Temperature</option>
          </select>
          <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
            {['all', 'alarms', 'normal'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setEntryMode(mode)}
                style={{
                  padding: '10px 14px',
                  border: 'none',
                  background: entryMode === mode ? 'var(--brand)' : 'var(--bg)',
                  color: entryMode === mode ? '#07111d' : 'var(--text)',
                  cursor: 'pointer',
                  fontWeight: entryMode === mode ? 700 : 500,
                }}
              >
                {mode === 'all' ? 'All' : mode === 'alarms' ? 'Alarms' : 'Normal'}
              </button>
            ))}
          </div>
          {onBack && (
            <button type="button" onClick={onBack} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--bg-strong)', color: 'var(--text)' }}>Back</button>
          )}
          {/* Export buttons for panel logs */}
          <button type="button" onClick={() => exportPanelLogsCSV(filtered, panel)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--brand)', color: '#07111d', fontWeight: 700 }}>Export CSV</button>
          <button type="button" onClick={() => exportPanelLogsExcel(filtered, panel)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--brand)', color: '#07111d', fontWeight: 700 }}>Export Excel</button>
          <button type="button" onClick={() => exportPanelLogsPDF(filtered, panel)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--bg-strong)', color: 'var(--text)' }}>Export PDF</button>
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
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload || {};
                          return (
                            <div style={{ background: '#07111d', color: '#E7ECF3', padding: 8, borderRadius: 6, fontSize: 12 }}>
                              <div style={{ fontWeight: 700 }}>{metric}</div>
                              <div>{Number(item.value).toFixed(2)}</div>
                              {item.isAlarm && item.alarmInfo && (
                                <div style={{ marginTop: 6, color: '#F0605C' }}>⚠ {item.alarmInfo.param}: {String(item.alarmInfo.value ?? '')} {item.alarmInfo.unit}</div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2DD4BF"
                      dot={(dotProps) => {
                        const p = dotProps && dotProps.payload;
                        if (p && p.isAlarm) {
                          return <circle cx={dotProps.cx} cy={dotProps.cy} r={4} fill="#F0605C" stroke="#fff" strokeWidth={0.6} />;
                        }
                        return null;
                      }}
                    />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Current snapshot</div>
        <div style={{ color: '#E7ECF3' }}>{metric}: {currentLabel}</div>
      </div>

      {visibleEntries.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <strong>Recent entries ({visibleEntries.length})</strong>
          <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 8, marginTop: 10 }}>
            <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'disc inside' }}>
              {visibleEntries.slice(-25).map((r) => (
                <li key={`${r.panelId}-${r.timestamp}`} style={{ wordBreak: 'break-word', marginBottom: 6 }}>
                  {new Date(r.timestamp).toLocaleString()}: {metric} = {r.metrics[metric]?.value ?? 'n/a'}{r.isAlarm ? ' ⚠' : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { isMetricAlarm } from '../services/panelTelemetry';
import PanelLogPage from './PanelLogPage';
import ControlsPanel from './ControlsPanel';

const METRIC_INFO = [
  { key: 'voltage', label: 'Voltage', unit: 'V' },
  { key: 'current', label: 'Current', unit: 'A' },
  { key: 'frequency', label: 'Frequency', unit: 'Hz' },
  { key: 'cosphi', label: 'Power factor', unit: '' },
  { key: 'power', label: 'Power', unit: 'kW' },
  { key: 'temp', label: 'Temperature', unit: '°C' },
];

function statusBadge(value, key) {
  const alarm = isMetricAlarm(key, value);
  return {
    text: alarm ? 'Alarm' : 'Normal',
    bg: alarm ? '#F0605C' : '#2DD4BF',
    color: alarm ? '#07111d' : '#07111d',
  };
}

export default function PanelPage({ panel, mode, onBack }) {
  const [metric, setMetric] = useState('temp');

  const series = useMemo(() => {
    const hist = panel.metrics[metric].history || [];
    return hist.map((h, i) => ({ timestamp: h.label || `T${i + 1}`, value: h.value }));
  }, [panel, metric]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>{panel.name}</h1>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>{panel.zone}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ background: 'var(--bg-strong)', border: '1px solid var(--surface-border)', borderRadius: 999, padding: '10px 14px', color: 'var(--text)' }}>{mode === 'control' ? 'Control mode' : 'Monitoring mode'}</span>
          <button type="button" onClick={onBack} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}>Back</button>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {METRIC_INFO.map((info) => {
            const value = panel.metrics[info.key]?.value;
            const alarm = isMetricAlarm(info.key, value);
            return (
              <div key={info.key} style={{ background: 'var(--bg)', border: `1px solid ${alarm ? 'var(--danger)' : 'var(--surface-border)'}`, borderRadius: 20, padding: 18 }}>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>{info.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <strong style={{ fontSize: 22, color: 'var(--text)' }}>{value}{info.unit}</strong>
                  <span style={{ background: alarm ? 'var(--danger)' : 'var(--brand)', color: '#07111d', padding: '8px 12px', borderRadius: 999, fontSize: 12 }}>{alarm ? 'Alarm' : 'Normal'}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 340px' }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--surface-border)', borderRadius: 18, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>Big trend graph</div>
                <strong style={{ fontSize: 18 }}>Historical {metric} trend</strong>
              </div>
              <select value={metric} onChange={(e) => setMetric(e.target.value)} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)' }}>
                {METRIC_INFO.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </div>
            <div style={{ minHeight: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid stroke="#203041" vertical={false} />
                  <XAxis dataKey="timestamp" tick={{ fill: '#8C97A8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#8C97A8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#10161F', border: '1px solid #212B3B', color: '#E7ECF3' }} />
                  <Line type="monotone" dataKey="value" stroke="#2DD4BF" strokeWidth={3} dot={{ fill: '#2DD4BF' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <aside style={{ display: 'grid', gap: 14 }}>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--surface-border)', borderRadius: 18, padding: 18 }}>
              <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>Panel condition</div>
              {METRIC_INFO.map((info) => {
                const value = panel.metrics[info.key]?.value;
                const alarm = isMetricAlarm(info.key, value);
                return (
                  <div key={info.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #212B3B' }}>
                    <span>{info.label}</span>
                    <span style={{ color: alarm ? '#F0605C' : '#2DD4BF' }}>{alarm ? 'Issue' : 'OK'}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ background: '#0A0E14', border: '1px solid #212B3B', borderRadius: 18, padding: 18 }}>
              <div style={{ color: '#8C97A8', fontSize: 13, marginBottom: 10 }}>Controls</div>
              <ControlsPanel panelId={panel.id} mode={mode} />
            </div>
          </aside>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <PanelLogPage panelId={panel.id} />
      </div>
    </div>
  );
}

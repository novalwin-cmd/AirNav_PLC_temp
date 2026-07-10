import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Gauge, Plus, Radio, Thermometer, X, Zap } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { applyTelemetryUpdate, buildInitialTelemetryFeed, isMetricAlarm, mergeTelemetryData, normalizePanels } from '../services/panelTelemetry';
import LogTerminal from './LogTerminal';
import PanelLogPage from './PanelLogPage';
import ThresholdEditor from './ThresholdEditor';
import ControlsPanel from './ControlsPanel';
import PanelPage from './PanelPage';

const METRIC_DEFS = [
  { key: 'voltage', label: 'Voltage', unit: 'V', icon: Zap, accent: '#2DD4BF' },
  { key: 'current', label: 'Current', unit: 'A', icon: Activity, accent: '#38BDF8' },
  { key: 'frequency', label: 'Frequency', unit: 'Hz', icon: Gauge, accent: '#F59E0B' },
  { key: 'cosphi', label: 'Power factor', unit: '', icon: Radio, accent: '#A78BFA' },
  { key: 'power', label: 'Power', unit: 'kW', icon: Zap, accent: '#F472B6' },
  { key: 'temp', label: 'Temperature', unit: '°C', icon: Thermometer, accent: '#34D399' },
];

const INITIAL_PANELS = normalizePanels(buildInitialTelemetryFeed());

function formatMetricValue(def, value) {
  if (def.key === 'cosphi') {
    return value.toFixed(2);
  }
  if (def.key === 'frequency') {
    return value.toFixed(1);
  }
  if (def.key === 'voltage' || def.key === 'current') {
    return value.toFixed(0);
  }
  return value.toFixed(1);
}

export default function PanelDashboard({ username, userRole = 'engineer', onLogout, telemetryFeed = null }) {
  const canControl = userRole === 'admin';
  const [mode, setMode] = useState('monitoring');
  const [panels, setPanels] = useState(INITIAL_PANELS);
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [draft, setDraft] = useState({
    name: '',
    zone: '',
    voltage: '220',
    current: '42',
    frequency: '50',
    cosphi: '0.95',
    power: '18.4',
    temp: '27',
  });
  const [selectedPanelForLogs, setSelectedPanelForLogs] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { panelId } = useParams();
  const selectedPanelPage = panelId || null;
  const isThresholdRoute = location.pathname === '/thresholds';

  useEffect(() => {
    if (!canControl) {
      setMode('monitoring');
    }
  }, [canControl]);

  useEffect(() => {
    if (telemetryFeed) {
      setPanels((currentPanels) => mergeTelemetryData(currentPanels, telemetryFeed));
      return;
    }

    const timer = window.setInterval(() => {
      setPanels((currentPanels) => normalizePanels(applyTelemetryUpdate(currentPanels)));
    }, 3000);

    return () => window.clearInterval(timer);
  }, [telemetryFeed]);

  const summary = useMemo(() => {
    const onlineCount = panels.filter((panel) => panel.metrics.temp.value < 35).length;
    return {
      total: panels.length,
      online: onlineCount,
      averageTemp: (panels.reduce((sum, panel) => sum + panel.metrics.temp.value, 0) / panels.length).toFixed(1),
    };
  }, [panels]);

  // render the threshold editor page separately when the route matches
  if (isThresholdRoute) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.header}>
            <div>
              <p style={styles.eyebrow}>AirNav control room</p>
              <h1 style={styles.title}>Thresholds</h1>
              <p style={styles.subtitle}>Edit alarm thresholds for metrics. Changes are stored locally.</p>
            </div>
            <div style={styles.headerActions}>
              <button type="button" onClick={() => navigate('/')} style={styles.secondaryButton}>Back</button>
            </div>
          </div>
          <ThresholdEditor />
        </div>
      </div>
    );
  }

  if (selectedPanelPage) {
    const panel = panels.find((p) => p.id === selectedPanelPage);
    if (!panel) {
      return (
        <div style={styles.page}>
          <div style={styles.shell}>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--surface-border)', borderRadius: 20, padding: 28 }}>
              <div style={{ marginBottom: 18 }}>
                <h1 style={{ margin: 0 }}>Panel not found</h1>
                <p style={{ color: 'var(--muted)' }}>The selected panel could not be loaded. Try returning to the overview.</p>
              </div>
              <button type="button" onClick={() => navigate('/')} style={styles.primaryButton}>Back to dashboard</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <PanelPage panel={panel} mode={canControl ? mode : 'monitoring'} onBack={() => navigate('/')} />
        </div>
      </div>
    );
  }

  const handleAddPanel = (event) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.zone.trim()) {
      return;
    }

    const newPanel = {
      id: `panel-${Date.now()}`,
      name: draft.name.trim(),
      zone: draft.zone.trim(),
      status: 'online',
      metrics: {
        voltage: { value: Number(draft.voltage) },
        current: { value: Number(draft.current) },
        frequency: { value: Number(draft.frequency) },
        cosphi: { value: Number(draft.cosphi) },
        power: { value: Number(draft.power) },
        temp: { value: Number(draft.temp) },
      },
    };

    setPanels((current) => normalizePanels([newPanel, ...current]));
    setDraft({
      name: '',
      zone: '',
      voltage: '220',
      current: '42',
      frequency: '50',
      cosphi: '0.95',
      power: '18.4',
      temp: '27',
    });
    setComposerOpen(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>AirNav</p>
            <h1 style={styles.title}>AirNav Monitoring and Control</h1>
            <p style={styles.subtitle}>
              Monitoring and control modes share the same live panel overview, and each panel can open a weekly trend view.
            </p>
          </div>
          <div style={styles.headerActions}>
            <div style={styles.userBadge}>Signed in as {username}</div>
            <button type="button" onClick={onLogout} style={styles.secondaryButton}>
              Log out
            </button>
          </div>
        </header>

        <div style={styles.toolbar}>
          <div style={styles.modeSwitcher}>
            {canControl ? ['monitoring', 'control'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                style={{
                  ...styles.modeButton,
                  ...(mode === item ? styles.modeButtonActive : {}),
                }}
              >
                {item === 'monitoring' ? 'Monitoring mode' : 'Control mode'}
              </button>
            )) : (
              <div style={{ ...styles.modeButton, ...styles.modeButtonActive, cursor: 'default' }}>
                Monitoring mode
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canControl ? (
              <>
                <button type="button" onClick={() => navigate('/thresholds')} style={styles.secondaryButton}>Thresholds</button>
                <button type="button" onClick={() => setComposerOpen(true)} style={styles.primaryButton}>
                  <Plus size={16} /> Add panel
                </button>
              </>
            ) : (
              <div style={{ background: 'rgba(245, 184, 76, 0.12)', border: '1px solid #F5B84C', borderRadius: 999, padding: '10px 14px', color: '#F5B84C', fontSize: 13 }}>
                Monitoring-only access
              </div>
            )}
          </div>
        </div>

        

        <div style={styles.summaryRow}>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Panels</span>
            <strong style={styles.summaryValue}>{summary.total}</strong>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Healthy rooms</span>
            <strong style={styles.summaryValue}>{summary.online}</strong>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Average temp</span>
            <strong style={styles.summaryValue}>{summary.averageTemp}°C</strong>
          </div>
        </div>

        {isComposerOpen && (
          <form onSubmit={handleAddPanel} style={styles.composerCard}>
            <div style={styles.composerHeader}>
              <h2 style={styles.cardTitle}>New panel</h2>
              <button type="button" onClick={() => setComposerOpen(false)} style={styles.iconButton}>
                <X size={16} />
              </button>
            </div>
            <div style={styles.formGrid}>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Panel name</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Panel Room 04"
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Zone</span>
                <input
                  value={draft.zone}
                  onChange={(event) => setDraft((current) => ({ ...current, zone: event.target.value }))}
                  placeholder="MDS - New Wing"
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Voltage (V)</span>
                <input
                  type="number"
                  value={draft.voltage}
                  onChange={(event) => setDraft((current) => ({ ...current, voltage: event.target.value }))}
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Current (A)</span>
                <input
                  type="number"
                  value={draft.current}
                  onChange={(event) => setDraft((current) => ({ ...current, current: event.target.value }))}
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Frequency (Hz)</span>
                <input
                  type="number"
                  value={draft.frequency}
                  onChange={(event) => setDraft((current) => ({ ...current, frequency: event.target.value }))}
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Power factor</span>
                <input
                  type="number"
                  value={draft.cosphi}
                  step="0.01"
                  onChange={(event) => setDraft((current) => ({ ...current, cosphi: event.target.value }))}
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Power (kW)</span>
                <input
                  type="number"
                  value={draft.power}
                  step="0.1"
                  onChange={(event) => setDraft((current) => ({ ...current, power: event.target.value }))}
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Temperature (°C)</span>
                <input
                  type="number"
                  value={draft.temp}
                  onChange={(event) => setDraft((current) => ({ ...current, temp: event.target.value }))}
                  style={styles.input}
                />
              </label>
            </div>
            <div style={styles.formActions}>
              <button type="submit" style={styles.primaryButton}>Create panel</button>
            </div>
          </form>
        )}

        <div style={styles.panelGrid}>
          {panels.map((panel) => (
            <article key={panel.id} style={styles.panelCard}>
              <div style={styles.panelHeader}>
                <div>
                  <h2 style={styles.panelTitle}>{panel.name}</h2>
                  <p style={styles.panelZone}>{panel.zone}</p>
                </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={styles.statusTag}>{mode === 'control' ? 'Control ready' : 'Monitoring live'}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={() => setSelectedPanelForLogs(panel.id)} style={styles.secondaryButton}>Logs</button>
                      <button type="button" onClick={() => navigate(`/panel/${panel.id}`)} style={styles.primaryButton}>Open</button>
                    </div>
                  </div>
              </div>

              <div style={styles.metricGrid}>
                {METRIC_DEFS.map((def) => {
                  const metric = panel.metrics[def.key];
                  const isAlarm = isMetricAlarm(def.key, metric.value);
                  const Icon = def.icon;
                  return (
                    <button
                      key={def.key}
                      type="button"
                      onClick={() => setSelectedMetric({ panel, def, metric })}
                      style={{ ...styles.metricCard, borderColor: isAlarm ? '#F0605C' : '#212B3B' }}
                    >
                      <div style={styles.metricHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ ...styles.iconBubble, background: `${def.accent}22`, color: def.accent }}>
                            <Icon size={16} />
                          </span>
                          <span style={styles.metricLabel}>{def.label}</span>
                        </div>
                        <strong style={styles.metricValue}>
                          {formatMetricValue(def, metric.value)}{def.unit}
                        </strong>
                      </div>
                      <div style={styles.sparkline}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={metric.history}>
                            <CartesianGrid stroke="#203041" vertical={false} />
                            <XAxis dataKey="label" tick={false} axisLine={false} />
                            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke={def.accent} strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        {/* Logs shown after the panels */}
        <div style={{ marginTop: 18 }}>
          <LogTerminal panels={panels} />
        </div>

        {selectedPanelForLogs && (() => {
          const panel = panels.find((p) => p.id === selectedPanelForLogs);
          if (!panel) return null;
          return (
            <div style={styles.modalOverlay}>
              <div style={{ ...styles.modalCard, width: 'min(100%, 980px)', padding: 0 }}>
                <PanelLogPage panelId={selectedPanelForLogs} panel={panel} onBack={() => setSelectedPanelForLogs(null)} />
              </div>
            </div>
          );
        })()}

      </div>

      {selectedMetric && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.eyebrow}>{selectedMetric.panel.name}</p>
                <h3 style={styles.cardTitle}>{selectedMetric.def.label} weekly trend</h3>
              </div>
              <button type="button" onClick={() => setSelectedMetric(null)} style={styles.iconButton}>
                <X size={18} />
              </button>
            </div>
            <div style={styles.chartWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedMetric.metric.history}>
                  <CartesianGrid stroke="#203041" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={selectedMetric.def.accent} strokeWidth={3} dot={{ fill: selectedMetric.def.accent }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p style={styles.modalHint}>This weekly view is available for every metric card in both monitoring and control modes.</p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #07111d 0%, #0e1724 100%)',
    color: '#e7ecf3',
    padding: 24,
  },
  shell: {
    maxWidth: 1260,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  eyebrow: {
    margin: 0,
    color: '#5A6576',
    letterSpacing: '0.32em',
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: 700,
  },
  title: {
    margin: '6px 0 8px',
    fontSize: 30,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    color: '#8C97A8',
    maxWidth: 720,
    lineHeight: 1.6,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  userBadge: {
    background: 'var(--bg-strong)',
    border: '1px solid var(--surface-border)',
    borderRadius: 999,
    padding: '10px 14px',
    color: 'var(--text)',
  },
  secondaryButton: {
    border: '1px solid var(--surface-border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    padding: '10px 14px',
    borderRadius: 999,
    cursor: 'pointer',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  modeSwitcher: {
    display: 'flex',
    gap: 8,
    background: 'var(--bg-strong)',
    padding: 8,
    borderRadius: 999,
    border: '1px solid var(--surface-border)',
  },
  modeButton: {
    border: 0,
    background: 'transparent',
    color: 'var(--muted)',
    padding: '10px 16px',
    borderRadius: 999,
    cursor: 'pointer',
    textTransform: 'capitalize',
  },
  modeButtonActive: {
    background: '#2DD4BF',
    color: '#07111d',
    fontWeight: 700,
  },
  primaryButton: {
    border: 0,
    background: '#2DD4BF',
    color: '#07111d',
    padding: '10px 14px',
    borderRadius: 999,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontWeight: 700,
  },
  summaryRow: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  summaryCard: {
    background: 'var(--bg-strong)',
    border: '1px solid var(--surface-border)',
    borderRadius: 20,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  summaryLabel: {
    color: 'var(--muted)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
  },
  summaryValue: {
    fontSize: 24,
    color: 'var(--text)',
  },
  composerCard: {
    background: 'var(--bg)',
    border: '1px solid var(--surface-border)',
    borderRadius: 20,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  composerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
    color: '#E7ECF3',
  },
  iconButton: {
    border: '1px solid #212B3B',
    background: 'transparent',
    color: '#E7ECF3',
    width: 34,
    height: 34,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  formGrid: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  fieldLabel: {
    color: '#8C97A8',
    fontSize: 13,
  },
  input: {
    border: '1px solid #212B3B',
    background: '#0A0E14',
    color: '#E7ECF3',
    borderRadius: 10,
    padding: '10px 12px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  panelGrid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  },
  panelCard: {
    background: 'var(--bg)',
    border: '1px solid var(--surface-border)',
    borderRadius: 24,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  panelTitle: {
    margin: 0,
    fontSize: 18,
    color: '#E7ECF3',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  panelZone: {
    margin: '4px 0 0',
    color: '#8C97A8',
    fontSize: 13,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  statusTag: {
    fontSize: 12,
    padding: '8px 12px',
    borderRadius: 999,
    background: 'var(--bg-strong)',
    color: 'var(--brand)',
    whiteSpace: 'nowrap',
  },
  metricGrid: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  metricCard: {
    border: '1px solid var(--surface-border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    padding: 16,
    borderRadius: 20,
    cursor: 'pointer',
    textAlign: 'left',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricLabel: {
    color: '#8C97A8',
    fontSize: 12,
  },
  metricValue: {
    color: '#E7ECF3',
    fontSize: 14,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkline: {
    height: 54,
    width: '100%',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(3, 8, 16, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 20,
  },
  modalCard: {
    background: '#10161F',
    border: '1px solid #212B3B',
    borderRadius: 20,
    width: '100%',
    maxWidth: 700,
    padding: 20,
    boxShadow: '0 16px 50px rgba(0, 0, 0, 0.35)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  chartWrap: {
    height: 280,
  },
  modalHint: {
    margin: '10px 0 0',
    color: '#8C97A8',
    fontSize: 13,
  },
};

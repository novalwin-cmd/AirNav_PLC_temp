import React, { useState, useMemo } from 'react';
import { Download, X, AlertTriangle, AlertCircle } from 'lucide-react';
import { getAlarmsByPanel, acknowledgeAlarm, formatAlarmTime, clearAlarmsByPanel } from '../services/alarmLogger';
import { downloadAlarmsAsCSV, exportAlarmsToExcel, downloadAlarmsAsPDF } from '../services/alarmExport';

const COLORS = {
  bg: '#0A0E14',
  surface1: '#10161F',
  surface2: '#161E2B',
  line: '#212B3B',
  textHi: '#E7ECF3',
  textMid: '#8C97A8',
  textLow: '#5A6576',
  accent: '#2DD4BF',
  warn: '#F5B84C',
  crit: '#F0605C',
};

export default function AlarmViewer({ panelId, panelName, onClose }) {
  const [filterSeverity, setFilterSeverity] = useState('all'); // all, warn, crit
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, acknowledged
  const [expandedAlarmId, setExpandedAlarmId] = useState(null);

  const alarms = useMemo(() => {
    let filtered = getAlarmsByPanel(panelId) || [];

    if (filterSeverity !== 'all') {
      filtered = filtered.filter((a) => a.level === filterSeverity);
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        filtered = filtered.filter((a) => !a.acknowledged);
      } else if (filterStatus === 'acknowledged') {
        filtered = filtered.filter((a) => a.acknowledged);
      }
    }

    // Sort by timestamp descending (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [panelId, filterSeverity, filterStatus]);

  const summary = useMemo(() => {
    const allAlarms = getAlarmsByPanel(panelId) || [];
    return {
      total: allAlarms.length,
      critical: allAlarms.filter((a) => a.level === 'crit').length,
      warning: allAlarms.filter((a) => a.level === 'warn').length,
      active: allAlarms.filter((a) => !a.acknowledged).length,
      acknowledged: allAlarms.filter((a) => a.acknowledged).length,
    };
  }, [panelId]);

  const handleAcknowledge = (alarmId) => {
    acknowledgeAlarm(panelId, alarmId);
    setExpandedAlarmId(null);
  };

  const handleExport = (format) => {
    switch (format) {
      case 'csv':
        downloadAlarmsAsCSV(panelName, alarms);
        break;
      case 'excel':
        exportAlarmsToExcel(panelName, alarms);
        break;
      case 'pdf':
        downloadAlarmsAsPDF(panelName, alarms);
        break;
      default:
        break;
    }
  };

  const handleClearAlarms = () => {
    if (window.confirm('Clear all alarms for this panel? This action cannot be undone.')) {
      clearAlarmsByPanel(panelId);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 8, 16, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 25,
      }}
    >
      <div
        style={{
          background: COLORS.surface1,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 16,
          width: '100%',
          maxWidth: 900,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 50px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${COLORS.line}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, color: COLORS.textHi }}>
              Alarm Log — {panelName}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: COLORS.textLow }}>
              {alarms.length} alarm{alarms.length !== 1 ? 's' : ''} displayed
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={24} color={COLORS.textMid} />
          </button>
        </div>

        {/* Summary Stats */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${COLORS.line}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.textHi }}>
              {summary.total}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textLow, textTransform: 'uppercase' }}>
              Total Alarms
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.crit }}>
              {summary.critical}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textLow, textTransform: 'uppercase' }}>
              Critical
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.warn }}>
              {summary.warning}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textLow, textTransform: 'uppercase' }}>
              Warnings
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.accent }}>
              {summary.active}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textLow, textTransform: 'uppercase' }}>
              Active
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${COLORS.line}`,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {/* Severity Filter */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: COLORS.textLow }}>Severity:</span>
            {['all', 'warn', 'crit'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: `1px solid ${filterSeverity === sev ? COLORS.accent : COLORS.line}`,
                  background: filterSeverity === sev ? COLORS.accent + '20' : 'transparent',
                  color: filterSeverity === sev ? COLORS.accent : COLORS.textMid,
                  cursor: 'pointer',
                  fontSize: 11,
                  textTransform: 'capitalize',
                }}
              >
                {sev === 'all' ? 'All' : sev === 'crit' ? 'Critical' : 'Warning'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: COLORS.textLow }}>Status:</span>
            {['all', 'active', 'acknowledged'].map((stat) => (
              <button
                key={stat}
                onClick={() => setFilterStatus(stat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: `1px solid ${filterStatus === stat ? COLORS.accent : COLORS.line}`,
                  background: filterStatus === stat ? COLORS.accent + '20' : 'transparent',
                  color: filterStatus === stat ? COLORS.accent : COLORS.textMid,
                  cursor: 'pointer',
                  fontSize: 11,
                  textTransform: 'capitalize',
                }}
              >
                {stat === 'all' ? 'All' : stat}
              </button>
            ))}
          </div>

          {/* Export & Clear */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => handleExport('csv')}
                title="Export as CSV"
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: `1px solid ${COLORS.accent}`,
                  background: 'transparent',
                  color: COLORS.accent,
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Download size={12} /> CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                title="Export as Excel"
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: `1px solid ${COLORS.accent}`,
                  background: 'transparent',
                  color: COLORS.accent,
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Download size={12} /> Excel
              </button>
            </div>
            <button
              onClick={handleClearAlarms}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: `1px solid ${COLORS.line}`,
                background: 'transparent',
                color: COLORS.textLow,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Alarm List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 24px',
          }}
        >
          {alarms.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 8,
                color: COLORS.textLow,
              }}
            >
              <AlertCircle size={32} />
              <p>No alarms matching filters</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  onClick={() => setExpandedAlarmId(expandedAlarmId === alarm.id ? null : alarm.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: `1px solid ${alarm.level === 'crit' ? COLORS.crit : COLORS.warn}`,
                    background:
                      alarm.level === 'crit'
                        ? COLORS.crit + '10'
                        : alarm.level === 'warn'
                          ? COLORS.warn + '10'
                          : COLORS.surface2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {alarm.level === 'crit' ? (
                      <AlertTriangle
                        size={18}
                        color={COLORS.crit}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                    ) : (
                      <AlertTriangle
                        size={18}
                        color={COLORS.warn}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: COLORS.textLow }}>
                          {formatAlarmTime(alarm.timestamp)}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background:
                              alarm.level === 'crit'
                                ? COLORS.crit + '30'
                                : COLORS.warn + '30',
                            color:
                              alarm.level === 'crit' ? COLORS.crit : COLORS.warn,
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          {alarm.level === 'crit' ? 'CRITICAL' : 'WARNING'}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: alarm.acknowledged ? COLORS.accent + '20' : 'transparent',
                            color: alarm.acknowledged ? COLORS.accent : COLORS.textLow,
                            textTransform: 'uppercase',
                          }}
                        >
                          {alarm.acknowledged ? 'ACK' : 'ACTIVE'}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: COLORS.textHi,
                          marginBottom: 4,
                        }}
                      >
                        <strong>{alarm.param}</strong>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: COLORS.textMid,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: 8,
                        }}
                      >
                        <span>
                          Current: <strong>{alarm.value.toFixed(2)}</strong> {alarm.unit}
                        </span>
                        <span>
                          Range: <strong>{alarm.low} – {alarm.high}</strong>
                        </span>
                      </div>

                      {expandedAlarmId === alarm.id && (
                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: `1px solid ${COLORS.line}`,
                            display: 'flex',
                            gap: 8,
                          }}
                        >
                          {!alarm.acknowledged && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcknowledge(alarm.id);
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: `1px solid ${COLORS.accent}`,
                                background: COLORS.accent,
                                color: COLORS.bg,
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              Acknowledge
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const csv = `Timestamp,Parameter,Value,Unit,Low Threshold,High Threshold,Severity\n${alarm.timestamp},${alarm.param},${alarm.value},${alarm.unit},${alarm.low},${alarm.high},${alarm.level === 'crit' ? 'CRITICAL' : 'WARNING'}`;
                              const blob = new Blob([csv], { type: 'text/csv' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `alarm_${alarm.id}.csv`;
                              link.click();
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: `1px solid ${COLORS.line}`,
                              background: 'transparent',
                              color: COLORS.textMid,
                              cursor: 'pointer',
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Download size={11} /> Export
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

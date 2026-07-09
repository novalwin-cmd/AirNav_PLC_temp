import React, { useEffect, useState, useRef } from 'react';
import { Save, FileText, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const STORAGE_KEY = 'airnav_panel_logs_v1';
const EXPORT_OPTIONS = ['csv', 'excel-csv', 'excel-xlsx', 'pdf', 'json'];

function timestampNow() {
  return new Date().toISOString();
}

function saveLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    // ignore
  }
}

function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function buildCSV(rows) {
  const header = ['timestamp', 'panelId', 'panelName', 'zone', 'metric', 'value', 'unit'];
  const lines = [header.join(',')];
  rows.forEach((r) => {
    lines.push([
      r.timestamp,
      r.panelId,
      r.panelName,
      r.zone,
      r.metric,
      r.value,
      r.unit || '',
    ].map((c) => String(c).replace(/\r?\n/g, ' ')).join(','));
  });
  return lines.join('\n');
}

export default function LogTerminal({ panels = [], onBack }) {
  const [logs, setLogs] = useState(() => loadLogs());
  const [exportFormat, setExportFormat] = useState('csv');
  const timerRef = useRef(null);
  const panelsRef = useRef(panels);

  useEffect(() => {
    panelsRef.current = panels;
  }, [panels]);

  useEffect(() => {
    function snapshot() {
      const ts = timestampNow();
      const entry = panelsRef.current.map((p) => ({
        timestamp: ts,
        panelId: p.id,
        panelName: p.name,
        zone: p.zone,
        metrics: p.metrics,
      }));
      setLogs((current) => {
        const next = [...current, ...entry];
        saveLogs(next);
        return next;
      });
    }

    timerRef.current = window.setInterval(snapshot, 15000);
    return () => window.clearInterval(timerRef.current);
  }, []);

  function handleExport() {
    if (!logs.length) return;
    // Flatten rows per metric
    const rows = [];
    logs.forEach((r) => {
      const metrics = r.metrics || r.metrics;
      Object.keys(r.metrics || {}).forEach((mkey) => {
        const m = r.metrics[mkey];
        rows.push({
          timestamp: r.timestamp,
          panelId: r.panelId,
          panelName: r.panelName,
          zone: r.zone,
          metric: mkey,
          value: m.value,
          unit: m.unit || '',
        });
      });
    });

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'airnav_logs.json';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (exportFormat === 'pdf') {
      // simple print-to-pdf approach: open printable view
      const w = window.open('', '_blank');
      const html = [`<h1>AirNav Monitoring and Control System</h1>`, `<p>Exported: ${new Date().toLocaleString()}</p>`];
      html.push('<table border="1" cellpadding="6" style="border-collapse:collapse; width:100%">');
      html.push('<tr><th>Timestamp</th><th>Panel</th><th>Zone</th><th>Metric</th><th>Value</th><th>Unit</th></tr>');
      rows.forEach((r) => {
        html.push(`<tr><td>${r.timestamp}</td><td>${r.panelName}</td><td>${r.zone}</td><td>${r.metric}</td><td>${r.value}</td><td>${r.unit}</td></tr>`);
      });
      html.push('</table>');
      w.document.write(html.join('\n'));
      w.document.close();
      w.focus();
      w.print();
      w.close();
      return;
    }

    if (exportFormat === 'excel-xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');
      XLSX.writeFile(workbook, 'airnav_logs.xlsx');
      return;
    }

    // csv / excel-csv
    const csv = buildCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFormat === 'excel-csv' ? 'airnav_logs.xls' : 'airnav_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // aggregate for overview charts: build timeseries of avg temp as example
  const seriesByMetric = {};
  // group logs by timestamp
  const grouped = {};
  logs.forEach((r) => {
    const ts = r.timestamp;
    if (!grouped[ts]) grouped[ts] = [];
    grouped[ts].push(r);
  });
  const series = Object.keys(grouped).map((ts) => {
    const items = grouped[ts];
    const obj = { timestamp: ts };
    items.forEach((it) => {
      Object.keys(it.metrics).forEach((k) => {
        if (!obj[k]) obj[k] = 0;
        obj[k] += Number(it.metrics[k].value || 0);
      });
    });
    // average
    Object.keys(obj).forEach((k) => {
      if (k === 'timestamp') return;
      obj[k] = Number((obj[k] / items.length).toFixed(2));
    });
    return obj;
  }).slice(-200);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>AirNav Monitoring and Control System</h1>
          <div style={{ color: 'var(--muted)' }}>Logs terminal — snapshots every 15 seconds</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)' }}>
            {EXPORT_OPTIONS.map((o) => (
              <option key={o} value={o}>{o.toUpperCase()}</option>
            ))}
          </select>
          <button type="button" onClick={handleExport} style={{ padding: '10px 14px', background: 'var(--brand)', border: 'none', borderRadius: 12, cursor: 'pointer', color: '#07111d' }}>
            <Save size={14} /> Export
          </button>
          {onBack && (
            <button type="button" onClick={onBack} style={{ padding: '10px 14px', background: 'var(--bg-strong)', border: '1px solid var(--surface-border)', borderRadius: 12, cursor: 'pointer' }}>
              <ArrowRight size={14} /> Back
            </button>
          )}
        </div>
      </header>

      <section style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--surface-border)', padding: 16, borderRadius: 18 }}>
          <strong>Stored entries</strong>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>{logs.length} rows (one per panel per snapshot)</div>
        </div>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 320px' }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--surface-border)', padding: 16, borderRadius: 18 }}>
            <strong>Overview — averaged metrics</strong>
            <div style={{ height: 220, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid stroke="#203041" vertical={false} />
                  <XAxis dataKey="timestamp" tick={false} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="temp" stroke="#34D399" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <aside style={{ background: 'var(--bg)', border: '1px solid var(--surface-border)', padding: 16, borderRadius: 18 }}>
            <strong>Quick actions</strong>
            <div style={{ marginTop: 10, display: 'flex', gap: 10, flexDirection: 'column' }}>
              <button type="button" onClick={() => { saveLogs([]); setLogs([]); }} style={{ padding: '12px 14px', background: 'var(--danger)', color: '#07111d', border: 'none', borderRadius: 14, cursor: 'pointer' }}>
                Clear logs
              </button>
              <button type="button" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(logs.slice(-100))); }} style={{ padding: '12px 14px', background: 'var(--bg-strong)', border: '1px solid var(--surface-border)', borderRadius: 14, cursor: 'pointer' }}>
                Copy recent (JSON)
              </button>
            </div>
          </aside>
        </div>

        <div style={{ background: 'var(--bg)', border: '1px solid var(--surface-border)', padding: 16, borderRadius: 18 }}>
          <strong>Recent entries</strong>
          <div style={{ marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8C97A8' }}>
                  <th style={{ padding: 8 }}>Timestamp</th>
                  <th style={{ padding: 8 }}>Panel</th>
                  <th style={{ padding: 8 }}>Metric</th>
                  <th style={{ padding: 8 }}>Value</th>
                </tr>
              </thead>
                  <tbody>
                    {logs.slice(-30).map((r, idx) => (
                      // r here is per-panel entry
                      <tr key={`${r.panelId}-${r.timestamp}-${idx}`} style={{ borderTop: '1px solid #212B3B' }}>
                        <td style={{ padding: 8, color: '#8C97A8', whiteSpace: 'normal', wordBreak: 'break-word' }}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                        <td style={{ padding: 8, whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.panelName}</td>
                        <td style={{ padding: 8, whiteSpace: 'normal', wordBreak: 'break-word' }} colSpan={2}>
                          {Object.keys(r.metrics).map((k) => (
                            <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
                              <div style={{ minWidth: 120, color: '#8C97A8', wordBreak: 'break-word' }}>{k}</div>
                              <div style={{ wordBreak: 'break-word' }}>{r.metrics[k].value}{r.metrics[k].unit || ''}</div>
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'airnav_thresholds_v1';

const DEFAULTS = {
  voltage: { base: 220, low: 198, high: 242 },
  current: { base: 42, low: 0, high: 63 },
  frequency: { base: 50, low: 49.5, high: 50.5 },
  cosphi: { base: 0.94, low: 0.85, high: 1.0 },
  power: { base: 18.4, low: 0, high: 35 },
  temp: { base: 27, low: 15, high: 35 },
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULTS;
  } catch (e) {
    return DEFAULTS;
  }
}

function save(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {}
}

export default function ThresholdEditor() {
  const [values, setValues] = useState(load());
  useEffect(() => { setValues(load()); }, []);

  function update(key, field, val) {
    setValues((v) => ({ ...v, [key]: { ...v[key], [field]: Number(val) } }));
  }

  function handleSave() {
    save(values);
    window.location.reload();
  }

  return (
    <div style={{ marginTop: 18, background: 'var(--bg)', border: '1px solid var(--surface-border)', borderRadius: 18, padding: 20, color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <strong style={{ fontSize: 16 }}>Threshold editor</strong>
          <div style={{ color: '#8C97A8', fontSize: 13 }}>Define low/high trigger values for alarms.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => { setValues(load()); }} style={{ padding: '10px 14px', background: 'var(--bg-strong)', border: '1px solid var(--surface-border)', borderRadius: 12 }}>Reset</button>
          <button type="button" onClick={handleSave} style={{ padding: '10px 14px', background: 'var(--brand)', border: 'none', borderRadius: 12, color: '#07111d' }}>Save</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 18 }}>
        {Object.keys(values).map((k) => (
          <div key={k} style={{ background: 'var(--bg-strong)', padding: 16, borderRadius: 20 }}>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10, textTransform: 'capitalize' }}>{k}</div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 56, color: 'var(--muted)' }}>Base</span>
              <input type="number" value={values[k].base} onChange={(e) => update(k, 'base', e.target.value)} style={{ flex: 1, padding: 12, borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
              <span style={{ width: 56, color: 'var(--muted)' }}>Low</span>
              <input type="number" value={values[k].low} onChange={(e) => update(k, 'low', e.target.value)} style={{ flex: 1, padding: 12, borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
              <span style={{ width: 56, color: 'var(--muted)' }}>High</span>
              <input type="number" value={values[k].high} onChange={(e) => update(k, 'high', e.target.value)} style={{ flex: 1, padding: 12, borderRadius: 14, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

import { recordAlarm } from './alarmLogger';
import { triggerAlarmNotification } from './audioNotification';

// Lightweight helper to force an alarm and write an immediate panel log entry.
// Intended for local development/testing only.
function attachForceAlarm() {
  try {
    window.forceAlarm = (panelId, key, value) => {
      try {
        const defMap = {
          voltage: { label: 'Voltage', unit: 'V' },
          current: { label: 'Current', unit: 'A' },
          frequency: { label: 'Frequency', unit: 'Hz' },
          cosphi: { label: 'Power factor', unit: '' },
          power: { label: 'Power', unit: 'kW' },
          temp: { label: 'Temperature', unit: '°C' },
        };
        const def = defMap[key] || { label: key, unit: '' };
        const low = null;
        const high = null;
        const level = 'crit';
        const detail = `${def.label} alarm: ${value}${def.unit}`;

        // record alarm in alarm history
        recordAlarm(panelId, panelId, def.label, value, def.unit, low, high, level, detail);

        // write immediate panel log entry
        try {
          const keyStorage = 'airnav_panel_logs_v1';
          const raw = window.localStorage.getItem(keyStorage) || '[]';
          const existing = JSON.parse(raw);
          const metricsSnapshot = { voltage: { value: null }, current: { value: null }, frequency: { value: null }, cosphi: { value: null }, power: { value: null }, temp: { value: null } };
          if (metricsSnapshot[key]) metricsSnapshot[key].value = value;
          const logEntry = {
            panelId,
            timestamp: new Date().toISOString(),
            metrics: metricsSnapshot,
            isAlarm: true,
            alarmInfo: { param: def.label, value, unit: def.unit, low, high, level, detail },
          };
          existing.push(logEntry);
          if (existing.length > 5000) existing.splice(0, existing.length - 5000);
          window.localStorage.setItem(keyStorage, JSON.stringify(existing));
        } catch (e) {
          // ignore
        }

        // try to play buzzer
        try { triggerAlarmNotification(level); } catch (e) {}
      } catch (e) {}
    };
  } catch (e) {}
}

attachForceAlarm();

export default {};

/**
 * Alarm Logger Service
 * Manages recording, storing, and retrieving alarm events
 * Separate from real-time telemetry data
 */

const ALARM_STORAGE_KEY = 'airnav_alarm_history_v1';
const MAX_ALARMS_PER_PANEL = 1000; // Prevent unbounded growth

export function initializeAlarmLog() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const existing = window.localStorage.getItem(ALARM_STORAGE_KEY);
      if (!existing) {
        window.localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify({}));
      }
    }
  } catch (e) {
    console.warn('Could not initialize alarm log:', e);
  }
}

/**
 * Record a new alarm event
 * @param {string} panelId - Panel room ID
 * @param {string} panelName - Panel room name
 * @param {string} param - Parameter name (voltage, current, etc.)
 * @param {number} value - Current value
 * @param {string} unit - Unit of measurement
 * @param {number} low - Low threshold
 * @param {number} high - High threshold
 * @param {'warn'|'crit'} level - Alarm severity
 * @param {string} [detail] - Optional human-readable detail (e.g. 'overvoltage')
 */
export function recordAlarm(panelId, panelName, param, value, unit, low, high, level, detail) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const raw = window.localStorage.getItem(ALARM_STORAGE_KEY) || '{}';
    const alarmLog = JSON.parse(raw);

    if (!alarmLog[panelId]) {
      alarmLog[panelId] = {
        panelName,
        alarms: [],
      };
    }

    const alarm = {
      id: `alarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      param,
      value,
      unit,
      low,
      high,
      level,
      detail: detail || '',
      acknowledged: false,
    };

    alarmLog[panelId].alarms.push(alarm);

    // Trim old alarms if exceeding limit
    if (alarmLog[panelId].alarms.length > MAX_ALARMS_PER_PANEL) {
      alarmLog[panelId].alarms = alarmLog[panelId].alarms.slice(-MAX_ALARMS_PER_PANEL);
    }

    window.localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarmLog));
  } catch (e) {
    console.warn('Could not record alarm:', e);
  }
}

/**
 * Get all alarms for a specific panel
 * @param {string} panelId - Panel room ID
 * @returns {Array} Array of alarm events
 */
export function getAlarmsByPanel(panelId) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const raw = window.localStorage.getItem(ALARM_STORAGE_KEY) || '{}';
    const alarmLog = JSON.parse(raw);

    return alarmLog[panelId]?.alarms || [];
  } catch (e) {
    console.warn('Could not retrieve alarms:', e);
    return [];
  }
}

/**
 * Get alarms for a specific panel within a time range
 * @param {string} panelId - Panel room ID
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {Array} Filtered alarm events
 */
export function getAlarmsByPanelAndTime(panelId, startTime, endTime) {
  const alarms = getAlarmsByPanel(panelId);
  return alarms.filter((a) => {
    const alarmTime = new Date(a.timestamp);
    return alarmTime >= startTime && alarmTime <= endTime;
  });
}

/**
 * Get all alarms across all panels
 * @returns {Object} Object with panelId as keys, alarms array as values
 */
export function getAllAlarms() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {};
    }

    const raw = window.localStorage.getItem(ALARM_STORAGE_KEY) || '{}';
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not retrieve all alarms:', e);
    return {};
  }
}

/**
 * Clear alarms for a specific panel
 * @param {string} panelId - Panel room ID
 */
export function clearAlarmsByPanel(panelId) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const raw = window.localStorage.getItem(ALARM_STORAGE_KEY) || '{}';
    const alarmLog = JSON.parse(raw);

    if (alarmLog[panelId]) {
      alarmLog[panelId].alarms = [];
    }

    window.localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarmLog));
  } catch (e) {
    console.warn('Could not clear alarms:', e);
  }
}

/**
 * Acknowledge an alarm
 * @param {string} panelId - Panel room ID
 * @param {string} alarmId - Alarm ID
 */
export function acknowledgeAlarm(panelId, alarmId) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const raw = window.localStorage.getItem(ALARM_STORAGE_KEY) || '{}';
    const alarmLog = JSON.parse(raw);

    if (alarmLog[panelId]) {
      const alarm = alarmLog[panelId].alarms.find((a) => a.id === alarmId);
      if (alarm) {
        alarm.acknowledged = true;
      }
    }

    window.localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarmLog));
  } catch (e) {
    console.warn('Could not acknowledge alarm:', e);
  }
}

/**
 * Format alarm timestamp for display
 * @param {string} isoTimestamp - ISO timestamp string
 * @returns {string} Formatted time string
 */
export function formatAlarmTime(isoTimestamp) {
  const date = new Date(isoTimestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format alarm timestamp with date for export
 * @param {string} isoTimestamp - ISO timestamp string
 * @returns {string} Formatted date-time string
 */
export function formatAlarmTimeFull(isoTimestamp) {
  const date = new Date(isoTimestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Initialize on module load
initializeAlarmLog();

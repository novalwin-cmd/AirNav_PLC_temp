const METRIC_KEYS = ['voltage', 'current', 'frequency', 'cosphi', 'power', 'temp'];

function buildHistory(base, jitter, points = 7) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [];
  let snap = Number(base);

  for (let i = 0; i < points; i += 1) {
    const wave = Math.sin(i / 1.7) * jitter + (i % 2 === 0 ? 0.2 : -0.2);
    snap = Number((snap + wave).toFixed(2));
    values.push({ label: labels[i], value: snap });
  }

  return values;
}

function buildMetricEntry(value, unit, jitter) {
  return {
    value: Number(value),
    history: buildHistory(value, jitter),
    unit,
  };
}

export function normalizePanels(sourcePanels = []) {
  return sourcePanels.map((panel, index) => ({
    id: panel.id || `panel-${index + 1}`,
    name: panel.name || `Panel Room ${index + 1}`,
    zone: panel.zone || 'Local panel room',
    status: panel.status || 'online',
    metrics: {
      voltage: buildMetricEntry(panel.metrics?.voltage?.value ?? 220, 'V', 3),
      current: buildMetricEntry(panel.metrics?.current?.value ?? 42, 'A', 2.4),
      frequency: buildMetricEntry(panel.metrics?.frequency?.value ?? 50, 'Hz', 0.12),
      cosphi: buildMetricEntry(panel.metrics?.cosphi?.value ?? 0.94, '', 0.02),
      power: buildMetricEntry(panel.metrics?.power?.value ?? 18.4, 'kW', 1.4),
      temp: buildMetricEntry(panel.metrics?.temp?.value ?? 27, '°C', 1.1),
    },
  }));
}

export function mergeTelemetryData(existingPanels, incomingPanels) {
  const nextPanels = [...existingPanels];
  const incoming = normalizePanels(incomingPanels);

  incoming.forEach((panel) => {
    const index = nextPanels.findIndex((item) => item.id === panel.id);
    if (index >= 0) {
      nextPanels[index] = {
        ...nextPanels[index],
        ...panel,
        metrics: {
          ...nextPanels[index].metrics,
          voltage: {
            ...nextPanels[index].metrics.voltage,
            value: panel.metrics.voltage.value,
            history: [...nextPanels[index].metrics.voltage.history.slice(-6), { label: 'Now', value: panel.metrics.voltage.value }],
            unit: panel.metrics.voltage.unit,
          },
          current: {
            ...nextPanels[index].metrics.current,
            value: panel.metrics.current.value,
            history: [...nextPanels[index].metrics.current.history.slice(-6), { label: 'Now', value: panel.metrics.current.value }],
            unit: panel.metrics.current.unit,
          },
          frequency: {
            ...nextPanels[index].metrics.frequency,
            value: panel.metrics.frequency.value,
            history: [...nextPanels[index].metrics.frequency.history.slice(-6), { label: 'Now', value: panel.metrics.frequency.value }],
            unit: panel.metrics.frequency.unit,
          },
          cosphi: {
            ...nextPanels[index].metrics.cosphi,
            value: panel.metrics.cosphi.value,
            history: [...nextPanels[index].metrics.cosphi.history.slice(-6), { label: 'Now', value: panel.metrics.cosphi.value }],
            unit: panel.metrics.cosphi.unit,
          },
          temp: {
            ...nextPanels[index].metrics.temp,
            value: panel.metrics.temp.value,
            history: [...nextPanels[index].metrics.temp.history.slice(-6), { label: 'Now', value: panel.metrics.temp.value }],
            unit: panel.metrics.temp.unit,
          },
          power: {
            ...nextPanels[index].metrics.power,
            value: panel.metrics.power.value,
            history: [...nextPanels[index].metrics.power.history.slice(-6), { label: 'Now', value: panel.metrics.power.value }],
            unit: panel.metrics.power.unit,
          },
        },
      };
    } else {
      nextPanels.push(panel);
    }
  });

  return nextPanels;
}

export function buildInitialTelemetryFeed() {
  return [
    {
      id: 'panel-01',
      name: 'Panel Room 01',
      zone: 'MDS - Terminal A',
      status: 'online',
      metrics: {
        voltage: { value: 220 },
        current: { value: 42 },
        frequency: { value: 50 },
        cosphi: { value: 0.94 },
        power: { value: 18.4 },
        temp: { value: 27 },
      },
    },
    {
      id: 'panel-02',
      name: 'Panel Room 02',
      zone: 'MDS - Tower Base',
      status: 'online',
      metrics: {
        voltage: { value: 218 },
        current: { value: 39 },
        frequency: { value: 49.9 },
        cosphi: { value: 0.93 },
        power: { value: 17.8 },
        temp: { value: 29 },
      },
    },
    {
      id: 'panel-03',
      name: 'Panel Room 03',
      zone: 'MDS - Backup Line',
      status: 'online',
      metrics: {
        voltage: { value: 221 },
        current: { value: 45 },
        frequency: { value: 50.1 },
        cosphi: { value: 0.95 },
        power: { value: 19.1 },
        temp: { value: 26 },
      },
    },
  ];
}

export function applyTelemetryUpdate(previousFeed) {
  return previousFeed.map((panel, index) => {
    const drift = index % 2 === 0 ? 0.8 : -0.6;
    return {
      ...panel,
      metrics: {
        ...panel.metrics,
        voltage: { value: Number((panel.metrics.voltage.value + drift).toFixed(1)) },
        current: { value: Number((panel.metrics.current.value + (index === 1 ? 0.3 : -0.2)).toFixed(1)) },
        frequency: { value: Number((panel.metrics.frequency.value + (index === 2 ? 0.02 : -0.01)).toFixed(2)) },
        cosphi: { value: Number((panel.metrics.cosphi.value + (index === 0 ? 0.001 : -0.001)).toFixed(3)) },
        power: { value: Number((panel.metrics.power.value + (index === 1 ? 0.3 : -0.2)).toFixed(1)) },
        temp: { value: Number((panel.metrics.temp.value + (index === 1 ? 0.4 : -0.2)).toFixed(1)) },
      },
    };
  });
}

export function isMetricAlarm(metricKey, value) {
  // try to read user-configured thresholds from localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('airnav_thresholds_v1');
      const thresholds = raw ? JSON.parse(raw) : null;
      if (thresholds && thresholds[metricKey]) {
        const t = thresholds[metricKey];
        if (typeof t.low === 'number' && typeof t.high === 'number') {
          return value < t.low || value > t.high;
        }
        if (typeof t.high === 'number') return value > t.high;
        if (typeof t.low === 'number') return value < t.low;
      }
    }
  } catch (e) {
    // ignore and fall back to defaults below
  }

  if (metricKey === 'voltage') return value < 198 || value > 242;
  if (metricKey === 'current') return value > 63;
  if (metricKey === 'frequency') return value < 49.5 || value > 50.5;
  if (metricKey === 'cosphi') return value < 0.85;
  if (metricKey === 'power') return value > 35;
  if (metricKey === 'temp') return value > 35;
  return false;
}

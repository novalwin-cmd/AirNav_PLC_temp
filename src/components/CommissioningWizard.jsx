import React, { useMemo, useState } from 'react';

const STEP_TITLES = ['Project', 'Rooms', 'Devices', 'Thresholds', 'Network', 'Review'];

const initialState = {
  project: {
    name: 'AirNav Jakarta Control Room',
    client: 'AirNav Indonesia',
    site: 'Panel Room Monitoring',
  },
  rooms: [
    { id: 'pr-01', name: 'Panel Room 01', zone: 'MDS - Terminal A', wired: true },
    { id: 'pr-02', name: 'Panel Room 02', zone: 'MDS - Tower Base', wired: false },
  ],
  devices: {
    meterProtocol: 'Modbus RTU/TCP',
    envProtocol: 'MQTT over VPN',
    nodeCount: 2,
  },
  thresholds: {
    voltage: { base: 220, low: 198, high: 242 },
    current: { base: 42, low: 0, high: 63 },
    frequency: { base: 50, low: 49.5, high: 50.5 },
    cosphi: { base: 0.94, low: 0.85, high: 1.0 },
    power: { base: 18.4, low: 0, high: 35 },
    temp: { base: 27, low: 15, high: 35 },
  },
  network: {
    vpn: true,
    vlanIsolation: true,
    historianRetention: '14 days',
  },
};

function StepHeader({ step, total }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, color: '#5A6576', letterSpacing: '0.4em', textTransform: 'uppercase' }}>Step {step + 1} / {total}</div>
      <div style={{ fontSize: 24, color: '#E7ECF3', fontWeight: 600, marginTop: 4 }}>{STEP_TITLES[step]}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#E7ECF3' }}>
      <span style={{ fontSize: 13, color: '#8C97A8' }}>{label}</span>
      {children}
    </label>
  );
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <Field label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #212B3B',
          background: '#10161F',
          color: '#E7ECF3',
        }}
      />
    </Field>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #212B3B',
          background: '#10161F',
          color: '#E7ECF3',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </Field>
  );
}

export default function CommissioningWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState(initialState);

  const updateProject = (field, value) => {
    setConfig((prev) => ({ ...prev, project: { ...prev.project, [field]: value } }));
  };

  const updateRoom = (index, field, value) => {
    setConfig((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room, idx) => (idx === index ? { ...room, [field]: value } : room)),
    }));
  };

  const addRoom = () => {
    setConfig((prev) => ({
      ...prev,
      rooms: [...prev.rooms, { id: `pr-${prev.rooms.length + 1}`.padStart(2, '0'), name: `Panel Room ${prev.rooms.length + 1}`, zone: 'New zone', wired: true }],
    }));
  };

  const updateThreshold = (key, field, value) => {
    setConfig((prev) => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]: { ...prev.thresholds[key], [field]: Number(value) },
      },
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div style={{ display: 'grid', gap: 14 }}>
            <InputField label="Project name" value={config.project.name} onChange={(v) => updateProject('name', v)} />
            <InputField label="Client" value={config.project.client} onChange={(v) => updateProject('client', v)} />
            <InputField label="Site / area" value={config.project.site} onChange={(v) => updateProject('site', v)} />
          </div>
        );
      case 1:
        return (
          <div style={{ display: 'grid', gap: 14 }}>
            {config.rooms.map((room, index) => (
              <div key={room.id} style={{ background: '#10161F', border: '1px solid #212B3B', borderRadius: 10, padding: 12, display: 'grid', gap: 10 }}>
                <InputField label="Room name" value={room.name} onChange={(v) => updateRoom(index, 'name', v)} />
                <InputField label="Zone / location" value={room.zone} onChange={(v) => updateRoom(index, 'zone', v)} />
                <SelectField
                  label="Connection"
                  value={room.wired ? 'wired' : 'wireless'}
                  onChange={(v) => updateRoom(index, 'wired', v === 'wired')}
                  options={[{ value: 'wired', label: 'Wired (RS485/Modbus)' }, { value: 'wireless', label: 'Wireless (ESP32/MQTT over VPN)' }]}
                />
              </div>
            ))}
            <button onClick={addRoom} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #2DD4BF', background: 'transparent', color: '#2DD4BF', cursor: 'pointer' }}>
              + Add room
            </button>
          </div>
        );
      case 2:
        return (
          <div style={{ display: 'grid', gap: 14 }}>
            <SelectField
              label="Power meter protocol"
              value={config.devices.meterProtocol}
              onChange={(v) => setConfig((prev) => ({ ...prev, devices: { ...prev.devices, meterProtocol: v } }))}
              options={[{ value: 'Modbus RTU/TCP', label: 'Modbus RTU/TCP' }, { value: 'Ethernet/IP', label: 'Ethernet/IP' }]}
            />
            <SelectField
              label="Environmental node protocol"
              value={config.devices.envProtocol}
              onChange={(v) => setConfig((prev) => ({ ...prev, devices: { ...prev.devices, envProtocol: v } }))}
              options={[{ value: 'MQTT over VPN', label: 'MQTT over VPN' }, { value: 'LoRaWAN', label: 'LoRaWAN' }]}
            />
            <InputField label="Node count" value={String(config.devices.nodeCount)} onChange={(v) => setConfig((prev) => ({ ...prev, devices: { ...prev.devices, nodeCount: Number(v) || 0 } }))} />
          </div>
        );
      case 3:
        return (
          <div style={{ display: 'grid', gap: 14 }}>
            {Object.entries(config.thresholds).map(([key, values]) => (
              <div key={key} style={{ background: '#10161F', border: '1px solid #212B3B', borderRadius: 10, padding: 12, display: 'grid', gap: 8 }}>
                <div style={{ color: '#E7ECF3', fontWeight: 600, textTransform: 'capitalize' }}>{key}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                  <InputField label="Base" value={String(values.base)} onChange={(v) => updateThreshold(key, 'base', v)} />
                  <InputField label="Low" value={String(values.low)} onChange={(v) => updateThreshold(key, 'low', v)} />
                  <InputField label="High" value={String(values.high)} onChange={(v) => updateThreshold(key, 'high', v)} />
                </div>
              </div>
            ))}
          </div>
        );
      case 4:
        return (
          <div style={{ display: 'grid', gap: 14 }}>
            <SelectField
              label="Use AirNav local VPN"
              value={config.network.vpn ? 'yes' : 'no'}
              onChange={(v) => setConfig((prev) => ({ ...prev, network: { ...prev.network, vpn: v === 'yes' } }))}
              options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
            />
            <SelectField
              label="VLAN isolation"
              value={config.network.vlanIsolation ? 'yes' : 'no'}
              onChange={(v) => setConfig((prev) => ({ ...prev, network: { ...prev.network, vlanIsolation: v === 'yes' } }))}
              options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
            />
            <InputField label="Historian retention" value={config.network.historianRetention} onChange={(v) => setConfig((prev) => ({ ...prev, network: { ...prev.network, historianRetention: v } }))} />
          </div>
        );
      case 5:
        return (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ background: '#10161F', border: '1px solid #212B3B', borderRadius: 10, padding: 14 }}>
              <div style={{ color: '#2DD4BF', fontWeight: 600, marginBottom: 8 }}>Configuration summary</div>
              <div style={{ color: '#E7ECF3', lineHeight: 1.7 }}>
                <div><strong>Project:</strong> {config.project.name}</div>
                <div><strong>Rooms:</strong> {config.rooms.map((room) => room.name).join(', ')}</div>
                <div><strong>Devices:</strong> {config.devices.meterProtocol} · {config.devices.envProtocol}</div>
                <div><strong>Network:</strong> VPN {config.network.vpn ? 'enabled' : 'disabled'} · VLAN {config.network.vlanIsolation ? 'isolated' : 'shared'}</div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const canGoNext = useMemo(() => {
    if (step === 0) return config.project.name.trim() && config.project.client.trim() && config.project.site.trim();
    if (step === 1) return config.rooms.length > 0 && config.rooms.every((room) => room.name.trim() && room.zone.trim());
    if (step === 2) return config.devices.nodeCount > 0;
    return true;
  }, [config, step]);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E14', color: '#E7ECF3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 760, background: '#10161F', border: '1px solid #212B3B', borderRadius: 16, padding: 24 }}>
        <StepHeader step={step} total={STEP_TITLES.length} />
        {renderStep()}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 10 }}>
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #212B3B', background: 'transparent', color: '#E7ECF3', cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? 0.6 : 1 }}>
            Back
          </button>
          {step < STEP_TITLES.length - 1 ? (
            <button onClick={() => canGoNext && setStep((s) => s + 1)} disabled={!canGoNext} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #2DD4BF', background: '#2DD4BF', color: '#0A0E14', cursor: canGoNext ? 'pointer' : 'not-allowed', opacity: canGoNext ? 1 : 0.6 }}>
              Next
            </button>
          ) : (
            <button onClick={() => onComplete(config)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #2DD4BF', background: '#2DD4BF', color: '#0A0E14', cursor: 'pointer' }}>
              Start monitoring
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

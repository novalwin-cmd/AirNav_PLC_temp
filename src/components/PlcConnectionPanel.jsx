import { useState } from 'react';
import { fetchPlcHealth, fetchPlcTelemetry, writePlcRegister } from '../services/plcApi';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #07111d 0%, #0e1724 100%)',
    color: '#e7ecf3',
    padding: 24,
  },
  card: {
    maxWidth: 760,
    margin: '0 auto',
    background: '#10161F',
    border: '1px solid #212B3B',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 18px 50px rgba(0, 0, 0, 0.3)',
  },
  grid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  input: {
    width: '100%',
    border: '1px solid #212B3B',
    background: '#0A0E14',
    color: '#E7ECF3',
    borderRadius: 10,
    padding: '10px 12px',
    marginTop: 6,
  },
  button: {
    border: 0,
    background: '#2DD4BF',
    color: '#07111d',
    padding: '10px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
  },
  result: {
    marginTop: 16,
    background: '#0A0E14',
    border: '1px solid #212B3B',
    borderRadius: 12,
    padding: 12,
    whiteSpace: 'pre-wrap',
    overflowX: 'auto',
  },
};

export default function PlcConnectionPanel() {
  const [host, setHost] = useState('192.168.1.10');
  const [port, setPort] = useState(502);
  const [unitId, setUnitId] = useState(1);
  const [address, setAddress] = useState(0);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('Idle');
  const [result, setResult] = useState(null);

  const handleTestConnection = async () => {
    setStatus('Testing connection...');
    try {
      const payload = await fetchPlcHealth(host, port, unitId);
      setResult(payload);
      setStatus(payload.ok ? 'Connection OK' : 'Connection failed');
    } catch (error) {
      setStatus('Connection failed');
      setResult({ error: error.message });
    }
  };

  const handleReadRegisters = async () => {
    setStatus('Reading registers...');
    try {
      const payload = await fetchPlcTelemetry(host, port, unitId, Number(address), 6);
      setResult(payload);
      setStatus(payload.ok ? 'Read OK' : 'Read failed');
    } catch (error) {
      setStatus('Read failed');
      setResult({ error: error.message });
    }
  };

  const handleWriteRegister = async () => {
    setStatus('Writing register...');
    try {
      const payload = await writePlcRegister(Number(address), Number(value), host, port, unitId);
      setResult(payload);
      setStatus(payload.ok ? 'Write OK' : 'Write failed');
    } catch (error) {
      setStatus('Write failed');
      setResult({ error: error.message });
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={{ marginTop: 0 }}>PLC connection panel</h2>
        <p style={{ color: '#8C97A8', marginTop: -4 }}>
          This panel uses a local bridge to talk to your PLC over Modbus/TCP. Use it after the PLC and PC are on the same subnet.
        </p>

        <div style={styles.grid}>
          <label>
            <span style={{ color: '#8C97A8' }}>PLC IP address</span>
            <input style={styles.input} value={host} onChange={(event) => setHost(event.target.value)} />
          </label>
          <label>
            <span style={{ color: '#8C97A8' }}>Port</span>
            <input style={styles.input} type="number" value={port} onChange={(event) => setPort(Number(event.target.value))} />
          </label>
          <label>
            <span style={{ color: '#8C97A8' }}>Unit ID</span>
            <input style={styles.input} type="number" value={unitId} onChange={(event) => setUnitId(Number(event.target.value))} />
          </label>
          <label>
            <span style={{ color: '#8C97A8' }}>Register address</span>
            <input style={styles.input} type="number" value={address} onChange={(event) => setAddress(Number(event.target.value))} />
          </label>
          <label>
            <span style={{ color: '#8C97A8' }}>Register value</span>
            <input style={styles.input} value={value} onChange={(event) => setValue(event.target.value)} />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <button style={styles.button} onClick={handleTestConnection}>Test connection</button>
          <button style={styles.button} onClick={handleReadRegisters}>Read registers</button>
          <button style={styles.button} onClick={handleWriteRegister}>Write register</button>
        </div>

        <div style={{ marginTop: 16, color: '#2DD4BF', fontWeight: 700 }}>{status}</div>
        <div style={styles.result}>{JSON.stringify(result, null, 2)}</div>
      </div>
    </div>
  );
}

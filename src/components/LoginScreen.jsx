import React, { useState } from 'react';
import users from '../data/users.json';

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const match = users.find((entry) => entry.username === username.trim() && entry.password === password);

    if (match) {
      onLogin(match.username);
      return;
    }

    setError('Invalid username or password.');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>AirNav Monitoring and Control</p>
        <h1 style={styles.title}>Secure access</h1>
        <p style={styles.subtitle}>Sign in with one of the configured local accounts to open the dashboard.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            <span style={styles.label}>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} style={styles.input} placeholder="admin" />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={styles.input} placeholder="••••••••" />
          </label>

          {error ? <div style={styles.error}>{error}</div> : null}

          <button type="submit" style={styles.button}>Login</button>
        </form>

        <div style={styles.helpBox}>
          <p style={styles.helpTitle}>Available accounts</p>
          <ul style={styles.helpList}>
            {users.map((entry) => (
              <li key={entry.username}>
                <strong>{entry.username}</strong> / {entry.password}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #07111d 0%, #0e1724 100%)',
    color: '#e7ecf3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    background: '#10161F',
    border: '1px solid #212B3B',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 18px 50px rgba(0, 0, 0, 0.35)',
  },
  eyebrow: {
    margin: 0,
    color: '#5A6576',
    fontSize: 12,
    letterSpacing: '0.32em',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  title: {
    margin: '8px 0 8px',
    fontSize: 28,
    fontWeight: 700,
  },
  subtitle: {
    margin: '0 0 18px',
    color: '#8C97A8',
    lineHeight: 1.6,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
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
  button: {
    marginTop: 4,
    border: 0,
    background: '#2DD4BF',
    color: '#07111d',
    padding: '10px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
  },
  error: {
    background: '#3b1f1f',
    color: '#fecaca',
    border: '1px solid #7f1d1d',
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 13,
  },
  helpBox: {
    marginTop: 16,
    background: '#0A0E14',
    border: '1px solid #212B3B',
    borderRadius: 12,
    padding: 12,
  },
  helpTitle: {
    margin: '0 0 8px',
    color: '#E7ECF3',
    fontSize: 13,
    fontWeight: 700,
  },
  helpList: {
    margin: 0,
    paddingLeft: 18,
    color: '#8C97A8',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
};

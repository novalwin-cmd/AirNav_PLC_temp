export async function fetchPlcHealth(host, port, unitId) {
  const params = new URLSearchParams();
  if (host) params.set('host', host);
  if (port) params.set('port', String(port));
  if (unitId) params.set('unitId', String(unitId));

  const response = await fetch(`/api/plc/health?${params.toString()}`);
  return response.json();
}

export async function fetchPlcTelemetry(host, port, unitId, startAddress = 0, quantity = 6) {
  const params = new URLSearchParams();
  if (host) params.set('host', host);
  if (port) params.set('port', String(port));
  if (unitId) params.set('unitId', String(unitId));
  params.set('startAddress', String(startAddress));
  params.set('quantity', String(quantity));

  const response = await fetch(`/api/plc/telemetry?${params.toString()}`);
  return response.json();
}

export async function writePlcRegister(address, value, host, port, unitId) {
  const response = await fetch('/api/plc/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, value, host, port, unitId }),
  });

  return response.json();
}

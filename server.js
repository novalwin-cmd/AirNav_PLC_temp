import http from 'node:http';
import net from 'node:net';
import { URL } from 'node:url';

const PLC_HOST = process.env.PLC_HOST || '192.168.1.10';
const PLC_PORT = Number(process.env.PLC_PORT || '502');
const PLC_UNIT_ID = Number(process.env.PLC_UNIT_ID || '1');
const SERVER_PORT = Number(process.env.PORT || '3001');
const DEFAULT_START_ADDRESS = Number(process.env.PLC_START_ADDRESS || '0');
const DEFAULT_QUANTITY = Number(process.env.PLC_QUANTITY || '6');

function buildReadHoldingRegistersRequest({ transactionId, unitId, startAddress, quantity }) {
  const request = Buffer.alloc(12);
  request.writeUInt16BE(transactionId, 0);
  request.writeUInt16BE(0, 2);
  request.writeUInt16BE(6, 4);
  request.writeUInt8(unitId, 6);
  request.writeUInt8(0x03, 7);
  request.writeUInt16BE(startAddress, 8);
  request.writeUInt16BE(quantity, 10);
  return request;
}

function buildWriteSingleRegisterRequest({ transactionId, unitId, address, value }) {
  const request = Buffer.alloc(12);
  request.writeUInt16BE(transactionId, 0);
  request.writeUInt16BE(0, 2);
  request.writeUInt16BE(6, 4);
  request.writeUInt8(unitId, 6);
  request.writeUInt8(0x06, 7);
  request.writeUInt16BE(address, 8);
  request.writeUInt16BE(value, 10);
  return request;
}

function parseReadHoldingRegistersResponse(buffer) {
  if (buffer.length < 8) {
    throw new Error('Incomplete Modbus response');
  }

  const byteCount = buffer[8];
  const expectedLength = 9 + byteCount;
  if (buffer.length < expectedLength) {
    throw new Error('Incomplete register payload');
  }

  const values = [];
  for (let index = 0; index < byteCount / 2; index += 1) {
    values.push(buffer.readUInt16BE(9 + index * 2));
  }

  return values;
}

function parseWriteSingleRegisterResponse(buffer) {
  if (buffer.length < 12) {
    throw new Error('Incomplete Modbus write response');
  }

  return {
    address: buffer.readUInt16BE(8),
    value: buffer.readUInt16BE(10),
  };
}

function createModbusRequest({ host, port, unitId, functionCode, startAddress, quantity, value }) {
  const transactionId = Math.floor(Math.random() * 0xffff);

  if (functionCode === 0x03) {
    return {
      transactionId,
      request: buildReadHoldingRegistersRequest({ transactionId, unitId, startAddress, quantity }),
    };
  }

  if (functionCode === 0x06) {
    return {
      transactionId,
      request: buildWriteSingleRegisterRequest({ transactionId, unitId, address: startAddress, value }),
    };
  }

  throw new Error(`Unsupported function code: ${functionCode}`);
}

function readFromPlc({ host, port, unitId, startAddress, quantity }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const { request } = createModbusRequest({
      host,
      port,
      unitId,
      functionCode: 0x03,
      startAddress,
      quantity,
    });

    let buffer = Buffer.alloc(0);

    socket.setTimeout(3000);

    socket.on('connect', () => {
      socket.write(request);
    });

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length >= 8) {
        const byteCount = buffer[8];
        const expectedLength = 9 + byteCount;
        if (buffer.length >= expectedLength) {
          try {
            resolve(parseReadHoldingRegistersResponse(buffer));
          } catch (error) {
            reject(error);
          } finally {
            socket.end();
          }
        }
      }
    });

    socket.on('timeout', () => {
      socket.destroy(new Error('PLC connection timed out'));
    });

    socket.on('error', (error) => {
      reject(error);
    });
  });
}

function writeToPlc({ host, port, unitId, address, value }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const { request } = createModbusRequest({
      host,
      port,
      unitId,
      functionCode: 0x06,
      startAddress: address,
      value,
    });

    let buffer = Buffer.alloc(0);

    socket.setTimeout(3000);

    socket.on('connect', () => {
      socket.write(request);
    });

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length >= 12) {
        try {
          resolve(parseWriteSingleRegisterResponse(buffer));
        } catch (error) {
          reject(error);
        } finally {
          socket.end();
        }
      }
    });

    socket.on('timeout', () => {
      socket.destroy(new Error('PLC write timed out'));
    });

    socket.on('error', (error) => {
      reject(error);
    });
  });
}

function sendJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, { ok: true, service: 'airnav-plc-bridge' });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/plc/health') {
    sendJson(res, {
      ok: true,
      host: process.env.PLC_HOST || PLC_HOST,
      port: process.env.PLC_PORT || PLC_PORT,
      unitId: process.env.PLC_UNIT_ID || PLC_UNIT_ID,
      message: 'Modbus/TCP bridge is ready',
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/plc/telemetry') {
    try {
      const host = url.searchParams.get('host') || process.env.PLC_HOST || PLC_HOST;
      const port = Number(url.searchParams.get('port') || process.env.PLC_PORT || PLC_PORT);
      const unitId = Number(url.searchParams.get('unitId') || process.env.PLC_UNIT_ID || PLC_UNIT_ID);
      const startAddress = Number(url.searchParams.get('startAddress') || DEFAULT_START_ADDRESS);
      const quantity = Number(url.searchParams.get('quantity') || DEFAULT_QUANTITY);
      const values = await readFromPlc({ host, port, unitId, startAddress, quantity });
      sendJson(res, { ok: true, host, port, unitId, startAddress, quantity, values });
    } catch (error) {
      sendJson(res, { ok: false, error: error.message }, 500);
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/plc/register') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const host = payload.host || process.env.PLC_HOST || PLC_HOST;
        const port = Number(payload.port || process.env.PLC_PORT || PLC_PORT);
        const unitId = Number(payload.unitId || process.env.PLC_UNIT_ID || PLC_UNIT_ID);
        const address = Number(payload.address);
        const value = Number(payload.value);

        if (!Number.isFinite(address) || !Number.isFinite(value)) {
          sendJson(res, { ok: false, error: 'address and value must be numeric' }, 400);
          return;
        }

        const wrote = await writeToPlc({ host, port, unitId, address, value });
        sendJson(res, { ok: true, host, port, unitId, wrote });
      } catch (error) {
        sendJson(res, { ok: false, error: error.message }, 500);
      }
    });
    return;
  }

  sendJson(res, { ok: false, error: 'Route not found' }, 404);
});

server.listen(SERVER_PORT, () => {
  console.log(`PLC bridge listening on port ${SERVER_PORT}`);
});

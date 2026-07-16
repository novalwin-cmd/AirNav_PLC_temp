# PLC connection guide

## 1. Protocol note
- Modbus/TCP and Ethernet/IP are different protocols.
- This project now includes a local Modbus/TCP bridge that can talk to a PLC exposing Modbus/TCP over Ethernet.
- If your PLC only exposes Ethernet/IP, you will need an intermediate gateway such as OPC UA, Kepware, or a PLC-specific driver.

## 2. Physical wiring
- Connect the PLC Ethernet port directly to the PC through a switch or a USB-to-Ethernet adapter if your PC has no Ethernet port.
- Make sure the PLC and the PC are on the same subnet, for example `192.168.1.x`.
- If the PLC uses DHCP, assign a fixed IP or confirm the PLC address in its network settings.

## 3. Configure the bridge
Set these environment variables before starting the bridge:

```bash
export PLC_HOST=192.168.1.10
export PLC_PORT=502
export PLC_UNIT_ID=1
export PLC_START_ADDRESS=0
export PLC_QUANTITY=6
npm run server
```

## 4. Use the website
- Start the Vite frontend with `npm run dev`.
- Open the PLC connection page at `/plc` after logging in.
- Use the Test connection button first.

## 5. Recommended next step
- Replace the default register addresses with the real memory map from your PLC manual.
- Add a polling loop to update the dashboard automatically from the PLC values.

# Alarm Logging & Export System Guide

## Overview

This document describes the comprehensive alarm logging, recording, and export system that has been integrated into the AirNav Panel Room Monitoring application. The system automatically records all alarm events, triggers audio notifications, marks alarm points on graphs, and provides downloadable logs in multiple formats.

---

## Features Implemented

### 1. **Automatic Alarm Recording**
- Every alarm (warning and critical) is automatically recorded with a timestamp
- Alarms are stored separately from real-time telemetry data (not in the 15-second rolling logs)
- Recorded data includes:
  - Exact timestamp of alarm onset
  - Parameter name (voltage, current, frequency, etc.)
  - Current value that triggered the alarm
  - Unit of measurement
  - Low and high thresholds
  - Alarm severity level (WARNING or CRITICAL)

### 2. **Audio Notifications**
- **Warning Alarms**: Two beeps at 800 Hz
- **Critical Alarms**: Three fast beeps at 1000 Hz
- Uses Web Audio API for cross-browser compatibility
- Optional: Can be extended with custom sound files

### 3. **Visual Alarm Markers on Graphs**
- Red dots (checkpoints) appear on parameter trend charts
- Marks the exact point in history where an alarm occurred
- Hover over a red dot to see the alarm details and value
- Visual indicator of alarm frequency across the time range

### 4. **Alarm Viewer Modal**
- **Full Alarm History View**: Display all recorded alarms for the selected panel
- **Filtering Options**:
  - By Severity: All, WARNING, CRITICAL
  - By Status: All, Active, Acknowledged
- **Summary Statistics**:
  - Total alarms count
  - Critical alarms count
  - Warning alarms count
  - Active vs. Acknowledged alarms
- **Alarm Details**: 
  - Timestamp
  - Parameter name
  - Current value and unit
  - Threshold range
  - Severity badge
  - Acknowledgment status
- **Expandable Entries**: Click an alarm to see full details and acknowledge it

### 5. **Export Capabilities**
Export alarm logs in three formats:

#### **CSV Export**
- Human-readable format
- Compatible with spreadsheet applications
- Includes headers: Timestamp, Parameter, Value, Unit, Low Threshold, High Threshold, Severity, Status
- Can be easily processed by data analysis tools

#### **Excel Export**
- Native .xlsx format with proper formatting
- Auto-sized columns for readability
- Professional presentation
- Best for business reporting

#### **PDF Export** (via CSV fallback)
- Text-based PDF generation
- Contains complete alarm history
- Suitable for archival and compliance

---

## Architecture

### Service Files

#### **`services/alarmLogger.js`**
Core alarm logging service with functions:
- `recordAlarm()`: Save a new alarm event
- `getAlarmsByPanel()`: Retrieve all alarms for a panel
- `getAlarmsByPanelAndTime()`: Get alarms within a time range
- `acknowledgeAlarm()`: Mark an alarm as acknowledged
- `clearAlarmsByPanel()`: Remove all alarms for a panel
- `formatAlarmTime()`: Format timestamps for display

Storage:
- Uses browser's localStorage
- Key: `airnav_alarm_history_v1`
- Structure: Object with panelId as keys, each containing array of alarm events
- Max 1000 alarms per panel (FIFO trimming when exceeded)

#### **`services/audioNotification.js`**
Audio notification system:
- `playBeep()`: Basic beep sound
- `playAlarmSound()`: Two-beep warning pattern
- `playCriticalAlarmSound()`: Three-beep critical pattern
- `triggerAlarmNotification()`: Intelligent alarm sound based on severity

#### **`services/alarmExport.js`**
Export functionality:
- `exportAlarmsToCSV()`: Generate CSV content
- `downloadAlarmsAsCSV()`: Download CSV file
- `exportAlarmsToExcel()`: Generate and download Excel file
- `downloadAlarmsAsPDF()`: Generate and download PDF file
- `exportAlarmsFiltered()`: Export with filtering options

### Component

#### **`components/AlarmViewer.jsx`**
Modal dialog component displaying alarm history with:
- Filtering UI (severity and status)
- Summary statistics cards
- Expandable alarm list
- Acknowledge alarm button
- Individual alarm export
- Bulk export buttons (CSV, Excel)
- Clear all alarms option

---

## Usage Flow

### For End Users

1. **Monitor Alarms in Real-Time**
   - Watch the alarm counter in the top bar
   - Listen for audio notifications
   - See alarms in the AlarmLog widget

2. **View Full Alarm History**
   - Click "VIEW FULL LOG" button in the AlarmLog panel
   - AlarmViewer modal opens for the selected panel room
   - Filter alarms by severity and status

3. **Export Alarm Data**
   - In AlarmViewer, click "CSV" or "Excel" to download
   - Filename includes panel name and current date
   - Use exported data for reporting or analysis

4. **Acknowledge Alarms**
   - Click on an alarm in AlarmViewer to expand it
   - Click "Acknowledge" button to mark as handled
   - Acknowledged alarms are still logged but marked as reviewed

---

## Alarm Detection Logic

### When Is an Alarm Recorded?

An alarm is recorded when:
1. A parameter value **crosses into the alarm zone** (out of threshold)
2. The alarm state **transitions from OK to ALARM** (not on every update while alarming)
3. This prevents duplicate logging of the same continuous alarm condition

### Thresholds

Default thresholds (can be customized):

| Parameter | Low | High | Unit | Warning Margin |
|-----------|-----|------|------|-----------------|
| Voltage | 198 | 242 | V | ±8% (8% margin = warning at 205.2 or 234.8) |
| Current | 0 | 63 | A | - |
| Frequency | 49.5 | 50.5 | Hz | - |
| Power Factor | 0.85 | 1.0 | - | - |
| Power | 0 | 35 | kW | - |
| Temperature | 15 | 35 | °C | - |

---

## Data Storage Details

### localStorage Structure
```json
{
  "panel-01": {
    "panelName": "Panel Room 01",
    "alarms": [
      {
        "id": "alarm-1234567890-abc123",
        "timestamp": "2026-07-10T14:23:45.123Z",
        "param": "Voltage",
        "value": 245.3,
        "unit": "V",
        "low": 198,
        "high": 242,
        "level": "crit",
        "acknowledged": false
      }
    ]
  }
}
```

### Limits & Constraints
- **Max alarms per panel**: 1000
- **Storage type**: Browser localStorage
- **Persistence**: Survives page refresh and browser restart
- **Scope**: Per browser, not synced across devices

---

## Integration with PanelRoomMonitor

### Automatic Alarm Detection
The system hooks into `PanelRoomMonitor` component:
1. On each parameter update, checks if status has changed from "ok" to "alarm"
2. If transition detected, calls `recordAlarm()`
3. Triggers audio notification via `triggerAlarmNotification()`
4. Updates internal tracking to prevent duplicate logging

### Graph Integration
Alarm markers added to parameter charts:
- Red dots overlay the trend line where alarms occurred
- Tooltip shows alarm details on hover
- Calculated position based on history index and value range

---

## Customization Options

### Modify Default Thresholds
Edit in `components/PanelRoomMonitor.jsx`:
```javascript
const DEFAULT_PARAM_DEFS = [
  { 
    key: "voltage", 
    label: "Voltage", 
    unit: "V", 
    icon: Zap, 
    base: 220, 
    jitter: 3, 
    low: 198,      // ← Edit these
    high: 242      // ← Edit these
  },
  // ... more params
];
```

### Customize Audio Notifications
In `services/audioNotification.js`:
```javascript
// Adjust beep frequency, duration, or volume
playAlarmSound(volumeValue); // 0-1
playCriticalAlarmSound(volumeValue);
```

### Extend Export Formats
Add new formats in `services/alarmExport.js`:
```javascript
export function exportAlarmsToJSON(panelName, alarms) {
  // Custom implementation
}
```

---

## Technical Notes

### Web Audio Context Initialization
- Requires user interaction to initialize (security requirement)
- Gracefully degrades if not supported or disabled
- No errors thrown if audio unavailable

### localStorage Limitations
- Size limit: ~5-10 MB per domain
- Cleared when browser cache is cleared
- Not encrypted (do not store sensitive data)

### Performance Considerations
- Alarm check runs on every parameter update (~2.2 second interval)
- localStorage read/write is synchronous but fast
- Large alarm histories (1000+ entries) have minimal impact

---

## Troubleshooting

### No Audio Notifications
1. Check browser audio is enabled
2. Ensure user has interacted with page before alarm occurs
3. Check volume settings in browser/OS
4. Try a different browser

### Alarms Not Being Recorded
1. Verify alarm thresholds are configured correctly
2. Check localStorage is not disabled in browser
3. Verify parameter values are actually out of range
4. Check browser console for errors

### Export Not Working
1. Ensure alarms exist for the panel
2. Try different export format
3. Check browser download settings
4. Verify pop-up blocker is not interfering

---

## Future Enhancements

Potential improvements:
1. Remote database storage for historical analysis
2. Email notifications for critical alarms
3. Alarm escalation/routing based on severity
4. Alarm trend analysis and predictive alerts
5. Custom threshold configuration UI
6. Alarm acknowledgment with notes/reasons
7. Multi-user alarm assignment and handoff
8. Integration with external ticketing systems

---

## Support & Questions

For issues or feature requests, refer to the codebase structure:
- Services: `src/services/`
- Components: `src/components/`
- Main app: `src/App.jsx` and `src/components/PanelDashboard.jsx`

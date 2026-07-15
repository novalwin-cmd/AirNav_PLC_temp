# Alarm Logging System - Quick Start Reference

## 🎯 What You Get

### Automatic Alarm Recording
```
Panel Parameter Changes → Automatic Detection → Alarm Recorded + Audio Beep
                              ↓
                        Stored in Browser
                              ↓
                    Persists After Page Refresh
```

### Key Capabilities

#### 1. Real-Time Monitoring
- ✅ Live alarm counter in toolbar ("X active")
- ✅ Audio notifications (beeps)
- ✅ Alarm widget showing recent alarms
- ✅ Red dots on graphs marking alarm points

#### 2. Alarm History Viewing
- ✅ Click "VIEW FULL LOG" button
- ✅ See all alarms for the selected panel
- ✅ Filter by severity and status
- ✅ View summary statistics

#### 3. Data Export
- ✅ Download as CSV (spreadsheet)
- ✅ Download as Excel (.xlsx)
- ✅ Includes timestamp, parameters, thresholds
- ✅ Professional formatting

---

## 🎮 Using the System

### View Active Alarms
1. Open Panel Room Monitor
2. Look at the alarm badge in top right
3. See active alarms in the AlarmLog widget (bottom right)

### Open Full Alarm Log
1. Click "VIEW FULL LOG" button in alarm widget
2. Modal dialog opens
3. Browse all alarms with filters

### Filter Alarms
```
Severity: All | Warning | Critical
Status:   All | Active  | Acknowledged
```

### Acknowledge an Alarm
1. In AlarmViewer, click on an alarm to expand
2. Click "Acknowledge" button
3. Alarm now marked as reviewed

### Export Alarms
1. In AlarmViewer, click "CSV" or "Excel"
2. File automatically downloads
3. Open in Excel/Google Sheets/Python/etc.

---

## 📊 What Gets Recorded

Each alarm contains:

| Field | Example |
|-------|---------|
| **Timestamp** | 2026-07-10 14:23:45 |
| **Panel** | Panel Room 01 |
| **Parameter** | Voltage |
| **Value** | 245.3 |
| **Unit** | V |
| **Threshold Low** | 198 |
| **Threshold High** | 242 |
| **Severity** | CRITICAL |
| **Status** | Active / Acknowledged |

---

## 🔊 Audio Notifications

### Warning Alarm
```
🔔 Beep... (pause) ...Beep
Frequency: 800 Hz
Pattern: Two beeps, 300ms apart
```

### Critical Alarm
```
🔔 Beep... Beep... Beep
Frequency: 1000 Hz  
Pattern: Three fast beeps, 200ms apart
```

---

## 📁 Export Formats

### CSV Format
```
Timestamp,Parameter,Value,Unit,Low Threshold,High Threshold,Severity,Status
2026-07-10 14:23:45,Voltage,245.3,V,198,242,CRITICAL,Active
2026-07-10 14:25:12,Current,65.2,A,0,63,WARNING,Active
```

### Excel Format
- Professional formatting
- Auto-sized columns
- Clean layout
- Easy to use in Excel/Google Sheets

---

## 🔧 Default Thresholds

| Parameter | Low | High | Unit |
|-----------|-----|------|------|
| Voltage | 198 | 242 | V |
| Current | 0 | 63 | A |
| Frequency | 49.5 | 50.5 | Hz |
| Power Factor | 0.85 | 1.0 | - |
| Power | 0 | 35 | kW |
| Temperature | 15 | 35 | °C |

*Contact administrator to customize thresholds*

---

## ✅ Verification Checklist

- [ ] You can see "X active" badge in toolbar
- [ ] Click "VIEW FULL LOG" opens a modal
- [ ] You can filter alarms by severity
- [ ] You can download CSV file
- [ ] You can download Excel file
- [ ] Red dots appear on graphs when there are alarms
- [ ] You hear beep sound when alarm occurs

---

## 🐛 Troubleshooting

### No Audio Notifications
- ✓ Check computer volume
- ✓ Ensure browser audio is enabled
- ✓ Try different browser

### Alarms Not Showing
- ✓ Check parameter values are out of range
- ✓ Verify thresholds are correct
- ✓ Refresh page and try again

### Export Not Working
- ✓ Try different format (CSV, Excel)
- ✓ Check if pop-up blocker is active
- ✓ Ensure alarms exist (not empty list)

---

## 📞 Support

For detailed information, see:
- **ALARM_LOGGING_GUIDE.md** - Full documentation
- **Code comments** - In service files

---

## 🎉 Ready to Use!

The system is fully operational and automatic. Just:
1. Use the application normally
2. Alarms are recorded automatically
3. Notifications play automatically
4. Export data as needed

Enjoy comprehensive alarm monitoring!

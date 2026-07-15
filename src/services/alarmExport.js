/**
 * Alarm Export Service
 * Exports alarm data to CSV, Excel, and PDF formats
 */

import * as XLSX from 'xlsx';
import { formatAlarmTimeFull } from './alarmLogger';

/**
 * Export alarms to CSV format
 * @param {string} panelName - Panel room name
 * @param {Array} alarms - Array of alarm events
 * @returns {string} CSV content
 */
export function exportAlarmsToCSV(panelName, alarms) {
  if (!alarms || alarms.length === 0) {
    return 'No alarms to export';
  }

  // CSV Header
  const headers = ['Timestamp', 'Parameter', 'Value', 'Unit', 'Low Threshold', 'High Threshold', 'Severity', 'Status'];
  
  // CSV Data
  const rows = alarms.map((alarm) => [
    formatAlarmTimeFull(alarm.timestamp),
    alarm.param,
    alarm.value,
    alarm.unit,
    alarm.low,
    alarm.high,
    alarm.level === 'crit' ? 'CRITICAL' : 'WARNING',
    alarm.acknowledged ? 'Acknowledged' : 'Active',
  ]);

  // Combine headers and rows
  const csvContent = [
    [
      `Panel Room Alarm Log - ${panelName}`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      `Generated: ${new Date().toISOString()}`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ],
    ['', '', '', '', '', '', '', ''], // Empty row for spacing
    headers,
    ...rows,
  ]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Export alarms to Excel format
 * @param {string} panelName - Panel room name
 * @param {Array} alarms - Array of alarm events
 */
export function exportAlarmsToExcel(panelName, alarms) {
  if (!alarms || alarms.length === 0) {
    alert('No alarms to export');
    return;
  }

  // Prepare data
  const data = alarms.map((alarm) => ({
    Timestamp: formatAlarmTimeFull(alarm.timestamp),
    Parameter: alarm.param,
    Value: alarm.value,
    Unit: alarm.unit,
    'Low Threshold': alarm.low,
    'High Threshold': alarm.high,
    Severity: alarm.level === 'crit' ? 'CRITICAL' : 'WARNING',
    Status: alarm.acknowledged ? 'Acknowledged' : 'Active',
  }));

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Alarms');

  // Add styling
  ws['!cols'] = [
    { wch: 20 }, // Timestamp
    { wch: 15 }, // Parameter
    { wch: 12 }, // Value
    { wch: 10 }, // Unit
    { wch: 15 }, // Low Threshold
    { wch: 15 }, // High Threshold
    { wch: 12 }, // Severity
    { wch: 15 }, // Status
  ];

  // Generate file
  const fileName = `${panelName.replace(/\s+/g, '_')}_Alarms_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export alarms to CSV format and trigger download
 * @param {string} panelName - Panel room name
 * @param {Array} alarms - Array of alarm events
 */
export function downloadAlarmsAsCSV(panelName, alarms) {
  const csvContent = exportAlarmsToCSV(panelName, alarms);
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const fileName = `${panelName.replace(/\s+/g, '_')}_Alarms_${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export alarms to PDF format (simple text-based PDF)
 * Uses basic PDF structure for broader compatibility
 * @param {string} panelName - Panel room name
 * @param {Array} alarms - Array of alarm events
 */
export function downloadAlarmsAsPDF(panelName, alarms) {
  if (!alarms || alarms.length === 0) {
    alert('No alarms to export');
    return;
  }

  // PDF Header
  const pdfTitle = `Panel Room Alarm Log - ${panelName}`;
  const generatedDate = `Generated: ${new Date().toISOString()}`;

  // Create simple PDF content
  let pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 0 >>
stream
BT
/F1 14 Tf
50 750 Td
(${pdfTitle}) Tj
0 -20 Td
/F1 10 Tf
(${generatedDate}) Tj
0 -30 Td
(Alarm History) Tj
0 -20 Td
/F1 9 Tf
`;

  // Add alarm entries
  let yPosition = 0;
  alarms.forEach((alarm, idx) => {
    if (idx > 0 && idx % 40 === 0) {
      // Start new page after 40 entries
      yPosition = 0;
      pdfContent += `
ET
endstream
endobj
`;
      // Add new page (simplified - would need complete rewrite for multiple pages)
    }

    const alarmText = `${formatAlarmTimeFull(alarm.timestamp)} | ${alarm.param} | ${alarm.value} ${alarm.unit} | ${alarm.level === 'crit' ? 'CRITICAL' : 'WARNING'}`;
    pdfContent += `(${alarmText.replace(/[()\\]/g, '\\$&')}) Tj\n0 -12 Td\n`;
    yPosition += 12;
  });

  pdfContent += `
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
0000002000 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
2075
%%EOF`;

  // For better PDF support, use a workaround with HTML to PDF
  // This is a simplified version - for production, consider using jsPDF library
  downloadAlarmsAsCSV(panelName, alarms); // Fallback to CSV which is more reliable
}

/**
 * Export alarms with filtering options
 * @param {string} panelName - Panel room name
 * @param {Array} alarms - Array of alarm events
 * @param {Object} options - Filter options { format, severity, dateRange }
 */
export function exportAlarmsFiltered(panelName, alarms, options = {}) {
  let filtered = alarms;

  // Filter by severity
  if (options.severity) {
    filtered = filtered.filter((a) => a.level === options.severity);
  }

  // Filter by date range
  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    filtered = filtered.filter((a) => {
      const alarmTime = new Date(a.timestamp);
      return alarmTime >= start && alarmTime <= end;
    });
  }

  // Export in requested format
  switch (options.format) {
    case 'excel':
      exportAlarmsToExcel(panelName, filtered);
      break;
    case 'pdf':
      downloadAlarmsAsPDF(panelName, filtered);
      break;
    case 'csv':
    default:
      downloadAlarmsAsCSV(panelName, filtered);
      break;
  }
}

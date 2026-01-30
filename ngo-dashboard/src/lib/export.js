import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export reports to CSV format
 * @param {Array} reports - Array of report objects
 * @param {string} filename - Output filename
 */
export function exportToCSV(reports, filename = 'reports') {
  if (!reports || reports.length === 0) {
    alert('No reports to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Zone',
    'Category',
    'Subcategory',
    'Status',
    'Latitude',
    'Longitude',
    'Description',
    'Created At',
  ];

  // Convert reports to CSV rows
  const rows = reports.map(report => [
    report.id || '',
    report.zone || '',
    report.category || '',
    report.subcategory || '',
    report.status || 'pending',
    report.latitude || '',
    report.longitude || '',
    `"${(report.description || '').replace(/"/g, '""')}"`, // Escape quotes
    report.created_at || report.timestamp || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export reports to PDF format
 * @param {Array} reports - Array of report objects
 * @param {string} filename - Output filename
 * @param {object} options - PDF options
 */
export function exportToPDF(reports, filename = 'reports', options = {}) {
  if (!reports || reports.length === 0) {
    alert('No reports to export');
    return;
  }

  const { title = 'Lifelines Report Export', region = 'All Regions' } = options;

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Add title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 20);

  // Add metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Region: ${region}`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);
  doc.text(`Total Reports: ${reports.length}`, 14, 40);

  // Calculate stats
  const stats = {
    pending: reports.filter(r => r.status === 'pending' || !r.status).length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    rubble: reports.filter(r => r.category === 'rubble').length,
    hazard: reports.filter(r => r.category === 'hazard').length,
    blockedRoad: reports.filter(r => r.category === 'blocked_road').length,
  };

  // Add stats summary
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Summary:', 14, 50);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Pending: ${stats.pending} | In Progress: ${stats.inProgress} | Resolved: ${stats.resolved}`, 14, 56);
  doc.text(`Rubble: ${stats.rubble} | Hazard: ${stats.hazard} | Blocked Road: ${stats.blockedRoad}`, 14, 62);

  // Prepare table data
  const tableData = reports.map(report => [
    (report.id || '').substring(0, 8) + '...',
    report.zone || '-',
    formatCategory(report.category),
    formatStatus(report.status),
    report.latitude?.toFixed(4) || '-',
    report.longitude?.toFixed(4) || '-',
    (report.description || '-').substring(0, 40) + (report.description?.length > 40 ? '...' : ''),
    formatDate(report.created_at || report.timestamp),
  ]);

  // Add table using autoTable
  doc.autoTable({
    startY: 70,
    head: [['ID', 'Zone', 'Category', 'Status', 'Lat', 'Lng', 'Description', 'Date']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { cellWidth: 60 },
      7: { cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: 70 },
  });

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Lifelines Crisis Response Platform`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Download PDF
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export reports for a specific region
 */
export function exportRegionReports(reports, region, format = 'csv') {
  const regionName = region === 'all' ? 'all_regions' : region;
  const filename = `lifelines_${regionName}_reports`;

  if (format === 'csv') {
    exportToCSV(reports, filename);
  } else if (format === 'pdf') {
    exportToPDF(reports, filename, {
      title: `Lifelines Report Export - ${formatRegionName(region)}`,
      region: formatRegionName(region),
    });
  }
}

// Helper functions
function formatCategory(category) {
  const labels = {
    rubble: '🧱 Rubble',
    hazard: '⚠️ Hazard',
    blocked_road: '🚧 Blocked',
  };
  return labels[category] || category || '-';
}

function formatStatus(status) {
  const labels = {
    pending: '⏳ Pending',
    in_progress: '🔧 In Progress',
    resolved: '✅ Resolved',
  };
  return labels[status] || status || 'Pending';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function formatRegionName(region) {
  const names = {
    all: 'All Regions',
    palestine: 'Palestine',
    sudan: 'Sudan',
    yemen: 'Yemen',
    syria: 'Syria',
    ukraine: 'Ukraine',
    afghanistan: 'Afghanistan',
    lebanon: 'Lebanon',
    somalia: 'Somalia',
  };
  return names[region] || region;
}

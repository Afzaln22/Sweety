import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates and downloads a clinical-grade PDF blood glucose report.
 *
 * @param {Object} options
 * @param {string} options.userName
 * @param {string} options.userEmail
 * @param {string} options.reportType - 'daily' | 'monthly' | 'yearly'
 * @param {string} options.selectedPeriod - e.g. '2026-10' or '2026-11-12'
 * @param {Object} options.stats - { average, highest, lowest, count }
 * @param {Array} options.readings - array of reading objects
 */
export function generatePdfReport({
  userName = 'Alex Morgan',
  userEmail = 'alex.morgan@example.com',
  reportType = 'monthly',
  selectedPeriod = '2026-10',
  stats = {},
  readings = []
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor = [79, 70, 229]; // #4F46E5 Indigo
  const darkTextColor = [15, 23, 42]; // #0F172A Slate 900
  const mutedTextColor = [100, 116, 139]; // #64748B Slate 500
  const lightBgColor = [248, 250, 252]; // #F8FAFC
  const borderGray = [226, 232, 240]; // #E2E8F0

  // 1. Top Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 8, 'F'); // Top accent strip

  // Brand Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text('sweety', margin, 42);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedTextColor);
  doc.text('GLUCOSE CARE', margin + 78, 38);

  // Document Title (Right Aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkTextColor);
  doc.text('Clinical Glucose Report', pageWidth - margin, 38, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  const now = new Date();
  const exportDateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  doc.text(`Generated: ${exportDateStr}`, pageWidth - margin, 52, { align: 'right' });

  // Divider Line
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(1);
  doc.line(margin, 64, pageWidth - margin, 64);

  // 2. Patient & Period Summary Box
  doc.setFillColor(...lightBgColor);
  doc.roundedRect(margin, 76, contentWidth, 72, 8, 8, 'F');
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, 76, contentWidth, 72, 8, 8, 'S');

  // Left Column: Patient Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedTextColor);
  doc.text('PATIENT INFORMATION', margin + 14, 94);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkTextColor);
  doc.text(userName || 'Alex Morgan', margin + 14, 110);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  doc.text(userEmail || 'alex.morgan@example.com', margin + 14, 126);

  // Right Column: Reporting Period & Target Range
  const periodLabel =
    reportType === 'daily'
      ? `Daily (${selectedPeriod})`
      : reportType === 'monthly'
      ? `Monthly (${selectedPeriod})`
      : `Yearly (${selectedPeriod})`;

  const rightColX = margin + contentWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedTextColor);
  doc.text('REPORTING SCOPE & TARGET', rightColX, 94);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkTextColor);
  doc.text(periodLabel, rightColX, 110);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text('Target: 70 – 140 mg/dL (ADA Standard)', rightColX, 126);

  // 3. Clinical Metrics Cards (4 Stat Boxes)
  const cardY = 162;
  const cardGap = 10;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cardHeight = 62;

  const statCards = [
    {
      title: 'AVERAGE GLUCOSE',
      value: stats.average ? `${stats.average} mg/dL` : '—',
      color: primaryColor,
      sub: 'Mean concentration'
    },
    {
      title: 'HIGHEST READING',
      value: stats.highest ? `${stats.highest} mg/dL` : '—',
      color: stats.highest > 140 ? [225, 29, 72] : primaryColor, // Rose if spike
      sub: stats.highest > 140 ? 'Review trend' : 'Within target'
    },
    {
      title: 'LOWEST READING',
      value: stats.lowest ? `${stats.lowest} mg/dL` : '—',
      color: stats.lowest < 70 ? [217, 119, 6] : primaryColor, // Amber if dip
      sub: stats.lowest < 70 ? 'Hypoglycemia alert' : 'Optimal floor'
    },
    {
      title: 'TOTAL READINGS',
      value: `${stats.count || readings.length || 0}`,
      color: darkTextColor,
      sub: 'Logged check-ins'
    }
  ];

  statCards.forEach((card, index) => {
    const x = margin + index * (cardWidth + cardGap);
    doc.setFillColor(...lightBgColor);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 6, 6, 'F');
    doc.setDrawColor(...borderGray);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 6, 6, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...mutedTextColor);
    doc.text(card.title, x + 10, cardY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...card.color);
    doc.text(card.value, x + 10, cardY + 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedTextColor);
    doc.text(card.sub, x + 10, cardY + 50);
  });

  // 4. Detailed Readings Table
  const tableData = readings.map((r, i) => {
    const val = Number(r.glucose_value);
    let statusText = 'Normal (In range)';
    if (val > 140) statusText = 'Elevated (Spike)';
    else if (val < 70) statusText = 'Low (Dip)';

    return [
      String(i + 1),
      r.reading_date || selectedPeriod,
      r.slot || 'Check-in',
      `${val} mg/dL`,
      r.recorded_at || '—',
      statusText
    ];
  });

  // Calculate table empty placeholder if no readings
  const finalTableData =
    tableData.length > 0
      ? tableData
      : [['—', selectedPeriod, 'No readings recorded for this period', '—', '—', 'Empty']];

  autoTable(doc, {
    startY: cardY + cardHeight + 18,
    margin: { left: margin, right: margin, bottom: 40 },
    head: [['#', 'Date', 'Time Slot', 'Glucose Value', 'Time Logged', 'Clinical Status']],
    body: finalTableData,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249], // Slate 100
      textColor: darkTextColor,
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 8
    },
    bodyStyles: {
      textColor: darkTextColor,
      fontSize: 8.5,
      cellPadding: 7,
      lineColor: borderGray,
      lineWidth: { bottom: 0.5 }
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 120 },
      3: { cellWidth: 85, fontStyle: 'bold' },
      4: { cellWidth: 75 },
      5: { cellWidth: 'auto', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Color-code the clinical status column
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text.includes('Elevated')) {
          data.cell.styles.textColor = [225, 29, 72]; // Rose
        } else if (text.includes('Low')) {
          data.cell.styles.textColor = [217, 119, 6]; // Amber
        } else if (text.includes('Normal')) {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald
        }
      }
    }
  });

  // 5. Medical Consultation Footer on Every Page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedTextColor);
    doc.text(
      'Medical Disclaimer: Sweety is for tracking and consultation. Clinical decisions should be made with a licensed physician.',
      margin,
      pageHeight - 20
    );

    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 20, {
      align: 'right'
    });
  }

  // Trigger browser download
  const cleanFilename = `sweety-glucose-report-${reportType}-${selectedPeriod}.pdf`;
  doc.save(cleanFilename);
}

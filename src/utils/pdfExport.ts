import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatasetProfile, DescriptiveStatRow, ModelScore, DecisionResult, ForecastResult } from '../types';

interface ReportData {
  datasetName: string;
  profile: DatasetProfile;
  stats: DescriptiveStatRow[];
  mlResults?: {
    target: string;
    bestModel: string;
    comparison: ModelScore[];
  };
  decision?: DecisionResult;
  forecast?: ForecastResult;
}

export function generatePdfReport(report: ReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('InsightAI Intelligence Report', 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 32);
  doc.text(`Dataset: ${report.datasetName}`, pageWidth - 14, 32, { align: 'right' });

  let currentY = 50;

  // Section 1: Executive Overview
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Dataset Health & Architecture', 14, currentY);
  currentY += 8;

  const overviewRows = [
    ['Total Records (Rows)', `${report.profile.rows.toLocaleString()}`, 'Total Features (Columns)', `${report.profile.columns}`],
    ['Numeric Columns', `${report.profile.numericColumns.length}`, 'Categorical Columns', `${report.profile.categoricalColumns.length}`],
    ['Missing Values', `${report.profile.totalMissing} (${report.profile.missingPercentage.toFixed(1)}%)`, 'Duplicate Rows', `${report.profile.duplicateRows}`],
    ['Memory Footprint', `~${report.profile.memoryEstimateKb} KB`, 'Integrity Status', report.profile.totalMissing === 0 ? 'Optimal (100%)' : 'Imputation Recommended'],
  ];

  autoTable(doc, {
    startY: currentY,
    body: overviewRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 14;

  // Section 2: Key Statistical Summary
  if (report.stats.length > 0) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Descriptive Statistical Highlights', 14, currentY);
    currentY += 8;

    const statsHeaders = [['Feature', 'Count', 'Mean', 'Std Dev', 'Min', 'Median', 'Max']];
    const statsRows = report.stats.slice(0, 8).map((s) => [
      s.feature,
      s.count,
      s.mean !== null ? s.mean : '—',
      s.std !== null ? s.std : '—',
      s.min !== null ? s.min : '—',
      s.median !== null ? s.median : '—',
      s.max !== null ? s.max : '—',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: statsHeaders,
      body: statsRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8, cellPadding: 2.5 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 14;
  }

  // Section 3: Machine Learning Benchmark
  if (report.mlResults) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Machine Learning & Predictive Modeling', 14, currentY);
    currentY += 8;

    const mlHeaders = [['Model Algorithm', 'Primary Metric', 'Score', 'Training Latency']];
    const mlRows = report.mlResults.comparison.map((m) => [
      m.modelName,
      m.primaryMetricName,
      typeof m.primaryMetricScore === 'number' ? `${m.primaryMetricScore}%` : m.primaryMetricScore,
      `${m.trainingTimeMs} ms`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: mlHeaders,
      body: mlRows,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8, cellPadding: 2.5 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 14;
  }

  // Section 4: Decision & Strategic Guidance
  if (report.decision) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Strategic Decision Intelligence', 14, currentY);
    currentY += 8;

    const decisionRows = [
      ['Evaluated Question', report.decision.businessQuestion],
      ['Final Recommendation', report.decision.decision],
      ['Risk Assessment', `${report.decision.risk} Risk`],
      ['Decision Score', `${report.decision.score} / 100`],
      ['Forecast Trajectory', report.decision.forecastDirection],
      ['Executive Guidance', report.decision.recommendation],
    ];

    autoTable(doc, {
      startY: currentY,
      body: decisionRows,
      theme: 'grid',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, fillColor: [241, 245, 249] },
        1: { cellWidth: 130 },
      },
      styles: { fontSize: 8.5, cellPadding: 3 },
    });
  }

  // Save / Download PDF
  const filename = `${report.datasetName.replace(/[^a-zA-Z0-9]/g, '_')}_InsightAI_Report.pdf`;
  doc.save(filename);
}

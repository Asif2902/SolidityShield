import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SecurityResult } from "@shared/schema";

interface AnalysisScores {
  security: number;
  gas: number;
  codeQuality: number;
  bestPractices: number;
  overall: number;
}

export function generateAuditReport(
  code: string,
  results: SecurityResult[],
  scores: AnalysisScores
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Title
  doc.setFontSize(20);
  doc.text('Smart Contract Security Audit Report', pageWidth / 2, 20, { align: 'center' });
  
  // Date
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });

  // Overall Score
  doc.setFontSize(16);
  doc.text('Analysis Scores', 14, 45);
  
  const scoreData = [
    ['Category', 'Score'],
    ['Overall', `${scores.overall}/100`],
    ['Security', `${scores.security}/100`],
    ['Gas Optimization', `${scores.gas}/100`],
    ['Code Quality', `${scores.codeQuality}/100`],
    ['Best Practices', `${scores.bestPractices}/100`],
  ];

  autoTable(doc, {
    startY: 50,
    head: [scoreData[0]],
    body: scoreData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
  });

  // Issues Summary
  const issuesBySeverity = results.reduce((acc, result) => {
    acc[result.severity] = (acc[result.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summaryData = Object.entries(issuesBySeverity).map(([severity, count]) => [
    severity.toUpperCase(),
    count.toString()
  ]);

  doc.text('Issues Summary', 14, doc.lastAutoTable.finalY + 20);
  
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 25,
    head: [['Severity', 'Count']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
  });

  // Detailed Findings
  doc.addPage();
  doc.text('Detailed Findings', 14, 20);

  const findingsData = results.map(result => [
    result.severity.toUpperCase(),
    result.title,
    result.description,
    result.line ? `Line ${result.line}` : 'N/A',
    result.recommendation
  ]);

  autoTable(doc, {
    startY: 25,
    head: [['Severity', 'Issue', 'Description', 'Location', 'Recommendation']],
    body: findingsData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { cellWidth: 45 },
      3: { cellWidth: 25 },
      4: { cellWidth: 50 }
    },
    styles: { overflow: 'linebreak', cellPadding: 2 },
  });

  // Code Snippet
  doc.addPage();
  doc.text('Analyzed Code', 14, 20);
  
  autoTable(doc, {
    startY: 25,
    head: [['Smart Contract Code']],
    body: [[code]],
    theme: 'plain',
    styles: { overflow: 'linebreak', cellPadding: 2, fontSize: 8 },
  });

  // Disclaimer
  doc.addPage();
  doc.setFontSize(12);
  doc.text('Disclaimer', 14, 20);
  doc.setFontSize(10);
  const disclaimer = `This report was generated automatically by the Solidity Security Analyzer tool. While we strive to provide accurate and comprehensive analysis, this tool should not be considered a replacement for professional smart contract auditing services. Always consult with professional auditors and conduct thorough testing before deploying any smart contract to production.`;
  doc.text(disclaimer, 14, 30, { maxWidth: pageWidth - 28 });

  return doc;
}

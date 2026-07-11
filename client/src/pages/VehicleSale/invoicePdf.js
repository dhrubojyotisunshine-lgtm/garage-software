import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// "Rs." is used instead of the ₹ glyph — the built-in PDF fonts don't include it.
const money = (n) => 'Rs. ' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fdate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

// Generate and download a full Vehicle Sale invoice as a real .pdf.
export function downloadInvoicePdf(sale) {
  if (!sale) return;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const M = 40;

  // ── Header: dealer (left) + invoice meta (right) ──
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text(sale.dealer?.name || 'Vehicle Sale', M, 46);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('TAX INVOICE', pw - M, 46, { align: 'right' });

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90);
  let y = 62;
  const dealerLines = [
    sale.dealer?.address, sale.dealer?.phone && `Phone: ${sale.dealer.phone}`,
    sale.dealer?.email, sale.dealer?.gstin && `GSTIN: ${sale.dealer.gstin}`
  ].filter(Boolean);
  dealerLines.forEach(l => { doc.text(String(l), M, y); y += 12; });

  doc.setTextColor(30);
  doc.text(`Invoice No: ${sale.invoiceNo || '-'}`, pw - M, 62, { align: 'right' });
  doc.text(`Date: ${fdate(sale.saleDate)}`, pw - M, 74, { align: 'right' });
  doc.text(`Sale Type: ${sale.saleType || '-'}`, pw - M, 86, { align: 'right' });
  if (sale.salesExecutive) doc.text(`Executive: ${sale.salesExecutive}`, pw - M, 98, { align: 'right' });

  y = Math.max(y, 104) + 6;

  // ── Bill To ──
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30);
  doc.text('Bill To', M, y); y += 14;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(60);
  const custLines = [
    sale.customer?.name, sale.customer?.mobile && `Mobile: ${sale.customer.mobile}`,
    sale.customer?.address, sale.customer?.email,
    sale.customer?.pan && `PAN: ${sale.customer.pan}`
  ].filter(Boolean);
  custLines.forEach(l => { doc.text(String(l), M, y); y += 12; });
  y += 6;

  // ── Vehicles ──
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['#', 'Vehicle Model', 'Variant', 'Color', 'Chassis No.', 'Engine No.', 'Price']],
    body: (sale.vehicles || []).map((v, i) => [
      i + 1, v.vehicleModel || '-', v.variant || '-', v.color || '-',
      v.chassisNumber || '-', v.engineNumber || '-', money(v.price)
    ]),
    styles: { fontSize: 8.5, cellPadding: 4 },
    headStyles: { fillColor: [243, 244, 246], textColor: 80, fontStyle: 'bold' },
    columnStyles: { 6: { halign: 'right' } }
  });

  // ── Amount summary (right half) ──
  const rows = [
    ['Ex-Showroom Price', money(sale.billing?.exShowroom)],
    ['GST', money(sale.billing?.gst)],
    ['TCS', money(sale.billing?.tcs)],
    ['Accessories', money(sale.billing?.accessories)],
    ['Net Vehicle Amount', money(sale.billing?.netVehicleAmount)],
    ['Total Insurance', money(sale.insurance?.totalInsurance)],
    ['Total RTO', money(sale.rto?.totalRto)],
    ['Gross Amount', money(sale.payment?.grossAmount)],
    ['Total Discount', money(sale.payment?.totalDiscount)],
    ['Net Payable', money(sale.payment?.netPayable)],
    ['Advance Paid', money(sale.payment?.advancePaid)],
    ['Balance Amount', money(sale.payment?.balanceAmount)]
  ];
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    margin: { left: pw / 2, right: M },
    head: [['Description', 'Amount']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, lineColor: [209, 213, 219], lineWidth: 0.5 },
    headStyles: { fillColor: [243, 244, 246], textColor: 80, fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'left', textColor: 90 }, 1: { halign: 'right' } },
    didParseCell: (d) => {
      if (d.section !== 'body') return;
      const label = rows[d.row.index]?.[0];
      if (['Net Payable', 'Balance Amount', 'Gross Amount'].includes(label)) {
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fillColor = [249, 250, 251];
      }
    }
  });

  // ── Payment + narration ── (one field per line so nothing is clipped)
  const pay = sale.payment || {};
  let fy = doc.lastAutoTable.finalY + 18;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(30);
  doc.text('Payment Details', M, fy); fy += 14;
  doc.setFont('helvetica', 'normal'); doc.setTextColor(60);
  [
    `Status: ${pay.paymentStatus || '-'}`,
    `Mode: ${pay.paymentMode || '-'}`,
    `Amount: ${money(pay.amount)}`,
    `Transaction ID / Ref No: ${pay.transactionId || '-'}`,
    `Payment Date: ${fdate(pay.paymentDate)}`
  ].forEach(l => { doc.text(String(l), M, fy, { maxWidth: pw - 2 * M }); fy += 12; });

  const wrap = (label, text) => {
    fy += 4;
    doc.setFont('helvetica', 'bold'); doc.text(label, M, fy);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(String(text), pw - 2 * M);
    lines.forEach((ln, i) => doc.text(ln, M, fy + 12 + i * 12));
    fy += 12 + lines.length * 12;
  };
  if (sale.narration) wrap('Narration', sale.narration);
  if (sale.remark) wrap('Remark', sale.remark);

  doc.save(`invoice-${sale.invoiceNo || 'sale'}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

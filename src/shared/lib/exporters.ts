import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportRow = Record<string, string | number>;

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCSV(filename: string, rows: ExportRow[]) {
  if (!rows.length) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  download(
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
}

export function exportXLSX(filename: string, rows: ExportRow[], sheetName = "Revenue") {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function exportPDF(opts: {
  filename: string;
  title: string;
  subtitle?: string;
  rows: ExportRow[];
  totals?: { label: string; value: string }[];
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 76, 58);
  doc.rect(0, 0, pageW, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Kwali Area Council — Smart Revenue Platform", 40, 28);
  doc.setFontSize(10);
  doc.text(opts.title, 40, 46);
  doc.setTextColor(40, 40, 40);
  if (opts.subtitle) {
    doc.setFontSize(9);
    doc.text(opts.subtitle, 40, 78);
  }
  if (opts.totals?.length) {
    doc.setFontSize(10);
    opts.totals.forEach((t, i) => {
      const x = 40 + i * 200;
      doc.setTextColor(120, 120, 120);
      doc.text(t.label, x, 100);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.text(t.value, x, 118);
      doc.setFontSize(10);
    });
  }
  const head = opts.rows.length ? [Object.keys(opts.rows[0])] : [["No data"]];
  const body = opts.rows.map((r) => Object.values(r).map((v) => String(v)));
  autoTable(doc, {
    startY: opts.totals?.length ? 140 : 90,
    head,
    body,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [15, 76, 58], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
  });
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 40, doc.internal.pageSize.getHeight() - 20);
  doc.save(opts.filename.endsWith(".pdf") ? opts.filename : `${opts.filename}.pdf`);
}

export function exportIdCardPDF(opts: {
  filename: string;
  idNo: string;
  name: string;
  lines: { label: string; value: string }[];
  footer?: string;
}) {
  // Landscape ID-card canvas.
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: [340, 216] });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Header band
  doc.setFillColor(15, 76, 58);
  doc.rect(0, 0, w, 52, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("Kwali Area Council", 18, 24);
  doc.setFontSize(8);
  doc.text("Digital Market ID · KURCMS", 18, 40);

  // Name + ID
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(14);
  doc.text(opts.name, 18, 78);
  doc.setTextColor(15, 76, 58);
  doc.setFontSize(11);
  doc.text(opts.idNo, 18, 96);

  // Line items (left column)
  let y = 120;
  doc.setFontSize(8.5);
  opts.lines.forEach((l) => {
    doc.setTextColor(120, 120, 120);
    doc.text(l.label, 18, y);
    doc.setTextColor(20, 20, 20);
    doc.text(String(l.value), 150, y, { align: "right" });
    y += 16;
  });

  // Deterministic QR-like block (right side)
  const seed = opts.idNo.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cell = 9;
  const grid = 8;
  const ox = w - 18 - grid * cell;
  const oy = 72;
  doc.setFillColor(15, 76, 58);
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const on =
        (r * 37 + c * 17 + seed) % 7 < 3 || r === 0 || c === 0 || r === grid - 1 || c === grid - 1;
      if (on) doc.rect(ox + c * cell, oy + r * cell, cell - 1, cell - 1, "F");
    }
  }

  // Footer
  doc.setDrawColor(220, 220, 220);
  doc.line(18, h - 26, w - 18, h - 26);
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.text(opts.footer ?? "KSRP · Kwali Smart Revenue Platform", 18, h - 14);
  doc.text("Verify at kwali.gov.ng/verify", w - 18, h - 14, { align: "right" });

  doc.save(opts.filename.endsWith(".pdf") ? opts.filename : `${opts.filename}.pdf`);
}

export function exportReceiptPDF(opts: {
  filename: string;
  receiptNo: string;
  payerName: string;
  lines: { label: string; value: string }[];
  amount: string;
  note?: string;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a5" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(15, 76, 58);
  doc.rect(0, 0, pageW, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text("Kwali Area Council", 32, 36);
  doc.setFontSize(9);
  doc.text("Unified Revenue & Compliance — Official Receipt", 32, 54);
  doc.setFontSize(8);
  doc.text(`Receipt No: ${opts.receiptNo}`, 32, 72);

  // Payer
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.text(opts.payerName, 32, 122);
  doc.setDrawColor(220, 220, 220);
  doc.line(32, 132, pageW - 32, 132);

  // Line items
  let y = 156;
  doc.setFontSize(10);
  opts.lines.forEach((l) => {
    doc.setTextColor(120, 120, 120);
    doc.text(l.label, 32, y);
    doc.setTextColor(20, 20, 20);
    doc.text(l.value, pageW - 32, y, { align: "right" });
    y += 22;
  });

  // Amount box
  y += 8;
  doc.setFillColor(240, 249, 244);
  doc.roundedRect(32, y, pageW - 64, 46, 6, 6, "F");
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text("AMOUNT PAID", 46, y + 20);
  doc.setTextColor(15, 76, 58);
  doc.setFontSize(18);
  doc.text(opts.amount, pageW - 46, y + 30, { align: "right" });

  // Footer
  const bottom = doc.internal.pageSize.getHeight();
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  if (opts.note) doc.text(opts.note, 32, bottom - 54);
  doc.text("This is a computer-generated receipt. Verify at kwali.gov.ng/verify", 32, bottom - 38);
  doc.text(`Issued ${new Date().toLocaleString()}`, 32, bottom - 24);

  doc.save(opts.filename.endsWith(".pdf") ? opts.filename : `${opts.filename}.pdf`);
}

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
  download(filename.endsWith(".csv") ? filename : `${filename}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8;" }));
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

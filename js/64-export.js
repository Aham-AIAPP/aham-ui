// ── Export (rules/4-页面.md 4.10) ────────────────────────────────────────────
// Rows to CSV with the columns, order and headings the user sees. A UTF-8 byte order mark lets Excel read Chinese.
// columns: [{ key, label, value?(row) }]. Cells that start with = + - @ get a leading apostrophe so a spreadsheet
// does not run them as formulas.
export function toCSV(rows, columns) {
  const cell = v => {
    let t = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
    return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lines = [columns.map(c => cell(c.label)).join(','), ...rows.map(r => columns.map(c => cell(c.value ? c.value(r) : r[c.key])).join(','))];
  return `﻿${lines.join('\r\n')}\r\n`;
}
export function downloadText(name, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


// ── File checks (rules/5-单据.md 5.13, pure) ───────────────────────────────────

// Checks one file against the accepted extensions ('.pdf', '.step') and a size limit in bytes. null = accepted.
export function checkFile(file, { accept = [], maxSize = Infinity } = {}) {
  const name = String(file?.name ?? ''), dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : '';
  if (accept.length && !accept.some(a => a.toLowerCase() === ext)) return `不支持的类型${ext ? ` ${ext}` : ''}`;
  if (!file.size) return '空文件';
  if (file.size > maxSize) return `超过 ${formatBytes(maxSize)}`;
  return null;
}
export function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '–';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${i && n < 10 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
}

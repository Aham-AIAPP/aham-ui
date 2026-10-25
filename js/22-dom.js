// ── DOM helpers: icons, escaping, ids ────────────────────────────────────────
const ICONS = typeof document !== 'undefined' ? new URL('./assets/icons/aham-icons.svg', import.meta.url).href : '';
export const icon = name => `<svg aria-hidden="true"><use href="${ICONS}#i-${name}"/></svg>`;
export const escapeHtml = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
let uid = 0;


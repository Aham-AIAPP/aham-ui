// ── Drop zone (rules/5-单据.md 5.13) ───────────────────────────────────────────
// Drop zone: drag files or a folder onto .wb-drop, or use its [data-drop="files" | "folder"] buttons (the keyboard path).
// Every file comes back once, checked: onFiles([{ file, name, path, size, error }]). The product uploads, shows progress
// and retries; nothing here talks to a server. A .zip is one file: unpacking happens on the server.
const hasFiles = e => [...(e.dataTransfer?.types || [])].includes('Files');
async function walkEntry(entry, prefix = '') {
  if (entry.isFile) return [{ file: await new Promise((ok, fail) => entry.file(ok, fail)), path: prefix + entry.name }];
  const reader = entry.createReader(), found = [];
  for (let batch; (batch = await new Promise((ok, fail) => reader.readEntries(ok, fail))).length;) found.push(...batch);
  return (await Promise.all(found.map(child => walkEntry(child, `${prefix}${entry.name}/`)))).flat();
}
export function initDropZone(zone, { accept = [], maxSize = Infinity, onFiles }) {
  const inputs = [...zone.querySelectorAll('input[type=file]')];
  inputs.forEach(input => { if (accept.length && !input.hasAttribute('webkitdirectory')) input.accept = accept.join(','); });
  const deliver = list => {
    const items = list.map(({ file, path }) => ({ file, name: file.name, path: path || file.webkitRelativePath || file.name, size: file.size, error: checkFile(file, { accept, maxSize }) }));
    if (items.length) onFiles?.(items);
  };
  let depth = 0;
  const over = on => { if (on) zone.dataset.drag = 'over'; else delete zone.dataset.drag; };
  zone.addEventListener('dragenter', e => { if (!hasFiles(e)) return; e.preventDefault(); depth++; over(true); });
  zone.addEventListener('dragover', e => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  zone.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) over(false); });
  zone.addEventListener('drop', async e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    over(false);
    // Entries must be read before the first await: the browser empties dataTransfer after the event.
    const entries = [...e.dataTransfer.items].map(i => i.webkitGetAsEntry?.()).filter(Boolean);
    deliver(entries.length ? (await Promise.all(entries.map(entry => walkEntry(entry)))).flat() : [...e.dataTransfer.files].map(file => ({ file })));
  });
  const open = (folder = false) => inputs.find(i => i.hasAttribute('webkitdirectory') === folder)?.click();
  zone.addEventListener('click', e => { const b = e.target.closest?.('[data-drop]'); if (b) open(b.dataset.drop === 'folder'); });
  inputs.forEach(input => input.addEventListener('change', () => { deliver([...input.files].map(file => ({ file }))); input.value = ''; }));
  return { open };
}


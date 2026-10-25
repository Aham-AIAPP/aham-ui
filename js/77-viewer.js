// ── File viewer (rules/5-单据.md 5.13) ─────────────────────────────────────────
// Aham renders no PDF or CAD itself: the product puts a rendered page (img, canvas or svg) into the viewer canvas
// and swaps it in onPage.
// File viewer: toolbar [data-viewer="prev|next|page|pages|zoom|zoom-out|zoom-in|fit|actual"], a focusable scroll area
// .wb-viewer-stage and the page .wb-viewer-canvas sized from its natural width × height. With the stage focused:
// + / − zoom, 0 fits the page, PageUp / PageDown turn pages, arrows scroll; ⌘ / Ctrl + wheel zooms; drag pans when zoomed.
// show({ page, x, y, width, height }) outlines a region in natural pixels, e.g. where a recognised field came from.
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
export function initViewer(root, { pages = 1, page = 1, width, height, onPage, onZoom } = {}) {
  const stage = root.querySelector('.wb-viewer-stage'), canvas = root.querySelector('.wb-viewer-canvas');
  const part = name => root.querySelector(`[data-viewer="${name}"]`);
  const size = { width: width ?? Number(canvas.dataset.width), height: height ?? Number(canvas.dataset.height) };
  let zoom = 1, fitted = true, drag = null;
  function paint() {
    canvas.style.width = `${Math.round(size.width * zoom)}px`;
    canvas.style.height = `${Math.round(size.height * zoom)}px`;
    if (part('zoom')) part('zoom').textContent = `${Math.round(zoom * 100)}%`;
    stage.dataset.pan = String(canvas.offsetWidth > stage.clientWidth || canvas.offsetHeight > stage.clientHeight);
  }
  function sync() {
    if (part('page')) { part('page').value = page; part('page').max = pages; }
    if (part('pages')) part('pages').textContent = pages;
    if (part('prev')) part('prev').disabled = page <= 1;
    if (part('next')) part('next').disabled = page >= pages;
  }
  function setZoom(z, fit = false) {
    zoom = Math.min(ZOOM_STEPS[ZOOM_STEPS.length - 1], Math.max(0.1, z));
    fitted = fit;
    paint();
    onZoom?.(zoom);
  }
  function fit() {
    const css = getComputedStyle(stage);
    const w = stage.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
    const h = stage.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
    setZoom(Math.min(w / size.width, h / size.height) || 1, true);
  }
  const step = dir => {
    const next = dir > 0 ? ZOOM_STEPS.find(s => s > zoom + 1e-3) : [...ZOOM_STEPS].reverse().find(s => s < zoom - 1e-3);
    if (next) setZoom(next);
  };
  function setPage(n) {
    const p = Math.min(pages, Math.max(1, Math.round(n) || 1));
    const turned = p !== page;
    page = p;
    sync();
    if (turned) onPage?.(page);
  }
  function show({ page: at, x, y, width: w, height: h }) {
    if (at) setPage(at);
    let mark = canvas.querySelector('.wb-viewer-mark');
    if (!mark) {
      mark = document.createElement('div');
      mark.className = 'wb-viewer-mark';
      mark.setAttribute('aria-hidden', 'true');
      canvas.append(mark);
    }
    const pct = v => `${(v * 100).toFixed(3)}%`;
    Object.assign(mark.style, { left: pct(x / size.width), top: pct(y / size.height), width: pct(w / size.width), height: pct(h / size.height) });
    mark.hidden = false;
    mark.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  const hide = () => { const mark = canvas.querySelector('.wb-viewer-mark'); if (mark) mark.hidden = true; };
  // Call after the product has put a new page into the canvas (sizes in natural pixels).
  function load({ width: w = size.width, height: h = size.height, pages: total = pages, page: at = page } = {}) {
    Object.assign(size, { width: w, height: h });
    pages = total;
    page = Math.min(pages, Math.max(1, at));
    sync();
    if (fitted) fit(); else paint();
  }
  root.addEventListener('click', e => {
    const b = e.target.closest?.('button[data-viewer]');
    const act = { prev: () => setPage(page - 1), next: () => setPage(page + 1), 'zoom-in': () => step(1), 'zoom-out': () => step(-1), fit, actual: () => setZoom(1) }[b?.dataset.viewer];
    act?.();
  });
  part('page')?.addEventListener('change', e => setPage(parseInt(e.target.value, 10)));
  stage.addEventListener('keydown', e => {
    if (e.target !== stage || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
    const act = { '+': () => step(1), '=': () => step(1), '-': () => step(-1), 0: fit, PageDown: () => setPage(page + 1), PageUp: () => setPage(page - 1) }[e.key];
    if (act) { e.preventDefault(); act(); }
  });
  stage.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); step(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0 || stage.dataset.pan !== 'true') return;
    drag = { x: e.clientX, y: e.clientY, left: stage.scrollLeft, top: stage.scrollTop };
    stage.setPointerCapture(e.pointerId);
    stage.dataset.dragging = '';
  });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    stage.scrollLeft = drag.left - (e.clientX - drag.x);
    stage.scrollTop = drag.top - (e.clientY - drag.y);
  });
  const endDrag = () => { drag = null; delete stage.dataset.dragging; };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => (fitted ? fit() : paint())).observe(stage);
  sync();
  fit();
  return { load, setPage, setZoom, fit, show, hide, page: () => page, zoom: () => zoom };
}


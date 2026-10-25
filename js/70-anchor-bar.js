// ── Anchor bar (rules/5-单据.md 5.1) ─────────────────────────────────────────
// One button per section; a click scrolls the section under the sticky head, scrolling marks the section on screen.
//   <nav class="wb-anchors" aria-label="分区"><button type="button" data-target="s-basic">基本信息</button>…</nav>
export function initAnchorBar(nav, { scroller }) {
  const life = scope();
  const buttons = [...nav.querySelectorAll('[data-target]')];
  const sections = buttons.map(b => document.getElementById(b.dataset.target)?.closest('section') || document.getElementById(b.dataset.target));
  let lock = 0;
  const mark = i => buttons.forEach((b, k) => { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  function current() {
    const top = nav.getBoundingClientRect().bottom + 8;
    let i = 0;
    sections.forEach((s, k) => { if (s && s.getBoundingClientRect().top <= top) i = k; });
    if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) i = sections.length - 1;
    return i;
  }
  life.on(nav, 'click', e => {
    const b = e.target.closest('[data-target]');
    if (!b) return;
    const i = buttons.indexOf(b), s = sections[i];
    lock = Date.now() + 600;
    mark(i);
    scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + s.getBoundingClientRect().top - nav.getBoundingClientRect().bottom - 16), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    s.querySelector('h2')?.setAttribute('tabindex', '-1');
    s.querySelector('h2')?.focus({ preventScroll: true });
  });
  const onScroll = () => { if (Date.now() > lock) mark(current()); };
  life.on(scroller, 'scroll', onScroll, { passive: true });
  mark(0);
  return { refresh: onScroll, destroy: life.end };
}


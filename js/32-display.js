// ── Display options ──────────────────────────────────────────────────────────
// Circle's "Display" popover: grouping and ordering rows, row height, then property chips that show or hide columns,
// and 恢复默认. The trigger is a filled small button; a dot (with hidden text) marks settings that differ from default.
// value / defaults: { group: key|null, sort: { field, dir }, density: 'standard'|'compact', columns: [[key, visible], …] }
export function initDisplay({ root, trigger, groups, sorts, columns, value, defaults, onChange }) {
  const life = scope();
  let state = structuredClone(value);
  const pop = document.createElement('div');
  pop.className = 'wb-popover form';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', '显示选项');
  root.append(pop);
  life.keep(() => pop.remove());
  const pick = s => JSON.stringify({ group: s.group, sort: s.sort, density: s.density, columns: s.columns });
  const changed = () => pick(state) !== pick(defaults);
  const label = key => columns.find(c => c.key === key)?.label ?? key;

  function renderTrigger() {
    trigger.innerHTML = `显示${changed() ? '<span class="wb-dot" aria-hidden="true"></span><span class="wb-sr-only">（已调整）</span>' : ''}`;
    trigger.setAttribute('aria-haspopup', 'dialog');
    if (!trigger.hasAttribute('aria-expanded')) trigger.setAttribute('aria-expanded', 'false');
  }
  function renderPop() {
    const token = document.activeElement?.dataset?.k ? `[data-k="${document.activeElement.dataset.k}"]${document.activeElement.dataset.col ? `[data-col="${document.activeElement.dataset.col}"]` : ''}` : null;
    const opt = (v, l, cur) => `<option value="${escapeHtml(v)}"${v === cur ? ' selected' : ''}>${escapeHtml(l)}</option>`;
    const asc = state.sort.dir === 'asc';
    pop.innerHTML = `<div class="wb-pop-section">
      <label class="wb-pop-field"><span>分组</span><select class="wb-field sm" data-k="group">${opt('', '不分组', state.group ?? '')}${groups.map(([k, l]) => opt(k, l, state.group)).join('')}</select></label>
      <div class="wb-pop-field"><span>排序</span><div class="wb-pop-row"><select class="wb-field sm" data-k="sort" aria-label="排序字段">${sorts.map(([k, l]) => opt(k, l, state.sort.field)).join('')}</select><button type="button" class="wb-icon-btn" data-k="dir" aria-label="${asc ? '当前升序，改为降序' : '当前降序，改为升序'}" title="${asc ? '升序' : '降序'}">${icon(asc ? 'chevron-up' : 'chevron-down')}</button></div></div>
      <div class="wb-pop-field"><span>行高</span><div class="wb-seg sm" role="group" aria-label="行高"><button type="button" data-k="density" data-v="standard" aria-pressed="${state.density === 'standard'}">标准</button><button type="button" data-k="density" data-v="compact" aria-pressed="${state.density === 'compact'}">紧凑</button></div></div>
    </div><div class="wb-pop-section"><div class="wb-pop-title">显示属性</div><div class="wb-toggle-chips">${state.columns.map(([k, on]) => `<button type="button" class="wb-toggle-chip" data-k="col" data-col="${escapeHtml(k)}" aria-pressed="${on}">${escapeHtml(label(k))}</button>`).join('')}</div></div>
    <div class="wb-pop-foot"><span>${changed() ? '已调整，只保存在本机' : '默认设置'}</span><button type="button" class="wb-btn sm ghost" data-k="reset"${changed() ? '' : ' disabled'}>恢复默认</button></div>`;
    if (token) (pop.querySelector(token) && !pop.querySelector(token).disabled ? pop.querySelector(token) : pop.querySelector('select'))?.focus({ preventScroll: true });
  }
  function update(mutate) {
    mutate(state);
    renderTrigger();
    renderPop();
    activePopover()?.place();
    onChange?.(structuredClone(state));
  }
  life.on(pop, 'change', e => {
    const t = e.target;
    if (t.dataset.k === 'group') update(s => { s.group = t.value || null; });
    else if (t.dataset.k === 'sort') update(s => { s.sort = { field: t.value, dir: s.sort.dir }; });
  });
  life.on(pop, 'click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const k = b.dataset.k;
    if (k === 'dir') update(s => { s.sort = { ...s.sort, dir: s.sort.dir === 'asc' ? 'desc' : 'asc' }; });
    else if (k === 'density') update(s => { s.density = b.dataset.v; });
    else if (k === 'col') update(s => { const c = s.columns.find(x => x[0] === b.dataset.col); c[1] = !c[1]; });
    else if (k === 'reset') update(s => Object.assign(s, structuredClone(defaults)));
  });
  life.on(trigger, 'click', () => { renderPop(); openPopover(trigger, pop, { align: 'end' }); });
  renderTrigger();
  return {
    get: () => structuredClone(state),
    set(next) { state = structuredClone(next); renderTrigger(); if (!pop.hidden) renderPop(); },
    destroy: life.end,
  };
}


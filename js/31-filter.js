// ── Filter controller ────────────────────────────────────────────────────────
// Circle / Linear filter: header button "筛选" (icon only once filters exist) → command menu of fields; typing also
// lists matching option values (quick filter). Applied filters show as four-part chips in a row under the header:
// field | operator | value | ✕, with an add button in front and 清除 at the end. Option values apply as you tick them;
// text, number and date apply as you type once valid. One filter per field.
// fields: [{ key, label, type, icon?, options?, unit?, parse?(input) → value, format?(value) → text }]
// counts(key, option, otherFilters) → number shown next to each option (optional).
export function initFilter({ root, trigger, bar, fields, value = [], counts, onChange }) {
  let filters = value.map(f => ({ ...f, values: [...f.values] }));
  const field = key => fields.find(f => f.key === key);
  const pop = document.createElement('div');
  pop.className = 'wb-popover flush';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  root.append(pop);
  const others = key => filters.filter(f => f.field !== key);
  const fmt = (f, v) => (f.format ? f.format(v) : String(v));

  function valueText(f, fd) {
    if (!filterComplete(f, fd.type)) return '…';
    if (fd.type === 'option') return f.values.length === 1 ? f.values[0] : `${f.values.length} 个${fd.label}`;
    if (f.op === 'between') return `${fmt(fd, f.values[0])} – ${fmt(fd, f.values[1])}${fd.unit ? ` ${fd.unit}` : ''}`;
    return `${fmt(fd, f.values[0])}${fd.unit ? ` ${fd.unit}` : ''}`;
  }
  function renderTrigger() {
    const n = filters.length;
    trigger.classList.toggle('icon-only', n > 0);
    trigger.innerHTML = n ? icon('filter') : '筛选';
    trigger.setAttribute('aria-label', n ? `添加筛选，已有 ${n} 个条件` : '筛选');
    trigger.setAttribute('aria-haspopup', 'dialog');
    if (!trigger.hasAttribute('aria-expanded')) trigger.setAttribute('aria-expanded', 'false');
  }
  function renderBar() {
    bar.hidden = !filters.length;
    if (!filters.length) { bar.innerHTML = ''; return; }
    const chips = filters.map(f => {
      const fd = field(f.field), op = operatorLabel(fd.type, f.op), val = valueText(f, fd);
      const full = fd.type === 'option' ? f.values.join('、') : val;
      return `<div class="wb-chip" role="group" aria-label="${escapeHtml(`${fd.label} ${op} ${full}`)}"><span class="wb-chip-field">${fd.icon ? icon(fd.icon) : ''}${escapeHtml(fd.label)}</span><button type="button" class="wb-chip-op" data-filter-op="${f.field}" data-anchor="op:${f.field}" aria-haspopup="dialog" aria-expanded="false" aria-label="${escapeHtml(`${fd.label}的条件：${op}`)}">${escapeHtml(op)}</button><button type="button" class="wb-chip-value" data-filter-value="${f.field}" data-anchor="value:${f.field}" aria-haspopup="dialog" aria-expanded="false" title="${escapeHtml(full)}" aria-label="${escapeHtml(`${fd.label}的值：${full}`)}"><span>${escapeHtml(val)}</span></button><button type="button" class="wb-chip-remove" data-filter-remove="${f.field}" aria-label="${escapeHtml(`移除筛选：${fd.label}`)}">${icon('close')}</button></div>`;
    }).join('');
    bar.innerHTML = `<div class="wb-filter-chips"><button type="button" class="wb-btn sm outline icon-only" data-filter-add data-anchor="add" aria-haspopup="dialog" aria-expanded="false" aria-label="添加筛选">${icon('filter')}</button>${chips}</div><button type="button" class="wb-btn sm ghost" data-filter-clear>清除</button>`;
  }
  function commit() {
    renderTrigger();
    renderBar();
    const p = activePopover();
    if (p?.panel === pop && !p.trigger.isConnected) {
      const next = bar.querySelector(`[data-anchor="${p.trigger.dataset.anchor}"]`) || bar.querySelector('[data-filter-add]') || trigger;
      p.trigger = next;
      next.setAttribute('aria-expanded', 'true');
      p.place();
    }
    onChange?.(filters.map(f => ({ ...f, values: [...f.values] })));
  }
  function upsert(next) {
    const i = filters.findIndex(f => f.field === next.field);
    if (i >= 0) filters[i] = next; else filters.push(next);
  }
  function show(anchor, build, label) {
    pop.setAttribute('aria-label', label);
    const open = activePopover();
    build();
    if (open?.panel === pop) { open.trigger = anchor; anchor.setAttribute('aria-expanded', 'true'); open.place(); (pop.querySelector('input') || pop.querySelector('[role=listbox]'))?.focus(); }
    else openPopover(anchor, pop, { align: 'start' });
  }

  function openFields(anchor) {
    show(anchor, () => {
      pop.innerHTML = '<div></div>';
      createCommand(pop.firstChild, {
        label: '筛选字段', placeholder: '筛选…',
        items: q => {
          const list = fields.map(f => ({ id: f.key, kind: 'field', label: f.label, icon: f.icon, arrow: true, group: 'fields' }));
          if (!q) return list;
          const quick = fields.filter(f => f.type === 'option').flatMap(f => {
            const cur = filters.find(x => x.field === f.key);
            return f.options.filter(o => o.toLowerCase().includes(q)).map(o => ({ id: `${f.key}:${o}`, kind: 'option', key: f.key, label: o, prefix: f.label, checked: Boolean(cur?.values.includes(o)), count: counts?.(f.key, o, others(f.key)), group: 'quick', always: true }));
          });
          return [...list, ...quick];
        },
        onSelect: (it, cmd) => {
          if (it.kind === 'field') { openValue(it.id, anchor, true); return; }
          toggleOption(it.key, it.label);
          cmd.render();
        },
      });
    }, '添加筛选');
  }
  function toggleOption(key, option) {
    const cur = filters.find(f => f.field === key);
    const values = cur ? (cur.values.includes(option) ? cur.values.filter(v => v !== option) : [...cur.values, option]) : [option];
    if (values.length) upsert({ field: key, op: fitOperator('option', cur?.op ?? 'is', values), values });
    else filters = others(key);
    commit();
  }
  function openValue(key, anchor, fromFields = false) {
    const fd = field(key);
    const back = fromFields ? () => openFields(anchor) : undefined;
    show(anchor, () => {
      if (fd.type === 'option') {
        const initial = new Set(filters.find(f => f.field === key)?.values ?? []);     // selected-first order is fixed while open, as in Circle
        pop.innerHTML = '<div></div>';
        createCommand(pop.firstChild, {
          label: `${fd.label}的值`, placeholder: `${fd.label}…`, onBack: back,
          items: () => {
            const cur = filters.find(f => f.field === key)?.values ?? [];
            const row = o => ({ id: o, label: o, checked: cur.includes(o), count: counts?.(key, o, others(key)), group: initial.has(o) ? 'selected' : 'rest' });
            return [...fd.options.filter(o => initial.has(o)).map(row), ...fd.options.filter(o => !initial.has(o)).map(row)];
          },
          onSelect: (it, cmd) => { toggleOption(key, it.id); cmd.render(); },
        });
        return;
      }
      valueEditor(fd, back);
    }, `筛选：${fd.label}`);
  }
  // Text / number / date editors apply live once the input is valid; an invalid entry keeps the last valid filter.
  function valueEditor(fd, back) {
    const cur = filters.find(f => f.field === fd.key) ?? { field: fd.key, op: FILTER_OPERATORS[fd.type][0][0], values: [] };
    const type = fd.type === 'number' ? 'text' : fd.type === 'date' ? 'date' : 'text';
    const shown = i => (cur.values[i] === undefined ? '' : fd.type === 'number' ? fmt(fd, cur.values[i]).replace(/,/g, '') : cur.values[i]);
    const ops = FILTER_OPERATORS[fd.type];
    pop.innerHTML = `<div class="wb-command wb-value-editor">
      <div class="wb-command-head">${back ? `<button type="button" class="wb-icon-btn" data-back aria-label="返回字段列表">${icon('chevron-left')}</button>` : ''}<span>${escapeHtml(fd.label)}</span></div>
      ${ops.length > 1 ? `<div class="wb-seg sm" role="group" aria-label="条件">${ops.map(([k, l]) => `<button type="button" data-op="${k}" aria-pressed="${k === cur.op}">${escapeHtml(l)}</button>`).join('')}</div>` : ''}
      <div class="wb-value-inputs"><input class="wb-field sm" type="${type}" data-v="0" value="${escapeHtml(shown(0))}" aria-label="${escapeHtml(fd.label)}${fd.unit ? `（${fd.unit}）` : ''}"${fd.type === 'number' ? ' inputmode="decimal"' : ''} placeholder="${fd.type === 'text' ? '输入关键字' : ''}"><span class="wb-value-to"${cur.op === 'between' ? '' : ' hidden'}>至</span><input class="wb-field sm" type="${type}" data-v="1" value="${escapeHtml(shown(1))}" aria-label="${escapeHtml(fd.label)}上限"${fd.type === 'number' ? ' inputmode="decimal"' : ''}${cur.op === 'between' ? '' : ' hidden'}>${fd.unit ? `<span class="wb-meta">${escapeHtml(fd.unit)}</span>` : ''}</div>
      <p class="wb-value-error" role="alert"></p>
    </div>`;
    const box = pop.firstElementChild, err = box.querySelector('.wb-value-error');
    let op = cur.op;
    const read = () => {
      const inputs = [...box.querySelectorAll('input')].slice(0, op === 'between' ? 2 : 1);
      const raw = inputs.map(i => i.value.trim());
      inputs.forEach(i => i.removeAttribute('aria-invalid'));
      err.textContent = '';
      if (raw.every(v => v === '')) { filters = others(fd.key); commit(); return; }
      if (raw.some(v => v === '')) return;               // range half-filled: wait
      let values = raw;
      if (fd.type === 'number') {
        values = raw.map(v => (fd.parse ? fd.parse(v) : Number(v)));
        const bad = values.findIndex(v => !Number.isFinite(v) || v < 0);
        if (bad >= 0) { inputs[bad].setAttribute('aria-invalid', 'true'); err.textContent = '填不小于 0 的数字'; return; }
      }
      if (op === 'between' && values[0] > values[1]) values = [values[1], values[0]];
      upsert({ field: fd.key, op, values });
      commit();
    };
    box.addEventListener('input', read);
    box.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); closePopover('done'); } else if (e.key === 'Backspace' && back && e.target.matches('input') && !e.target.value && e.target.dataset.v === '0') { e.preventDefault(); back(); } });
    box.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if ('back' in b.dataset) { back(); return; }
      if (b.dataset.op) {
        op = b.dataset.op;
        box.querySelectorAll('[data-op]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        box.querySelector('[data-v="1"]').hidden = op !== 'between';
        box.querySelector('.wb-value-to').hidden = op !== 'between';
        read();
      }
    });
  }
  function openOperator(key, anchor) {
    const f = filters.find(x => x.field === key), fd = field(key);
    const ops = fd.type === 'option' ? [fitOperator('option', 'is', f.values), fitOperator('option', 'isNot', f.values)] : FILTER_OPERATORS[fd.type].map(o => o[0]);
    show(anchor, () => {
      pop.innerHTML = '<div></div>';
      createCommand(pop.firstChild, {
        label: `${fd.label}的条件`, placeholder: '条件…', search: ops.length > 4,
        items: ops.map(k => ({ id: k, label: operatorLabel(fd.type, k), current: k === f.op })),
        onSelect: it => {
          const values = f.op === 'between' && it.id !== 'between' ? f.values.slice(0, 1) : f.values;
          upsert({ ...f, op: it.id, values });
          closePopover('done');
          commit();
          if (it.id === 'between' && !filterComplete(filters.find(x => x.field === key), fd.type)) {
            const v = bar.querySelector(`[data-filter-value="${key}"]`);
            if (v) openValue(key, v);
          }
        },
      });
    }, `${fd.label}的条件`);
  }

  trigger.addEventListener('click', () => openFields(trigger));
  bar.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if ('filterAdd' in d) openFields(b);
    else if (d.filterOp) openOperator(d.filterOp, b);
    else if (d.filterValue) openValue(d.filterValue, b);
    else if (d.filterRemove) {
      const i = filters.findIndex(f => f.field === d.filterRemove);
      filters = others(d.filterRemove);
      commit();
      (bar.querySelectorAll('[data-filter-remove]')[i] || bar.querySelector('[data-filter-remove]') || trigger).focus();
    } else if ('filterClear' in d) { filters = []; commit(); trigger.focus(); }
  });
  renderTrigger();
  renderBar();
  return {
    get: () => filters.map(f => ({ ...f, values: [...f.values] })),
    set(next) { filters = next.map(f => ({ ...f, values: [...f.values] })); renderTrigger(); renderBar(); },
    open: () => openFields(trigger),
  };
}


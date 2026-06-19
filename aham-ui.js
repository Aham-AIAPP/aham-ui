/* Aham UI — 最小交互（vanilla, 零依赖, data 属性驱动）
   这是「参考实现」：给需要行为的组件提供最简交互，便于样例可运行。
   生产中 AI 可用任意框架(React/Vue/Swift)重写，行为契约见下方注释。 */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // 页签：[data-tabs] 容器，.tab[data-target] 切换 [data-panel]
  $$("[data-tabs]").forEach((box) => {
    box.addEventListener("click", (e) => {
      const tab = e.target.closest(".tab[data-target]");
      if (!tab) return;
      $$(".tab", box).forEach((t) => t.classList.remove("tab--on"));
      tab.classList.add("tab--on");
      const scope = box.closest("[data-tabscope]") || document;
      $$("[data-panel]", scope).forEach((p) => (p.hidden = p.dataset.panel !== tab.dataset.target));
    });
  });

  // 表格排序：th.sortable[data-key]，点击在 asc/desc 间切换并重排 tbody 行
  $$("table[data-sortable]").forEach((tbl) => {
    tbl.querySelectorAll("th.sortable").forEach((th) => {
      th.addEventListener("click", () => {
        const tbody = tbl.tBodies[0];
        const idx = [...th.parentNode.children].indexOf(th);
        const asc = th.dataset.dir !== "asc";
        tbl.querySelectorAll("th.sortable .caret").forEach((c) => (c.textContent = ""));
        th.dataset.dir = asc ? "asc" : "desc";
        const caret = th.querySelector(".caret") || th.appendChild(Object.assign(document.createElement("span"), { className: "caret" }));
        caret.textContent = asc ? "↑" : "↓";
        [...tbody.rows]
          .sort((a, b) => {
            const x = a.cells[idx].innerText.trim(), y = b.cells[idx].innerText.trim();
            const nx = parseFloat(x.replace(/[^\d.-]/g, "")), ny = parseFloat(y.replace(/[^\d.-]/g, ""));
            const r = !isNaN(nx) && !isNaN(ny) ? nx - ny : x.localeCompare(y, "zh");
            return asc ? r : -r;
          })
          .forEach((row) => tbody.appendChild(row));
      });
    });
  });

  // 行展开：[data-expand] 切换其后带 .row-expand 的行
  $$("[data-expand]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tr = btn.closest("tr");
      const next = tr && tr.nextElementSibling;
      if (next && next.classList.contains("row-expand")) next.hidden = !next.hidden;
      btn.textContent = next && next.hidden ? "▸" : "▾";
    });
  });

  // 全选：[data-select-all] 同步同表 tbody 内 [data-row-check]，并给行加 aria-selected
  $$("[data-select-all]").forEach((all) => {
    all.addEventListener("change", () => {
      const tbl = all.closest("table");
      tbl.querySelectorAll("tbody [data-row-check]").forEach((cb) => {
        cb.checked = all.checked;
        cb.closest("tr").setAttribute("aria-selected", all.checked);
      });
    });
    all.closest("table").addEventListener("change", (e) => {
      const cb = e.target.closest("[data-row-check]");
      if (cb) cb.closest("tr").setAttribute("aria-selected", cb.checked);
    });
  });

  // 折叠：[data-accordion] 内 .ac-head 切换其后 .ac-body
  $$("[data-accordion]").forEach((acc) => {
    acc.addEventListener("click", (e) => {
      const head = e.target.closest(".ac-head");
      if (!head) return;
      const body = head.nextElementSibling;
      if (body && body.classList.contains("ac-body")) body.hidden = !body.hidden;
    });
  });

  // 树展开：.tree-caret 切换其所在 .tree-item 的兄弟 .tree-children
  $$(".tree").forEach((tree) => {
    tree.addEventListener("click", (e) => {
      const caret = e.target.closest(".tree-caret");
      if (!caret) return;
      const item = caret.closest(".tree-item");
      const kids = item && item.nextElementSibling;
      if (kids && kids.classList.contains("tree-children")) {
        kids.hidden = !kids.hidden;
        caret.textContent = kids.hidden ? "▸" : "▾";
      }
    });
  });

  // 浮层开关：[data-open="#id"] 打开、[data-close] 关闭、点 .scrim 关闭
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (opener) {
      const el = $(opener.dataset.open);
      if (el) el.hidden = false;
      const scrim = el && el.previousElementSibling;
      if (scrim && scrim.classList.contains("scrim")) scrim.hidden = false;
    }
    const closer = e.target.closest("[data-close]");
    if (closer) {
      const host = closer.closest("[hidden=false],.modal,.drawer,.cmdk,.notif-center") || closer.closest("div");
      // 关闭最近的浮层与其 scrim
      const layer = closer.closest(".modal,.drawer,.cmdk,.notif-center");
      if (layer) {
        layer.hidden = true;
        const scrim = layer.previousElementSibling;
        if (scrim && scrim.classList.contains("scrim")) scrim.hidden = true;
      }
    }
    if (e.target.classList.contains("scrim")) {
      e.target.hidden = true;
      const layer = e.target.nextElementSibling;
      if (layer) layer.hidden = true;
    }
  });

  // Esc 关闭所有可见浮层
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape")
      $$(".modal,.drawer,.cmdk,.notif-center,.scrim").forEach((el) => (el.hidden = true));
  });

  // 文件拖放视觉
  $$(".upload").forEach((u) => {
    ["dragover", "dragleave", "drop"].forEach((ev) =>
      u.addEventListener(ev, (e) => {
        e.preventDefault();
        u.classList.toggle("dragover", ev === "dragover");
      })
    );
  });
})();

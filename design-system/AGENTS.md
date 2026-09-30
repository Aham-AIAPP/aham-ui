# AGENTS.md — 给 AI 的消费指引

**你是 AI(编码/文档/设计 agent),要用 Aham UI 做界面或文档?先读完这页再动手。**

Aham UI 是机读设计规范 + 参考实现,目的是**让你产出一致结果,不要自由发挥**。设计性格:极简、克制、留白、内容优先;冷色的纸、克制的金属感、对话式。

## 一条铁律
**值只从 `tokens.json` 取,颜色只用调色板,字体只用两族(无衬线 Inter Variable + 等宽 Berkeley Mono / JetBrains Mono),间距/圆角/控件尺寸只用既定档位——绝不自创值、自创组件、加装饰。**

## 消费顺序
完整清单以 `library-consumption.json` 的 `readingOrder` 为准，README 与本页和它一致。
1. **取值** → `tokens.json`:含**亮+暗两套** + **文本样式体系**(11 样式) + **控件尺寸档** + 间距/圆角/阴影 + **v6.0 布局体系**(`breakpoint`/`contentWidth`/`grid`/`density`/`overlayWidth`/`dialog`/`track`/`canonicalLayout`)。直接引用,不改不近似。
2. **取规则** → `DESIGN.md`:**八层**完整规范(第 8 层 = 页面布局体系);做管理界面时接着读 `WORKBENCH.md`。
3. **查契约** → `components/index.json` 与 `components/{slug}.json`:结构、状态、禁止事项;预览页只作视觉参考。
4. **拼界面** → 基础层用 `aham-ui.css`:组件 + **文本样式类** `.text-display`…`.text-mono` + **布局类**(`.container`/`.grid-12`/`.page-header`/`.page-toolbar`/`.page-state`/`.preview`)+ **暗色**。不自创组件。交互契约见 `aham-ui.js`。工作台用 `workbench.css` + `workbench.js`。`colors_and_type.css` / `components.css` 只服务组件预览页。
5. **看成品** → `examples/`:`patterns.html`(页型)、`charts.html`(图表)、`composition.html`(组合规则)、`page-shell.html`(页面骨架)、`search-filter.html`(搜索筛选)、`preview.html`(预览)、`states.html`(空/加载/错误)。
6. **做 Office** → `aham-ui-office.md`。

## 做界面前先选"轨"(v6.0 关键)
**Aham 分四轨,布局心智不同——先声明你在做哪一轨,再套 §8 规则:**
- **网页轨**:先选 content（`.track-web` 居中收口）或 workbench（`.aham-workbench` 全宽工作台）。CRM 列表、单据和详情优先 workbench，先读 `WORKBENCH.md`。使用同一组 rem 断点；吸底 CTA 合法。
- **应用轨(macOS)**:`.track-app`,内容**左对齐铺满**、多余宽度展开 pane,dp 断点;**底部不放关键控件**;仅登录/向导/空态居中。
- **Office 轨**:Word 流式 / Excel 网格 / PPT 画布,见 `aham-ui-office.md`。
- **邮件轨**:table + 600px + 内联样式。
- **页面用视口断点,组件用容器查询**(`.cq`);页面三层 `.page-header` → `.page-toolbar` → `.page-content`。

## 八层(都在 DESIGN.md)
0 原则 · 1 基础 · 2 控件与组件 · 3 组合规则 · 4 模式 · 5 介质落地 · 6 输入 · 7 系统支撑 · **8 页面布局体系(多轨)**。

## 按任务怎么做
- **界面**:用 css class + 文本样式类;版式照 `examples/patterns.html`;**组合照第 3 章规则**(同心圆角=父圆角−间距、左缘对齐、一组一 primary、间距同一把尺子);交互照 `aham-ui.js`。
- **暗色**:加 `[data-theme="dark"]` 或跟随系统——组件引用语义 token,**自动适配**,无需改组件。
- **图表**:照 `examples/charts.html`——灰阶序列 + 当前项一个蓝、细轴线、mono 数字、阈值只染文字。
- **Office**:照 `aham-ui-office.md`——雅黑/Inter/Consolas、表格只横线、阈值只染文字、文档不做暗色。

## 产出前自查(= 第 7 章 lint,最常违反的)
- 状态用 **6px 点+文字**;可加状态图标,但必须配文字;不要 pill/色块/红黄绿灯。
- 表格**只横线**,无竖线/整行底色;数字右对齐 mono。
- 卡片**无边框无阴影**;选中=**扁平灰**,不是蓝。
- 蓝**只**在 logo/主操作/发送/焦点环/当前页签下划线/文字链接;主按钮底色用深一档 `#164EC3`,其余用 `#336EE8`;选中用灰。
- 一组**一个** primary;单一无衬线;内容区 `•`+文字,图标只在导航/工具栏/菜单/控件内部。
- 字体不从第三方服务器加载;需要统一字形时自托管。
- 颜色只来自 token 调色板;字体只用允许的几族;圆角只用档位。
- **不靠颜色单独传达**:每个状态/数据系列除颜色外必有图标/文字/形状(单蓝体系关键);纯图标按钮必有可访问名(aria-label);图表配文字/数据表替代。
- **布局(v6.0)**:先声明轨道;页面有 `.page-header`(标题左上、主操作右上、全页一个 primary);内容宽度命中 `--page-max/content-max/form-max/auth-max` 档之一,**不裸写宽度**;搜索框/结果计数**不置底**;**弹窗取消在左、确认在右**(默认绑 Return),破坏按钮不设默认、不上蓝;空态必给下一步;骨架占位 = 最终尺寸;用逻辑属性(`margin-inline`)不写死 left/right。

## 文件清单
| 文件 | 用途 |
|---|---|
| `tokens.json` | 值(机读,单一事实源,亮+暗+文本样式+尺寸档) |
| `DESIGN.md` | 规则(八层) |
| `WORKBENCH.md` | 网页工作台规则(管理界面) |
| `library-consumption.json` | 读取顺序的唯一清单 |
| `aham-ui.css` | 组件 + 文本样式类 + 暗色 |
| `aham-ui.js` | 交互契约 |
| `examples/patterns.html` | 页型成品 |
| `examples/charts.html` | 图表成品 |
| `examples/composition.html` | 组合规则示范 |
| `examples/page-shell.html` | 页面骨架(多轨/页眉/三层结构) v6.0 |
| `examples/search-filter.html` | 搜索与筛选布局 v6.0 |
| `examples/preview.html` | 预览模式(Quick Look 式) v6.0 |
| `examples/states.html` | 状态布局(空/加载/错误) v6.0 |
| `examples/data.html` `overlays.html` `status-viz.html` `extras.html` | 数据/浮层/可视化/新组件示范 |
| `aham-ui-office.md` | Office 落地 |

**拿不准就回到 `tokens.json` 和 `DESIGN.md`,不要猜。你的工作是执行这套规范,不是设计。**

## 工作台入口（7.2）
做 ToB 管理界面（列表、详情、单据、设置）时用网页工作台，按这个顺序读：
1. `WORKBENCH.md`：规则。§2 外框与页眉，§4–6 单据页，§9–10 列表与筛选，§11 列表键盘与详情，§12 快速操作，§13 设置页，§14 AI 协作。
2. `tokens.json` 的 `workbench` 组：全部尺寸，不自创值。
3. `components/index.json` 里的工作台契约：结构、状态、键盘、可访问性、禁止事项，多数写明 DOM 结构。
4. `workbench.css` + `workbench.js`：直接引用，不要重写。行为函数：`initShell`、`initPanels`、`initSearch`、`initFilter`、`initDisplay`、`createCommand`、`initListKeys`、`initPropertyPickers`、`initComposer`、`initPalette`、`registerShortcut`、`initContextMenu`、`openPicker`、`toast`、`openCreateDialog`、`initTheme`、`initTooltips`、`setSingleKeyShortcuts`、`createAIOutput`、`showSuggestion`、`openAIConfirm`、`setAIEnabled`。
5. `preview/workbench-*.html` 看组件状态，`examples/*.html` 看页面组合。

硬性要求：
- 列表页不用 `.page-header` 大标题，改用 40px 页眉横条；工作台用 full 宽度，不套 page-max。
- 快捷键只用 `components/shortcuts.json` 的保留键，并用 `registerShortcut` 登记；界面不显示未登记的按键。
- 浮层不级联，一次只开一个模态；Esc 每次只关最上面一层。
- 单个字母的快捷键要能在设置里关闭（`setSingleKeyShortcuts`）。
- AI 生成的内容要标记并列出依据；AI 改数据前必须弹窗确认，默认不开启 AI（WORKBENCH §14）。
- 取舍规则：颜色、形状听 Aham；字体栈、布局、交互、密度、键盘听 Linear；字号和字重仍用 Aham 的档位（WORKBENCH §1.1）。
- 原网页内容、macOS、Office 规范继续适用。

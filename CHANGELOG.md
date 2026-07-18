# Changelog 更新日志

本项目所有重要变更记录于此。
格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本 SemVer](https://semver.org/lang/zh-CN/)。
单一事实源在 `tokens.json`，下游（DESIGN.md / aham-ui.css / Office）全部派生。

## [Unreleased]
### 修复
- 全景页 `index.html` 顶栏版本徽章由硬编码 `v6.1` 改为**读取 `tokens.json` 动态显示**（离线兜底当前版本），并去掉 banner 示范里过时的具体版本文案——不再随发版过时。

## [7.0.2] - 2026-07-18

> **排版与布局规范补全**：对照 Apple HIG / Material 3 / IBM Carbon / Polaris / Fluent 2 / GOV.UK / Atlassian / Primer / Twilio Paste / Geist / Ant Design **11 家大厂**深度调研，确认现有规范 18 项与业界一致、7 项取值校准、**14 项缺口补全**。调研诊断报告见 `design-system/排版布局调研诊断.md`。**纯追加规则，不破坏既有 token 与组件。**

### 新增
- **§1.3.1 长文排版细则**（DESIGN.md）：CJK 正文行高 `1.75`（`--leading-cjk`，解决汉字字面占比 ~95% vs 西文 ~70% 导致中文偏紧）、段间距规则（`= 1×font-size`，禁首行缩进——无任何大厂用）、垂直韵律（行高对齐 4px 网格）、标题→正文分级间距、引用块衬线字体（`--font-serif`，参考 IBM Carbon）、代码块块级规则、图文 baseline 对齐（参考 Twilio Paste）。
- **§8.13 信息密集表格**（DESIGN.md）：列宽策略（留一列弹性填充 + `scroll.x`，参考 Ant Design）、横向溢出 + 冻结首列 + 表头吸顶、单元格截断（标题 truncate + tooltip，正文 wrap）、表头行高 = 数据行高不混用。
- **§8.14 仪表盘模块布局**（DESIGN.md）：Bento 模块用 Fixed-wide（1280px）不用 Fluid 流体栅格（Atlassian 明确警示：大视口下元素失去视觉关系）、模块间距 32–40px、Hybrid box 模式。
- **§8.15 表单布局**（DESIGN.md）：label 位置（短 label 左 / 长 label 上）、span 比例（8/16、6/18）、单表单内混用 horizontal + vertical（参考 Ant Design）、长表单 progressive disclosure 分步。
- **`preview/layout-longform.html`**：长文排版示范（标题层级、CJK 行高、段间距、引用块、代码块、图文 baseline 对齐）。
- **`preview/layout-dense.html`**：密集布局示范（信息密集表格 + Bento 仪表盘 + 混用表单）。
- **`排版布局调研诊断.md`**：11 家大厂对照诊断报告（18 项一致 / 7 项校准 / 14 项缺口 + 一手 URL 引用清单）。
- `tokens.json` 新增 `typography.cjkLineHeight`（`1.75`）、`spacing.paragraph`（段间距语义）、`--font-serif`（引用块衬线字体栈）。

### 变更
- **compact 密度行高 28→32**（对齐 IBM Carbon sm 32、Ant small ~39；28 偏小；触控/窄屏强制 comfortable 不用本档）。
- `colors_and_type.css` 头部版本标注由 `v6.1.0` 更新为 `v7.0.2`。

## [7.0.1] - 2026-07-11
### 修复
- **表格复选框由蓝改回墨色** `#262626`（守「选中 = 墨色，不用蓝」铁律；`preview/component-table.html` 的 `accent-color`）。
- **dashboard 导航图标不渲染**：`lucide.createIcons()` 在 React 异步挂载前就调用了，改为挂载后重试兜底。
- **GitHub Pages 部署**：新增 `.nojekyll`，自包含全景页按原样服务、不经 Jekyll（原失败为一次性 ID-token 超时，已随重推恢复）。
### 变更
- **README 章节统一到 Aham 家族模板**（为什么做 / 定位 / 能做什么 / 预览 / 开始使用 / 更新记录 / 关于 Aham / 关注·交流），与 aham-word / ppt / voice / survey 对齐；徽章补「联系我（微信）」与「在线全景」；「关于 Aham」矩阵补 Aham Word、Aham Excel（6 行）；预览配图刷新（dashboard / 图标 / 组件 / 色板）。
### 新增
- `ORIGIN.md`（来源与脱敏说明，对齐家族仓库）。

## [7.0.0] - 2026-07-11

> **结构重构**：仓库改为「门面在根 + 完整设计系统在 `design-system/`」。设计系统整体采用组件库 / skill 打包格式（更利于 AI 消费）；根只保留 README 门面、LICENSE、CHANGELOG、社区文件、社交封面、在线全景、调研 docs。**这是破坏性的路径变更（消费方引用需更新），发版建议 MAJOR（v7.0.0）。**

### 新增
- **`design-system/` 组件库 / skill 包**：17 个组件（button / input / card / dialog / table / nav / checkbox / radio / toggle / segmented / progress / slider / search / tooltip / popover / menu + **图标**）各带机读契约 `components/*.json` + 自包含预览 `preview/component-*.html`；并入 `components.css`（聚合组件 CSS）、`colors_and_type.css`（运行时变量）、`css.json`（机读 token 镜像）、`SKILL.md` / `library-consumption.json`（AI 入口与阅读顺序）、`ui_kits/dashboard/`（成品示范）。
- **图标作为一等组件**：`components/icon.json` 契约 + `preview/component-icon.html` 预览；`components.css` 增 `.icon` / `.icon-sm` / `-lg` / `-thin`。
- **图标层（Lucide · ISC · 51 起始语义图标）** 并入 `design-system/icons/`（雪碧图 `aham-icons.svg` + 语义映射 `icons.json`（含 `sfSymbol` 预留）+ 原始 SVG `lucide/` + ISC `LICENSE`）；`tokens.json` 新增 `icon` 语义组；`DESIGN.md` §1.6 落为具体集 + 分轨来源（web/Office/邮件 = Lucide，macOS app = SF Symbols 按名，后续）；全景页 `index.html` 新增「图标」节（内联雪碧图，自包含）。

### 变更
- 设计内容（`tokens.json` / `DESIGN.md` / `aham-ui.css` / `aham-ui.js` / `AGENTS.md` / `aham-ui-office.md` / `examples/`）整体移入 `design-system/`；根 README「怎么用」表改指新路径。
- 仓库迁移至新账号 [Aham-AIAPP](https://github.com/Aham-AIAPP)（旧账号不可用），全部链接更新；README 徽章行加「联系我（微信）」，「关于 Aham」加公众号/作者微信二维码，产品矩阵补 Aham Word。

### 修复
- `design-system/README.md`（品牌参考）修正一批**生成时误写的非品牌值**：语义色由 Google Material（`#34A853/#FBBC04/#EA4335`）改回 canonical（`#5A7A60/#8A7333/#9E3D31`）、ink `#1A1A1E`→`#262626`、border `#E5E5EA`→`#E7E7E7`、字号标度（display 28→44 等）与间距/圆角标度改回 `tokens.json` 真值；并**摆正单一事实源 = `tokens.json`**（原文误称 CSS 权威）。

### 移除
- `figma/`（未测试的 Figma 生成插件，经确认无用）。
- `docs.html`（与 `index.html` 重复）。


## [6.1.0] - 2026-06-21
### 新增
- 第 2 层新增 **2.9 媒体与对话**：9 个纳入自 AhamVoice 的招牌组件——媒体播放器 `.player`/`.player--mini`（灰阶波形 + 已播放段一抹蓝 + mono 时间码）、逐句转写 `.transcript` + 说话人标记 `.speaker-marker`（**形状区分类别、不靠颜色**）、正文排版 `.prose`、对话输入 `.composer`、附件卡 `.attachment`、头像 `.avatar`、侧栏三槽 `.sidebar__brand/__nav/__foot`、认证壳 `.auth-shell`、表单分组 `.form-section`；各带第 7 章 lint 自查。
- `aham-ui.css` 第 9 节承载上述 9 件 CSS（零类名冲突，只引既有 token）。
- `tokens.json` 新增 `avatar` 尺寸档（20/24/32/40/56）。
### 变更
- 全景展示页 `index.html` / `docs.html` 由不可维护的 JS 打包文件 **重建为手写自包含单页**，恢复原版「白卡 → 卡内灰底 demo 盒 + 中英标签」版式，并就地融入「媒体与对话」「页面布局」；顶栏含亮/暗切换；保留 OG/社交卡片。
- `组件全家福` 更名为 `组件库`。
### 移除
- 不再保留分散的二级示范目录与多处在线预览入口，全部集中到单页全景。

## [6.0.0] - 2026-06-21
### 新增
- DESIGN.md 第 8 层 **页面布局体系**（8.0 四轨总览 … 8.12 介质细则）：页面骨架与页型（Pane 模型 + Canonical Layouts）、页眉、搜索筛选、弹窗（选型决策树 + 按钮顺序）、状态、内容密度、预览模式、i18n/RTL、打印。
- `tokens.json` 新增 `contentWidth`/`grid`/`density`/`overlayWidth`/`dialog`/`aspectRatio`/`canonicalLayout`/`track` 八组。
- `aham-ui.css` 第 8 节：`.container`/`.grid-12`/`.cq`/`.page-header`/`.page-toolbar`/`.page-state`/`.notice`/`.preview`/`.ar-*` + rem 断点响应式。
- 示范页 `page-shell` / `search-filter` / `states` / `preview`。
### 变更
- 断点改为 **网页 rem 单一事实源 + 应用 dp 派生 + 高度断点**；按落地介质分四轨（网页 / 应用 / Office / 邮件）。
### 移除
- 废止 v5 断点 `sm380/md860/lg1280`。

## [5.1.0] - 2026-06-19
### 移除
- 删除 8 个与 `text-*` 重复的旧排版类 + 7 个死代码类。
### 变更
- docs 与示范页引用迁移到 `text-*`；CSS 757 → 728 行，无悬空引用。

## 更早历史（本仓库建立之前）
- **v5.0** — 对照 Apple HIG 完整性审计补全 30 项（Dynamic Type / Differentiate Without Color / VoiceOver / Drag and drop / 标准快捷键 / RTL / 隐私 等）。
- **v4.0** — 以 Apple HIG 框架重构为七层；新增文本样式体系、控件尺寸体系、组合规则层、暗色模式。
- **v3.1** — 重构为六层 + 补 19 个 B 端组件 + tokens 扩至 13 组。
- **v3.0** — Workbench 蓝色版（三层灰 + 蓝 + flat，砍衬线统一 Inter）。
- **v2.x / v1.x** — 早期 steel-blue 骨架（三层 token + DESIGN.md + tokens.json 成型）。

[Unreleased]: https://github.com/Aham-AIAPP/aham-ui/compare/v7.0.1...HEAD
[7.0.1]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.0.1
[7.0.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.0.0
[6.1.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v6.1.0
[6.0.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v6.0.0
[5.1.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v5.1.0

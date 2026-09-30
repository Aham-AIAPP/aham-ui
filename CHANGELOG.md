# Changelog 更新日志

本项目所有重要变更记录于此。
格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本 SemVer](https://semver.org/lang/zh-CN/)。
单一事实源在 `tokens.json`，下游（DESIGN.md / aham-ui.css / Office）全部派生。

## [Unreleased]

## [7.3.0] - 2026-09-30

> **字体改用 Linear 的字体栈**：无衬线 Inter Variable（随包附带 4.1），等宽 Berkeley Mono（未授权时 JetBrains Mono），开启 Linear 的 `cv01` / `ss03`；字号和字重仍用 Aham 的档位。

### 新增
- `design-system/fonts/` 附带 Inter Variable 4.1 的正体和斜体（取自 rsms/inter 的 v4.1 标签，与 Linear 自托管的版本相同）及 SIL OFL 授权文本。`fonts/inter.css` 声明字体，`aham-ui.css`、`workbench.css`、`colors_and_type.css` 在文件开头引入它。

### 变更
- **字体改用 Linear 的字体栈**，依据是 linear.app 样式表 `:root` 里的 `--font-regular` 和 `--font-monospace`（2026-09-30 核对）。无衬线 `Inter Variable` 在前，其后接 Linear 的系统字体回退，中文仍回退雅黑、黑体。等宽用 `Berkeley Mono`，未购买商业授权时由 `JetBrains Mono` 接替。
- 同 Linear，全局开启 Inter 字形特性 `cv01`、`ss03`，等宽处重置为 `normal`。新 token 为 `typography.fontFeatureSettings`，CSS 变量为 `--font-features` / `--wb-font-features`。
- `typography.fontFamily.sansDisplay` 改为 `sans` 的别名：Inter Variable 的光学尺寸轴按字号自动切换，不再单独用 Inter Display。
- 字重保持 400 / 500 / 600，不跟 Linear 的 510 / 590，原因写在 DESIGN §1.3。
- 取舍规则随之调整（DESIGN §8.16、WORKBENCH §1.1、AGENTS）：字体栈听 Linear，颜色、形状、字号和字重仍听 Aham。
- `scripts/lint-design.mjs` 增加字体变量核对：`aham-ui.css`、`colors_and_type.css` 的 `--font-sans`、`--font-mono`、`--font-features` 须与 tokens 一致。

### 移除
- token `typography.opticalSizeThreshold`（20px 阈值随 Inter Display 一起取消）。
- `colors_and_type.css`、`css.json` 里的 `--font-serif`，以及长文预览引用块的衬线字体；它们与 DESIGN §1.3.1「不引入衬线」冲突。
- 重复的 `design-system/排版布局调研诊断.md`：7.2.1 已归档到 `docs/`，原文件漏删。

### 修正
- `design-system/README.md` 里「Inter Display 从 Google Fonts 加载」的说明已过时（7.2.0 起不再远程加载），改为自托管和授权说明。

## [7.2.1] - 2026-09-30

> **次级按钮统一与仓库清理**：工作台次级按钮改为与基础层相同的白底描边，WORKBENCH 新增两层组件对照表；移除误提交的设计库镜像，归档调研诊断文档。

### 新增
- WORKBENCH §8 新增两层组件对照表：主按钮、次级按钮、文字按钮、危险按钮、分段控件、标签、焦点在基础层与工作台的类名和共同写法。
- 归档 v7.0.2 的排版布局调研诊断到 `docs/排版布局规范-调研诊断.md`。

### 变更
- 工作台次级按钮统一为白底 + 1px 分隔线描边，与基础层 `.btn--secondary` 相同；「显示」按钮随之从灰底改为描边。`.outline` 保留为兼容写法，外观与默认相同。

### 移除
- v7.0.2 时误提交的 `.design_library/` 设计库镜像（4 个文件，停在 7.0.2，仓库内无引用）。

## [7.2.0] - 2026-09-30

> **网页工作台扩展**：面向 ToB 管理软件，颜色、字体、圆角、状态写法沿用 Aham，布局与交互照 Circle（Linear 风格的开源实现）。新增规范 WORKBENCH §9–14、23 个工作台组合契约、4 个状态预览页、5 个页面示例，参考实现 `workbench.css` + `workbench.js`（零依赖）。示例只用虚构数据。

### 新增
- 工作台外框（7.2 P1）：导航展开 240px / 收起 52px，内容卡在白色层、宽屏离边 8px；1–2 条 40px 页眉横条，条内控件 28px；侧面板 240 / 400px 两档，一次只开一个。行为在新增的 `workbench.js`（⌘B 切换、窄屏浮层、Esc 关闭）。新增示例 `examples/workbench-shell.html`。
- `workbench.js` 新增层栈、弹层与页眉搜索；Esc 每次只关最上面一层。
- 工作台列表页（7.2 P2）：分组表格、吸顶表头与分组标题、四段式筛选条件（写进网址）、显示选项（存本机）、勾选后的批量条、翻页与空结果恢复入口。新增契约 `list-view` / `filter-bar` / `display-options` / `bulk-bar`、规范 WORKBENCH §9、示例 `examples/customer-list.html`。
- 列表筛选照 Circle / Linear：「筛选」描边按钮（有条件后缩成图标）→ 命令菜单选字段、快速筛选选项值 → 页眉下方筛选行显示四段式条件标签，行首添加、行尾清除；选项勾选即生效，文本 / 数字 / 日期边输入边生效。「显示」改为填充按钮，调整过加墨色圆点；显示选项改为分组 / 排序 / 行高 + 属性标签。
- 通用组件 `createCommand`（命令菜单）、`initFilter`、`initDisplay`，筛选语义 `FILTER_OPERATORS` / `matchesFilter` / 网址读写移入 `workbench.js`；新增契约 `command-menu`、状态预览页 `preview/workbench-filter.html`、规范 WORKBENCH §10。
- 列表键盘、预览与记录详情（7.2 P3）：当前行 ↑↓ 移动、空格预览、Enter 打开、x 勾选；详情页一条页眉带位置与上一条 / 下一条，720px 居中主内容，240px「标签 + 值」属性栏，动态流与 ⌘ / Ctrl + Enter 评论框。新增 `initListKeys` / `initPropertyPickers` / `initComposer`、契约 `list-keyboard` / `record-detail` / `properties-panel` / `activity-feed`、规范 WORKBENCH §11、预览页 `preview/workbench-detail.html`、示例 `examples/record-detail.html`。
- 快速操作（7.2 P4）：⌘K 命令面板（上下文标签、分组、子列表原地替换）、统一快捷键表与 ? 帮助、行右键菜单（Shift + F10，下级原地替换）、单元格就地改属性、右下角提示条（带撤销）、新建弹窗（继续新建、⌘ Enter、原地放弃确认）。新增 `initPalette` / `registerShortcut` / `initContextMenu` / `openPicker` / `toast` / `openCreateDialog`、6 个契约、规范 WORKBENCH §12、预览页 `preview/workbench-actions.html`；保留快捷键写入 `components/shortcuts.json`。
- 设置页（7.2 P5）：左侧分组设置导航、720px 居中内容、横线分隔的设置行、单项即时生效与提示条确认、破坏性操作放最后并确认。规范 WORKBENCH §13、契约 `settings-page`、示例 `examples/settings.html`。
- 全景页 `index.html` 重做，共 12 个区块，新增「间距、圆角与层次」一节。色板、文本样式、间距、图标、契约清单、读取顺序、版本号和数量由新增的 `scripts/build-panorama.mjs` 从包内文件生成，`--check` 进 CI；网页工作台区块用框内样例直接运行 5 个页面示例和 3 个状态预览页；浅色 / 深色 / 跟随系统三档主题，窄屏可用。
- 7.2 规划 `docs/workbench-7.2-plan.md`：列表页、侧面板、命令面板与快捷键，参考 Circle 的布局与交互。
- AI 协作（WORKBENCH §14）：入口放 ⌘K「AI」组和就地按钮；生成内容带标记和依据，可停止、重试；字段建议一次一条；AI 改数据前必须确认并可撤销；首次使用前征得同意，默认关闭。新增 `createAIOutput` / `showSuggestion` / `openAIConfirm` / `setAIEnabled`、契约 `ai-output` / `ai-suggestion` / `ai-confirm`、预览页 `preview/workbench-ai.html`、图标 `ai` 与 `stop`（Lucide）；示例文字在本地模拟，不连接模型。
- 取舍规则与工具感（WORKBENCH §1.1）：Aham 与 Linear 冲突时，颜色、字体、形状听 Aham；布局、交互、信息密度与键盘听 Linear。写明五条工具感做法。
- Linear 式范式进入通用层：按钮提示带快捷键（`initTooltips`，§12.7）；Shift + ↑↓ / Shift + 点击范围勾选（`initListKeys` 的 `onRange`）；⌘K 覆盖页面上的全部操作，列表示例补齐显示、预览、导航、主题、删除。
- 单键快捷键可整体关闭（`setSingleKeyShortcuts`，WCAG 2.1.4），设置页「常规」分区加开关。
- 主题参数：`initTheme` 读取 `?theme=light|dark` 并统一接管主题按钮，全景页样例框随页面主题切换。
- 工作台支持系统「增强对比度」（控件边界 3.45:1）和「减少动态效果」。
- 设计校验 `scripts/lint-design.mjs` 进 CI：tokens 与两层 CSS 变量逐项一致、色值白名单、30 组文字与控件对比度、表格竖线、远程字体；圆角越档给警告。
### 变更
- 报价单迁入新外框：导航按钮移到页眉，主题开关改为图标按钮，页脚删除；表头不再折行。
- 工作台通用类统一为 `wb-` 前缀、变量为 `--wb-`；报价单专用样式移到 `examples/crm-quotation.css`。报价示例外观不变（三种宽度、六种状态逐元素比对无差异）。
- 工作台浮层的圆角改为 8px（基础 popover 契约为 12px），外加 1px 描边，原因见 WORKBENCH §10。
- 主按钮底色统一用深一档蓝 `#164EC3`，悬停 `#336EE8`，基础层与工作台一致，亮暗一致（token `color.alias.action-bg`）。
- 键盘焦点统一为 2px 实线蓝色描边、偏移 2px；原基础层是 3px 20% 浅蓝光晕。
- 工作台正文由 12px 改为 13px，单据紧凑模式保留 12px。单据页密度档名 `standard` 改为 `detail`，旧草稿按 `detail` 读取。
- 工作台危险按钮改为白底红字；状态文字改为墨色、圆点保持次级色；基础层分段控件选中改为扁平灰、去掉阴影；页面内通知正文改为墨色。
- 规则统一：蓝色用途、状态可带图标、图标使用范围、筛选胶囊例外、网页字号单位、焦点写法在 DESIGN / AGENTS / SKILL / README 中一致；删除 DESIGN §1.4 已废止的断点旧值。
- 读取顺序只保留 `library-consumption.json` 一份，README、AGENTS、SKILL 改为与它一致；`colors_and_type.css`、`components.css` 标明只服务组件预览页。
- `aham-ui.css`、`colors_and_type.css` 不再从 Google 加载字体（DESIGN §1.11）；需要统一字形时由产品自托管。
- tokens 新增主按钮色、通知描边、深色浅底与交互填充、高对比度取值，以及工作台 13px 正文、控件高、32px 点击区、合计字号、窄屏输入字号。
### 修复
- DESIGN.md §8.8 紧凑行高由 28 改为 32，与 tokens.json 一致；重复的 §8.12 工作台一节改为 §8.16。
- 写明两套外框尺寸的分工：`layout` 组用于应用轨与 content 网页，`workbench` 组用于工作台。
- `.gitignore` 的 `Icon?` 在 macOS 上误匹配 `icons/`，导致 `design-system/icons/` 从未进入 git；已加 `!icons/` 放回。
- 新增 3 条回归测试：通用层不含页面专用类、示例引用的图标存在、DESIGN.md 行高与小节编号一致。
- 全景页不再内嵌两份过期的 `aham-ui.css`（v6.1、v7.0 各一份），改为直接引用 `design-system/aham-ui.css` 与 `workbench.css`；去掉依赖外部运行时的模板写法（原主题开关在仓库里不能用）和指向不存在文件的脚本（载入报 404）；首屏数量改为生成值，原「约 75 个组件」与「约 65 个控件」两处互相矛盾。
- 对比度不达 4.5:1 的 5 处组合全部修正。深色：基础层主按钮白字 3.30:1，工作台危险按钮白字 3.00:1。浅色：选中行阶段文字 4.12:1，成功 / 警示通知文字 4.25 / 4.06:1。
- 页眉 28px 图标按钮与小按钮用透明外扩把点击区补到 32px（DESIGN §2.0）。
- `colors_and_type.css` 深色模式误用浅色的浅底色，缺少语义浅底与焦点色；头注释「由 token 生成」与事实不符，已改。
- 全景页首屏「所有数值只有一份」与事实不符，已改；设计性格标签去掉蓝字；铁规改为从 DESIGN §0 与 AGENTS 生成。
- 15 个基础示例页的「全景」链接指向 v7.0 已删除的 `docs.html`，改为全景页 `index.html`；DESIGN 两处提到从未存在的 `examples/media.html`，改为全景页「基础组件 · 2.9」。
- SKILL 把 `css.json` 写成数值来源、README 把三份兼容文件都写成「生成」，与事实不符，已改；组件预览里一处 5px 圆角改为 `radius.sm`。
- README「网页工作台」一节移回「开始使用」之后，恢复家族模板的章节顺序；CHANGELOG 补 7.2.0 / 7.1.0 / 7.0.2 版本链接。
### 移除
- token `workbench.breadcrumbHeight`（7.1 的兼容别名，7.1 未发布，无人引用）。
- 无引用的 `.wb-body` 样式、无人读取的 `--wb-context` / `--wb-bp-mobile` 变量、单据密度的 `standard` 选择器（旧草稿在读取时已换成 `detail`）。

## [7.1.0] - 2026-09-30

- 新增 C 风格 web-workbench 子模式：全宽壳、三列单据、32px 紧凑明细 / 48px 双行详情、响应式摘要。
- 新增四个组合模式契约、WORKBENCH 规范、迁移规划和可运行 CRM 报价示例。
- 增加 Token 生成与漂移校验、组件 CSS 提取器、金额和草稿恢复测试及 CI。
- 修正消费顺序、表格 28/32px 冲突、状态 pill 描述和 dialog 全局按钮覆盖。旧页面默认布局保持不变，工作台显式启用。

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

[Unreleased]: https://github.com/Aham-AIAPP/aham-ui/compare/v7.3.0...HEAD
[7.3.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.3.0
[7.2.1]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.2.1
[7.2.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.2.0
[7.1.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.1.0
[7.0.2]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.0.2
[7.0.1]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.0.1
[7.0.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.0.0
[6.1.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v6.1.0
[6.0.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v6.0.0
[5.1.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v5.1.0

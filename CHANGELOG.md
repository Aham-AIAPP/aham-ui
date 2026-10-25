# Changelog 更新日志

本项目的重要变更记录在这里。格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号按 [语义化版本](https://semver.org/lang/zh-CN/)。7.6.0 及更早的条目保留原文，其中的路径和文件名指当时的 `design-system/` 目录。

## [Unreleased]

计划发布为 9.0.0。9.0 借鉴 Linear 的整体风格：界面退到业务对象后面，结构靠间距和对齐，信息密但不压人，颜色和图标克制。新增总体文档《设计理念》，每章写明落实哪几条原则。

### 不兼容的改动
- `.wb-mono` 改名为 `.wb-tnum`，用 Inter 的等宽数字（`font-variant-numeric: tabular-nums`）。JetBrains Mono（`--wb-mono`）只用于代码。
- 删除 `--wb-detail-title`（24px）。详情页、单据页和设置页标题统一用 `--wb-title`（20px，字重 600）。
- 删除 `--wb-rail-labeled` 和 `.aham-workbench.is-labeled`（72px 带名称导航栏），改用 220px 文字侧栏。
- 外框默认展开侧栏。收起改用 `.aham-workbench.collapsed`（52px）；`.expanded` 只表示 1024px 及以下的浮层侧栏。`initShell()` 把选择记在本机，默认展开。
- 侧栏结构改写：`.wb-rail-head`、`.wb-brand`、`.wb-brand-name`、`.wb-nav-group`、`.wb-nav-heading`、`.wb-nav-item`、`.wb-nav-count`、`.wb-nav-user`、`.wb-nav-foot`。8.x 的侧栏写法要按 examples/shell.html 改写。
- 图标默认 14px（8.x 是 16px），页眉每条 44px（8.x 是 40px），侧栏导航项 28px（8.x 是 32px）。
- 亮色中性灰去掉黄绿色偏，按 Claude 客户端侧栏重新取色：`--wb-canvas` 从 `#F9F9F7` 改为 `#EDECEB`，`--wb-nav-selected` `#DEDDDB`，`--wb-line` `#E5E5E4`，`--wb-line-strong` `#80807E`，`--wb-muted` `#666664`。8.x 的灰色在 LCH 里彩度 1.5–2.6、色相约 105°，9.0 的彩度在 1 以下。
- `.wb-link` 改为正文色加 `--wb-line-strong` 下划线，不再用主色。
- `.wb-tag` 改为描边胶囊：1px `--wb-line` 描边、6px 分类色圆点、`--wb-ink-2` 文字，不铺底色。
- `--wb-label` 从 72px 改为 88px；`.wb-props` 宽度改用新变量 `--wb-panel-props`（288px）。
- `--wb-detail-width`（720px）只给对外填报页。详情页正文和设置页内容改用新变量 `--wb-body-width`（640px）。
- 列表页改用单行列表 `.wb-table.wb-list-rows`：数据行 44px（新变量 `--wb-list-row`），紧凑 36px；表头视觉隐藏，保留给读屏。8.0「电脑上不用 44px 行高」的规定只对数据表格保留。
- 分区标题（单据分区、表格工具栏、设置分区、预览面板标题、空状态标题）从 14px 或 20px 改为 13px 字重 500。

### 新增
- 《设计理念》（设计理念.md）：读者和用法、总体标准、14 条原则（含义、原因、判据）、冲突时的次序、来源。README、AGENTS 和第 1 章链接到它。
- 阶段图标 `.wb-stage-icon` 和 `stageIconHTML()`、`STAGE_STATE_WORDS`（3.15），五种状态：没开始、进行中、已完成、受阻、不进行。组件契约 stage-icon.json，共 45 份。
- `personHTML(name, { compact: true })`：单行列表里只显示 20px 头像，带 `title` 和 `aria-label`。
- 侧栏导航项写 `data-go` 时注册 G 加字母的跳转快捷键；收起时悬停显示名称和快捷键。
- 颜色变量 `--wb-nav-selected`（亮色 `#E9E8E4`，暗色 `#232322`）。
- 主题生成 scripts/theme.mjs（2.12）：由底色、主色和对比度三个值在 LCH 里生成中性色和主色。`--check` 检查默认主题和 3 个样例主题的对比度，CI 增加这一步。
- 调研记录 research/Linear字体字号-调研.md：Linear 截图实测和 FDE 演示版对照。

### 规则
- 第 1 章版本改为 9.0.0；1.2 改为原则和章节对照表；1.3 来源加 Linear，写明不借鉴的部分（品牌色、默认深色、渐变）；1.4 新增术语「阶段图标」「侧栏」，「导航栏」「菜单」统一改为「侧栏」。
- 2.5 字号重写：工作台一屏只用 13px 和 12px 两档，20px 标题一页一次；字重 400 和 500，600 只给标题；Inter 光学尺寸自动。2.7 尺寸、2.9 图标重写。新增 2.12 主题生成。
- 3.9 标签、3.11 头像、3.12 阶段条（2px 线，当前阶段用主色）更新；新增 3.15 阶段图标。
- 4.1 外框、4.3 列表页、4.5 视图页签、4.8 记录详情页、4.9 设置页按 9.0 重写。
- 第 7 章加 G 加字母跳转，⌘B 收起侧栏。
- 第 9 章新增 9.7 风格判据 S1–S12 和截图比例校准；9.5 自查增加第 12 项。
- lint 新增三类检查：主色用作文字颜色、svg 写死像素尺寸、侧栏的三组对比度。

### 升级步骤
1. 全局替换 `wb-mono` 为 `wb-tnum`，`--wb-detail-title` 为 `--wb-title`。
2. 删去 `is-labeled`；侧栏按 examples/shell.html 的结构改写，收起状态改用 `.collapsed`。
3. 列表页的 `<table>` 加 `wb-list-rows`，单元格按 4.3 的顺序和类名改写（`wb-cell-meta`、`wb-cell-icon`、`wb-cell-name`、`wb-cell-end`）；人员单元格改用 `personHTML(name, { compact: true })`。
4. 正文里用主色的链接改为 `.wb-link`。
5. 跑 `node scripts/lint.mjs`，按提示改掉写死的图标像素和主色文字。

## [8.1.0] - 2026-10-23

8.1 把 FDE 工作台界面设计中定下的通用规则写进规范：元素按用途取舍、人员头像、阶段条、下一步提示条、记录折叠、对外填报页，并把文字和控件描边的对比度提到 WCAG 2 AA。

### 视觉
- 控件描边 `--wb-line-strong` 从 `#E1E0D9`（1.32:1）改为 `#8C8880`（3.53:1），暗色从 `#3A3936` 改为 `#6E6C66`。lint 新增三组控件描边的对比度检查。
- 需要读的文字一律不低于 4.5:1。字段说明、设置项说明、占位文字、空值、时间戳、表格副文字和失活行从 `--wb-faint` 改用 `--wb-muted`。`--wb-faint` 只留给图标和禁用文字。输入框悬停描边改用 `--wb-muted`。
- 新增状态 `data-tone="wait"`（等待），信息色空心圆。
- 头像底色改为分类色的 18%，序号由姓名算出（`avatarCat()`）。文件图标按类型取分类色（`fileCat()`）。
- 新增变量 `--wb-avatar`（24px）和 `--wb-rail-labeled`（72px）。

### 控件和页面
- 新增 `.wb-person`、`.wb-people`、`personHTML()`：人员一律显示头像加姓名，未指定时显示虚线空心圆和「未指定」。
- 新增阶段条 `.wb-stages` 和时间线 `.wb-timeline`（3.12）、下一步提示条 `.wb-next`（3.13）、输入区里的文件列表 `.wb-composer-files`（3.14）。
- 新增记录折叠 `.wb-fold`、单行展开列表 `.wb-expand` 和 `initSingleExpand()`、概况数字行 `.wb-nums`（4.13）。
- 新增页型「对外填报页」`.wb-form-page`（4.12）和示例页 examples/form.html。适用范围从内部管理系统扩大到对外填报页。
- 新增带名称的导航栏 `.is-labeled`：72px，图标在上、两字名称在下，不展开。示例页的导航名称统一为两个字。
- 记录详情页的动态默认折叠在页尾一行，评论框始终显示；评论框加「文件」「录音」，文件可以拖入。
- 选择控件选型表里，页签的例子从「明细 / 条款 / 附件」改为「项目的概况 / 任务」，一页最多 2 个页签。

### 规则
- 1.2 新增三条原则：元素按用途留、非必需的不显示、记录类信息靠后。1.4 新增术语：下一步提示条、阶段条、对外填报页、编辑、新建、添加、加入。
- 空值按类型写（10.5）：文字「未填写」、选项「未选择」、人员「未指定」、数值和日期「–」。全仓库的「没填」改为「未填写」。
- 6.6 新增书面语和权限提示的写法，6.7 规定空表不显示表头，新增 6.9 等待说明。
- 第 8 章按 AI 接入方式区分适用条文：只通过外部接口（例如 MCP）接入 AI 的产品只适用 8.2 和 8.5。
- 9.5 自查从十项增加到十一项。新增 9.6 方案确认流程：先做能点的方案并自测、附取舍表、重要页面出 3 个版本、先调研同类软件、逐页打磨、分阶段审计。
- 组件契约新增 7 份（avatar、stages、next-step、fold、expand-list、nums、form-page），共 44 份；status、shell、activity-feed 三份同步更新。

## [8.0.0] - 2026-10-17

8.0 是一次重构：只保留业务管理系统一套规则，目录整体重排；中性色和表面层级按 Claude 客户端量取，交互规则按 SAP Fiori 补全。

### 不兼容的改动
- 删除 `design-system/` 目录，文件移到仓库根目录：`tokens.json`、`aham.css`、`aham.js`、`components/`、`examples/`、`assets/fonts/`、`assets/icons/`。
- `workbench.css` 和 `workbench.js` 改名为 `aham.css` 和 `aham.js`。页面只引 `aham.css` 一个样式文件。
- 删除基础层 `aham-ui.css`、`aham-ui.js`、`colors_and_type.css`、`components.css`，以及 PC 工作台的 `desktop.css`（`.wb-pc`）。
- 删除规则文件 `DESIGN.md`、`WORKBENCH.md`、`DESKTOP.md`、`SKILL.md`、`aham-ui-office.md`，规则改写到 `rules/` 的十个文件。
- 删除 macOS 应用、Office 文档、HTML 邮件三套规则。
- 删除 `preview/` 和 `ui_kits/`，以及 `library-consumption.json`、`css.json`、`uikit-plan.json`。
- 输入框统一为 `.wb-field`，小号加 `.sm`。替代 `.wb-input`、`.wb-select`、`.wb-edit-input`、`.wb-edit-area`、`.wb-field-select`。
- 单据页的保存和取消移到页脚工具栏 `.wb-doc-foot`，只在编辑态和新建态出现；单据头只放显示态的操作。
- 一个按钮只用文字或只用图标。示例页里图标加文字的按钮全部改掉，`initFilter()` 和 `initDisplay()` 的触发按钮同样改掉。
- 单据页版式改为连续纸面，删除 `.wb-doc-card*`、`.wb-doc-pair`、`.wb-doc-side`、`.wb-form-cols`、`.wb-form-col`、`.wb-edit-footer` 等类；新结构见 `rules/5-单据.md` 5.1。
- 行高变量统一为 `--wb-row`（36px）和 `--wb-row-compact`（32px），删除 `--wb-list-row`、`--wb-row-list`、`--wb-row-detail`。电脑上不再使用 44px 行高，44px 只在触屏上使用（`--wb-touch`）。
- 删除变量 `--wb-body-dense`、`--wb-text-md`、`--wb-doc-max`、`--wb-form-col-max`。
- 组件契约升到 `schemaVersion` 3，`specification` 指向 `rules/` 的章节。原有 45 份契约删除 22 份、保留 23 份，另新增 14 份，共 37 份。

### 视觉
- 中性色按 Claude 客户端截图量取，并和第三方项目 open-claude-ui 的取值核对：外框 `#F9F9F7`，内容区 `#FFFFFF`，一行高的灰底 `#F3F3F0`，选中 `#EDECE8`，分隔线 `#EAE9E4`，控件描边 `#E1E0D9`，正文 `#151515`，标签 `#52514E`，次要文字 `#6D6B67`，辅助说明 `#898781`。
- 灰底只用在一行高的元素上。侧面板、汇总栏、表头改为白底，用分隔线区分。变量 `--wb-panel` 改名为 `--wb-fill`，新增 `--wb-canvas`、`--wb-line-strong`、`--wb-ink-2`、`--wb-hairline`。
- 辅助说明（字段说明、设置项说明、表格副文字）改用 `--wb-faint`，对白底 3.59:1，低于 WCAG 正文要求，限制见 `rules/2-视觉.md` 2.1；增强对比度时换成 `#4A4743`。
- 主色保持钢蓝 `#336EE8`。新增 4 个状态色（成功、警示、错误、信息）各带浅底，新增 6 个分类色。
- 图标线宽从 2px 改为 1.5px。
- 圆角：标签 4px，控件和弹层 8px，内容区外壳 10px，弹窗和命令面板 12px；胶囊形只用于开关、进度条和头像。
- 2 倍及以上屏幕的分隔线画 0.5px。弹层和弹窗的阴影带一圈 1px 描边。
- 动效时长改为 60 / 120 / 200 / 300ms，缓动改为 `cubic-bezier(.165,.84,.44,1)`，取自 open-claude-ui docs/v2，没有经过截图核对。
- 新增增强对比度一套颜色，系统开启时使用；控件描边和辅助说明也跟着加深。
- 打印时一律使用亮色。
- 空值统一写短横线「–」，`money(null)` 和 `formatBytes()` 不再返回长破折号。

### 新增
- `rules/1-总则.md` 至 `10-数据格式.md`。按 SAP Fiori 补全的规则：控件状态、工具栏排序和溢出、值帮助弹窗（3）；工作清单、向导、初始页、筛选、视图、表格选型、导出、批量编辑（4）；关键信息、锚点栏、明细条数、四种编辑流程、页脚工具栏、草稿和编辑状态（5）；消息框类型和文案、批量处理的结果、空状态、忙碌和占位加载（6）；日期、数字、单位、换行和截断（10）。
- 示例页 `examples/worklist.html`：待审批的报价单，行内通过和退回，批量通过前说明不能处理的项。
- 单据页示例：关键信息、锚点栏、添加明细行弹窗、编辑态删行、每 20 秒自动保存草稿、离开时的四选一弹窗。
- 列表页示例：另存视图和「*」标记、批量编辑、删除部分失败的结果弹窗、导出 CSV。
- `aham.js` 新增 `openFormDialog()`、`showBatchResult()`、`toCSV()`、`downloadText()`、`initAnchorBar()`；`openConfirm()` 新增 `choices` 和 `cancel`；`initObjectPage()` 新增 `changed`、`draft`，返回值新增 `discard`、`saveDraft`、`values`。
- 新增 `.wb-skeleton` 占位加载和 `tr[data-dimmed]` 停用行的写法。
- 示例页：单据页 `examples/document.html`、打印预览 `examples/print.html`、控件总览 `examples/controls.html`。
- 单据状态：草稿、审批中、已退回、已生效、已作废，每个状态只显示可用的操作。
- `aham.js` 新增 `openConfirm()`：确认弹窗，可以要求填写原因。
- `initObjectPage()` 新增 `canEdit` 参数，按单据状态决定能否进入编辑态；支持单选组。
- 打印预览：A4、15mm 页边距，未生效的单据印出状态标记，金额印大写（`chineseAmount()`）。
- `scripts/lint.mjs`：检查变量定义、写死的颜色和字号、亮暗两套颜色的对比度。
- `tests/structure.test.mjs`：检查生成文件、链接、契约、规则文件的标题和用词。
- CI 改为 `.github/workflows/check.yml`。

### 删除
- `scripts/build-workbench.mjs`、`extract-components-css.mjs`、`build-panorama.mjs`、`lint-design.mjs`，由 `scripts/build.mjs` 和 `scripts/lint.mjs` 替代。
- 示例页 `crm-quotation`、`object-page`、`desktop-workbench`，由 `examples/document.html` 替代。
- 草稿自动恢复的示例代码。草稿规则见 `rules/5-单据.md` 5.7，示例页重新实现了自动保存和离开弹窗。
- 列表批量条里的「分配负责人」，由批量编辑替代。

## [7.6.0] - 2026-10-12

### PC 工作台
- 新增 DESKTOP.md、desktop-workbench 契约和 wb-pc 样式，统一页头、连续分区、表格和编辑状态。
- 取值加入 workbench.desktop，由构建脚本生成 CSS；维持已有主题和其它介质的入口。
- PC 采用 32 / 48px 页面边距、32px 控件、40px 表头、44px 正文行；编辑标签上置、双列与容器查询。
- 约定真实改动比较、失败保稿、未保存离开保护和固定保存入口；新增可操作的合成数据示例。


## [7.5.0] - 2026-10-08

> **单据的版式和编辑态**：工作台单据页正文限宽，分区是描边卡片、里面一层小节块，标签 148px 加冒号；显示态和编辑态用同一套行，照 SAP Fiori 的 Object Page（WORKBENCH §4.1–4.5）。规则来自一个生产项目的 RFQ 单据，经需求方逐轮确认后写进规范。

### 新增
- WORKBENCH §4.1 版式、§4.2 显示态和编辑态、§4.3 值的写法、§4.4 校验和消息、§4.5 编辑控件；§5 加单据正文里小表格的工具栏和横向滚动。
- `tokens.json` 的 workbench 组新增 `formLabelWidth` 148px、`formColumnMin` 480px、`formColumnMax` 640px、`formPairMin` 1008px、`documentMaxWidth` 1328px；语义色新增 `warning-mark`（亮 #E3DDCE、暗 #443E2A），给要核对的值做文字底色。
- 工作台变量新增 `--wb-faint`、`--wb-warning-mark`、`--wb-text-md`、`--wb-form-label`、`--wb-form-col-min`、`--wb-form-col-max`、`--wb-doc-max`。
- `workbench.css` 新增 `.wb-document.is-capped`、`.wb-doc-card*`、`.wb-doc-group*`、`.wb-doc-pair`、`.wb-doc-side`、`.wb-form-*`、`.wb-value.is-*`、`.wb-source`、`.wb-edit*`、`.wb-value-state`、`.wb-table-block`、`.wb-table-toolbar`、`.wb-edit-footer`、`.wb-msg-btn`、`.wb-messages`；标签位置和两列并排用容器查询，写在 `workbench-layout.css.in`。
- `workbench.js` 新增 `initObjectPage`：进入编辑态、初始焦点、校验和值状态、消息列表、保存、有改动时取消先问、离开页面先问。
- 页脚贴在正文底边：粘性定位会让开滚动容器的内边距，`.wb-edit-footer` 的 bottom 取 `.wb-document` 下内边距的负数；正文另设内边距时跟着改。
- 小节里的表格表头用小节的次级底色，不留白条；只有标题行的卡片（收起的分区）去掉标题下的分隔线。
- 编辑控件高 `--wb-hit` 32px，上下各用 -4px 外边距收回，行高仍是 24px。多行文本框最低 32px，`initObjectPage` 自动加高时也以 32px 为下限。
- 单据小节里的 `.wb-risk.warning` 文字用墨色、图标保留警示色，和摘要栏等次级底色一样（§1.2）。
- WORKBENCH §4.4 写明：点保存时有错误，打开消息列表，焦点在第一条。
- 示例页 `examples/object-page.html`，登记进 `library-consumption.json`。
- 保留键新增 E（编辑当前单据）；⌘ / Ctrl + Enter 的说明加「保存编辑态」。WORKBENCH §12.2 同步。
- `scripts/lint-design.mjs` 增加 4 组对比度：要核对的值、必填没写的值，亮暗各一组。
- 测试增加 1 条：单据页的规则、token、类、行为函数和示例页。

### 变更
- DESIGN §0、AGENTS、CONTRIBUTING 的「卡片无边框」注明例外：工作台单据正文的分区卡片 1px 描边，里面只套一层次级底色小节。
- 蓝色的用途加一项：单据小节标题前的 3px 竖条。
- WORKBENCH §1.1 第 3 条：就地修改、即时生效只用于列表的格子和属性栏，单据的表单改用编辑态、一次保存。§2 的字段标签一行改为单据表单 148px、窄面板 72px。
- `document-form` 契约补结构、规则、状态和键盘，参考页改为 `examples/object-page.html`；`editable-table` 契约补规则。

## [7.4.0] - 2026-09-30

> **文件与版本**：工作台新增文件上传、文件预览、树形明细、版本对比四种组合（WORKBENCH §15）；补写风险表达、主按钮位置和暗色取值；修正文件之间的 25 处矛盾。

### 新增
- 四种工作台组合，规则写在 WORKBENCH §15，DESIGN 第 2 层新增 2.10：
  - 文件上传 `file-upload`：拖放文件或文件夹，另有选择按钮；逐个文件检查、显示进度、失败可重试。
  - 文件预览 `file-viewer`：缩放、平移、翻页；与识别字段并排，点字段在图上框出来源。
  - 树形明细 `tree-table`：层级缩进、展开折叠、行级键盘，父行金额由子行求和。
  - 版本对比 `version-compare`：选两个版本，按分类列出新增、删除和改动，旧值和新值并排。
- `workbench.js` 新增 `initDropZone`、`initViewer`、`initTreeTable`，以及纯函数 `checkFile`、`formatBytes`、`treeTotals`、`diffRecords`。
- `workbench.css` 新增 `.wb-drop`、`.wb-file`、`.wb-progress`、`.wb-viewer*`、`.wb-recognized*`、`.wb-tree-*`、`.wb-diff-*`、`.wb-compare-pick`，取值只用工作台变量。
- 状态预览页 `preview/workbench-files.html`，登记进 `library-consumption.json`。上传进度和识别结果是本页模拟的。
- `components/shortcuts.json` 保留键增加 ←、→（树形明细）和 +、−、0、PageUp、PageDown（文件预览）。WORKBENCH §12.2 同步。
- 测试增加 4 条：新契约与预览页的结构检查，以及文件检查、按层汇总、版本差异三组纯函数。
- WORKBENCH §1.2 风险与警示：状态点保持灰色，真实风险用 `.wb-risk` 的语义色文字加说明。表格单元格只染数值，另配隐藏文字。
- 工作台新增变量 `--wb-warning`（`color.semantic.warning`），供 `.wb-risk.warning` 使用。
- WORKBENCH §2.1 写明主按钮的位置：单据页放标题区，列表、详情、设置放第 1 条横条最右端，第 2 条不放主按钮。
- WORKBENCH §7.1 列出亮暗两种主题下主按钮、焦点、危险和警示文字的取值与对比度。
- DESIGN 诚实声明第 4 条列出 `aham-ui.css` 里现有的写死字距，标为临时值。
- AGENTS 的工作台硬性要求补两条：风险写法、主按钮位置。
- `scripts/lint-design.mjs` 增加 4 组对比度：危险文字对次级底，暗色危险、警示文字对次级底，暗色焦点对次级底。

### 变更
- 工作台暗色的 `--wb-blue` 由 `#7BA3F0` 改为 `#5C8BED`，与 token `focusRing` 和基础层一致。焦点描边、当前页签下划线和列表焦点行边线随之变化。

### 修复
修正文件之间的 25 处矛盾。裁决顺序为 tokens → WORKBENCH / DESIGN → 契约 → 运行时 → 示例。

- `aham-ui.css` 的 `[data-density="compact"]` 行高由 28px 改为 32px，与 tokens 一致。
- 快捷键的方向键名与保留表一致：`workbench.js` 把 `ArrowDown` 等规范为 `down`、`up`、`left`、`right`，原来登记 `down` 的快捷键按不响应。新增导出 `keyStep`，测试核对它给出的键名都在 `shortcuts.json` 的保留表里。
- 开关打开统一为墨色：`toggle.json` 和开关预览页原来写蓝色。
- `button.json` 改为现行写法：主按钮 `#164EC3`，次级白底加线，危险红字。按钮预览页随之改。
- 进度条和滑块的填充统一为墨色，改的是契约和预览页；`aham-ui.css` 原本就是墨色。
- `segmented-control.json` 删去「选中段是白色卡片」；预览页的选中段改为扁平灰、去掉阴影。
- `tooltip.json` 的出现延迟由 0.3s 改为 500ms，与 WORKBENCH §12.7 和 `workbench.js` 一致。
- `menu.json` 删去「多选不用勾选」，改为说明 `.checked` 的用途（DESIGN §2.1）。
- 基础层 `.popover` 圆角由 8px 改为 12px，与 `popover.json` 和 WORKBENCH §10 一致。
- `nav.json` 写明 36px 用于应用轨和 content 网页，工作台导航项用 32px。
- `command-palette.json` 的分组顺序补上「AI」组，与 WORKBENCH §12.1 一致。
- token `workbench.detailWidth` 的说明改为 13px 正文。
- 图标数量统一为 53：tokens、`icon.json`、`components/index.json`、DESIGN §1.6、组件预览页和 `design-system/README.md`。图标预览页补上 `ai`、`stop` 两件。
- DESIGN §1.7 写明加载反馈的循环例外：spinner、骨架屏和不确定进度条。
- 0.15s 的过渡改为 `motion.duration.fast`：`aham-ui.css` 的开关和两处箭头，以及组件预览页。
- 工作台表头与数据行同高：列表 36 / 32px，触屏 44px，单据跟随单据行高。
- 工作台表头去掉次级底色，吸顶时用白底，靠字重和底边线区分（DESIGN §0）。
- 触屏和窄屏下，列表的 44px 行高不再被「紧凑」显示选项覆盖。
- 基础层 `.drawer` 宽度改用 `overlayWidth.drawer`（400px）。
- CONTRIBUTING 的铁律改为现行的蓝色用途，删去「蓝色用于选中」。
- `design-system/README.md` 的暗色说明改为「单独取值」，与 DESIGN §1.2 一致。
- 删除未使用的 `--ui-border-light`，tokens 里只有一种线色。
- `SKILL.md` 的定位描述改为 AI 工具和 ToB 业务界面的设计系统。
- `examples/workbench-shell.html` 的「筛选」「显示」改为次级按钮（WORKBENCH §9.2）。
- `checkbox.json` 的键盘焦点改为 2px 实线描边；`search-field.json` 写明光晕只用于输入框聚焦。
- `examples/page-shell.html` 去掉未定义的 `.text-overline`，改用 `.text-caption`。
- 设置示例删去「发送评论：Enter」选项。评论框按 WORKBENCH §11.5 固定为 ⌘ / Ctrl + Enter 发送。
- 确认弹窗标题去掉问句：客户列表、设置页、弹窗预览页和 dashboard 示例。DESIGN §1.9 写明这条规则。
- 基础层 `.tree-item` 高度由 30px 改为 32px，回到 4px 网格。
- `.wb-table-scroll` 加 `position:relative`。表格单元格里的隐藏文字原先会撑出页面，在 390px 宽时产生横向滚动。

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

[Unreleased]: https://github.com/Aham-AIAPP/aham-ui/compare/v7.5.0...HEAD
[7.5.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.5.0
[7.4.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.4.0
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

[7.6.0]: https://github.com/Aham-AIAPP/aham-ui/releases/tag/v7.6.0

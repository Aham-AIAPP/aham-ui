# Aham UI — 设计规范

> Aham 品牌系列(Voice/Survey/PPT,local-first macOS AI 工具)的设计基础。
> 北极星:Claude desktop 气质——极简、克制、留白、内容优先。性格:**冷色的纸、克制的金属感、对话式**。
> 重构原则:**框架/方法/比例对齐 Apple HIG,取值全用 Aham**。机读值见 `tokens.json`(含亮+暗两套 + 文本样式体系)。AI 消费入口见 `AGENTS.md`。

**七层结构**:0 原则 · 1 基础(含国际化/RTL、隐私) · 2 控件与组件 · 3 组合规则 · 4 模式 · 5 介质落地 · 6 输入 · 7 系统支撑。

**版本 v5.1**——在 v5.0(对照 Apple HIG 完整性审计补全 30 项:Dynamic Type、Differentiate Without Color、VoiceOver 契约、Drag and drop、Loading 分级、标准快捷键、焦点组、RTL、隐私等)基础上,清理 15 个旧/重复类。

---

## 0 设计原则

1. **清晰 Clarity**:内容是主角,文字易读,层级分明。
2. **克制 Restraint**:默认是"不加"。每个颜色/字体/装饰都要有理由。
3. **层次 Depth**:深度靠**三层背景层差**(纯色),**不靠材质/模糊/阴影**(这是与 Apple 的核心分歧——Apple 用 Liquid Glass 材质,Aham 用层差)。

**铁规总览**(全文强约束):
- 状态 = 6px 点 + 文字,**绝不** pill/徽章/色块/红黄绿灯。
- 表格**只横线**,无竖线、无整行底色;数字右对齐 mono;表头/合计靠加粗。
- 卡片**无边框无阴影**;选中 = 扁平灰 `#E7E7E7`,**非蓝**。
- 蓝 `#336EE8` **只**用于 logo/主操作/发送/选中;蓝若第一眼注意到就超标。
- 静置/hover **无阴影**,**仅浮层**有阴影。
- 内容区用 `•`+文字,图标仅导航/发送栏。
- 一组**只一个** primary。
- 单一无衬线(Inter),**禁衬线**;数字 mono(JetBrains)。

---

## 1 基础 Foundations

### 1.1 品牌
Aham = *aha moment*——把灵光一现做成能用的 AI 工具。身份锚点(不可让渡):单蓝 + 三层灰 + 扁平克制 + 冷色的纸。logo 仅蓝着色,不加阴影/渐变。

### 1.2 色彩(亮 + 暗)
**三层表面(亮)**:`#FFFFFF` 内容 · `#F3F3F3` 面板/侧栏 · `#E7E7E7` 线/选中。↔ Apple 三层 background stack。无暖调。

**文字四级**(对齐 Apple label 不透明度递减,取值 Aham):
| 级 | 值 | ≈黑% | ↔Apple | 用途 |
|---|---|---|---|---|
| 主 | #262626 | 85 | label | 正文/标题 |
| 次 | #6E6E6E | 57 | secondaryLabel | 次要 |
| 三 | #9B9B9B | 39 | tertiaryLabel | 占位/装饰(非正文) |
| 四 | #C4C4C4 | 23 | quaternaryLabel | 最弱分隔/禁用 |

**强调(蓝,唯一色相)**:`#336EE8` 主 / `#5C8BED` hover / `#164EC3` 按下 / `#EDF0F7` 浅底 / `#C8D3EA` 浅底描边。
**语义(极弱,仅真风险)**:成功 `#5A7A60` / 警示 `#8A7333` / 风险 `#9E3D31`(各配极淡 -bg)。禁红黄绿灯。
**交互填充**:hover `rgba(20,20,20,.04)` / active `.08`。

**暗色【提案,需实测对比度】**(学 Apple 暗色模板:背景分层深灰非纯黑、文字接近白、蓝调亮;中性灰守"冷色的纸"):背景 `#1C1C1C/#2A2A2A/#3A3A3A` · 文字 `#F5F5F5/#A8A8A8/#767676` · 蓝 `#5C8BED`。触发:系统 `prefers-color-scheme` 或 `[data-theme="dark"]`。

**命名分层**:primitive → semantic(`bg-app`/`ink-primary`/`accent`/`border`) → component。组件只引语义层。

**深色细则(↔Apple Dark Mode)**:暗色**不是简单反相**;白底图片在暗色下稍压暗避免发光;自定色暗色下**单独取值**(非亮色直接变暗);对比阈值正文 ≥4.5:1、**小字/前景争取 7:1**;暗色须在 **Increase Contrast + Reduce Transparency 同时开启**下也测一遍(防深字压深底不可读)。

### 1.3 文本样式体系
**字族**:无衬线 `Inter`(+雅黑/黑体);大字光学尺寸 `Inter Display`(≥20px);等宽 `JetBrains Mono`(数字/代码)。**单一无衬线,禁衬线。**

**11 语义样式**(字号 px / 行高 / 字重;取值 Aham,base 14):
| 样式 | 字号 | 行高 | 字重 | 字族 |
|---|---|---|---|---|
| Display | 44 | 1.15 | 600 | Inter Display |
| Title | 32 | 1.2 | 600 | Inter Display |
| Heading | 24 | 1.25 | 600 | Inter Display |
| Subheading | 20 | 1.3 | 600 | Inter Display |
| Body-L | 17 | 1.5 | 400 | Inter |
| **Body(默认)** | **14** | **1.55** | **400** | Inter |
| Callout | 15 | 1.45 | 400 | Inter |
| Subhead | 13 | 1.4 | 500 | Inter |
| Footnote | 13 | 1.45 | 400 | Inter |
| Caption | 12 | 1.4 | 400 | Inter |
| Mono | 跟随 | — | 400 | JetBrains |

CSS 类:`.text-display`…`.text-mono`。**光学尺寸**:≥20px 用 Inter Display,<20px 用 Inter(↔Apple 20pt 阈值)。**字重**:标题 600、正文 400、强调 500/600,**不用 100–300 细重**(↔Apple"避免过细")。**方法**:主力档少、靠字重+大小写+位置分层(↔Apple 实践);tracking 学规律不抄值(Apple 真实是 U 形,但 SF 值不适用 Inter)。

**文字缩放响应 Dynamic Type(↔Apple)**:样式用**相对刻度**(rem/em),不写死 px;系统/浏览器放大文字时**内容优先放大、chrome 次要**(如 Mail:正文放大、日期发件人保持小);每样式声明 最小/默认/最大 三档;**字号超阈值时容器从 inline 切 stacked**(防截断/重叠)。

**可读性红线(↔Apple Typography)**:正文最大行长 ~60–75 字符(`ch`/`max-width` 限);最小可读字号 ≥12px(macOS Body 基准 **13**、网页 14,**可不同**);**禁两端对齐**、禁长段斜体/全大写。

### 1.4 布局与间距
间距(4 基):`4/8/12/16/24/32/48/64/96`。**留白是首要分隔,先加间距再考虑线。** 布局:rail 60 / sidebar 264 / rightbar 340 / topbar 52。断点(仅 web):≤860 折叠/转单列,≤380 压窄。

**安全区与边距(↔Apple Layout)**:尊重系统 safe area;macOS 窗口内容四周留边距 + 定义最小窗口尺寸;网页定义内容最大宽度 + 响应外边距。**注**:4/8 基网格与边距取值是 Aham **自定约定**(Apple 现行未官方规定 8pt 网格,经典数值来自归档版)。**本地化变长**:按钮/标签/菜单项可伸缩、不截断或带省略;先用最长(德语)/最短文案测布局。**内容优先级**:空间不足(窄列/放大文字)时,规定哪些先折叠/进 overflow/截断(工具栏、表格列、导航各有优先级)。

### 1.5 圆角与层次
圆角:xs4 / sm6 / md8(控件)/ lg12(卡片)/ xl16(modal)/ pill999。**层次=flat**:静置/hover 无阴影,深度靠三层层差(代替材质);仅浮层有阴影(菜单 `.05`/popover `.06`/modal `.10`)。**同心圆角**:子圆角=父圆角−间距(详见 3.1)。

### 1.6 图标
尺寸:16/20/24。线性、单色、1.5px、无填充,一套;**权重随相邻文字字重**(↔SF Symbols 方法)。**克制**:内容区用 `•`+文字,图标仅导航/发送栏。禁 emoji、多色/填充图标、品牌色文件图标(文件类型用 `DOCX` 文字 badge)。

### 1.7 动效
服务反馈不表演,默认不动。时长:fast .12s / base .18s / slow .28s。缓动 `cubic-bezier(.2,0,0,1)`。禁循环/弹跳/视差/>.3s。

**Reduce Motion 响应(↔Apple)**:`prefers-reduced-motion:reduce` 时,缩放/滑动/旋转**替换为 dissolve/淡入淡出**或直接切换(无过渡);禁视差与自动播放。**CSS 已实现该媒体查询**。

### 1.8 无障碍
对比度(对白底,实算;AA 正文 4.5/大字 3.0):#262626 **15.1** ✓ / #6E6E6E **5.1** ✓ / #336EE8 **4.63** ✓ / 语义 4.6–6.6 ✓ / #9B9B9B **2.78** ✗(仅占位)/ #C4C4C4 **~1.70** ✗(仅分隔,**不承载文字**)。

**不靠颜色单独传达 Differentiate Without Color(↔Apple,对单蓝体系尤其关键)**:Aham 只用一个蓝,比多彩系统更依赖形状/图标/文字区分。**每个语义状态除颜色外必须配图标或文字**;**数据系列除颜色外用图案/直接标注/形状**;开关/选中除色变外加**勾选/形状标记**。用**灰度走查**(去色后仍可辨)验证。

**VoiceOver / 语义契约(↔Apple)**:可点/可拖的都要可访问操作;**纯图标按钮必须有可访问名**(aria-label);状态/值(勾选、进度)不能只靠视觉,要有文字/aria;**图表必须带数据表或文字摘要替代**;打开新页/切上下文的按钮可预测(标题加 `…`)。

**键盘/焦点**:全可达、可见 `:focus-visible` 3px ring、Esc 关浮层、**焦点只落可交互元素**(详见第 6 层)。

**系统开关**:`prefers-reduced-motion`(见 1.7)、`prefers-contrast:more`(增强边框/分隔/焦点环);不用材质,Reduce Transparency 影响小。

**命中区**:桌面图标按钮 ≥32(含 padding)、触屏 ≥44(详见 2.0 更正)。不只靠色(点+文字双通道)。

### 1.9 内容文案
语气克制直接不夸张;术语全系统一致;按钮用动词;空状态一句+一出路;错误说"发生什么+怎么办";数字格式统一(千分位/时间 `2026-06-19`/百分比位数一致)。

**文案体系(↔Apple Writing / Inclusion)**:按钮/菜单**动词开头**;正文第二人称("你");避免行话与带性别/文化偏见措辞;西文标题式 vs 句首大写保持一致;**空白屏必须给下一步动作 + 按钮/链接**(不只"暂无数据")。

### 1.10 国际化与 RTL(↔Apple Right-to-left)
布局用 **leading/trailing 逻辑属性**(非硬编码 left/right),文本 natural 对齐——低成本支持 RTL/CJK。**镜像**:表方向的箭头/导航/进度翻转。**不翻转清单**:音频/视频**播放控件与时间轴**、图表 x/y 轴、时钟、乐谱、不表方向的图标;**电话号码、数字、未本地化拉丁文/产品名始终 LTR**。

### 1.11 隐私(↔Apple Privacy)
local-first:数据默认留本机。**仅在需要时请求权限**(麦克风录音、文件访问),**先给价值再要授权**,授权文案清楚说明用途;**不为营销索取数据**。

---

## 2 控件与组件 Components

### 2.0 控件尺寸体系(↔Apple control sizes)
| 档 | 高 | 水平 padding | 字号 |
|---|---|---|---|
| Small | 28 | 12 | 13 |
| **Medium(默认)** | **32** | **16** | **14** |
| Large | 40 | 20 | 15 |

规则:① 宽度=内容+固定 padding,**绝不写死宽度**;② 同档同高,**贯穿所有控件**;③ 最小热区桌面 ≥32/触屏 Large=44;④ 窄容器**撑满或换行**,不挤压字号。token `--ctrl-h-*`/`--ctrl-px-*`。

**命中区(更正)**:Apple **唯一公开**的命中区数字是 **44×44pt**(明确涵盖指针);macOS 实际控件约 22–24pt。"28pt 指针最小值"是第三方约定、**非 Apple 官方**。Aham 自定取值,但保留原则——**围绕小目标(图标按钮)加 padding 形成命中区**,桌面 ≥32(含 padding)、触屏 Large=44。

### 2.1–2.8 组件(按 8 组,各守铁规)
- **2.1 动作 Actions**(全变体):
  - 按钮 `.btn`:层级 `--primary/secondary/ghost/danger` × 尺寸 `--sm/(md 默认)/--lg`;状态 hover/active/focus/disabled/**`.is-loading`**;变体 **全宽 `--block` / toggle `--toggle[aria-pressed]` / 链接 `--link`** / 图标+文字(gap) / 纯图标 `.icon-btn`。**一组一 primary;宽度自适应。**
  - 按钮组 `.btn-group`:相邻合并描边。
  - 菜单 `.menu`:项 `.mi` + 图标 `.ico` + 快捷键 `.sc`(mono) + **勾选 `.checked` / 分组 `.mg` / 分隔 `.md` / 危险 `.danger` / 子菜单 `.has-sub`>`.submenu`(hover 展开)**。
  - 上下文菜单 `.context-menu`;工具栏 `.toolbar`(溢出 `.overflow` → More 菜单)。
  - **按钮 role(↔Apple)**:`normal` / `primary`(一组一个) / **`destructive`(危险)**;destructive 且**不可撤销**时**必须二次确认**(对话框,Cancel 与危险操作分离)。
  - 图标一律**线性单色,非 emoji**。
  - 示范:`examples/actions.html`。
- **2.2 录入 Inputs**(每组件全状态):
  - 输入 `.input`:default/hover/focus/**error(`.is-error`)/disabled/readonly**;变体 前缀 `.input-wrap.has-prefix`/后缀 `.has-suffix`/清除 `.clear`/字数 `.input-count`(超限 `.over`)。
  - 文本域 `.textarea`:同输入态 + min-height + 可 resize + 字数。
  - 下拉 `.select`:default/hover/focus/error/disabled;自绘箭头墨色。
  - 复选 `.check`:未选/选中/**不确定 `:indeterminate`/禁用**;选中=墨色。
  - 单选 `.radio`:未选/选中/禁用;选中=墨色。
  - 开关 `.switch`:关/开/禁用 + 带标签 `.switch-row`(两端式 `.between`);开=墨色。
  - 滑块 `.slider`:default/禁用 + 带值 `.slider-row .val` + 刻度 `.slider-ticks`。
  - 步进 `.stepper`:−/值/+ + 禁用。验证码 `.otp`:分格输入。
  - 日期/时间/范围 `.picker-trigger`:只读 input + 图标,触发日历浮层。上传 `.upload`:default/hover/dragover。
  - 字段 `.field`:label在上 → 控件 → hint/`.err` 垂直节奏。
  - 示范:`examples/inputs.html`。
- **2.3 导航 Navigation**(全状态):
  - 导航栏 `.navbar`:三段式 返回 `.back`(蓝) / 标题 `.nav-title` / 操作 `.nav-actions`。
  - 侧栏 `.sidebar`+`.nav-item`(选中 `--on` 扁平灰);**分组 `.nav-group`(可折叠 `.collapsed`,caret 旋转) + 图标 `.ico` + 徽标 `.badge`(mono)**。
  - 面包屑 `.crumb`(末项 `.here`);页签 `.tabs/.tab`(选中底部蓝线)。
  - 搜索 `.search`:input-wrap(放大镜前缀 + `.clear`) + **建议下拉 `.search-suggest`(`.si`/`.on` 高亮)**。
  - **令牌字段 `.token-field`**:标签 `.token`(可 `.x` 移除) + 输入,收件人式。
  - 分页 `.pager` / 步骤 `.steps` / 树 `.tree` / 命令面板 `.cmdk`。
  - **菜单语义(↔Apple)**:pop-up button(互斥选项,回显选中)≠ pull-down button(动作集合)。
  - **macOS 菜单栏(桌面 app 必备)**:顶部 App / File / Edit / View / Window / Help;标准项归位(撤销/剪贴在 Edit、设置在 App ⌘,);**菜单项显示快捷键**。
  - 示范:`examples/navigation.html`。
- **2.4 数据展示 Data Display**(全状态):
  - 表格 `.doc-table`:**只横线、数字右对齐 mono、表头/合计加粗**;树表 `[data-depth]` / 排序 `.sortable` / 选中 `[aria-selected]` / 展开行 `.row-expand`;**可编辑 `.cell-input` / 行内操作 `.row-actions .act`(hover 显示) / 分组表头 `.group-row` / 固定首列 `.sticky-col`**。
  - **Lockup `.lockup`**:图标 `.lk-icon` + 标题 `.lk-title` + 副标题 `.lk-sub`。
  - 卡片 `.card`:**无边框无阴影**;选中 `--sel` 扁平灰;**集合 `.card-grid`(靠 panel 层差区分)**。
  - 指标 `.metric`(mono 数值) / 键值 `.desc` / 标签 `.tag`(中性) / 折叠 `.accordion` / **行内 `.disclosure`**。
  - 代码 `.code` / 空状态 `.empty`(**升为复用组件:图标 + 一句说明 + 下一步按钮**) / 时间线 `.timeline`。
  - **选择模式(↔Apple Lists)**:单选 / 多选(勾选)/ **范围选(Shift+点、Shift+方向键)**;高亮两类——**导航类**持久高亮当前行 vs **选项类**短暂高亮 + 勾选;macOS 大表可选交替行背景。
  - **滑动操作的桌面对应**:iOS swipe = 桌面/网页的**右键上下文菜单 + 行内悬停操作按钮**。
  - **组合框 `.combobox`**(可输入下拉:文本框 + 候选) / **路径栏 `.path`**(文件路径,各级可点)。
  - **disclosure 层级**:`.disclosure` 缩进表层级;深/多时改用新视图而非无限嵌套(渐进披露)。
  - 示范:`examples/data.html`。
- **2.5 数据可视化 Data Viz**:柱/线/环/横条 + **面积/堆叠/散点/sparkline** + 仪表 `.gauge`(半环) + 环形进度 `.ring` + KPI `.metric` + 阈值表。**灰阶序列 + 至多一个蓝高亮;阈值只染文字;细轴线;mono 数字;无 3D/渐变/多色谱**。示范:`examples/charts.html`、`status-viz.html`。
- **2.6 反馈 Feedback**:警示条 `.alert` / 横幅 `.banner` / 轻提示 `.toast` / 进度 `.progress`(+**不确定 `.is-indeterminate` / 环形 `.ring`**) / 加载 `.spinner`+骨架 `.skeleton` / 三态 / 气泡确认 `.popconfirm` / 状态 `.status`(**6px 点+文字**) / 通知中心 `.notif-center`。**图片容器 `.image-box` / 分享面板 `.share-panel` / 编辑菜单 `.edit-menu`**。示范:`examples/status-viz.html`。
- **2.7 浮层 Overlays**(全状态):
  - 模态 `.modal`(结构 `__head/__title/__body/__foot`) / **对话框式 alert `.dialog`(确认弹窗)**。
  - 抽屉 `.drawer`(`__head/__body`)。
  - 气泡卡 `.popover`:**箭头指向 `.arrow-top/bottom/left/right`**。
  - 工具提示 `.tooltip`(深底白字);菜单 `.menu`(见 2.1);遮罩 `.scrim`。
  - **窗口 chrome `.window`**(`__bar` + 灯位中性灰 + `__body`)。
  - **滚动吸顶 `.scroll-sticky .sticky-head` + 滚动阴影 `.scroll-shadow`**。
  - **dismiss 行为(↔Apple)**:modal 用按钮区(macOS 在内容区);popover/tooltip **点外部即消失(transient)**;Esc 关闭非破坏浮层;**有未保存内容时关闭前确认**(保存/放弃/取消);sheet 在 macOS 总是模态。
  - **仅浮层有阴影;同心圆角。**
  - 示范:`examples/overlays.html`。
- **2.8 布局容器**:外壳/栅格/堆叠/分隔/分割/滚动区。间距走 spacing scale。

**暗色**:所有组件引用语义 token,暗色下值切换,组件零改动自动适配(已验证)。

---

## 3 组合规则层 Composition

把孤立组件变成"一套"。

### 3.1 同心圆角
内元素紧贴内壁时:**内圆角 = 外圆角 − 间距**。例:卡片 lg12 内嵌输入 padding4 → 输入 md8。**适用条件**:仅紧贴(小 padding)时同心;padding 大(≥16)用独立圆角档。取最近档,不引入新圆角值。

### 3.2 对齐与网格
4 基网格(杜绝 3/7/13px);同档同高即对齐;表单 label/控件/说明**左缘成线**;数字右对齐;图标按视觉重心对齐。

### 3.3 动作主次
一组一 primary;层级 primary>secondary>ghost>danger;主操作在右/末位;可见按钮 ≤3–4,多则收菜单;按钮间距 8–12,主次靠颜色非距离。

### 3.4 容器与内容
列表行高=控件高+padding,行内垂直居中;表单字段节奏 label→6→控件→4→hint,字段间 16–24;卡片 padding 16–24;嵌套 padding 递减(24→16→8);侧栏选中↔内容标题联动。

### 3.5 间距贯穿(成套的根本)
**一套** spacing scale 同时管 组件内 padding+组件间 margin+区块间距;按关系选档(紧密 4–8/独立 16–24/区块 32–48);同类全局一致;先间距后线。

---

## 4 模式 Patterns

页型(组件+组合规则拼成):表单/列表/详情/设置/仪表盘/三态/搜索筛选/通知/登录(local-first 最小)/对话(发送唯一蓝)。
补充模式:撤销重做(`Cmd+Z`+toast)/文件管理(重命名+删除确认)/音频回放(Voice,波形灰阶+一个蓝)/打印(Office,按纸分页)/轻量引导(内联,不做多步弹窗)。成品见 `examples/patterns.html`。

**交互模式(↔Apple Patterns):**
- **拖放 Drag and drop**(桌面核心:拖入音频转写、素材整理、PPT 排序、文件管理):显示目标能否接受(高亮/插入点;不可接受显示 `⊘`);拖到无效/失败给反馈(回弹或蒸发);必要时**自动滚动**容器;**优先可撤销**,不可撤销前确认。视觉类 `.drop-zone`(`.over`/`.invalid`)+ `.dragging`。
- **加载分级 Loading**(按预计时长):极短**不显示**;短显 spinner;长显**确定进度 + 可取消**;可分块先**骨架**再渐进填充。AI 转写/生成 PPT 属长任务,给取消入口。
- **模态取舍 Modality**:仅用于聚焦一个 scoped 任务,**用得克制**;优先行内编辑/撤销/渐进披露,非必要不弹模态。
- **录入减负 Entering data**:合理默认值、合适控件、自动补全、**能选别键入**;即时 vs 提交校验按场景,错误清楚可恢复。
- **引导 Onboarding / 帮助**:可**延后登录**先探索;引导**≤3 屏、可跳过**;靠渐进披露 + 上下文提示,不做多步弹窗。
- **通知克制**:合并、减打断、给控制;**绝不用通知营销**。

---

## 5 介质落地 Media（Aham 独有）

- **网页**:CSS 变量+文本样式类+断点;暗色支持。
- **桌面 macOS**:三栏窗口+原生菜单;暗色**跟随系统**;取值派生为 Swift 常量。
- **Office(Word/PPT/Excel)**:字体映射 中文雅黑/西文 Inter/数字 Consolas;颜色用 HEX(见 `aham-ui-office.md`);表格只横线、阈值只染文字;**文档不做暗色**;标题映射文本样式体系。

---

## 6 输入 Inputs

- **指针**:可交互有 hover 反馈;**光标映射**——可点 `pointer`(链接手型)、文本 `text`(I-beam)、可拖 `grab`/`col-resize`、不可用 `not-allowed`;围绕小目标加 padding 形成命中区(见 2.0)。右键 / Control-click / 菜单键 触发**上下文菜单**。
- **标准快捷键(↔Apple,不覆盖系统级)**:⌘C/V/X、⌘Z/⇧⌘Z、⌘A 全选、⌘F 查找、⌘S 保存、⌘N 新建、⌘W 关闭、⌘, 设置、⌘B/I/U、Esc 取消、Return 确认;**macOS 菜单项必须显示快捷键**;修饰键用标准符号 ⌘⌥⇧⌃。
- **焦点 Focus(↔Apple Full Keyboard Access)**:Tab 在主要区域间、**方向键在区域内**、Space/Return 选择;**Tab 序只含可交互项**(非所有元素);**焦点分组**——表格/列表/集合默认成组,组内方向键导航;阅读顺序左上→右下(RTL 镜像)。浮层**焦点陷阱 + 关闭后焦点归还**;长页"跳到主内容"。

---

## 7 系统支撑 Support（Aham 独有）

- **命名**:token 三层(primitive→semantic→component,组件只引语义);class BEM-like + `.text-*`。
- **AI 消费**:`AGENTS.md` 入口;`tokens.json` 单一事实源;`examples/` 成品。
- **校验(交付前必过)**:HEX 白名单 / 字体越界 / 表格竖线 / 一组多 primary / 对比度 <4.5 / 圆角越档——出现即失败(圆角警告)。应做成脚本(自检+验收)。
- **治理**:单一事实源 `tokens.json`;**token 派生管线**(→网页CSS/Swift/Office HEX,改一处全端更新);语义化版本+`CHANGELOG.md`;改 token 先改源再派生,新组件默认不加。

---

## 诚实声明(汇总边界)
1. **取值不抄 Apple**:学框架/方法/比例,数值是 Aham(版权 + Inter≠SF + pt≠px)。Apple 数据为特定版本核对,随版本变,仅作参考。
2. **暗色是提案**,需真机实测对比度(尤其暗色主按钮蓝底白字、Increase Contrast 下深字压深底)。
3. **命中区更正**:Apple 唯一公开命中区数字是 44×44pt;"28pt 指针目标"是第三方约定**非 Apple 官方**。Aham 自定取值,保留"足够命中区 + padding"原则。
4. **tracking 未入 token**:字体特定,SF 值不适用 Inter,留待 Inter 实测/opsz 轴。
5. **行为类规范需真实代码验证**:拖放完整交互、VoiceOver 实际朗读、焦点组键盘导航、Dynamic Type 实际缩放——规范给规则 + CSS 给视觉/媒体查询支持,**完整行为在阶段 6 于真实 React/Swift 落地验证**。
6. **base 14px / 4 基网格是 Aham 自定**(桌面/数据密度;Apple 现行未官方规定 8pt 网格),非未对齐。

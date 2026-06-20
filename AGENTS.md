# AGENTS.md — 给 AI 的消费指引

**你是 AI(编码/文档/设计 agent),要用 Aham UI 做界面或文档?先读完这页再动手。**

Aham UI 是机读设计规范 + 参考实现,目的是**让你产出一致结果,不要自由发挥**。设计性格:极简、克制、留白、内容优先;冷色的纸、克制的金属感、对话式。

## 一条铁律
**值只从 `tokens.json` 取,颜色只用调色板,字体只用两族(Inter/Inter Display + JetBrains),间距/圆角/控件尺寸只用既定档位——绝不自创值、自创组件、加装饰。**

## 消费顺序
1. **取值** → `tokens.json`:含**亮+暗两套** + **文本样式体系**(11 样式) + **控件尺寸档** + 间距/圆角/阴影 + **v6.0 布局体系**(`breakpoint`/`contentWidth`/`grid`/`density`/`overlayWidth`/`dialog`/`track`/`canonicalLayout`)。直接引用,不改不近似。
2. **取规则** → `DESIGN.md`:**八层**完整规范(第 8 层 = 页面布局体系)。
3. **拼界面** → `aham-ui.css`:组件 + **文本样式类** `.text-display`…`.text-mono` + **布局类**(`.container`/`.grid-12`/`.page-header`/`.page-toolbar`/`.page-state`/`.preview`)+ **暗色**。不自创组件。交互契约见 `aham-ui.js`。
4. **看成品** → `examples/`:`patterns.html`(页型)、`charts.html`(图表)、`composition.html`(组合规则)、`page-shell.html`(页面骨架)、`search-filter.html`(搜索筛选)、`preview.html`(预览)、`states.html`(空/加载/错误)。
5. **做 Office** → `aham-ui-office.md`。

## 做界面前先选"轨"(v6.0 关键)
**Aham 分四轨,布局心智不同——先声明你在做哪一轨,再套 §8 规则:**
- **网页轨**:`.track-web`,页面壳 `max-width` + `margin:auto` **居中**,12 列栅格,rem 断点(单一事实源);再分桌面(顶栏)/移动(底栏 tab);吸底 CTA 合法。
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
- 状态用 **6px 点+文字**,不要 pill/图标/色块/红黄绿灯。
- 表格**只横线**,无竖线/整行底色;数字右对齐 mono。
- 卡片**无边框无阴影**;选中=**扁平灰**,不是蓝。
- 蓝 `#336EE8` **只**在 logo/主操作/发送/选中。
- 一组**一个** primary;单一无衬线;内容区 `•`+文字。
- 颜色只来自 token 调色板;字体只用允许的几族;圆角只用档位。
- **不靠颜色单独传达**:每个状态/数据系列除颜色外必有图标/文字/形状(单蓝体系关键);纯图标按钮必有可访问名(aria-label);图表配文字/数据表替代。
- **布局(v6.0)**:先声明轨道;页面有 `.page-header`(标题左上、主操作右上、全页一个 primary);内容宽度命中 `--page-max/content-max/form-max/auth-max` 档之一,**不裸写宽度**;搜索框/结果计数**不置底**;**弹窗取消在左、确认在右**(默认绑 Return),破坏按钮不设默认、不上蓝;空态必给下一步;骨架占位 = 最终尺寸;用逻辑属性(`margin-inline`)不写死 left/right。

## 文件清单
| 文件 | 用途 |
|---|---|
| `tokens.json` | 值(机读,单一事实源,亮+暗+文本样式+尺寸档) |
| `DESIGN.md` | 规则(七层) |
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

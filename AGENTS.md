# AGENTS.md — 给 AI 的消费指引

**你是 AI(编码/文档/设计 agent),要用 Aham UI 做界面或文档?先读完这页再动手。**

Aham UI 是机读设计规范 + 参考实现,目的是**让你产出一致结果,不要自由发挥**。设计性格:极简、克制、留白、内容优先;冷色的纸、克制的金属感、对话式。

## 一条铁律
**值只从 `tokens.json` 取,颜色只用调色板,字体只用两族(Inter/Inter Display + JetBrains),间距/圆角/控件尺寸只用既定档位——绝不自创值、自创组件、加装饰。**

## 消费顺序
1. **取值** → `tokens.json`:含**亮+暗两套** + **文本样式体系**(11 样式) + **控件尺寸档** + 间距/圆角/阴影等。直接引用,不改不近似。
2. **取规则** → `DESIGN.md`:**七层**完整规范。
3. **拼界面** → `aham-ui.css`:组件 + **文本样式类** `.text-display`…`.text-mono` + **暗色**。不自创组件。交互契约见 `aham-ui.js`。
4. **看成品** → `examples/`:`patterns.html`(页型)、`charts.html`(图表)、`composition.html`(组合规则示范)。
5. **做 Office** → `aham-ui-office.md`。

## 七层(都在 DESIGN.md)
0 原则 · 1 基础 · 2 控件与组件 · 3 组合规则 · 4 模式 · 5 介质落地 · 6 输入 · 7 系统支撑。

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
| `examples/data.html` `overlays.html` `status-viz.html` `extras.html` | 数据/浮层/可视化/新组件示范 |
| `aham-ui-office.md` | Office 落地 |

**拿不准就回到 `tokens.json` 和 `DESIGN.md`,不要猜。你的工作是执行这套规范,不是设计。**

# Aham UI — 供 AI 消费的设计系统

> aham 系列 · 本地优先 macOS AI 工具的设计地基 · 单一事实源、机器可读
>
> 把"该长什么样"写成 AI 能读懂的规范，让 Claude 等工具据此产出风格一致的界面与文档。

把灵感交给 AI 生成交付物时，字体、颜色、间距各自为政——十几个文件十几种样式。Aham UI 把设计语言写成**机器可读的单一事实源**，AI 据规范产出，处处一致。

**🖥 在线全景展示** → <https://li599198347-svg.github.io/aham-ui/>

## 关于 Aham

> **把灵光一现，做成能用的 AI 工具。**

Aham 来自 *aha moment*。每个工具只把一件事做利落，共享同一套设计地基——这就是 Aham UI。

| 应用 | 一句话 |
|---|---|
| **[Aham UI](https://github.com/li599198347-svg/aham-ui)** | 供 AI 消费的设计系统——写一次规范，AI 产出处处一致（本仓库 · 全系列地基） |
| [Aham Voice](https://github.com/li599198347-svg/aham-voice) | 录音转写与会议纪要（macOS）——录一段会，纪要已经写好 |
| [Aham Survey](https://github.com/li599198347-svg/aham-survey) | 现场调研工具（macOS）——聊一圈，调研结果自己长出来 |
| [Aham PPT](https://github.com/li599198347-svg/aham-ppt) | 咨询级 AI PPT 制作技能——丢一堆素材，幻灯片出来了 |

## 设计性格

**冷色的纸、克制的金属感、对话式**——对标 Claude desktop 的极简克制。

- 单一强调色：钢蓝 `#336EE8`，只用于点缀（logo / 主按钮 / 发送 / 推荐标记 / 选中下划线）。**第一眼就注意到蓝色，就算超标。**
- 三层灰背景（`#FFFFFF` / `#F3F3F3` / `#E7E7E7`），层级靠背景与留白，不靠阴影。
- 扁平、无静置阴影；单一无衬线（Inter + 雅黑/黑体），层级只靠字号与字重。
- 状态 = 符号 + 颜色双通道，绝不整块上色；语义色高度去饱和，仅用于真实风险。
- 亮 / 暗双色 · 无障碍 + RTL 支持。

## 方法论

框架 / 比例 / 方法参考 **Apple Human Interface Guidelines**，但**取值全部自定**（不抄 Apple 的 hex/pt）。经 Apple HIG 完整性审计，补全 30 项（Dynamic Type、无障碍、拖放、加载分级、标准快捷键、RTL 等）。

## 规模

- **七层规范**：原则 / 基础 / 组件 / 组合规则 / 模式 / 介质落地 / 输入 / 系统支撑
- **约 65 个独立 UI 组件**，分 8 大类
- **三层 token 体系**（primitive → semantic → component）
- 亮 / 暗双色 · 无障碍 + RTL

## 怎么用（消费顺序）

**铁律：值只从 token 取，绝不自由发挥。**

| 用途 | 文件 |
|---|---|
| AI 消费入口 | [`AGENTS.md`](./AGENTS.md) |
| 单一事实源（机读 token，亮+暗+文本样式） | [`tokens.json`](./tokens.json) |
| 完整规范（七层） | [`DESIGN.md`](./DESIGN.md) |
| 参考实现 | [`aham-ui.css`](./aham-ui.css) / [`aham-ui.js`](./aham-ui.js) |
| 组件文档站 | [`docs.html`](./docs.html) |
| 示范页 | [`examples/`](./examples/) |
| Office 落地（HEX + 字体映射） | [`aham-ui-office.md`](./aham-ui-office.md) |

AI 消费顺序：`tokens.json`（值）→ `DESIGN.md`（七层规则）→ `aham-ui.css`（组件 + 文本样式类 + 暗色）→ `examples/`（成品）→ `aham-ui-office.md`（Office）。

## 快速看

- **在线**：[全景展示页](https://li599198347-svg.github.io/aham-ui/)（即本仓库 `index.html`）
- **本地**：浏览器打开 `docs.html`、`examples/patterns.html`、`examples/charts.html`、`examples/composition.html`
- 切暗色：地址栏加 `?`，或在控制台执行 `document.documentElement.setAttribute('data-theme','dark')`

## 性质说明

这是**设计规范 + 参考实现（CSS）**，主要供 AI 据规范产出一致输出；组件 CSS 尚未在生产级 React / Swift 中逐一验证。

---

当前版本 **v5.1**。变更见 [CHANGELOG.md](./CHANGELOG.md)。 · Aham：把灵光一现，做成能用的 AI 工具。

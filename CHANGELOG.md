# CHANGELOG

## v5.1 — 清理旧/重复类
- **删除 8 个与新 `text-*` 重复的旧排版类**(`t-display`/`t-title`/`t-heading`/`t-card-title`/`t-body`/`t-ui`/`t-label`/`t-caption`);docs 与示范页的引用已迁移到 `text-*`。
- **删除 7 个死代码类**(零引用:`review`/`checklist`/`avatar`/`num-input`/`frow`/`fsection`/`wrap-pad`)。
- 保留有效类:`text-*`(11 个新排版)、`t-2`/`t-3`(颜色工具)、`ftype`(文件类型 badge)、`empty`(简版空状态,与 `empty-state` 粒度不同)。
- CSS 757→728 行;无悬空;docs.html 与全部示范页验证无残留引用。

## v5.0 — 对照 Apple HIG 完整性审计补全
- 深度调研 Apple HIG 全部章节,补全 **30 项**欠缺(规则进 DESIGN 七层,能纯前端落地的进 CSS)。
- **基础**:Dynamic Type 文字缩放响应、可读性红线(行长/最小字号/禁两端对齐)、深色对比细则、安全区/本地化、**国际化 RTL(含不翻转清单)**、隐私授权。
- **无障碍**:**Differentiate Without Color**(单蓝体系关键)、VoiceOver 语义契约、**Reduce Motion / Increase Contrast 媒体查询(已实现)**、命中区更正(44pt,非臆造 28pt)。
- **组件**:按钮 role(destructive 确认)、macOS 菜单栏、选择模式/右键、浮层 dismiss/防数据丢失、**组合框、路径栏、空状态组件**。
- **模式**:**Drag and drop**(拖放,桌面核心)、Loading 分级、Modality 取舍、Entering data 减负、Onboarding、通知克制。
- **输入**:标准快捷键映射、焦点组/focus order、光标映射、右键菜单。
- 守住全部铁规与 Aham 取值;移动/系统级/材质/多彩仍不做。

## v4.0 — 对齐 Apple HIG 框架的全面重构
- **方法**：从 Apple HIG 框架做减法 + 补 Aham 独有(Office/AI消费/治理)；取值全用 Aham，比例/方法对齐 Apple。
- **新增**：文本样式体系(11 语义样式)、控件尺寸体系(Small/Medium/Large)、组合规则层(同心圆角/对齐/主次/容器内容/间距贯穿)、暗色模式(系统+手动)、第四级文字。
- **tokens.json**：扩为亮+暗两套 + 文本样式 + 光学尺寸字族。
- **DESIGN.md**：重写为**七层结构**(0原则/1基础/2控件组件/3组合规则/4模式/5介质/6输入/7支撑)。
- **守住**：单蓝 #336EE8 / 三层灰 / 扁平 / 克制 / 全部铁规 / 单一无衬线。

# Aham UI · CHANGELOG

记录每版新增 / 变更 / 废弃 / 修复。单一事实源在 `tokens.json`，下游全部派生。

## v3.1 — 重构为六层架构 + 对照市场基准补全
- **重构**：DESIGN.md 推倒"9 节 + 追加补丁"的旧结构，重写为干净六层（哲学/基础值/组件/模式/介质/支撑）
- **基础值补全**：补齐边框宽度、焦点环宽度/偏移、图标尺寸阶梯、断点、中性交互填充、禁用透明度——基础值 12 类齐
- **组件补全**：新增 19 个 B 端标配组件（Alert/Banner/Toast/Progress/Skeleton/Result/Tooltip/Drawer/Popconfirm/Pagination/Segmented/Steps/Descriptions/Accordion/Code/Button-group/Slider/焦点环），CSS 组件约 49 个
- **机读补全**：tokens.json 增至 13 组（含 zIndex/motion/border/focusRing/iconSize/opacity/breakpoint）
- 每组件标注实现状态（✅已实现 / 📝待实现 / ⚙️需JS / 🚫不适用）
- 品牌定位修正为 Aham（aha moment + Voice/Survey/PPT），清除制造业旧表述

## v3.0 — Workbench 蓝色版
- 规整为蓝色版（三层灰 + 蓝 + flat）；字体重设计（砍衬线，统一 Inter+雅黑+JetBrains）

## v2.1 — 回归修复
- 修复 v2 误删 `--text-2xs`/`--text-4xl`（`.metric` 依赖），回滚 10 档字号

## v2.0 / v1.x — 早期 steel-blue 骨架
- 三层 token + DESIGN.md + tokens.json 成型

# ORIGIN — 来源与说明

## 血缘

Aham UI 是整个 Aham 应用矩阵的**设计地基**——Word / PPT / Voice / Survey 的视觉取值都源自这里。

它自身规整自 **Aham Workbench** 设计系统：强调色由陶土棕改为钢蓝 `#336EE8`；字体统一为单一无衬线（Inter + 雅黑 / 黑体）+ 等宽（JetBrains Mono），去衬线、补 CJK 回退；其余取值忠实沿用 Workbench。框架 / 比例 / 方法对齐 Apple HIG 与业内主流设计系统（Material / Carbon / Ant / Fluent / GOV.UK 等），**取值全部自定，不抄 hex/pt**。

v7.0 起，规范被打包成 AI 可直接消费的组件库（17 组件契约 + 就地预览 + dashboard 示范），整体收进 `design-system/`。

## 图标

图标集采用 [Lucide](https://lucide.dev)（ISC 许可），原始 SVG 与许可全文见 `design-system/icons/`。SF Symbols 版权属 Apple，仅可用于苹果平台及其 mockup，不纳入本 MIT 仓库。

## 脱敏

本仓库不含任何真实客户数据。`design-system/examples/`、`ui_kits/`、预览与截图里的数字、名称均为虚构样例，仅用于演示样式。

## 工程实现参考

三层令牌体系（primitive → semantic → component）、容器查询、暗色覆盖、组件 CSS 等，是设计系统的通用做法，已按 Aham 性格重写，并以 `tokens.json` 为单一事实源驱动。

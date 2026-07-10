# 贡献指南 Contributing

感谢关注 Aham UI。本仓库是一套**供 AI 消费的设计规范 + 参考实现**，欢迎报告问题、提议组件、改进规范。

## 报告问题 / 提议

- 用 [Issue 模板](https://github.com/Aham-AIAPP/aham-ui/issues/new/choose) 提交：**Bug 反馈**（设计/CSS 不一致）或 **功能提议**（新组件/规范）。
- 描述清楚：期望 vs 实际、所在文件、浏览器/环境。

## 核心理念：单一事实源

所有数值的源头是 **`tokens.json`**，下游全部派生。**改动务必按此顺序**，保持四处一致：

1. **`tokens.json`** — 改值（颜色/间距/字号/尺寸…）。这是唯一事实源。
2. **`DESIGN.md`** — 改规则（八层规范，新组件归第 2 层）。
3. **`aham-ui.css`** — 改参考实现（组件类 + 文本样式类 + 暗色）。
4. **`CHANGELOG.md`** — 在 `[Unreleased]` 下记录本次改动。

## 铁律（提交前自查）

- 颜色/间距/圆角/控件尺寸**只用既定 token**，绝不裸写像素或自造色。
- 单蓝 `#336EE8` 只点缀（logo/主操作/发送/选中）；卡片无边框无阴影；表格只横线；状态 = 点 + 文字。
- 单一无衬线（Inter）+ 数字 mono（JetBrains）。
- **不靠颜色单独传达**：多类别用形状/文字/图标（见 `.speaker-marker`）。
- 新增组件需在 `DESIGN.md` 第 2 层写明：原则 / 结构 / 变体 / 约束 / lint 自查。

## 发版流程（维护者）

每次"规范更新"按此走，保证 GitHub 门面规范、版本可追溯：

1. 升版本号：`tokens.json` 的 `$meta.version` + `DESIGN.md` 头部 + `README.md` 版本行（遵 [SemVer](https://semver.org/lang/zh-CN/)：新增功能 → MINOR，修复 → PATCH，破坏性 → MAJOR）。
2. 把 `CHANGELOG.md` 的 `[Unreleased]` 内容移入新版本号 + 当日日期 + `新增/变更/修复/移除` 分组。
3. 提交并推送：`git commit && git push origin main`。
4. 发布 Release（自动建 tag）：
   ```sh
   gh release create v6.1.0 --title "v6.1.0 — 一句话主题" --notes "<取自 CHANGELOG 该版本>" --latest
   ```
5. 封面 `assets/social-preview.png` **不印版本号**——版本由 README 的 Release 徽章动态显示。

## 许可

贡献默认遵 [MIT](./LICENSE)。维护者：@Aham-AIAPP

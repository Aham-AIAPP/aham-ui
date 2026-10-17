# 贡献指南

Aham UI 是一套业务管理系统的界面规范和参考实现。问题和建议用 [Issue](https://github.com/Aham-AIAPP/aham-ui/issues/new/choose) 提交，写清期望的结果、实际的结果、所在文件和浏览器。

## 改动顺序

1. **改取值**：只改 [tokens.json](tokens.json)。
2. **改规则**：改 [rules/](rules/) 里对应的文件。规则变了先改规则，再改实现。
3. **改实现**：样式改 `src/*.css`，行为改 `aham.js`，结构变了同步改 `components/*.json`。
4. **重新生成**：运行 `node scripts/build.mjs` 生成 aham.css。aham.css 不手改。
5. **同步示例**：规则涉及的示例页一起改。
6. **记录**：在 [CHANGELOG.md](CHANGELOG.md) 的 `[Unreleased]` 下写本次改动。

## 提交前检查

```bash
node scripts/build.mjs --check
node scripts/lint.mjs
node --test
```

三条都要通过，CI 运行同样的三条。改了视觉的，按 [rules/9-验收.md](rules/9-验收.md) 9.4 截图核对亮色和暗色。

## 规则文字的写法

- 标题用名词短语，不用问句。
- 每条规则写到能核对：写数值、写条件、写例外的判断标准。
- 同一个概念只用一个词，词表见 [rules/1-总则.md](rules/1-总则.md) 1.4。
- `tests/structure.test.mjs` 会检查标题和禁用词。

## 发版

1. 改 `tokens.json` 的 `$meta.version` 和 `rules/1-总则.md` 开头的版本号。新增功能升次版本号，修复升修订号，不兼容的改动升主版本号。
2. 把 CHANGELOG 的 `[Unreleased]` 移到新版本号下，写上日期。
3. 提交并推送到 main，在 GitHub 上发布 Release。

## 许可

贡献的内容按 [MIT](LICENSE) 许可发布。维护者：@Aham-AIAPP

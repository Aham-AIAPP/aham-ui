# Aham UI · 业务管理系统界面规范

[![Release](https://img.shields.io/github/v/release/Aham-AIAPP/aham-ui?color=336EE8)](https://github.com/Aham-AIAPP/aham-ui/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-336EE8.svg)](LICENSE)
[![在线预览](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E9%A2%84%E8%A7%88-Pages-336EE8.svg)](https://aham-aiapp.github.io/aham-ui/)
[![联系我](https://img.shields.io/badge/%E8%81%94%E7%B3%BB%E6%88%91-%E5%BE%AE%E4%BF%A1-336EE8.svg?logo=wechat&logoColor=white)](assets/wechat-qr.png)

Aham UI 是一套给电脑浏览器里的业务管理系统用的界面规范，包括取值、规则、样式、脚本和示例页。AI 和人按同一份文件生成界面，同一个需求生成几次，取值和交互都一致。

![单据页](assets/shots/document.png)

## 设计方向

- **视觉学 Claude 客户端**：中性色和表面层级按客户端截图量取，大面积近白，灰色只用在一行高的元素上；1px 细线、8px 圆角、1.5px 线宽的小图标。主色、状态色和字体自定。
- **交互学 SAP Fiori**：单据的显示态和编辑态、校验和消息、单据状态、按钮位置、选择控件选型。
- **键盘学 Linear**：命令面板、快捷键、右键菜单、列表键盘。
- **密度按电脑设定**：行高 36px，紧凑 32px，控件 32px。44px 只在触屏上使用。
- **颜色分三类**：主色钢蓝 `#336EE8` 用于操作和焦点，4 个状态色表达状态，6 个分类色区分类别。

## 目录

| 位置 | 内容 |
|---|---|
| [tokens.json](tokens.json) | 全部取值：亮色、暗色、增强对比度三套颜色，字号、间距、尺寸、断点 |
| [rules/](rules/) | 规则正文，九个文件：总则、视觉、控件、页面、单据、反馈、键盘与命令、AI 协作、验收 |
| [components/](components/) | 36 份契约，写明每个控件和组合的结构、类名、状态和键盘 |
| [src/](src/) | 样式源文件 |
| [aham.css](aham.css) | 由 `scripts/build.mjs` 从 tokens.json 和 src/ 生成，页面只引这一个文件 |
| [aham.js](aham.js) | 行为脚本，ES 模块，没有第三方依赖 |
| [examples/](examples/) | 示例页，数据全部虚构 |
| [assets/](assets/) | Inter 字体（SIL OFL）、Lucide 图标 53 个（ISC）、截图 |
| [scripts/](scripts/)、[tests/](tests/) | 生成、检查和测试脚本 |
| [research/](research/) | 调研和规划记录，只作历史参考 |
| [AGENTS.md](AGENTS.md) | 给 AI 的读取顺序和硬约束 |

## 示例页

| 页面 | 演示内容 |
|---|---|
| [单据页](examples/document.html) | 报价单的显示态、编辑态、校验、提交、审批、退回、作废、删除 |
| [打印预览](examples/print.html) | A4 版式、未生效标记、金额大写 |
| [列表页](examples/list.html) | 筛选、显示选项、分组、勾选、批量操作、列表键盘 |
| [记录详情页](examples/record.html) | 属性栏、动态、评论、AI 摘要 |
| [设置页](examples/settings.html) | 分区设置、立即生效、危险操作 |
| [控件总览](examples/controls.html) | 按钮、输入框、选择控件、状态、标签、提示条 |
| [外框](examples/shell.html) | 导航栏、页眉、侧面板 |
| 部件 | [筛选](examples/parts-filter.html) · [列表键盘和详情](examples/parts-detail.html) · [快速操作](examples/parts-actions.html) · [AI 协作](examples/parts-ai.html) · [文件与版本](examples/parts-files.html) |

<table>
<tr>
<td width="50%"><img src="assets/shots/list.png" alt="列表页"><br><sub>列表页</sub></td>
<td width="50%"><img src="assets/shots/document-edit.png" alt="单据编辑态"><br><sub>单据编辑态：字段错误和消息列表</sub></td>
</tr>
<tr>
<td width="50%"><img src="assets/shots/print.png" alt="打印预览"><br><sub>打印预览</sub></td>
<td width="50%"><img src="assets/shots/dark.png" alt="暗色"><br><sub>暗色</sub></td>
</tr>
</table>

## 使用方法

**交给 AI**：把仓库地址 `https://github.com/Aham-AIAPP/aham-ui` 发给 AI，要求按 [AGENTS.md](AGENTS.md) 生成界面。

**在页面里引用**：复制 `aham.css`、`aham.js` 和 `assets/` 目录。

```html
<link rel="stylesheet" href="aham.css">
<div class="aham-workbench" data-theme="light">…</div>
<script type="module">
  import { initShell } from './aham.js';
</script>
```

**换品牌**：改 tokens.json 里的取值，运行 `node scripts/build.mjs` 重新生成 aham.css。规则文件不用改。

**本地预览和检查**：

```bash
python3 -m http.server 8765 --bind 127.0.0.1   # 打开 http://127.0.0.1:8765/
node scripts/build.mjs --check                  # aham.css 是最新生成的
node scripts/lint.mjs                           # 变量都有定义、没有写死的值、对比度达标
node --test                                     # 计算函数、筛选语义、文件结构
```

## 版本

当前版本 8.0.0。8.0 删除了 macOS、Office 和 HTML 邮件三套规则，目录整体重排，类名和变量有改动，详见 [CHANGELOG.md](CHANGELOG.md)。

[Releases](https://github.com/Aham-AIAPP/aham-ui/releases) · [CHANGELOG](CHANGELOG.md) · [CONTRIBUTING](CONTRIBUTING.md) · [ORIGIN](ORIGIN.md) · [MIT](LICENSE)

## 关于 Aham

Aham 这个名字来自 *aha moment*，每个工具处理一类任务。

| 应用 | 说明 |
|---|---|
| **Aham UI**（本仓库） | 业务管理系统界面规范 |
| [Aham Word](https://github.com/Aham-AIAPP/aham-word) | AI 按规范生成 .docx 文档 |
| [Aham PPT](https://github.com/Aham-AIAPP/aham-ppt) | 把素材做成方案级 PPT 的技能 |
| Aham Excel | Excel 规范，开发中 |
| [Aham Voice](https://github.com/Aham-AIAPP/aham-voice) | 录音转写与会议纪要（macOS），本地离线转写 |
| [Aham Survey](https://github.com/Aham-AIAPP/aham-survey) | 现场调研工具（macOS），本地优先 |

公众号发布 AI 工具的实践记录和更新，扫码可以加作者微信交流。

<p><img src="assets/wechat-qr.png" width="640" alt="Aham 公众号和作者微信二维码"></p>

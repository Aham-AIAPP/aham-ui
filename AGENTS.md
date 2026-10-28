# AGENTS · AI 使用说明

本文件写给按 Aham UI 生成界面的 AI。人读 [README.md](README.md)。

## 适用范围

Aham UI 覆盖电脑浏览器里的业务管理系统：列表、单据、记录详情、设置页；以及这类系统发给外部人员填写的对外填报页。官网、营销页、macOS 应用、Office 文档和 HTML 邮件不在范围内，遇到这类需求时直接说明本仓库不覆盖。

## 读取顺序

0. [设计理念.md](设计理念.md)：总体标准、16 条原则和冲突时的取舍次序。规则没写到的情况，按这篇判断。
1. [tokens.json](tokens.json)：全部取值。键名就是 CSS 变量名，键 `row` 对应 `--wb-row`。
2. [rules/](rules/)：十一个规则文件，按编号读。至少读 [1-总则.md](rules/1-总则.md)、[2-视觉.md](rules/2-视觉.md)、[3-控件.md](rules/3-控件.md)、[10-数据格式.md](rules/10-数据格式.md)，再按页面类型读 4–8。
3. [components/index.json](components/index.json)：全部契约的目录，写明每个控件和组合的结构、类名、状态和键盘。
4. [aham.css](aham.css) 和 [aham.js](aham.js)：样式和行为的参考实现。
5. [examples/](examples/)：示例页。拿不准的写法以示例页为准。

规则和 tokens.json、aham.css、aham.js 不一致时，按缺陷处理，在回复里指出。

## 引用方式

```html
<link rel="stylesheet" href="aham.css">
<div class="aham-workbench" data-theme="light">…</div>
<script type="module">
  import { initShell, initPalette } from './aham.js';
  const root = document.querySelector('.aham-workbench');
  initShell(root);
  initPalette({ root, groups: () => [/* 本页的命令 */], shell: true });
</script>
```

- 每个 `init*` 和 `create*` 返回的句柄都有 `destroy()`。React 里在 `useEffect` 中调用，在清理函数里销毁，写法见 [docs/react.md](docs/react.md)。参数和返回值见 [aham.d.ts](aham.d.ts)。
- `initPalette({ shell: true })` 自带界面、账户、跳转、帮助四组命令和 ? 快捷键，页面只写本页的命令组。

- aham.css 按相对路径引用 `assets/fonts/` 里的 Inter 字体，复制 aham.css 时一并复制 `assets/`。
- 根节点 `.aham-workbench` 的 `data-theme` 取 `light`、`dark`，不写时跟随系统。
- 图标用 `<svg><use href="assets/icons/aham-icons.svg#i-名称"></use></svg>`，名称见 [assets/icons/icons.json](assets/icons/icons.json)。

## 页型选择

| 需求 | 页型 | 示例 |
|---|---|---|
| 登录后先看今天要关心的事 | 我的工作台 | [examples/home.html](examples/home.html) |
| 查找、筛选、批量处理 | 列表页 | [examples/list.html](examples/list.html) |
| 有明细、金额或审批的业务对象 | 单据页 | [examples/document.html](examples/document.html) |
| 逐条处理分给自己的待办 | 工作清单 | [examples/worklist.html](examples/worklist.html) |
| 没有审批流程的记录 | 记录详情页 | [examples/record.html](examples/record.html) |
| 客户和我方共用、按阶段推进的对象 | 共用对象的列表页和详情页 | [examples/scenes.html](examples/scenes.html)、[examples/scene.html](examples/scene.html) |
| 新建简单的记录：必填字段少于 8 个、没有明细表 | 新建弹窗 | `openCreateDialog()` |
| 新建单据：有明细表或必填字段 8 个以上 | 单据页的新建态 | — |
| 新建过程分 3–8 步、前后步骤有依赖 | 向导 | 没有参考实现 |
| 先输入编号或名称，再打开对应的单据 | 初始页 | 没有参考实现 |
| 打印单据 | 打印预览页 | [examples/print.html](examples/print.html) |
| 请公司外部的人填写信息 | 对外填报页 | [examples/form.html](examples/form.html) |
| 个人或工作区设置 | 设置页 | [examples/settings.html](examples/settings.html) |
| 成员、角色和权限 | 设置页的成员与角色 | [examples/members.html](examples/members.html) |

完整的选择表见 [rules/4-页面.md](rules/4-页面.md) 4.2。

## 生成时的硬约束

- 颜色、字号、间距、圆角、尺寸只用 `var(--wb-*)`，不写十六进制色值和像素字号。
- 列表页用单行列表 `.wb-table.wb-list-rows`：不显示表头，按分组排列，数据行 44px（`--wb-list-row`），分组行 36px。需要逐列比较数字的数据表格用 `.wb-table`，行高 36px（`--wb-row`），紧凑 32px。控件 32px。
- 外框是 220px 的文字侧栏（`.wb-rail`），⌘/Ctrl + B 收起成 52px。侧栏项写 `data-go` 登记 G 加字母的跳转。
- 字号只用两档：正文 13px，辅助信息 12px。20px 标题一页一次，只在详情页、单据页和设置页。字重 400 和 500，600 只给标题。
- 金额、数量、单价和就地变化的计数用 `.wb-tnum`（Inter 等宽数字），编号和日期不用，也不换等宽字体。
- 图标 14px。主色蓝只用在主按钮、焦点框、当前项标记、进行中的阶段图标；正文链接用 `.wb-link`（正文色加下划线）。
- 标签是描边胶囊加分类色圆点（`.wb-tag`）。列表行里的人员只放头像：`personHTML(name, { compact: true })`；对象所在阶段用 `stageIconHTML()`。
- 一个页面只有一个主按钮。一个按钮只用文字或只用图标，不同时用。
- 灰底（`--wb-fill`、`--wb-hover`、`--wb-selected`）只用在一行高的元素上，侧栏和表头用白底加分隔线。
- 状态用圆点加文字（`.wb-status`），不给整行上色。
- 单据的显示态和编辑态用同一版式，按状态只显示当前可用的操作。编辑态的取消和保存放在页脚工具栏（[rules/5-单据.md](rules/5-单据.md) 5.4）。
- 日期写 2026-10-17，金额写 780,800.00。空值按类型写：文字「未填写」、选项「未选择」、人员「未指定」、数值和日期「–」（[rules/10-数据格式.md](rules/10-数据格式.md) 10.5）。
- 需要读的文字不低于 4.5:1，用 `--wb-muted` 及更深的颜色；`--wb-faint` 只用于图标和禁用文字。
- 每个元素先答三个问题：谁在什么时候用、不看会不会做错、能不能从别处看到。答不上来就删除，不挪进抽屉或页签。
- 详情页和属性栏里的人员用 `personHTML()` 显示头像加姓名；有流程的对象在标题下放下一步提示条 `.wb-next`；动态和修改记录折叠在页尾（`.wb-fold`）。
- 客户方和我方共用的对象，人名后写组织简称，仅我方的内容加 `.wb-scope` 标记，客户方看不到的内容不渲染（[rules/4-页面.md](rules/4-页面.md) 4.15）。字段标签统一 12px、`--wb-muted`。
- 删除、作废、撤回之前用确认弹窗（`openConfirm()`），按钮写动作名。
- 界面文字不用「请」「您」「抱歉」，写法见 [rules/6-反馈.md](rules/6-反馈.md) 6.6。
- 示例数据一律虚构。

## 交付前自查

新设计和改版先按 [rules/9-验收.md](rules/9-验收.md) 9.6 出方案，用户确认后再写代码。交付前逐条核对 9.5 的十二项，改了视觉的再核对 9.7 的风格判据。产品仓库（用 Aham UI 做的系统）提交前按 [rules/9-验收.md](rules/9-验收.md) 9.8 做挤压测试，并运行 `node scripts/product-check.mjs --config <配置文件>`（9.9）。产品的业务词写在产品自己的用语表里，界面上不出现内部代号和数据库里的写法（原则 13、16）。

改了本仓库的文件时，再运行全部检查：

```bash
npm run check
```

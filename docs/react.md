# React 接入

本文说明在 React 18 加 Vite 的产品里使用 aham.css 和 aham.js 的写法。Aham 不另出 React 组件包，页面结构照规则写 JSX，行为调用 aham.js。

## 引入

```js
import 'aham-ui/aham.css';
import { initShell, initPalette } from 'aham-ui/aham.js';
```

类型声明在 aham.d.ts，和 aham.js 放在同一目录，编辑器自动读取。

## 挂载和卸载

每个 `init*` 和 `create*` 的返回值都有 `destroy()`。它移除这次调用加上的监听、快捷键和元素。在 `useEffect` 里调用，在清理函数里销毁：

```jsx
function Workbench({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    const shell = initShell(root);
    const palette = initPalette({ root, groups: () => [], shell: true });
    return () => { palette.destroy(); shell?.destroy(); };
  }, []);
  return <div className="aham-workbench" ref={ref}>{children}</div>;
}
```

开发模式下 StrictMode 会挂载两次。先销毁再挂载，页面上只留一份监听和一个命令面板。

## 弹窗和浮层

`openConfirm`、`openFormDialog`、`openDialog` 这类函数打开一次就结束，自己关闭时清理，不需要在清理函数里处理。组件卸载时弹窗还开着的，调用返回值的 `close()`。

## 状态归属

- 列表的数据、筛选和排序归 React 状态。`initFilter` 的 `onChange` 回调里调用 setState，状态变了再调用 `set()` 同步回控件。
- 表格重新渲染后调用 `initListKeys` 返回值的 `refresh()`，当前行和 Tab 顺序按新的行重算。
- 不要让 React 和 aham.js 同时改同一个属性。`aria-pressed`、`hidden` 这类由 aham.js 维护的属性，JSX 里只写初值。

## 全局状态

层栈、快捷键表和轻提示容器在一个页面里只有一份。aham.js 只能加载一次，不要用两个路径或两个版本引入。

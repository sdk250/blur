// 窗口大小变了要不要重建拼图。
// 手机上点搜索框会弹出键盘、改变视口高度：正在输入时绝不能重建，否则输入框被换掉、键盘收起，又触发一次变化，死循环。
export function shouldRebuild(prev, next, typing) {
  if (typing) return false;
  return prev.w !== next.w || prev.h !== next.h;
}

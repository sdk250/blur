// 触屏上，按下的一瞬间悬停样式就生效，紧接着的点击会落在“刚出现”的按钮上。
// 规则：触屏 / 笔在按钮还没展开时按下 -> 这一下只负责展开，吞掉随后的那次点击。鼠标不受影响。
export function createRevealGuard() {
  let swallow = false;
  return {
    pointerDown(pointerType, wasOpen) { swallow = pointerType !== 'mouse' && !wasOpen; },
    /** 这次点击是否放行 */
    takeClick() { const ok = !swallow; swallow = false; return ok; },
  };
}

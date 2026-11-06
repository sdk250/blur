// 万能桩：冒充 document / window / DOM 元素，只为了让画面模块在 Node 里把顶层和工厂函数跑一遍，
// 抓 “声明前使用” 这类会让整页黑屏的运行时错误。不验证画面本身。
export const any = () => new Proxy(function () {}, {
  get: (t, k) => k === Symbol.toPrimitive ? () => 1 : k === 'then' ? undefined
    : k === Symbol.iterator ? function* () {} : any(),
  apply: () => any(), construct: () => any(), set: () => true, has: () => true,
});
const g = globalThis;
for (const k of ['document', 'Image', 'getComputedStyle', 'matchMedia']) g[k] = any();
g.window = g; g.innerWidth = 1280; g.innerHeight = 800; g.devicePixelRatio = 1;
g.addEventListener = () => {}; g.removeEventListener = () => {};
g.requestAnimationFrame = () => 0; g.cancelAnimationFrame = () => {};
g.fetch = () => new Promise(() => {}); // 永远挂起：不进入真实数据流程

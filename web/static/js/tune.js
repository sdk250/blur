// 和用户逐项确认过的参数（见设计文档 §8），其它模块只从这里取
export const tune = {
  dur: 3000,     // 歌词飞入时长 ms
  dist: 2300,    // 飞入起始距离（translateZ）
  float: 28,     // 漂浮幅度
  lead: 3,       // 隧道中心预判提前 s
  chase: 0.6,    // 追焦速度（弹簧）
  curve: 0.5,    // 随机弧度强度
};
export const EXIT_MS = 900;        // 歌词退场
export const BG_BLUR = 30;         // 背景模糊 px（写在 CSS 里，这里留作记录）
export const MIST_LIFE = 11;       // 一团色雾的生命周期 s
export const MIST_COUNT = 16;
export const IDLE_MS = 2500;       // 无操作多久隐去歌名
export const FADE_TOGGLE_MS = 500; // 空格播放/暂停的音量淡入淡出
export const FADE_IN_MS = 300;     // 进入/切歌时音乐淡入
export const FADE_OUT_MS = 800;    // 返回/切歌时音乐淡出
export const RECENT = 10;          // 随机下一曲避开最近几首

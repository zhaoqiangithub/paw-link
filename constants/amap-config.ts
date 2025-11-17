// 高德地图配置常量
// 高德地图JavaScript API版本
export const AMAP_JS_API_VERSION = '2.0';

// 高德地图JS API基础URL
export const AMAP_JS_API_URL = `https://webapi.amap.com/api/jsapi?v=${AMAP_JS_API_VERSION}`;

// 高德地图样式类型
export type MapStyleType =
  | 'normal'          // 标准样式
  | 'dark'            // 暗黑样式
  | 'light'           // 月光银
  | 'whitesmoke'      // 远山黛
  | 'fresh'           // 草色青
  | 'grey'            // 雅士灰
  | 'graffiti'        // 涂鸦
  | 'macaron'         // 马卡龙
  | 'blue'            // 靛青蓝
  | 'darkblue'        // 极夜蓝
  | 'wine'            // 酱籽

// 地图样式配置
export const MAP_STYLES = {
  normal: 'amap://styles/normal',           // 标准样式
  dark: 'amap://styles/dark',               // 暗黑样式
  light: 'amap://styles/light',             // 月光银
  whitesmoke: 'amap://styles/whitesmoke',   // 远山黛
  fresh: 'amap://styles/fresh',             // 草色青
  grey: 'amap://styles/grey',               // 雅士灰
  graffiti: 'amap://styles/graffiti',       // 涂鸦
  macaron: 'amap://styles/macaron',         // 马卡龙
  blue: 'amap://styles/blue',               // 靛青蓝
  darkblue: 'amap://styles/darkblue',       // 极夜蓝
  wine: 'amap://styles/wine',               // 酱籽
};

// PawLink 品牌色彩主题
export const PAWLINK_THEME = {
  primary: '#4CAF50',       // 主色调 - 绿色（代表生命与希望）
  secondary: '#2196F3',     // 辅助色 - 蓝色（代表信任）
  accent: '#FF9800',        // 强调色 - 橙色（代表温暖）
  danger: '#FF4444',        // 危险色 - 红色（紧急情况）
  success: '#4CAF50',       // 成功色 - 绿色
  warning: '#FFC107',       // 警告色 - 黄色
  info: '#2196F3',          // 信息色 - 蓝色
  disabled: '#9E9E9E',      // 禁用色 - 灰色
};

// 宠物状态对应的标记颜色（优化后）
export const PET_STATUS_COLORS = {
  emergency: PAWLINK_THEME.danger,         // 紧急 - 红色
  needs_rescue: PAWLINK_THEME.accent,      // 需救助 - 橙色
  for_adoption: PAWLINK_THEME.primary,     // 待领养 - 绿色
  adopted: PAWLINK_THEME.disabled,         // 已领养 - 灰色
};

// 宠物状态对应的标记图标（使用emoji）
export const PET_STATUS_ICONS = {
  emergency: '🚨',           // 紧急
  needs_rescue: '🆘',        // 需救助
  for_adoption: '🐾',        // 待领养（改用爪印更贴合主题）
  adopted: '✅',             // 已领养
};

// 宠物状态中文名称
export const PET_STATUS_LABELS = {
  emergency: '紧急救助',
  needs_rescue: '需要救助',
  for_adoption: '待领养',
  adopted: '已领养',
};

// 高德地图默认配置
export const DEFAULT_MAP_CONFIG = {
  zoom: 15,                   // 默认缩放级别
  minZoom: 3,                 // 最小缩放级别
  maxZoom: 20,                // 最大缩放级别
  pitch: 0,                   // 俯仰角度
  rotation: 0,                // 旋转角度
  viewMode: '2D',             // 地图视图模式 (2D/3D)
  showLabel: true,            // 是否显示文字标注
  defaultCursor: 'pointer',   // 默认鼠标样式
  mapStyle: MAP_STYLES.normal,// 默认地图样式
  features: ['bg', 'road', 'building', 'point'],  // 显示的地图元素
  showIndoorMap: false,       // 不显示室内地图
};

// 定位配置（优化）
export const LOCATION_CONFIG = {
  enableHighAccuracy: true,   // 是否使用高精度定位
  timeout: 10000,             // 定位超时时间(ms)
  maximumAge: 0,              // 不使用缓存，每次都获取最新位置
  convert: true,              // 是否需要转换为GCJ02坐标系
  noIpLocate: 0,              // 允许使用IP定位
  GeoLocationFirst: true,     // 优先使用浏览器定位
  needAddress: true,          // 返回地址信息
  extensions: 'all',          // 返回详细信息
};

// 标记样式配置
export const MARKER_CONFIG = {
  size: 40,                   // 标记大小
  strokeWidth: 3,             // 边框宽度
  strokeColor: '#FFFFFF',     // 边框颜色
  shadowBlur: 8,              // 阴影模糊度
  shadowColor: 'rgba(0,0,0,0.3)', // 阴影颜色
  pulseAnimation: true,       // 是否启用脉冲动画
  pulseRadius: 10,            // 脉冲半径
};

// 用户位置标记配置
export const USER_MARKER_CONFIG = {
  size: 30,
  color: PAWLINK_THEME.info,
  strokeWidth: 3,
  strokeColor: '#FFFFFF',
  innerSize: 8,
};

// WebView样式
export const WEBVIEW_STYLES = {
  width: '100%',
  height: '100%',
  backgroundColor: '#f5f5f5',
};

// 地图容器样式
export const MAP_CONTAINER_STYLES = {
  flex: 1,
  width: '100%',
  height: '100%',
};

// 地图动画配置
export const ANIMATION_CONFIG = {
  duration: 300,              // 动画时长(ms)
  easing: 'ease-out',         // 缓动函数
};

// 地理编码配置
export const GEOCODER_CONFIG = {
  radius: 1000,               // 搜索半径
  extensions: 'all',          // 返回完整信息
  batch: false,               // 不批量查询
};

// POI搜索配置
export const POI_SEARCH_CONFIG = {
  pageSize: 20,               // 每页结果数
  pageIndex: 1,               // 页码
  extensions: 'all',          // 返回完整信息
  citylimit: false,           // 不限制城市
};

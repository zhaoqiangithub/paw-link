// 高德地图配置常量
// 高德地图JavaScript API版本
export const AMAP_JS_API_VERSION = '2.0';

// 高德地图JS API基础URL
export const AMAP_JS_API_URL = `https://webapi.amap.com/api/jsapi?v=${AMAP_JS_API_VERSION}`;

// 宠物状态对应的标记颜色
export const PET_STATUS_COLORS = {
  emergency: '#FF4444',      // 紧急 - 红色
  needs_rescue: '#FF9800',   // 需救助 - 橙色
  for_adoption: '#4CAF50',   // 待领养 - 绿色
  adopted: '#9E9E9E',        // 已领养 - 灰色
};

// 宠物状态对应的标记图标（使用emoji）
export const PET_STATUS_ICONS = {
  emergency: '🚨',           // 紧急
  needs_rescue: '🆘',        // 需救助
  for_adoption: '🐱',        // 待领养
  adopted: '✅',             // 已领养
};

// 高德地图默认配置
export const DEFAULT_MAP_CONFIG = {
  zoom: 15,                   // 默认缩放级别
  pitch: 0,                   // 俯仰角度
  rotation: 0,                // 旋转角度
  viewMode: '2D',             // 地图视图模式 (2D/3D)
  showLabel: true,            // 是否显示文字标注
  defaultCursor: 'pointer',   // 默认鼠标样式
};

// 定位配置
export const LOCATION_CONFIG = {
  enableHighAccuracy: true,   // 是否使用高精度定位
  timeout: 10000,             // 定位超时时间(ms)
  maximumAge: 5000,           // 定位缓存最大时间(ms)
  convert: true,              // 是否需要转换为GCJ02坐标系
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

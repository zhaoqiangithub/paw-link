# 高德地图定位修复说明

## 问题分析

使用Android设备时，地图一直显示"定位中..."状态，主要原因包括：

1. **Android WebView权限问题**：WebView中的HTML5定位API需要特殊权限配置
2. **超时处理不完善**：定位失败时没有超时机制和错误提示
3. **缺乏备选方案**：高德地图定位失败时没有其他定位方式

## 修复内容

### 1. 配置Android权限 (`app.json`)

添加了以下权限配置：

```json
"android": {
  "permissions": [
    "ACCESS_COARSE_LOCATION",
    "ACCESS_FINE_LOCATION",
    "ACCESS_BACKGROUND_LOCATION"
  ],
  "webView": {
    "supportsGeolocation": true
  }
}
```

**说明**：
- `ACCESS_COARSE_LOCATION`：粗糙定位权限
- `ACCESS_FINE_LOCATION`：精确定位权限
- `ACCESS_BACKGROUND_LOCATION`：后台定位权限
- `webView.supportsGeolocation`：启用WebView定位支持

### 2. 优化高德地图定位逻辑 (`utils/amap-js-bridge.ts`)

**改进点**：

- ✅ 缩短超时时间：从15秒改为10秒
- ✅ 禁用缓存：设置 `maximumAge: 0` 强制重新定位
- ✅ 添加超时保险：12秒后强制触发错误回调
- ✅ 增加调试日志：方便定位问题
- ✅ 改进错误处理：区分权限错误和网络错误

**关键修改**：

```javascript
const geolocation = new AMap.Geolocation({
  enableHighAccuracy: true,
  timeout: 10000,           // 10秒超时
  maximumAge: 0,            // 不使用缓存
  convert: true,
  showButton: false,
  showMarker: true,
  panToLocation: true,
  zoomToAccuracy: true
});
```

### 3. 添加备选定位方案 (`components/MapView.tsx`)

**当高德地图定位失败时，自动尝试React Native的expo-location**：

- **权限错误（错误码7/8）**：立即尝试备选方案
- **网络错误**：等待3秒后尝试备选方案
- **备选方案失败**：显示详细错误提示和重试选项

### 4. 添加重试按钮 (`components/MapView.tsx`)

- 定位失败时显示绿色"重试"按钮
- 点击可直接触发WebView重新定位
- 避免应用重启的麻烦

### 5. 暴露WebView引用 (`components/AmapWebView.tsx`)

使用 `React.forwardRef` 和 `useImperativeHandle` 暴露定位方法给父组件调用。

## 测试步骤

### 1. 在Android设备上测试

```bash
# 启动开发服务器
npm start

# 运行Android应用
npm run android
```

### 2. 检查权限

1. 打开Android设置 → 应用 → PawLink → 权限
2. 确认以下权限已开启：
   - 位置信息
   - 精确定位
   - 后台定位（可选）

### 3. 测试场景

#### 场景1：首次定位
- **期望**：5-10秒内完成定位，显示具体地址
- **失败**：显示"重试"按钮，可点击重试

#### 场景2：权限拒绝
- **期望**：3秒后自动尝试备选定位（expo-location）
- **备选成功**：显示"定位成功（系统定位）"
- **备选失败**：显示详细错误提示

#### 场景3：网络问题
- **期望**：12秒后超时，显示重试按钮
- **操作**：点击重试按钮重新定位

#### 场景4：定位精度
- **期望**：定位精度在10-50米范围内
- **验证**：检查地图上的蓝色圆圈（精度范围）

### 4. 查看调试日志

在Android Logcat或Chrome DevTools中查看控制台输出：

```
Starting location request...
Location status: complete result: {position: {lng: xxx, lat: xxx}}
Location success: 116.xxx 39.xxx
Address: 北京市朝阳区xxx街道
```

## 高德API Key说明

当前使用的高德API Key：`f4f3fe154db5361fad122db55f64178c`

**注意**：这是web端js api的key，在Android WebView中使用是正常的。

## 已知问题

1. **iOS Safari兼容性问题**：在iOS设备上，WebView的定位功能可能受限
2. **HTTPS要求**：Android 5.0+ WebView要求HTTPS才能获取定位（高德地图使用HTTPS，已满足）

## 下一步优化

1. 添加定位权限检查页面
2. 支持GPS和Network定位模式切换
3. 添加定位历史记录
4. 实现地理围栏功能

## 技术参考

- [Android WebView定位指南](https://developer.android.com/reference/android/webkit/WebSettings#setGeolocationEnabled(boolean))
- [高德地图JavaScript API](https://lbs.amap.com/api/javascript-api/summary)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)

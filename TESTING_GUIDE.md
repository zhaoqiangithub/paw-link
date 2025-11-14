# 🧪 高德地图定位测试指南

## 🚨 问题现象
如果仍然看到以下错误：
```
ERROR Error getting location: [Error: Current location is unavailable]
```
说明需要清除缓存并重新测试。

---

## ✅ 测试步骤

### 1. 清除所有缓存（重要！）
```bash
# 停止所有Expo进程
pkill -9 -f "expo\|metro\|node" || true

# 清除缓存
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .expo 2>/dev/null || true

# 重新启动
npm start
```

### 2. 检查控制台日志

打开浏览器控制台（或Android Logcat），查找以下日志：

**✅ 修复成功标志**：
```
useLocation initialized, isWeb: true/false
✅ Non-web platform, requesting permission...  # Android/iOS
❌ Web platform detected, skipping permission request  # Web
Platform detection: {...}
MapView platform check: {...}
```

**❌ 错误标志**：
```
Error getting location: [Error: Current location is unavailable]
```

---

## 📱 平台测试

### Android设备测试

**启动**：
```bash
npm start
npm run android
```

**期望结果**：
1. 地图加载
2. 控制台显示：`✅ Non-web platform, requesting permission...`
3. 5-10秒内定位成功
4. 显示地址："北京市朝阳区xxx街道"
5. **不应该出现**：`Error getting location`

**如果仍然报错**：
```bash
# 彻底清理
npm run reset-project
npm start
npm run android
```

### iOS设备测试

**启动**：
```bash
npm start
npm run ios
```

**期望结果**：同Android

### Web浏览器测试

**启动**：
```bash
npm run web
```

**期望结果**：
1. 地图加载
2. 控制台显示：`❌ Web platform detected, skipping permission request`
3. 不自动定位（正常）
4. 点击📍按钮 → 浏览器弹出权限提示
5. **不应该出现**：`Error getting location`

---

## 🔍 日志分析

### 成功案例（Android）
```
useLocation initialized, isWeb: false
✅ Non-web platform, requesting permission...
✅ Non-web platform, getting current location...
Location success: 116.xxx 39.xxx
Address: 北京市朝阳区xxx
```

### 成功案例（Web）
```
useLocation initialized, isWeb: true
❌ Web platform detected, skipping permission request
❌ Web platform detected, skipping getCurrentLocation
Platform detection: {
  userAgent: "chrome/...",
  isWebBrowser: true,
  isWebView: false,
  isStandalone: false,
  result: true
}
MapView platform check: { isWebBrowser: true, isStandalone: false, result: true }
```

### 失败案例（需要修复）
```
Error getting location: [Error: Current location is unavailable]
```
**原因**：缓存未清除或平台检测失效

---

## 🛠️ 故障排除

### 问题1：仍然有expo-location错误
**解决方案**：
```bash
# 完全重置项目
npm run reset-project
npm start
npm run android
```

### 问题2：Android设备上不自动定位
**检查**：
1. 控制台是否有：`✅ Non-web platform, requesting permission...`
2. 如果有权限提示，选择"允许"
3. 检查定位服务是否开启（设置 → 隐私 → 定位服务）

### 问题3：Web端点击定位按钮无反应
**检查**：
1. 控制台是否有：`❌ Web platform detected, skipping...`
2. 确认浏览器地址栏旁有定位图标
3. 允许定位权限后再次点击📍按钮

---

## 📊 验证清单

- [ ] 清除缓存
- [ ] 重启开发服务器
- [ ] 控制台显示平台检测日志
- [ ] Android：5-10秒自动定位
- [ ] iOS：5-10秒自动定位
- [ ] Web：不自动定位，点击📍按钮生效
- [ ] 控制台无expo-location错误
- [ ] 地图显示定位标记（蓝色圆圈）
- [ ] 显示具体地址

---

## 🎯 预期行为对比

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| Android启动 | ❌ 一直"定位中" | ✅ 5-10秒定位 |
| Web启动 | ❌ expo-location报错 | ✅ 无错误，提示手动定位 |
| 控制台 | ❌ 错误堆栈 | ✅ 清晰平台检测日志 |

---

**重要提示**：如果按照本指南操作后仍有问题，请提供：
1. 控制台完整日志
2. 测试平台（Android/iOS/Web）
3. Expo SDK版本：`npx expo --version`

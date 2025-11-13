# 🐛 WebView 调试指南

## 🚀 问题诊断步骤

当您遇到 WebView 页面一直在加载的问题时，请按以下步骤进行诊断：

---

## 🔧 第1步：使用调试模式测试

在应用中有一个**调试模式**按钮，可以快速验证 WebView 是否正常工作。

### 操作步骤：

1. **启动应用**后，进入首页（地图页面）
2. **点击右上角的橙色按钮** `🐛 调试模式`
3. **观察页面变化**：
   - ✅ **成功**：显示绿色测试页面，说明 WebView 工作正常
   - ❌ **失败**：如果仍然无法加载，可能是 API Key 问题或网络问题

### 调试模式功能：

- 显示 "🎉 WebView 测试成功！" 页面
- 点击 "发送消息到 React Native" 按钮测试双向通信
- 如果能弹出成功提示，说明 WebView 完全正常

---

## 🔍 第2步：检查控制台日志

在 Metro 控制台中查看详细日志：

### 启动应用时的日志：

```
📱 WebView开始加载
🔑 API Key: 未配置❌  ← 注意这里
✅ WebView HTML加载完成
⚠️ 请先配置高德地图API Key！请在AmapWebView.tsx中配置您的API Key
```

### 正确的日志应该是：

```
📱 WebView开始加载
🔑 API Key: 已配置✅
✅ WebView HTML加载完成
✅ 高德地图初始化完成
```

---

## 🔑 第3步：配置 API Key

如果日志显示 "🔑 API Key: 未配置❌"，需要配置 API Key：

### 步骤 1：申请 API Key

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册开发者账号
3. 创建应用并获取 Web 服务 API Key
4. 参考 `AMAP_SETUP.md` 获取详细步骤

### 步骤 2：配置到项目中

编辑 `components/AmapWebView.tsx` 第 55 行：

```typescript
// 修改前：
const [apiKey] = useState<string>('5cf2d9bdceb2ce9266c7a489826bf21b');

// 修改后：
const [apiKey] = useState<string>('5cf2d9bdceb2ce9266c7a489826bf21b');
```

### 步骤 3：重启应用

配置完成后，重启开发服务器：

```bash
npm start
# 或按 r 重载
```

---

## 🌍 第4步：测试高德地图

配置 API Key 后：

1. **关闭调试模式**（点击 `🔙 返回地图`）
2. **等待地图加载**（约 3-5 秒）
3. **查看控制台日志**：
   ```
   ✅ 高德地图初始化完成
   ```

---

## ❗️ 常见问题解决

### 问题 1：调试模式也打不开

**可能原因**：
- react-native-webview 未正确安装
- 项目未重启

**解决方法**：
```bash
npm install react-native-webview
# 重启开发服务器
npm start
```

### 问题 2：调试模式能打开，但地图打不开

**可能原因**：
- API Key 未配置或配置错误
- API Key 没有 Web 服务权限

**解决方法**：
1. 检查 API Key 是否正确
2. 确认 Key 权限包含 "Web端(JS API)"
3. 检查 API Key 是否超过调用限制

### 问题 3：地图显示但没有宠物标记

**可能原因**：
- 位置权限未开启
- 数据库中没有宠物数据
- 距离筛选条件过严

**解决方法**：
1. 在设备设置中开启定位权限
2. 查看是否有宠物数据
3. 检查 `PetInfoDB.getList()` 的调用参数

### 问题 4：点击标记没有反应

**可能原因**：
- onMarkerPress 回调未正确传递
- 宠物数据格式不匹配

**解决方法**：
1. 检查 MapView 的 onMarkerPress 属性
2. 查看控制台是否有 "MARKER_CLICK" 日志

---

## 🔍 远程调试（iOS）

### Safari Web Inspector（推荐）

1. **开启设备 Web 检查器**：
   - 设置 → Safari → 高级 → Web 检查器 ✅

2. **在 Mac 上打开 Safari**：
   - 开发菜单 → 选择您的设备

3. **连接设备并运行应用**：
   - 在 Safari 中查看 WebView 内容
   - 检查控制台错误和 Network 请求

### Chrome DevTools

对于 Android 设备，可以使用 Chrome 远程调试：

1. **开启 USB 调试**
2. **在 Chrome 中访问**：`chrome://inspect`

---

## 📊 日志级别说明

| 图标 | 含义 | 示例 |
|------|------|------|
| 📱 | WebView 生命周期 | WebView 开始/结束加载 |
| 🔑 | API Key 状态 | 已配置✅ / 未配置❌ |
| ✅ | 成功操作 | 地图初始化完成 |
| ❌ | 错误 | WebView 加载失败 |
| 📨 | 消息通信 | 收到 WebView 消息 |
| ⚠️ | 警告 | API Key 未配置 |

---

## 🆘 获取帮助

如果按照以上步骤仍然无法解决问题，请收集以下信息：

1. **控制台完整日志**
2. **调试模式截图**
3. **设备型号和系统版本**
4. **API Key 状态**（不要提供实际 Key）

---

## 🎯 快速检查清单

- [ ] react-native-webview 已安装
- [ ] 应用已重启
- [ ] 调试模式可以打开
- [ ] API Key 已配置（控制台显示 "已配置✅"）
- [ ] 设备定位权限已开启
- [ ] 网络连接正常
- [ ] 高德 API Key 权限正确

完成以上检查后，WebView 应该可以正常工作了！ 🎉

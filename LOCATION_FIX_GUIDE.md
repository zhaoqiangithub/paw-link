# 安卓设备定位问题修复指南

## 问题描述
在安卓设备上，首页定位功能无法使用，一直显示"正在获取您的位置"状态。

## 修复内容

### 1. 修复 `hooks/use-location.ts` (第64-149行)

**主要改动：**

- **移除过早的模拟器检测**：删除了第73-84行的预检查代码，避免误判真实安卓设备为模拟器
- **添加超时控制**：使用 `Promise.race` 实现15秒超时机制，防止无限等待
- **改善错误处理**：提供更详细的错误信息，帮助用户理解问题
- **延长定位时间**：将 `timeInterval` 从5秒增加到8秒，给GPS更多时间获取位置

**具体改进：**
```typescript
// 添加超时控制
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('TIMEOUT')), 15000); // 15秒超时
});

const locationPromise = Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 8000,  // 从5秒增加到8秒
  distanceInterval: 10
});

const locationResult = await Promise.race([locationPromise, timeoutPromise]);
```

### 2. 改善首页错误提示 (`app/(tabs)/index.tsx`)

**新增功能：**
- 在错误提示横幅中添加"重试"按钮
- 用户可以点击重试按钮重新尝试定位

**改动：**
- 导出 `getCurrentLocation` 函数用于重试
- 添加重试按钮的样式和点击事件

## 测试方法

### 在安卓设备上测试：

1. **启动开发服务器**
```bash
npx expo start --port 8083
```

2. **在Expo Go中打开应用**
   - 使用Expo Go扫描二维码或输入URL：`exp://192.168.x.x:8083`

3. **测试定位功能**
   - 打开首页，查看是否还会无限显示"正在获取您的位置"
   - 如果定位失败，应该显示错误信息和重试按钮
   - 点击"重试"按钮测试重新定位

### 可能遇到的情况：

1. **定位成功**：显示位置信息和地址 ✅
2. **权限问题**：显示"定位权限被拒绝"，需要用户在设置中开启权限
3. **GPS不可用**：显示"此设备GPS不可用"，可能是在模拟器中或GPS硬件问题
4. **超时**：显示"定位超时"，可能是因为信号不好或网络问题
5. **其他错误**：会显示对应的错误信息

## 权限检查

确保设备已授予定位权限：
- Android: 设置 > 应用 > PawLink > 权限 > 位置

## 已知问题

如果用户仍然无法获取位置，可能的原因：
1. 设备GPS硬件故障
2. 模拟器环境（建议使用真机测试）
3. 权限被拒绝
4. 网络连接问题

## 后续建议

如果需要更稳定的定位体验，可以考虑：
1. 添加手动选择位置的备选方案
2. 使用最后已知位置（last known location）
3. 集成高德地图SDK进行定位

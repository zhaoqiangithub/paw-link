# 🗺️ 高德地图集成完成指南

## ✅ 集成完成情况

高德地图已成功集成到 PawLink 项目中！原有的自定义地图已被完全替换为真实的高德地图。

### 📁 新增文件

1. **AMAP_SETUP.md** - 高德地图 API Key 申请指南
2. **constants/amap-config.ts** - 高德地图配置常量
3. **utils/amap-js-bridge.ts** - JavaScript 桥接工具
4. **components/AmapWebView.tsx** - 高德地图 WebView 组件
5. **AMAP_INTEGRATION_GUIDE.md** - 本文件（集成使用指南）

### 📝 修改文件

- **components/MapView.tsx** - 已替换为使用 AmapWebView

---

## 🔑 第一步：配置 API Key

### 1. 申请 API Key

参考 `AMAP_SETUP.md` 文件，完成高德地图 API Key 的申请。

### 2. 配置 API Key

编辑 `components/AmapWebView.tsx` 文件：

```typescript
const [apiKey] = useState<string>('你的高德地图API_Key在这里');
```

将 `'你的高德地图API_Key在这里'` 替换为您申请到的真实 API Key。

### 3. 环境变量配置（推荐）

为了更好的安全性，建议使用环境变量：

1. 在项目根目录创建 `.env` 文件：
```
AMAP_API_KEY=你的API_Key_在这里
```

2. 安装 `react-native-dotenv`：
```bash
npm install react-native-dotenv
```

3. 修改 `components/AmapWebView.tsx`：
```typescript
import { AMAP_API_KEY } from 'react-native-dotenv';

const [apiKey] = useState<string>(AMAP_API_KEY);
```

---

## 🚀 运行和测试

### 1. 安装依赖

确保已安装 `react-native-webview`：
```bash
npm install react-native-webview
```

### 2. 启动开发服务器

```bash
npm start
```

### 3. 运行应用

```bash
# iOS
npm run ios

# Android
npm run android

# Web（注意：WebView在Web上可能有限制）
npm run web
```

---

## ✨ 功能特性

### ✅ 已实现功能

| 功能 | 说明 | 状态 |
|------|------|------|
| **真实地图显示** | 使用高德地图替代自定义背景 | ✅ 完成 |
| **GPS 定位** | 获取用户当前位置 | ✅ 完成 |
| **地图缩放** | 支持手势缩放地图 | ✅ 完成 |
| **地图拖拽** | 支持手势拖拽地图 | ✅ 完成 |
| **宠物标记** | 显示宠物信息标记点 | ✅ 完成 |
| **标记点击** | 点击标记查看宠物详情 | ✅ 完成 |
| **状态颜色** | 根据宠物状态显示不同颜色 | ✅ 完成 |
| - 紧急 | 红色标记 | ✅ |
| - 需救助 | 橙色标记 | ✅ |
| - 待领养 | 绿色标记 | ✅ |
| - 已领养 | 灰色标记 | ✅ |

### 📋 宠物标记颜色映射

```
紧急 (emergency)      → 🔴 红色
需救助 (needs_rescue)  → 🟠 橙色
待领养 (for_adoption)  → 🟢 绿色
已领养 (adopted)       → ⚫ 灰色
```

---

## 🔧 组件使用说明

### AmapWebView 组件

```typescript
import { AmapWebView } from '@/components/AmapWebView';

<AmapWebView
  center={{ longitude: 116.407526, latitude: 39.90403 }}
  zoom={15}
  pets={[
    {
      id: '1',
      title: '小白',
      longitude: 116.407526,
      latitude: 39.90403,
      status: 'for_adoption',
      description: '可爱的小白猫'
    }
  ]}
  onMapLoaded={() => console.log('地图加载完成')}
  onMarkerClick={(pet) => console.log('点击了:', pet)}
  onLocationSuccess={(loc) => console.log('定位成功:', loc)}
  onLocationError={(err) => console.error('定位失败:', err)}
/>
```

### Props 说明

| Prop | 类型 | 说明 |
|------|------|------|
| `center` | `{ longitude: number; latitude: number }` | 地图中心点 |
| `zoom` | number | 缩放级别 (3-20) |
| `pets` | `PetInfo[]` | 宠物数据列表 |
| `onMapLoaded` | `() => void` | 地图加载完成回调 |
| `onMarkerClick` | `(pet: PetInfo) => void` | 标记点击回调 |
| `onLocationSuccess` | `(location: LocationInfo) => void` | 定位成功回调 |
| `onLocationError` | `(error: { message: string }) => void` | 定位失败回调 |
| `onMapClick` | `(location: { longitude: number; latitude: number }) => void` | 地图点击回调 |

---

## 📱 移动端权限配置

### iOS (info.plist)

在 `app.json` 中添加定位权限：

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "PawLink需要访问您的位置以显示附近的宠物信息"
      }
    }
  }
}
```

### Android (AndroidManifest.xml)

在 `app.json` 中添加权限：

```json
{
  "expo": {
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

---

## 🐛 常见问题

### Q1: 地图无法显示

**可能原因**：
- API Key 未正确配置
- 网络连接问题
- WebView 加载失败

**解决方法**：
1. 检查 API Key 是否正确
2. 检查控制台错误日志
3. 确保网络连接正常

### Q2: 定位功能不工作

**可能原因**：
- 未授予定位权限
- 设备定位服务未开启

**解决方法**：
1. 在设备设置中开启定位权限
2. 确保设备的 GPS 功能已启用
3. 检查 `app.json` 中的权限配置

### Q3: 标记点不显示

**可能原因**：
- 宠物数据为空
- 经纬度坐标无效
- 地图未完全加载

**解决方法**：
1. 检查宠物数据是否正确
2. 确保经纬度坐标有效
3. 等待地图完全加载后再添加标记

---

## 🎯 下一步优化

### 可选增强功能

1. **POI 搜索** - 添加兴趣点搜索功能
2. **路线规划** - 实现导航功能
3. **离线地图** - 支持离线地图显示
4. **自定义标记图标** - 使用更丰富的自定义图标
5. **地图样式切换** - 提供多种地图样式选择

---

## 📞 技术支持

- **高德地图文档**: https://lbs.amap.com/api/javascript-api-v2/
- **React Native WebView**: https://github.com/react-native-webview/react-native-webview

---

## 🎉 完成！

您的高德地图集成已完成！现在可以享受真实的地图体验了。

**立即行动**：
1. 申请 API Key
2. 配置到 `components/AmapWebView.tsx`
3. 运行应用并测试功能

享受您的全新地图体验吧！ 🗺️✨

# 定位按钮功能修复规格

## ADDED Requirements

### Requirement: 首页定位按钮功能
首页 SHALL 包含定位按钮，用户可以点击触发定位流程。定位按钮 SHALL 显示在地图右下角，具备明确的状态指示（定位中/可点击）。

**覆盖范围**：
- 页面：`app/(tabs)/index.tsx`
- 组件：`components/AmapWebView.tsx`

**验收标准**：
- 地图右下角显示定位按钮（📍）
- 点击定位按钮触发定位流程
- 定位中按钮显示loading动画
- 定位成功/失败后按钮恢复默认状态

**技术实现**：
```typescript
<AmapWebView
  ref={webViewRef}
  webViewRef={webViewRef}
  onLocationSuccess={handleMapLocationSuccess}
  onLocationError={handleMapLocationError}
/>

<TouchableOpacity
  style={styles.mapLocationButton}
  onPress={handleLocationButton}
>
  <Ionicons name={isLocating ? "locate-outline" : "locate"} size={24} color="#fff" />
</TouchableOpacity>
```

#### Scenario: 首页点击定位按钮
- **WHEN** 用户点击首页地图右下角的定位按钮
- **THEN** 按钮显示loading动画，触发高德地图定位流程

#### Scenario: 定位成功
- **WHEN** 高德地图定位成功获取用户位置
- **THEN** 按钮恢复默认状态，显示用户位置和地址

#### Scenario: 定位失败
- **WHEN** 定位过程中发生错误（权限拒绝、超时、网络异常）
- **THEN** 按钮恢复默认状态，显示错误信息

---

### Requirement: 首页定位状态显示优化
首页 SHALL 正确显示定位状态，包括定位中、成功和失败状态。用户 SHALL 能清晰了解当前定位进度和结果。

**覆盖范围**：
- 页面：`app/(tabs)/index.tsx`

**验收标准**：
- 定位中显示："📍 正在定位..."
- 定位成功显示："✅ 详细地址"
- 定位失败显示："⚠️ 错误信息"
- 状态文本颜色区分（蓝色/绿色/红色）

**技术实现**：
```typescript
<Text style={styles.mapLocationText}>
  {isLocating
    ? '📍 正在定位...'
    : mapLocation?.address
      ? `✅ ${mapLocation.address}`
      : locationError
        ? `⚠️ ${locationError}`
        : '点击定位按钮获取位置'}
</Text>
```

#### Scenario: 首页定位状态切换
- **WHEN** 用户点击定位按钮到定位完成
- **THEN** 状态文本从"正在定位..."变为"✅ 地址"或"⚠️ 错误信息"

#### Scenario: 多次定位
- **WHEN** 用户多次点击定位按钮
- **THEN** 每次都能正确触发定位，状态正确更新

---

### Requirement: 选择位置页面定位功能完善
选择位置页面 SHALL 支持自动定位和手动定位功能，提供清晰的定位状态反馈。

**覆盖范围**：
- 页面：`app/select-location.tsx`

**验收标准**：
- 页面加载后自动触发定位
- 显示定位状态（"正在定位..."或地址）
- 提供手动定位按钮
- 定位失败时显示错误信息和重试选项

**技术实现**：
```typescript
const requestMapLocation = useCallback(() => {
  if (!webViewRef.current) return;
  setIsLocating(true);
  webViewRef.current.postMessage(JSON.stringify({
    type: 'GET_LOCATION',
  }));
}, [webViewRef]);
```

#### Scenario: 选择位置页面自动定位
- **WHEN** 用户进入选择位置页面
- **THEN** 页面自动触发定位，显示"正在定位..."

#### Scenario: 选择位置页面手动定位
- **WHEN** 用户点击定位按钮
- **THEN** 重新触发定位流程，更新定位状态

#### Scenario: 选择位置页面定位成功
- **WHEN** 高德地图定位成功
- **THEN** 显示详细地址，用户可以确认选择

#### Scenario: 选择位置页面定位失败
- **WHEN** 定位过程中发生错误
- **THEN** 显示错误弹窗，提供重试选项

---

### Requirement: 定位按钮样式和交互规范
定位按钮 SHALL 遵循统一样式规范，提供良好的用户交互体验。

**覆盖范围**：
- 组件：`components/AmapWebView.tsx`
- 页面：`app/(tabs)/index.tsx`, `app/select-location.tsx`

**验收标准**：
- 按钮位置：右下角（right: 16, bottom: 100）
- 按钮大小：56x56像素
- 按钮颜色：#2196F3（蓝色）
- 图标：Ionicons.locate
- 交互效果：点击时有按压效果（activeOpacity）
- 阴影效果：elevation: 5
- z-index：浮在地图上方（zIndex: 10）

**样式规范**：
```typescript
const styles = StyleSheet.create({
  mapLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
});
```

#### Scenario: 定位按钮显示
- **WHEN** 地图加载完成
- **THEN** 定位按钮显示在地图右下角，样式符合规范

#### Scenario: 定位按钮交互
- **WHEN** 用户点击定位按钮
- **THEN** 按钮有按压反馈效果，触发定位流程

---

## MODIFIED Requirements

### Requirement: AmapWebView组件增强webViewRef支持
修改AmapWebView组件 SHALL 添加可选的webViewRef属性，使父组件可以主动触发定位操作。

**修改内容**：
- 添加webViewRef?: React.RefObject<WebView>属性到AmapWebViewProps
- 允许外部组件通过webViewRef访问WebView实例
- 同时保留AmapWebViewMethods导出方法

**覆盖范围**：
- 组件：`components/AmapWebView.tsx`

**验收标准**：
- AmapWebViewProps接口包含webViewRef属性
- webViewRef正确传递到WebView组件
- 外部组件可以使用webViewRef触发定位

**技术实现**：
```typescript
interface AmapWebViewProps {
  // ... 现有属性
  webViewRef?: React.RefObject<WebView>;
}

export const AmapWebView: React.FC<AmapWebViewProps & { webViewRef?: React.RefObject<WebView> }> = (props) => {
  const { webViewRef } = props;
  const internalWebViewRef = useRef<WebView>(null);
  const actualWebViewRef = webViewRef || internalWebViewRef;
  // ...
};
```

#### Scenario: 使用webViewRef触发定位
- **WHEN** 外部组件调用webViewRef.current.getUserLocation()
- **THEN** WebView接收到GET_LOCATION消息，触发定位流程

#### Scenario: 使用AmapWebViewMethods触发定位
- **WHEN** 外部组件调用AmapWebViewMethods.getUserLocation(webViewRef)
- **THEN** 组件内部调用getUserLocation()方法

---

### Requirement: 完善定位回调处理
修改定位回调处理逻辑 SHALL 确保定位结果正确通知到父组件，状态正确更新。

**修改内容**：
- 确保onLocationSuccess回调正确传递
- 确保onLocationError回调正确传递
- 添加loading状态管理
- 优化错误处理和重试机制

**覆盖范围**：
- 组件：`components/AmapWebView.tsx`
- 页面：`app/(tabs)/index.tsx`, `app/select-location.tsx`

**验收标准**：
- 定位成功时onLocationSuccess被正确调用
- 定位失败时onLocationError被正确调用
- loading状态正确更新
- 错误信息清晰明确

**技术实现**：
```typescript
// AmapWebView.tsx
const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    switch (data.type) {
      case 'LOCATION_SUCCESS':
        if (onLocationSuccess) {
          onLocationSuccess(data.data);
        }
        break;
      case 'LOCATION_ERROR':
        if (onLocationError) {
          onLocationError(data.data);
        }
        break;
      // ...
    }
  } catch (error) {
    // Silent error handling
  }
}, [pets, onMapLoaded, onMarkerClick, onLocationSuccess, onLocationError, onMapClick, onSearchResults, onPOISearchResults]);

// 首页
const handleMapLocationSuccess = (loc: { latitude: number; longitude: number; address?: string }) => {
  setMapLocation(loc);
  setIsLocating(false);
};

// 选择位置页面
const handleLocationSuccess = useCallback((location: LocationInfo) => {
  setIsLocating(false);
  setSelectedLocation({
    longitude: location.longitude,
    latitude: location.latitude,
    address: location.address || '未知地址',
  });
}, []);
```

#### Scenario: 定位成功回调
- **WHEN** WebView发送LOCATION_SUCCESS消息
- **THEN** 父组件onLocationSuccess被调用，状态更新

#### Scenario: 定位失败回调
- **WHEN** WebView发送LOCATION_ERROR消息
- **THEN** 父组件onLocationError被调用，显示错误信息

---

### Requirement: 优化定位状态管理
修改定位状态管理 SHALL 确保所有页面和组件的状态同步，避免状态不一致。

**修改内容**：
- 添加isLocating状态到首页
- 优化选择位置页面的定位状态
- 确保状态转换正确
- 添加状态持久化

**覆盖范围**：
- 页面：`app/(tabs)/index.tsx`, `app/select-location.tsx`

**验收标准**：
- 所有定位状态正确更新
- 状态转换无闪烁
- 多次定位状态正确
- 无状态冲突

**状态设计**：
```typescript
// 首页状态
const [mapLocation, setMapLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
const [locationError, setLocationError] = useState<string | null>(null);
const [isLocating, setIsLocating] = useState(false);

// 选择位置页面状态
const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
const [isLocating, setIsLocating] = useState(false);
```

#### Scenario: 首页状态同步
- **WHEN** 用户点击定位按钮
- **THEN** isLocating变为true，定位完成后变为false

#### Scenario: 选择位置页面状态同步
- **WHEN** 页面自动定位
- **THEN** isLocating变为true，定位完成后变为false

---

## REMOVED Requirements

### Requirement: 移除无效的定位逻辑
移除或废弃无效的定位逻辑 SHALL 确保代码清晰，避免混淆。

**移除内容**：
- 移除未使用的getCurrentLocation导入
- 清理无效的定位相关代码
- 移除冲突的定位状态

**覆盖范围**：
- 页面：`app/(tabs)/index.tsx`

**验收标准**：
- 代码中无未使用的定位逻辑
- 定位职责清晰分离
- 无冲突的状态管理

#### Scenario: 清理未使用代码
- **WHEN** 代码审查
- **THEN** 确认无未使用的定位相关代码

#### Scenario: 定位职责清晰
- **WHEN** 定位流程执行
- **THEN** 只有AmapWebView处理定位，其他组件通过回调获取结果

---

## Scenario 详细说明

### Scenario 1: 首页完整定位流程
**触发条件**：用户首次打开应用

**期望行为**：
1. 地图加载完成
2. 显示定位按钮（右下角）
3. 用户点击定位按钮
4. 按钮显示loading动画
5. 触发高德地图定位
6. 定位成功后显示用户位置和地址
7. 按钮恢复默认状态

**验收**：
- ✅ 地图正常加载
- ✅ 定位按钮可点击
- ✅ 定位流程完整
- ✅ 状态显示正确

### Scenario 2: 定位权限被拒绝
**触发条件**：用户拒绝定位权限

**期望行为**：
1. 用户点击定位按钮
2. 系统请求定位权限
3. 用户点击"拒绝"
4. 显示权限被拒绝错误信息
5. 提供"去设置"选项

**验收**：
- ✅ 不自动重试
- ✅ 显示清晰的权限引导
- ✅ 提供设置选项

### Scenario 3: 定位超时
**触发条件**：GPS信号弱或网络问题

**期望行为**：
1. 用户点击定位按钮
2. 开始定位流程
3. 12秒后超时
4. 显示超时错误信息
5. 提供"重试"选项

**验收**：
- ✅ 12秒后一定超时
- ✅ 错误信息准确
- ✅ 重试机制有效

### Scenario 4: 选择位置页面定位
**触发条件**：用户进入选择位置页面

**期望行为**：
1. 页面加载
2. 自动触发定位
3. 显示"正在定位..."
4. 定位成功后显示地址
5. 用户可以点击地图手动选择
6. 点击定位按钮重新定位

**验收**：
- ✅ 自动定位触发
- ✅ 状态显示正确
- ✅ 手动选择功能正常
- ✅ 重新定位功能正常

### Scenario 5: 多次定位操作
**触发条件**：用户多次点击定位按钮

**期望行为**：
1. 首次点击定位按钮
2. 定位中状态（按钮loading）
3. 定位完成
4. 再次点击定位按钮
5. 重新触发定位流程

**验收**：
- ✅ 支持多次定位
- ✅ 每次定位都能正确触发
- ✅ 状态正确更新

---

## 兼容性说明

### 向后兼容
- ✅ 保持现有AmapWebView API不变
- ✅ 仅添加可选的webViewRef属性
- ✅ 保留AmapWebViewMethods导出方法
- ✅ 不影响其他组件功能

### 平台支持
- ✅ iOS：完整支持
- ✅ Android：完整支持
- ✅ Web：保持现有行为

---

## 测试计划

### 单元测试
- [ ] getUserLocation方法测试
- [ ] 定位回调处理测试
- [ ] 状态更新测试
- [ ] 错误处理测试

### 集成测试
- [ ] 首页定位完整流程测试
- [ ] 选择位置页面定位测试
- [ ] 定位按钮交互测试
- [ ] 错误场景测试

### 真机测试
- [ ] Android多设备测试
- [ ] iOS设备测试
- [ ] 不同网络环境测试
- [ ] 长时间使用稳定性测试

---

## 验收检查清单

在完成修复后，必须满足以下所有条件：

**功能性验收**：
- [ ] 首页定位按钮可点击
- [ ] 点击定位按钮触发定位流程
- [ ] 定位成功后显示用户位置和地址
- [ ] 定位失败时显示明确错误信息
- [ ] 选择位置页面定位功能正常
- [ ] 定位状态正确显示（定位中/成功/失败）
- [ ] 定位按钮样式符合规范

**代码质量验收**：
- [ ] 无TypeScript编译错误
- [ ] 代码注释充分
- [ ] 遵循项目规范
- [ ] 无未使用的代码

**用户体验验收**：
- [ ] 定位按钮位置合理
- [ ] 状态反馈清晰及时
- [ ] 错误提示有帮助性
- [ ] 操作流程直观
- [ ] 响应速度快

**测试验收**：
- [ ] 所有测试用例通过
- [ ] 真机测试通过
- [ ] 边界情况测试通过
- [ ] 性能测试通过

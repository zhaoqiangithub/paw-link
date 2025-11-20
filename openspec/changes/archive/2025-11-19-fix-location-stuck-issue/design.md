# 定位系统重构设计文档

## 架构分析

### 当前问题

#### 1. 多重定位源冲突
**现状**：
- `hooks/use-location.ts` 提供独立的定位功能
- `components/NativeMapView.tsx` 内部也有定位逻辑
- `app/(tabs)/index.tsx` 同时可能使用两者

**问题**：
- 状态管理混乱，哪个定位源控制UI不明确
- 可能出现竞态条件
- 错误状态可能互相覆盖

#### 2. 状态生命周期不完整
**问题**：
- `loading` 状态可能在某些错误路径下未正确重置
- 错误状态可能与成功状态冲突
- 重试时状态未完全清理

#### 3. 超时处理机制不足
**问题**：
- 虽然有超时设置，但可能在某些场景下未触发
- 超时后未提供明确的恢复路径
- 用户无法感知超时状态

## 解决方案设计

### 方案A：完全移除useLocation，统一使用NativeMapView定位

**优势**：
- 消除冲突，明确单一入口
- 减少重复代码
- 状态管理更清晰

**劣势**：
- `useLocation` 在其他地方可能还在使用
- 需要检查所有使用位置

**实施**：
1. 分析所有使用 `useLocation` 的地方
2. 将定位逻辑迁移到 `NativeMapView`
3. 其他组件通过props或context获取位置
4. 测试确保没有破坏现有功能

### 方案B：优化useLocation，使其成为权威定位源

**优势**：
- 更灵活，可在多个地方使用
- 保持组件解耦

**劣势**：
- 可能仍然存在状态同步问题
- 需要额外协调机制

**实施**：
1. 简化 `useLocation`，移除冲突逻辑
2. 确保其成为唯一定位入口
3. 其他组件监听其状态变化

### 推荐方案：方案A的改进版

**核心原则**：
1. **单一职责**：`NativeMapView` 负责地图相关定位
2. **全局状态**：应用级别的位置信息通过Context提供
3. **清晰边界**：每个组件职责明确，不重复定位逻辑

**架构**：
```
AppContext
├── 用户位置信息 (全局状态)
├── 位置更新时间
└── 位置错误状态

NativeMapView
├── 地图定位 (仅用于地图展示)
└── 通过onLocationSuccess更新AppContext

其他组件
└── 从AppContext读取位置信息
```

## 详细设计

### 1. 状态机设计

```
定位状态机：

IDLE → REQUESTING_PERMISSION → GETTING_LOCATION → GETTING_ADDRESS → SUCCESS
  ↓                              ↓                     ↓
  ↓                          TIMEOUT              TIMEOUT
  ↓                              ↓                     ↓
  ↓                        ERROR (PERMISSION)    ERROR (NETWORK)
  ↓                              ↓                     ↓
  ↓                              ↓                     ↓
  ↓                              ↓                     ↓
  ↓                              ↓                     ↓
  ↓                              ↓                     ↓
RETRY ←────── ERROR (OTHER) ←────┴─────────────────────┘
  ↓
  ↓
USER_MANUAL_SELECT ←────┘
```

**状态转换规则**：
1. **IDLE** → **REQUESTING_PERMISSION**：开始定位流程
2. **REQUESTING_PERMISSION** → **GETTING_LOCATION**：权限获取成功
3. **GETTING_LOCATION** → **GETTING_ADDRESS**：坐标获取成功
4. **GETTING_ADDRESS** → **SUCCESS**：地址获取成功
5. 任何状态 → **ERROR**：出错时，设置错误信息，清空loading
6. **ERROR** → **RETRY**：用户点击重试，回到IDLE
7. **ERROR** → **USER_MANUAL_SELECT**：用户提供手动位置

### 2. 超时控制策略

**超时时间设置**：
- 权限请求：无超时（依赖系统）
- GPS定位：20秒（硬件依赖，考虑信号因素）
- 地址解析：10秒（网络依赖）

**超时处理**：
```typescript
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error('TIMEOUT')), 20000);
});

const locationPromise = Location.getCurrentPositionAsync({...});

try {
  const result = await Promise.race([locationPromise, timeoutPromise]);
  // 处理成功结果
} catch (error) {
  if (error.message === 'TIMEOUT') {
    // 超时处理
  }
}
```

### 3. 重试机制

**重试策略**：
- 最大重试次数：3次
- 延迟策略：指数退避（1s, 2s, 3s）
- 重试条件：仅对可恢复错误重试
  - ✅ 重试：TIMEOUT, NETWORK_ERROR
  - ❌ 不重试：PERMISSION_DENIED, GPS_UNAVAILABLE

**重试流程**：
```typescript
let retryCount = 0;
const maxRetries = 3;

while (retryCount < maxRetries) {
  try {
    await attemptLocation();
    return; // 成功则退出
  } catch (error) {
    if (!isRetryable(error)) {
      throw error; // 不可重试的错误直接抛出
    }
    retryCount++;
    if (retryCount >= maxRetries) {
      throw error; // 达到最大重试次数
    }
    await delay(1000 * retryCount); // 指数退避
  }
}
```

### 4. 错误分类和处理

**错误类型**：
1. **PERMISSION_DENIED** (1)
   - 用户拒绝了定位权限
   - 处理：显示引导用户开启权限
   - 不重试

2. **LOCATION_TIMEOUT** (2)
   - GPS定位超时
   - 处理：建议用户检查GPS设置或重试
   - 可重试

3. **API_UNAVAILABLE** (3)
   - GPS服务不可用（模拟器等）
   - 处理：建议使用真机或手动选择
   - 不重试

4. **NETWORK_ERROR** (4)
   - 网络问题导致地址解析失败
   - 处理：使用坐标而非地址，或重试
   - 可重试

5. **UNKNOWN_ERROR** (5)
   - 未知错误
   - 处理：显示通用错误信息和重试选项
   - 可重试

### 5. 用户界面设计

**状态指示**：
- 🟡 定位中：显示旋转图标和"正在获取位置..."
- 🟢 成功：显示位置地址和坐标
- 🔴 失败：显示错误信息和"重试"按钮

**交互元素**：
1. **定位按钮**（右下角）：点击触发重新定位
2. **状态栏**（顶部）：显示当前状态和地址
3. **错误横幅**：显示错误详情和操作建议
4. **重试按钮**：清晰标注，点击重试
5. **手动选择**：提供"手动选择位置"选项

**示例UI文本**：
- 定位中：📍 "正在获取您的位置，请稍候..."
- 成功：✅ "我在北京市朝阳区三里屯"
- 权限拒绝：⚠️ "需要定位权限，请在设置中开启"
- 超时：⏱️ "定位超时，请检查GPS或网络后重试"
- 重试按钮：🔄 "重试定位"
- 手动选择：📌 "手动选择位置"

## 实施计划

### 阶段1：分析和准备 (Task 1-2)
- 分析所有定位相关代码
- 创建问题分析报告

### 阶段2：重构NativeMapView (Task 3-5)
- 优化定位流程
- 完善错误处理
- 实现重试机制

### 阶段3：统一状态管理 (Task 6-7)
- 检查useLocation使用
- 消除冲突和重复

### 阶段4：完善用户界面 (Task 8-9)
- 改善状态显示
- 实现手动选择位置

### 阶段5：测试验证 (Task 10-11)
- 功能测试
- 边界情况测试

### 阶段6：文档更新 (Task 12)
- 更新开发文档
- 记录修复内容

## 风险评估

### 高风险
- ❌ 无

### 中风险
- ⚠️ 修改可能影响现有功能
  - **缓解**：充分测试，特别是iOS平台
  - **回滚方案**：Git revert

### 低风险
- ℹ️ 用户体验改进，可能需要适应期
  - **缓解**：提供清晰的状态指示和反馈

## 成功标准

### 功能标准
- ✅ 安卓设备上20秒内完成定位或显示明确错误
- ✅ 重试机制在3次内成功或给出明确建议
- ✅ 权限拒绝时有清晰引导
- ✅ 所有状态转换正确，无卡住现象

### 代码质量标准
- ✅ 无TypeScript错误
- ✅ ESLint通过
- ✅ 无明显内存泄漏
- ✅ 代码注释充分

### 用户体验标准
- ✅ 状态反馈清晰明确
- ✅ 错误信息有帮助性
- ✅ 重试操作简单直观
- ✅ 提供备选方案

## 参考资料

1. **Expo Location API**
   - https://docs.expo.dev/versions/latest/sdk/location/
   - `getCurrentPositionAsync()` 选项和限制

2. **React Native Maps**
   - https://github.com/react-native-maps/react-native-maps
   - 地图组件配置和事件

3. **Amap API**
   - https://lbs.amap.com/api
   - 逆地理编码接口和参数

4. **现有实现**
   - `components/NativeMapView.tsx` - 当前地图组件
   - `hooks/use-location.ts` - 当前定位Hook
   - `app/(tabs)/index.tsx` - 首页实现

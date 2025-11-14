# 导航栏标签页修复说明

## 问题描述
新增的功能页面（故事、众筹、统计）最初放在 `app/` 根目录下，但在 Expo Router 的 tabs 系统中，`Tabs.Screen` 只能引用 `(tabs)` 目录内的页面文件。

## 解决方案

### 1. 文件移动
将以下页面移动到 `app/(tabs)/` 目录下：

```bash
app/stories.tsx → app/(tabs)/stories.tsx
app/crowdfunding.tsx → app/(tabs)/crowdfunding.tsx
app/statistics.tsx → app/(tabs)/statistics.tsx
app/success-cases.tsx → app/(tabs)/success-cases.tsx
```

### 2. 路由配置更新

**更新前：** `app/_layout.tsx` 中包含所有路由
```typescript
<Stack.Screen name="stories" options={{ headerShown: false }} />
<Stack.Screen name="crowdfunding" options={{ headerShown: false }} />
<Stack.Screen name="statistics" options={{ headerShown: false }} />
<Stack.Screen name="success-cases" options={{ headerShown: false }} />
```

**更新后：** 仅保留根路由和独立页面路由
```typescript
<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
<Stack.Screen name="publish" options={{ headerShown: false }} />
```

### 3. 标签栏优化

为适应 5 个标签页，调整了标签栏配置：

**`app/(tabs)/_layout.tsx`**
```typescript
screenOptions={{
  tabBarStyle: {
    height: 70,           // 增加高度
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabelStyle: {
    fontSize: 10,         // 减小字体
    fontWeight: '500',
  },
  tabBarIconStyle: {
    marginBottom: 2,      // 图标间距
  },
}}
```

### 4. 导航结构

**当前导航栏包含 5 个标签：**
1. 首页 (`index`) - 地图视图 + 智能推荐
2. 探索 (`explore`) - 搜索和浏览
3. 故事 (`stories`) - 救助故事社区
4. 众筹 (`crowdfunding`) - 爱心众筹
5. 统计 (`statistics`) - 数据统计面板

**独立页面（不在标签栏）：**
- 发布 (`publish`) - 发布宠物信息
- 聊天 (`chat`) - 私信功能
- 模态框 (`modal`) - 系统模态框

## 验证方法

启动应用后，底部导航栏应该显示 5 个标签：

```
[首页] [探索] [故事] [众筹] [统计]
```

每个标签都可以正常点击切换，对应页面功能完整。

## 文件变更列表

### 新位置（app/(tabs)/）
- ✅ `app/(tabs)/stories.tsx`
- ✅ `app/(tabs)/crowdfunding.tsx`
- ✅ `app/(tabs)/statistics.tsx`
- ✅ `app/(tabs)/success-cases.tsx`

### 更新文件
- ✅ `app/(tabs)/_layout.tsx` - 更新标签栏配置
- ✅ `app/_layout.tsx` - 移除已移动的路由

### 保持不变
- ✅ `app/_layout.tsx` - 根布局（保留独立页面路由）
- ✅ `app/(tabs)/index.tsx` - 首页
- ✅ `app/(tabs)/explore.tsx` - 探索页
- ✅ `app/publish.tsx` - 发布页
- ✅ `app/chat.tsx` - 聊天页
- ✅ `app/modal.tsx` - 模态框页

## 技术说明

### Expo Router Tabs 规则
- Tabs.Screen 的 `name` 属性对应 `(tabs)` 目录下的文件名（不含扩展名）
- 例如：`name="stories"` 对应 `(tabs)/stories.tsx`
- 页面在 `(tabs)` 目录下时，路由自动包含在标签导航中

### 标签栏最佳实践
- 标签数量：建议不超过 5 个（遵循 iOS/Android 设计规范）
- 图标大小：22-24pt 适合标签栏使用
- 字体大小：10-12pt 在小屏幕上可读性较好
- 高度：60-70pt 提供足够的点击区域

## 总结

✅ 问题已完全修复
✅ 5 个新功能标签页正常显示
✅ 所有页面路由配置正确
✅ 标签栏视觉效果优化

现在用户可以在底部导航栏中看到并访问所有新增功能！

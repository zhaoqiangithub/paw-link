# PawLink 分支策略

## 📋 当前分支

### feature/mvp-iteration-1

**当前活跃分支** - PawLink MVP 迭代 1

- **创建日期**: 2025-11-13
- **状态**: ✅ 已完成
- **功能完成度**: 10/10 核心功能
- **最后更新**: 2025-11-13

#### 📦 包含的功能

| 模块 | 状态 | 文件 |
|------|------|------|
| 项目基础架构 | ✅ | app/_layout.tsx |
| 数据库系统 | ✅ | lib/database.ts |
| 用户标识系统 | ✅ | lib/device.ts |
| 地图与位置 | ✅ | components/MapView.tsx |
| 信息发布 | ✅ | app/publish.tsx |
| 图片上传 | ✅ | hooks/use-image-picker.ts |
| 搜索过滤 | ✅ | components/SearchFilters.tsx |
| 联系方式 | ✅ | components/ContactActions.tsx |
| 消息系统 | ✅ | app/chat.tsx |
| 举报功能 | ✅ | components/ReportModal.tsx |
| 开发文档 | ✅ | DEVELOPMENT.md |
| 项目文档 | ✅ | README.md |

#### 🔗 提交记录

```
a5b4f2a feat: 完成 PawLink MVP 迭代 1 - 核心功能开发
62a8bff Initialize Expo project structure and dependencies
0dd03da Initial commit
```

#### 📊 统计信息

- **文件更改**: 21 files
- **新增行数**: 4,013 lines
- **删除行数**: 224 lines

---

## 🌳 分支结构

```
main (稳定分支)
├── feature/mvp-iteration-1 (当前开发分支)
```

---

## 🔄 分支操作指南

### 切换分支

```bash
# 查看所有分支
git branch -a

# 切换到主分支
git checkout main

# 切换到 MVP 功能分支
git checkout feature/mvp-iteration-1
```

### 更新代码

```bash
# 在 feature/mvp-iteration-1 分支上
# 拉取最新更改
git pull origin feature/mvp-iteration-1

# 推送更改
git push origin feature/mvp-iteration-1
```

### 创建新功能分支

```bash
# 基于当前分支创建新分支
git checkout -b feature/新功能名称

# 例如创建迭代2分支
git checkout -b feature/mvp-iteration-2
```

---

## 📝 未来分支计划

### feature/mvp-iteration-2 (计划中)

**计划功能**:
- [ ] 宠物详情页面
- [ ] 用户个人中心
- [ ] 消息推送通知
- [ ] 支付众筹功能
- [ ] AI 图像识别

**创建条件**: 完成 Iteration 1 测试和评审

### feature/mvp-iteration-3 (未来)

**计划功能**:
- [ ] 志愿者管理系统
- [ ] AI 智能审核
- [ ] 跨平台数据同步
- [ ] 后端 API 服务

---

## ✅ 分支完成标准

### Iteration 1 完成检查清单

- [x] 所有核心功能实现
- [x] 所有编译错误修复
- [x] 文档编写完成
- [x] 测试通过
- [x] 代码审查通过
- [x] 提交到功能分支
- [x] 合并到主分支 (待完成)

### 合并到主分支

```bash
# 1. 切换到主分支
git checkout main

# 2. 合并功能分支
git merge feature/mvp-iteration-1

# 3. 推送更改
git push origin main

# 4. 删除功能分支 (可选)
git branch -d feature/mvp-iteration-1
```

---

## 🏷️ 提交信息规范

### 格式

```
<type>: <描述>

[可选的详细说明]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 类型 (type)

- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```bash
feat: 添加宠物详情页面

- 实现宠物信息展示
- 添加图片轮播
- 添加联系选项

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 📞 支持

如有问题，请查看：

- [DEVELOPMENT.md](./DEVELOPMENT.md) - 详细开发文档
- [README.md](./README.md) - 项目说明

---

**PawLink** - 让每一只宠物都能找到家 🐾

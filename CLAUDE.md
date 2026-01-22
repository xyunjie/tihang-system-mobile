# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 unibest 模板构建的企业级移动端系统，使用 uni-app + Vue3 + TypeScript 技术栈，支持 H5、小程序、App 多端部署。

## 开发命令

### 包管理器
**必须使用 PNPM**（项目配置了 preinstall 检查）：
```bash
pnpm install
```

### 开发调试
```bash
pnpm dev:h5       # H5 开发服务器 (http://localhost:9000)
pnpm dev:mp       # 微信小程序 (导入 dist/dev/mp-weixin)
pnpm dev:app      # App 平台 (使用 HBuilderX 导入 dist/dev/app)
```

### 构建
```bash
pnpm build:h5     # H5 构建 (产物: dist/build/h5/)
pnpm build:mp     # 微信小程序构建
pnpm build:app    # App 构建 (使用 HBuilderX 云打包)
```

### 代码质量
```bash
pnpm lint         # ESLint 检查
pnpm lint:fix     # 自动修复
pnpm type-check   # TypeScript 类型检查
```

## 核心架构

### 目录结构
```
src/
├── api/              # API 接口定义 (按业务模块组织)
├── components/       # 通用组件
├── hooks/            # 组合式函数 (自动导入)
├── http/
│   ├── http.ts       # HTTP 请求核心实现 + Token 自动刷新
│   ├── interceptor.ts# 请求拦截器 (添加 baseURL、token、platform)
│   └── queryString.ts
├── layouts/          # 页面布局 (使用 @uni-helper/vite-plugin-uni-layouts)
├── pages/            # 主包页面
├── pages-sub/        # 分包页面 (支持多个分包)
├── router/
│   └── interceptor.ts # 路由拦截器 (登录白名单验证)
├── service/          # 业务服务层
├── store/            # Pinia 状态管理
│   ├── index.ts      # Store 配置 (使用 pinia-plugin-persistedstate)
│   └── user.ts       # 用户状态
├── style/            # 全局样式
└── utils/            # 工具函数
```

### HTTP 请求层

项目使用自封装的 HTTP 层（基于 uni.request），而非 Alova。核心文件：

- **`src/http/http.ts`** - 请求核心实现，包含：
  - JWT Token 自动刷新机制（401 响应处理）
  - 请求队列管理（并发请求时的 token 刷新）
  - `http.get()`, `http.post()`, `http.put()`, `http.delete()` 方法

- **`src/http/interceptor.ts`** - 请求拦截器：
  - 自动拼接 baseURL
  - 添加 Authorization header
  - 添加 platform 标识

### 状态管理

使用 Pinia + pinia-plugin-persistedstate，持久化存储使用 uni.getStorageSync/setStorageSync：

```typescript
import { useUserStore } from '@/store'

const userStore = useUserStore()
userStore.login({ username, password })
```

### 路由与权限

1. **路由配置** - 基于 `pages.json`（通过 @uni-helper/vite-plugin-uni-pages 自动生成）
2. **登录拦截** - 白名单机制，在 `src/router/interceptor.ts` 中配置
3. **未登录页面** - 自动跳转到 `/pages/login/index`

### 环境配置

环境变量文件位于 `env/` 目录：
- `.env` - 基础配置
- `.env.development` - 开发环境
- `.env.test` - 测试环境
- `.env.production` - 生产环境

### UI 组件库

- **wot-design-uni** - 主要 UI 组件
- **z-paging** - 分页组件
- **UnoCSS** - 原子化 CSS（自动导入）

### 设计规范

### 特殊组件

**HtmlRenderer** (`src/components/HtmlRenderer.vue`) - 移动端 HTML 渲染组件，支持：
- 响应式图片和表格
- 数学公式渲染（预留 KaTeX 集成）
- 代码高亮（预留 Highlight.js 集成）

详见 `src/components/README.md`

### 自动导入

以下内容会自动导入，无需手动 import：
- Vue API (ref, computed, 等)
- uni-app API
- `src/hooks/` 下的组合式函数
- 组件（通过 @uni-helper/vite-plugin-uni-components）

### 分包策略

- 主包：`src/pages/`
- 分包：`src/pages-sub/`（支持多个分包）
- 使用 @uni-ku/bundle-optimizer 进行优化

### API 调用模式

```typescript
// src/api/xxx.ts
import { http } from '@/http/http'

export function getSomeData(params: any) {
  return http.get<ResponseType>('/admin-api/endpoint', params)
}
```

## Git 提交规范

```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建配置等
```

## 注意事项

1. **必须使用 PNPM** - 项目强制检查包管理器
2. **Token 刷新** - HTTP 层自动处理 401 和 token 刷新，无需手动处理
3. **登录白名单** - 新增无需登录的页面需在 `src/router/interceptor.ts` 中配置
4. **组件类型** - 组件自动导入类型生成在 `src/types/components.d.ts`
5. **平台条件编译** - 使用 `#ifdef` / `#ifndef` 进行平台特定代码编写

# Tihang System Mobile

<div align="center">

[![Node Version](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org/)
[![PNPM Version](https://img.shields.io/badge/pnpm-%3E%3D7.30-green)](https://pnpm.io/)
[![Vue Version](https://img.shields.io/badge/vue-3.4+-blue)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

**Tihang System Mobile** 是一个基于 [unibest](https://github.com/feige996/unibest) 模板构建的企业级移动端系统，采用 uni-app 框架和现代化前端技术栈，提供完整的移动办公解决方案。系统涵盖用户管理、工作流审批、考勤管理、消息通知等核心功能模块。

> 本项目基于优秀的开源项目 [unibest](https://github.com/feige996/unibest) 构建，感谢原作者 [@feige996](https://github.com/feige996) 提供的优质模板。unibest 是最好的 uniapp 开发框架，为本项目提供了坚实的技术基础。

## ✨ 核心特性

- 🚀 **现代技术栈** - Vue3 + TypeScript + Vite5 + UnoCSS
- 📱 **跨平台支持** - 支持 H5、小程序、App 多端部署
- 🎨 **企业级 UI** - 基于 wot-design-uni，简洁专业的设计风格
- 🔐 **安全认证** - JWT Token + 自动刷新机制
- 🏗️ **模块化架构** - 清晰的分层结构，高内聚低耦合
- 📊 **状态管理** - Pinia 响应式状态管理
- 🌐 **网络请求** - 基于 Alova 的请求封装与拦截
- 🛡️ **权限控制** - 路由守卫 + 页面级权限验证

## 📋 功能模块

### 核心业务
- **用户管理** - 用户登录、注册、资料管理、权限控制
- **工作台** - 个人工作台、统计数据、快捷操作
- **工作流** - 业务流程审批、待办事项、审批历史
- **考勤管理** - 签到打卡、考勤记录、统计报表
- **消息通知** - 系统通知、消息推送、公告管理
- **纳新登记** - 新员工登记、信息收集、审核流程

### 辅助功能
- **帮助中心** - 使用指南、常见问题、意见反馈
- **账号安全** - 密码修改、安全设置、登录记录
- **个人资料** - 基本信息编辑、头像上传、联系方式

## 🏗️ 技术架构

### 技术栈
- **前端框架**: uni-app + Vue3 (Composition API)
- **开发语言**: TypeScript
- **构建工具**: Vite5
- **状态管理**: Pinia
- **UI 组件**: wot-design-uni + z-paging
- **样式方案**: UnoCSS 原子化 CSS
- **HTTP 客户端**: Alova + 自封装请求层
- **代码规范**: ESLint + Prettier

### 架构设计
```
src/
├── api/              # API 接口定义
├── components/       # 通用组件
├── hooks/           # 组合式函数
├── http/            # 请求封装与拦截器
├── layouts/         # 页面布局
├── pages/           # 主包页面
├── pages-sub/       # 分包页面
├── router/          # 路由拦截
├── service/         # 业务服务层
├── store/           # 状态管理
├── style/           # 全局样式
└── utils/           # 工具函数
```

## 平台兼容性

| H5  | iOS | Android | 微信小程序 | 支付宝小程序 | 字节小程序 | 快手小程序 | 百度小程序 |
| --- | --- | ------- | ---------- | ------------ | ---------- | ---------- | ---------- |
| ✅   | ✅   | ✅       | ✅          | ✅            | ✅          | ✅          | ✅          |

## ⚙️ 环境要求

- **Node.js**: >=18.0.0
- **PNPM**: >=7.30.0
- **Vue Official**: >=2.1.10
- **TypeScript**: >=5.0.0

## 📦 安装依赖

推荐使用 PNPM 包管理器：

```bash
# 安装 PNPM（如果尚未安装）
npm install -g pnpm@10.10.0

# 验证安装
pnpm --version

# 安装项目依赖
pnpm install
```

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/your-repo/tihang-system-mobile.git
cd tihang-system-mobile

# 安装依赖
pnpm install

# 启动 H5 开发服务器
pnpm dev

# 启动微信小程序开发
pnpm dev:mp
```

## 💻 开发调试

### H5 平台开发
```bash
pnpm dev:h5
# 访问 http://localhost:9000
```

### 微信小程序开发
```bash
pnpm dev:mp
# 在微信开发者工具中导入 dist/dev/mp-weixin 目录
```

### App 平台开发
```bash
pnpm dev:app
# 使用 HBuilderX 导入 dist/dev/app 目录
```

### 其他平台
```bash
pnpm dev:mp-alipay     # 支付宝小程序
pnpm dev:mp-toutiao    # 字节跳动小程序
pnpm dev:mp-baidu      # 百度小程序
pnpm dev:mp-qq         # QQ 小程序
```

## 📦 项目构建

### H5 构建
```bash
pnpm build:h5
# 构建产物：dist/build/h5/
# 部署到 Nginx 等 Web 服务器
```

### 小程序构建
```bash
pnpm build:mp          # 微信小程序
pnpm build:mp-alipay   # 支付宝小程序
pnpm build:mp-toutiao  # 字节跳动小程序
# 构建产物：dist/build/mp-**/
# 使用对应平台开发者工具上传发布
```

### App 构建
```bash
pnpm build:app
# 构建产物：dist/build/app/
# 使用 HBuilderX 进行云打包
```

## 🔧 开发规范

### 代码风格
```bash
# 代码检查
pnpm lint

# 自动修复
pnpm lint:fix

# 类型检查
pnpm type-check
```

### Git 提交规范
```bash
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建配置等
```

## 📚 项目文档

- [快速开始指南](docs/quick-start.md)
- [核心架构设计](docs/architecture.md)
- [API 接口文档](docs/api.md)
- [组件使用说明](docs/components.md)
- [部署配置指南](docs/deployment.md)

## 🙏 致谢

本项目基于以下优秀开源项目构建：

- **[unibest](https://github.com/feige996/unibest)** - 最好的 uniapp 开发框架
  - 作者：[@feige996](https://github.com/feige996)
  - 协议：MIT License
  - 文档：[unibest.tech](https://unibest.tech/)

感谢 unibest 团队提供的优质模板和完善的开发体验，为移动端开发提供了强大的技术支撑。

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

## 🐛 问题反馈

如果您在使用过程中遇到问题，请通过以下方式反馈：

- [GitHub Issues](https://github.com/your-repo/tihang-system-mobile/issues)
- [项目文档](https://your-docs-site.com)
- 邮箱：2292240763@qq.com

## 👥 团队成员

- **开发者**: accepted (xyj)
- **邮箱**: 2292240763@qq.com
- **GitHub**: [xyunjie](https://github.com/xyunjie)
- **Gitee**: [xyunjie](https://gitee.com/xyunjie)

## 📄 开源协议

本项目基于 [MIT](https://opensource.org/license/mit/) 协议开源

Copyright (c) 2025 accepted

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐**

[⬆️ 返回顶部](#tihang-system-mobile)

</div>

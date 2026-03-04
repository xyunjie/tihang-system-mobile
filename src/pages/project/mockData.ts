/**
 * 项目管理模块 - 假数据（以队伍为主体）
 */

import type { ProjectBaseInfo, ProjectStatistics, ProjectTeamInfo, ProjectTeamMember, ProjectTeamPlan, ProjectTeamReport } from '@/api/types/project'

// 我参与的队伍列表（按状态排序）
export const mockMyTeams: Array<ProjectTeamInfo & { project: ProjectBaseInfo }> = [
  // 进行中的项目
  {
    id: 1,
    projectId: 1,
    name: '前端开发组',
    description: '负责项目前端界面开发与用户体验优化',
    categoryId: 1,
    categoryName: '技术研发',
    captainId: 1,
    captainName: '张三',
    currentCount: 8,
    recruitCount: 10,
    project: {
      id: 1,
      name: '天航工作室年度项目',
      goal: '建设全方位的学生能力培养平台，提升团队协作效率',
      description: '本项目旨在为工作室成员提供全面的项目管理、技能培训和团队协作支持。',
      status: 'in_progress',
      year: 2026,
      startTime: '2026-01-01 00:00:00',
      endTime: '2026-12-31 23:59:59',
      coverImage: '',
      createTime: '2026-01-01 00:00:00',
    },
  },
  {
    id: 3,
    projectId: 1,
    name: '产品设计组',
    description: '负责产品设计与用户体验研究',
    categoryId: 2,
    categoryName: '产品设计',
    captainId: 3,
    captainName: '王五',
    currentCount: 5,
    recruitCount: 6,
    project: {
      id: 1,
      name: '天航工作室年度项目',
      goal: '建设全方位的学生能力培养平台，提升团队协作效率',
      description: '本项目旨在为工作室成员提供全面的项目管理、技能培训和团队协作支持。',
      status: 'in_progress',
      year: 2026,
      startTime: '2026-01-01 00:00:00',
      endTime: '2026-12-31 23:59:59',
      coverImage: '',
      createTime: '2026-01-01 00:00:00',
    },
  },
  // 招募中的项目
  {
    id: 6,
    projectId: 2,
    name: '移动端开发组',
    description: '负责移动端应用开发',
    categoryId: 1,
    categoryName: '技术研发',
    captainId: 1,
    captainName: '张三',
    currentCount: 5,
    recruitCount: 8,
    project: {
      id: 2,
      name: '移动端应用开发',
      goal: '开发基于 uni-app 的跨平台移动应用',
      description: '使用 Vue 3 和 uni-app 框架开发移动端应用，支持 iOS 和 Android 平台。',
      status: 'recruiting',
      year: 2026,
      startTime: '2026-03-01 00:00:00',
      endTime: '2026-06-30 23:59:59',
      coverImage: '',
      createTime: '2026-03-01 00:00:00',
    },
  },
  // 已结束的项目
  {
    id: 9,
    projectId: 4,
    name: '文档组',
    description: '负责项目文档编写',
    categoryId: 5,
    categoryName: '文档',
    captainId: 6,
    captainName: '孙八',
    currentCount: 3,
    recruitCount: 4,
    project: {
      id: 4,
      name: '开源社区建设',
      goal: '打造活跃的开源技术社区',
      description: '通过开源项目和技术分享，建立良好的技术交流氛围。',
      status: 'completed',
      year: 2025,
      startTime: '2025-01-01 00:00:00',
      endTime: '2025-12-31 23:59:59',
      coverImage: '',
      createTime: '2025-01-01 00:00:00',
    },
  },
]

// 队伍成员假数据
export const mockTeamMembers: ProjectTeamMember[] = [
  { id: 1, teamId: 1, userId: 1, userName: '张三', userAvatar: '', role: 'captain', joinTime: '2026-01-01 00:00:00' },
  { id: 2, teamId: 1, userId: 2, userName: '李华', userAvatar: '', role: 'member', joinTime: '2026-01-05 00:00:00' },
  { id: 3, teamId: 1, userId: 3, userName: '王芳', userAvatar: '', role: 'member', joinTime: '2026-01-08 00:00:00' },
  { id: 4, teamId: 1, userId: 4, userName: '赵明', userAvatar: '', role: 'member', joinTime: '2026-01-10 00:00:00' },
  { id: 5, teamId: 1, userId: 5, userName: '刘强', userAvatar: '', role: 'member', joinTime: '2026-01-12 00:00:00' },
  { id: 6, teamId: 1, userId: 6, userName: '陈静', userAvatar: '', role: 'member', joinTime: '2026-01-15 00:00:00' },
  { id: 7, teamId: 1, userId: 7, userName: '杨光', userAvatar: '', role: 'member', joinTime: '2026-01-18 00:00:00' },
  { id: 8, teamId: 1, userId: 8, userName: '周杰', userAvatar: '', role: 'member', joinTime: '2026-01-20 00:00:00' },
]

// 计划列表假数据
export const mockPlans: ProjectTeamPlan[] = [
  {
    id: 1,
    teamId: 1,
    title: '用户界面设计',
    content: '完成应用首页、详情页等主要界面的UI设计',
    status: 2,
    startTime: '2026-01-01 00:00:00',
    endTime: '2026-01-31 23:59:59',
    progress: 100,
  },
  {
    id: 2,
    teamId: 1,
    title: '前端框架搭建',
    content: '搭建 Vue 3 + Vite 前端项目框架',
    status: 2,
    startTime: '2026-02-01 00:00:00',
    endTime: '2026-02-15 23:59:59',
    progress: 100,
  },
  {
    id: 3,
    teamId: 1,
    title: 'API接口对接',
    content: '完成后端API接口对接与数据联调',
    status: 1,
    startTime: '2026-02-16 00:00:00',
    endTime: '2026-03-15 23:59:59',
    progress: 75,
  },
  {
    id: 4,
    teamId: 1,
    title: '功能模块开发',
    content: '完成用户管理、项目管理等核心功能模块开发',
    status: 1,
    startTime: '2026-03-01 00:00:00',
    endTime: '2026-04-30 23:59:59',
    progress: 60,
  },
  {
    id: 5,
    teamId: 1,
    title: '测试与优化',
    content: '完成系统测试和性能优化',
    status: 0,
    startTime: '2026-05-01 00:00:00',
    endTime: '2026-05-31 23:59:59',
    progress: 0,
  },
]

// 周报列表假数据
export const mockReports: ProjectTeamReport[] = [
  {
    id: 1,
    teamId: 1,
    title: '第一周周报',
    content: '本周完成了项目框架搭建和基础组件开发。下周计划开始用户管理模块开发。',
    reportDate: '2026-01-07 00:00:00',
    status: 1,
    reviewComment: '工作进展顺利，继续保持。',
    reviewTime: '2026-01-08 10:00:00',
    reviewerId: 1,
    reviewerName: '张三',
    createTime: '2026-01-07 18:00:00',
  },
  {
    id: 2,
    teamId: 1,
    title: '第二周周报',
    content: '本周完成了登录注册功能和用户信息管理页面。下周计划开始项目管理模块开发。',
    reportDate: '2026-01-14 00:00:00',
    status: 1,
    reviewComment: '功能完成质量良好。',
    reviewTime: '2026-01-15 09:30:00',
    reviewerId: 1,
    reviewerName: '张三',
    createTime: '2026-01-14 17:30:00',
  },
  {
    id: 3,
    teamId: 1,
    title: '第三周周报',
    content: '本周完成了项目列表和项目详情页面。正在开发计划管理功能。',
    reportDate: '2026-01-21 00:00:00',
    status: 1,
    reviewComment: '',
    reviewTime: '2026-01-22 14:00:00',
    reviewerId: 1,
    reviewerName: '张三',
    createTime: '2026-01-21 18:30:00',
  },
  {
    id: 4,
    teamId: 1,
    title: '第四周周报',
    content: '本周完成了计划列表和计划详情页面的开发。计划下周开始周报管理功能。',
    reportDate: '2026-01-28 00:00:00',
    status: 0,
    reviewComment: '',
    reviewTime: '',
    reviewerId: 0,
    reviewerName: '',
    createTime: '2026-01-28 19:00:00',
  },
]

// 按状态分组的队伍
export const getTeamsByStatus = () => {
  const inProgress = mockMyTeams.filter(t => t.project.status === 'in_progress')
  const recruiting = mockMyTeams.filter(t => t.project.status === 'recruiting')
  const completed = mockMyTeams.filter(t => t.project.status === 'completed')

  return {
    inProgress,
    recruiting,
    completed,
    all: [...inProgress, ...recruiting, ...completed],
  }
}

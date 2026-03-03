// 项目管理相关类型定义

// ==================== 项目基础信息 ====================

/** 项目基本信息 */
export interface ProjectBaseInfo {
  /** 项目ID */
  id: number
  /** 项目名称 */
  name?: string
  /** 所属年度 */
  year?: number
  /** 项目类型（字典：project_type） */
  type: string
  /** 项目目标 */
  goal?: string
  /** 项目描述 */
  description?: string
  /** 封面图片 */
  coverImage?: string
  /** 项目开始时间 */
  startTime?: string
  /** 项目结束时间 */
  endTime?: string
  /** 项目状态（字典：project_status） */
  status: string
  /** 是否已锁定 */
  isLocked?: boolean
  /** 最终总结 */
  finalSummary?: string
  /** 创建时间 */
  createTime?: string
}

/** 项目统计数据 */
export interface ProjectStatistics {
  /** 组别数量 */
  categoryCount: number
  /** 队伍数量 */
  teamCount: number
  /** 成员数量 */
  memberCount: number
  /** 计划数量 */
  planCount: number
  /** 已完成计划数 */
  completedPlanCount: number
  /** 进行中计划数 */
  inProgressPlanCount: number
  /** 周报数量 */
  reportCount: number
  /** 待审阅周报数 */
  pendingReportCount: number
  /** 附件数量 */
  attachmentCount: number
  /** 计划完成率 */
  planCompletionRate: number
  /** 计划状态统计 */
  planStatusCounts: Record<string, number>
  /** 队伍成员统计 */
  teamMemberStats: TeamMemberStats[]
}

/** 队伍成员统计 */
export interface TeamMemberStats {
  teamId: number
  teamName: string
  memberCount: number
  captainName?: string
}

// ==================== 队伍信息 ====================

/** 队伍信息 */
export interface ProjectTeamInfo {
  /** 队伍ID */
  id: number
  /** 项目ID */
  projectId: number
  /** 组别ID */
  categoryId: number
  /** 组别名称 */
  categoryName?: string
  /** 队伍名称 */
  name: string
  /** 队伍描述 */
  description?: string
  /** 队长用户ID */
  captainId?: number
  /** 队长姓名 */
  captainName?: string
  /** 招募人数 */
  recruitCount?: number
  /** 当前人数 */
  currentCount?: number
  /** 状态 */
  status?: number
  /** 创建时间 */
  createTime?: string
}

/** 队伍成员 */
export interface ProjectTeamMember {
  /** 成员ID */
  id: number
  /** 队伍ID */
  teamId: number
  /** 用户ID */
  userId: number
  /** 用户姓名 */
  userName?: string
  /** 用户头像 */
  userAvatar?: string
  /** 角色（队长/队员） */
  role: string
  /** 加入时间 */
  joinTime?: string
}

// ==================== 计划管理 ====================

/** 队伍计划 */
export interface ProjectTeamPlan {
  /** 计划ID */
  id: number
  /** 队伍ID */
  teamId: number
  /** 计划标题 */
  title: string
  /** 计划内容 */
  content?: string
  /** 开始时间 */
  startTime?: string
  /** 结束时间 */
  endTime?: string
  /** 状态（0-待开始，1-进行中，2-已完成，3-已延期） */
  status: number
  /** 进度（0-100） */
  progress?: number
  /** 创建时间 */
  createTime?: string
}

// ==================== 周报管理 ====================

/** 队伍周报 */
export interface ProjectTeamReport {
  /** 周报ID */
  id: number
  /** 队伍ID */
  teamId: number
  /** 周报标题 */
  title?: string
  /** 周报内容 */
  content: string
  /** 周报日期 */
  reportDate: string
  /** 状态（0-待审阅，1-已审阅） */
  status: number
  /** 审阅人 */
  reviewerId?: number
  /** 审阅时间 */
  reviewTime?: string
  /** 审阅意见 */
  reviewComment?: string
  /** 创建时间 */
  createTime?: string
}

// ==================== 分页请求 ====================

/** 分页请求参数 */
export interface PageParam {
  /** 页码，从1开始 */
  pageNo: number
  /** 每页条数 */
  pageSize: number
}

/** 分页结果 */
export interface PageResult<T> {
  /** 数据列表 */
  list: T[]
  /** 总数 */
  total: number
}

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
  /** 用户姓名（EasyTrans翻译） */
  userName?: string
  /** 用户头像 */
  userAvatar?: string
  /** 部门名称 */
  userDeptName?: string
  /** 学校组织架构（学院/专业/班级） */
  userSchoolDeptName?: string
  /** 角色（字典：project_role） */
  role: string
  /** 是否是队长 */
  isCaptain?: boolean
  /** 加入时间 */
  joinTime?: string
  /** 状态（1正常 0退出） */
  status?: number
}

// ==================== 计划管理 ====================

/** 队伍计划 */
export interface ProjectTeamPlan {
  /** 计划ID */
  id: number
  /** 队伍ID */
  teamId: number
  /** 用户ID */
  userId?: number
  /** 负责人名称（EasyTrans翻译） */
  userName?: string
  /** 计划类型 */
  planType?: string
  /** 计划标题 */
  title: string
  /** 计划描述 */
  description?: string
  /** 计划内容 */
  content?: string
  /** 指派人ID */
  assignerId?: number
  /** 指派人名称（EasyTrans翻译） */
  assignerName?: string
  /** 被指派人类型 */
  assigneeType?: string
  /** 开始日期 */
  startDate?: string
  /** 结束日期 */
  endDate?: string
  /** 开始时间（兼容） */
  startTime?: string
  /** 结束时间（兼容） */
  endTime?: string
  /** 状态（字典：plan_status） */
  status: number | string
  /** 进度（0-100） */
  progress?: number
  /** 优先级 */
  priority?: number
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
  /** 用户ID */
  userId?: number
  /** 提交人名称（EasyTrans翻译） */
  userName?: string
  /** 报告类型（字典：report_type） */
  reportType?: string
  /** 周报标题 */
  title?: string
  /** 周报内容 */
  content: string
  /** 工作总结 */
  workSummary?: string
  /** 下周计划 */
  nextPlan?: string
  /** 遇到的问题 */
  problems?: string
  /** 解决方案 */
  solutions?: string
  /** 周报日期 */
  reportDate: string
  /** 周数 */
  weekNumber?: number
  /** 年份 */
  year?: number
  /** 审阅状态（字典：review_status） */
  reviewStatus?: string
  /** 审阅人ID */
  reviewerId?: number
  /** 审阅人名称（EasyTrans翻译） */
  reviewerName?: string
  /** 审阅时间 */
  reviewTime?: string
  /** 审阅意见 */
  reviewComment?: string
  /** 状态（兼容旧版） */
  status?: number
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

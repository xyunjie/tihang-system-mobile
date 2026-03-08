import type { PageParam, PageResult, ProjectBaseInfo, ProjectStatistics, ProjectTeamInfo, ProjectTeamMember, ProjectTeamPlan, ProjectTeamReport } from './types/project'
import { http } from '@/http/http'

// ==================== 项目基础信息 ====================

/**
 * 获取我参与的项目列表
 */
export function getMyProjects() {
  return http.get<ProjectBaseInfo[]>('/admin-api/project/base-info/my-projects')
}

/**
 * 获取我参与的队伍列表（含项目信息）
 */
export function getMyTeams() {
  return http.get<any[]>('/admin-api/project/base-info/my-teams')
}

/**
 * 获取项目详情
 */
export function getProjectDetail(id: number) {
  return http.get<ProjectBaseInfo>(`/admin-api/project/base-info/get?id=${id}`)
}

/**
 * 获取项目统计数据
 */
export function getProjectStatistics(id: number) {
  return http.get<ProjectStatistics>(`/admin-api/project/base-info/statistics?id=${id}`)
}

// ==================== 队伍信息 ====================

/**
 * 获取项目的队伍列表（后端仅提供 page，这里做 list 兼容）
 */
export async function getTeamList(projectId: number, pageNo = 1, pageSize = 100) {
  const response = await http.get<PageResult<ProjectTeamInfo>>('/admin-api/project/team-info/page', {
    projectId,
    pageNo,
    pageSize,
  })
  return {
    ...response,
    data: response.data?.list || [],
  }
}

/**
 * 获取我在指定项目参与的队伍（基于 my-teams 本地筛选）
 */
export async function getMyTeam(projectId: number) {
  const response = await getMyTeams()
  if (response.code !== 0 || !response.data) {
    return {
      ...response,
      data: null,
    }
  }

  const target = response.data.find((item: any) => Number(item.competitionId) === Number(projectId))
  if (!target) {
    return {
      ...response,
      data: null,
    }
  }

  const teamInfo: ProjectTeamInfo = {
    id: target.id,
    projectId: target.competitionId,
    categoryId: target.categoryId,
    categoryName: target.categoryName,
    name: target.name,
    description: target.description,
    captainName: target.members?.find((m: any) => m.isCaptain)?.name,
    recruitCount: target.maxMembers,
    currentCount: target.currentMembers,
    status: target.status,
    createTime: target.createTime,
  }

  return {
    ...response,
    data: teamInfo,
  }
}

/**
 * 获取队伍详情
 */
export function getTeamDetail(id: number) {
  return http.get<ProjectTeamInfo>(`/admin-api/project/team-info/get?id=${id}`)
}

// ==================== 队伍成员 ====================

/**
 * 获取队伍成员列表（后端仅提供 page，这里做 list 兼容）
 */
export async function getTeamMemberList(teamId: number, pageNo = 1, pageSize = 200) {
  const response = await http.get<PageResult<ProjectTeamMember>>('/admin-api/project/team-member/page', {
    teamId,
    pageNo,
    pageSize,
  })
  return {
    ...response,
    data: response.data?.list || [],
  }
}

/**
 * 加入队伍
 */
export function joinTeam(data: { teamId: number }) {
  return http.post<number>('/admin-api/project/team-member/join', undefined, {
    teamId: data.teamId,
  })
}

/**
 * 退出队伍（后端接口为 /quit，参数是成员ID）
 */
export function leaveTeam(data: { id: number; quitReason?: string }) {
  return http.put<boolean>('/admin-api/project/team-member/quit', data)
}

// ==================== 队伍计划 ====================

/**
 * 获取队伍计划列表（后端仅提供 page，这里做 list 兼容）
 */
export async function getPlanList(teamId: number, pageNo = 1, pageSize = 200) {
  const response = await http.get<PageResult<ProjectTeamPlan>>('/admin-api/project/team-plan/page', {
    teamId,
    pageNo,
    pageSize,
  })
  return {
    ...response,
    data: response.data?.list || [],
  }
}

/**
 * 获取计划详情
 */
export function getPlanDetail(id: number) {
  return http.get<ProjectTeamPlan>(`/admin-api/project/team-plan/get?id=${id}`)
}

/**
 * 创建计划
 */
export function createPlan(data: Record<string, any>) {
  return http.post<number>('/admin-api/project/team-plan/create', data)
}

/**
 * 更新计划
 */
export function updatePlan(data: Record<string, any>) {
  return http.put<boolean>('/admin-api/project/team-plan/update', data)
}

/**
 * 删除计划
 */
export function deletePlan(id: number) {
  return http.delete<boolean>(`/admin-api/project/team-plan/delete?id=${id}`)
}

/**
 * 更新计划进度
 */
export function updatePlanProgress(data: { id: number; progress: number; status?: string | number }) {
  return http.put<boolean>('/admin-api/project/team-plan/update-progress', data)
}

// ==================== 队伍周报 ====================

/**
 * 获取周报分页列表
 */
export function getReportPage(params: PageParam & { teamId: number }) {
  return http.get<PageResult<ProjectTeamReport>>('/admin-api/project/team-report/page', params)
}

/**
 * 获取周报详情
 */
export function getReportDetail(id: number) {
  return http.get<ProjectTeamReport>(`/admin-api/project/team-report/get?id=${id}`)
}

/**
 * 提交周报
 */
export function createReport(data: Partial<ProjectTeamReport>) {
  return http.post<number>('/admin-api/project/team-report/create', data)
}

/**
 * 更新周报
 */
export function updateReport(data: Partial<ProjectTeamReport>) {
  return http.put<boolean>('/admin-api/project/team-report/update', data)
}

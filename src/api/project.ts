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
 * 获取项目的队伍列表
 */
export function getTeamList(projectId: number) {
  return http.get<ProjectTeamInfo[]>('/admin-api/project/team-info/list', { projectId })
}

/**
 * 获取我参与的队伍
 */
export function getMyTeam(projectId: number) {
  return http.get<ProjectTeamInfo>('/admin-api/project/team-info/my-team', { projectId })
}

/**
 * 获取队伍详情
 */
export function getTeamDetail(id: number) {
  return http.get<ProjectTeamInfo>(`/admin-api/project/team-info/get?id=${id}`)
}

// ==================== 队伍成员 ====================

/**
 * 获取队伍成员列表
 */
export function getTeamMemberList(teamId: number) {
  return http.get<ProjectTeamMember[]>('/admin-api/project/team-member/list', { teamId })
}

/**
 * 加入队伍
 */
export function joinTeam(data: { teamId: number }) {
  return http.post<number>('/admin-api/project/team-member/join', data)
}

/**
 * 退出队伍
 */
export function leaveTeam(teamId: number) {
  return http.delete<boolean>(`/admin-api/project/team-member/leave?teamId=${teamId}`)
}

// ==================== 队伍计划 ====================

/**
 * 获取队伍计划列表
 */
export function getPlanList(teamId: number) {
  return http.get<ProjectTeamPlan[]>('/admin-api/project/team-plan/list', { teamId })
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
export function createPlan(data: Partial<ProjectTeamPlan>) {
  return http.post<number>('/admin-api/project/team-plan/create', data)
}

/**
 * 更新计划
 */
export function updatePlan(data: Partial<ProjectTeamPlan>) {
  return http.put<boolean>('/admin-api/project/team-plan/update', data)
}

/**
 * 更新计划进度
 */
export function updatePlanProgress(data: { id: number; progress: number; status?: number }) {
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

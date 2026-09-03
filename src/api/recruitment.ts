import type { CommonResultLong, UserRecruitmentArchivesRespVO, UserRecruitmentConfigRespVO, UserRecruitmentProgressRespVO, UserRecruitmentRespVO, UserRecruitmentSaveReqVO } from '@/api/types/recruitment'
import { http } from '@/http/http'

/**
 * 获取当前用户的纳新提交状态
 * @param openid 微信 openid
 * @param unionId 微信 unionId（可选）
 */
export function getSubmitStatus(openid: string, unionId?: string) {
  return http.get<UserRecruitmentRespVO>('/admin-api/system/user-recruitment/get-submit', {
    openid,
    unionId,
  })
}

/**
 * 获取当前用户自己的纳新进度。
 * 服务端只接受 openid/unionId 身份，不接受 recruitmentId，避免越权读取他人进度。
 */
export function getRecruitmentProgress(openid: string, unionId?: string) {
  return http.get<UserRecruitmentProgressRespVO>('/admin-api/system/user-recruitment/get-progress', {
    openid,
    unionId,
  })
}

/**
 * 创建用户纳新登记
 * @param data 纳新登记数据
 */
export function createUserRecruitment(data: UserRecruitmentSaveReqVO) {
  return http.post<CommonResultLong>('/admin-api/system/user-recruitment/create', data)
}

/**
 * 更新用户纳新登记
 * @param data 纳新登记数据
 */
export function updateUserRecruitment(data: UserRecruitmentSaveReqVO) {
  return http.put<CommonResultLong>('/admin-api/system/user-recruitment/update', data)
}

/**
 * 获取用户纳新计划配置
 */
export function getUserRecruitmentConfig() {
  return http.get<UserRecruitmentConfigRespVO>('/admin-api/system/user-recruitment-config/get-runtime')
}

/**
 * 根据 openid 获取纳新归档信息
 * @param openid 微信 openid
 */
export function getRecruitmentArchivesByOpenid(openid: string) {
  return http.get<UserRecruitmentArchivesRespVO | null>('/admin-api/system/user-recruitment-archives/get-by-openid', { openid })
}

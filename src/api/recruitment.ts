import type { CommonResultLong, UserRecruitmentConfigRespVO, UserRecruitmentRespVO, UserRecruitmentSaveReqVO } from '@/api/types/recruitment'
import { http } from '@/http/http'

/**
 * 创建用户纳新登记
 * @param data 纳新登记数据
 */
export function createUserRecruitment(data: UserRecruitmentSaveReqVO) {
  return http.post<CommonResultLong>('/admin-api/system/user-recruitment/create', data, undefined)
}

/**
 * 更新用户纳新登记
 * @param data 纳新登记数据
 */
export function updateUserRecruitment(data: UserRecruitmentSaveReqVO) {
  return http.put<CommonResultLong>('/admin-api/system/user-recruitment/update', data, undefined)
}

/**
 * 获取用户纳新计划配置
 */
export function getUserRecruitmentConfig() {
  return http.get<UserRecruitmentConfigRespVO>('/admin-api/system/user-recruitment-config/get-runtime')
}

/**
 * 获取当前用户的纳新提交状态
 * @param openid 微信 openid
 * @param socialType 社交类型：34=微信小程序，31=微信H5（服务号）
 */
export function getSubmitStatus(openid: string, socialType: number) {
  return http.get<UserRecruitmentRespVO>('/admin-api/system/user-recruitment/get-submit', { openid, socialType })
}

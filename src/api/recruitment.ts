import type { CommonResultLong, RecruitmentAuthRespVO, RecruitmentTokenStatusRespVO, UserRecruitmentConfigRespVO, UserRecruitmentRespVO, UserRecruitmentSaveReqVO } from '@/api/types/recruitment'
import { http } from '@/http/http'

/**
 * 纳新授权，获取 Token
 * @param code 微信授权码
 * @param socialType 社交类型：34=微信小程序，31=微信H5（服务号）
 * @param state 微信授权回调的 state 参数
 */
export function authRecruitment(code: string, socialType: number, state?: string) {
  return http.post<RecruitmentAuthRespVO>('/admin-api/system/user-recruitment/auth', null,{ code, socialType, state })
}

/**
 * 检查 Token 状态，如果快过期则自动刷新
 * @param token 授权 Token
 */
export function checkTokenStatus(token: string) {
  return http.get<RecruitmentTokenStatusRespVO>('/admin-api/system/user-recruitment/token-status', undefined, {
      Authorization: `Bearer ${token}`,
    })
}

/**
 * 获取当前用户的纳新提交状态
 * @param token 授权 Token
 */
export function getSubmitStatus(token: string) {
  return http.get<UserRecruitmentRespVO>('/admin-api/system/user-recruitment/get-submit', undefined, {
      Authorization: `Bearer ${token}`,
    })
}

/**
 * 创建用户纳新登记
 * @param token 授权 Token
 * @param data 纳新登记数据
 */
export function createUserRecruitment(token: string, data: UserRecruitmentSaveReqVO) {
  return http.post<CommonResultLong>('/admin-api/system/user-recruitment/create', data, {
      Authorization: `Bearer ${token}`,
    })
}

/**
 * 更新用户纳新登记
 * @param token 授权 Token
 * @param data 纳新登记数据
 */
export function updateUserRecruitment(token: string, data: UserRecruitmentSaveReqVO) {
  return http.put<CommonResultLong>('/admin-api/system/user-recruitment/update', data, undefined, {
      Authorization: `Bearer ${token}`,
    })
}

/**
 * 获取用户纳新计划配置
 */
export function getUserRecruitmentConfig() {
  return http.get<UserRecruitmentConfigRespVO>('/admin-api/system/user-recruitment-config/get-runtime')
}


import type { CommonResultLong, UserRecruitmentConfigRespVO, UserRecruitmentSaveReqVO } from '@/api/types/recruitment'
import { http } from '@/http/http'

/**
 * 创建用户纳新登记
 * @param data 纳新登记数据
 */
export function createUserRecruitment(data: UserRecruitmentSaveReqVO) {
  return http.post<CommonResultLong>('/admin-api/system/user-recruitment/create', data, undefined)
}

/**
 * 获取用户纳新计划配置
 */
export function getUserRecruitmentConfig() {
  return http.get<UserRecruitmentConfigRespVO>('/admin-api/system/user-recruitment-config/get-runtime')
}

import type { CommonResultLong, UserRecruitmentConfigRespVO, UserRecruitmentSaveReqVO } from '@/api/types/recruitment'
import { http } from '@/http/http'

/**
 * 创建用户纳新登记
 * @param data 纳新登记数据
 */
export function createUserRecruitment(data: UserRecruitmentSaveReqVO) {
  const headers: Record<string, any> = {
    'tenant-id': 1, // 默认租户ID
  }

  return http.post<CommonResultLong>('/admin-api/system/user-recruitment/create', data, undefined, headers)
}

/**
 * 获取用户纳新计划配置
 */
export function getUserRecruitmentConfig() {
  const headers: Record<string, any> = {
    'tenant-id': 1, // 默认租户ID
  }

  return http.get<UserRecruitmentConfigRespVO>('/admin-api/system/user-recruitment-config/get', undefined, headers)
}

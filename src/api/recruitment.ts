import type { CommonResultLong, UserRecruitmentArchivesRespVO, UserRecruitmentConfigRespVO, UserRecruitmentProgressPreload, UserRecruitmentProgressRespVO, UserRecruitmentRespVO, UserRecruitmentSaveReqVO } from '@/api/types/recruitment'
import { http } from '@/http/http'

const RECRUITMENT_PROGRESS_PRELOAD_KEY = 'recruitment-progress-preload'
const RECRUITMENT_PROGRESS_PRELOAD_TTL = 30 * 1000

function isProgressPreload(value: unknown): value is UserRecruitmentProgressPreload {
  if (!value || typeof value !== 'object')
    return false

  const preload = value as Partial<UserRecruitmentProgressPreload>
  return typeof preload.token === 'string'
    && preload.token.length > 0
    && typeof preload.createdAt === 'number'
    && (preload.openid === undefined || typeof preload.openid === 'string')
    && (preload.unionId === undefined || typeof preload.unionId === 'string')
    && ((preload.openid?.trim().length ?? 0) > 0 || (preload.unionId?.trim().length ?? 0) > 0)
    && !!preload.progress
    && Number.isFinite(preload.progress.status)
    && Array.isArray(preload.progress.assessments)
    && preload.progress.assessments.every(item => !!item
      && Number.isFinite(item.assessmentStage)
      && typeof item.assessmentType === 'string'
      && typeof item.passed === 'boolean')
    && (preload.groupLink === undefined || typeof preload.groupLink === 'string')
}

/** 写入状态页的一次性短期预加载缓存；URL 只携带随机消费令牌，不携带个人资料或考核 JSON。 */
export function setRecruitmentProgressPreload(preload: Omit<UserRecruitmentProgressPreload, 'createdAt' | 'token'>) {
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  uni.setStorageSync(RECRUITMENT_PROGRESS_PRELOAD_KEY, {
    ...preload,
    token,
    createdAt: Date.now(),
  })
  return token
}

export function clearRecruitmentProgressPreload(token?: string) {
  if (token) {
    const preload = uni.getStorageSync(RECRUITMENT_PROGRESS_PRELOAD_KEY) as unknown
    if (isProgressPreload(preload) && preload.token !== token)
      return
  }
  uni.removeStorageSync(RECRUITMENT_PROGRESS_PRELOAD_KEY)
}

/** 读取后立即删除；过期或损坏的数据直接丢弃，由状态页回退到真实接口加载。 */
export function takeRecruitmentProgressPreload(token?: string): UserRecruitmentProgressPreload | null {
  if (!token) {
    // Direct entry has no matching token, so any leftover handoff is unusable.
    clearRecruitmentProgressPreload()
    return null
  }
  const preload = uni.getStorageSync(RECRUITMENT_PROGRESS_PRELOAD_KEY) as unknown
  if (!isProgressPreload(preload)) {
    clearRecruitmentProgressPreload()
    return null
  }
  if (preload.token !== token) {
    // A mismatched token must never consume another navigation's payload, but the
    // stale handoff is no longer reachable from this page and should be removed.
    clearRecruitmentProgressPreload()
    return null
  }
  clearRecruitmentProgressPreload(token)
  const age = Date.now() - preload.createdAt
  if (age < 0 || age > RECRUITMENT_PROGRESS_PRELOAD_TTL)
    return null
  return preload
}

/**
 * 获取当前用户的纳新提交状态
 * @param openid 微信 openid
 * @param unionId 微信 unionId（可选）
 */
export function getSubmitStatus(openid?: string, unionId?: string) {
  return http.get<UserRecruitmentRespVO>('/admin-api/system/user-recruitment/get-submit', {
    openid,
    unionId,
  })
}

/**
 * 获取当前用户自己的纳新进度。
 * 服务端只接受 openid/unionId 身份，不接受 recruitmentId，避免越权读取他人进度。
 */
export function getRecruitmentProgress(openid?: string, unionId?: string) {
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

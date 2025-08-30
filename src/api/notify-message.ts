import type { NotifyMessagePageReqVO, NotifyMessageRespVO, PageResultNotifyMessageRespVO } from './types/notify-message'
import { http } from '@/http/http'

/**
 * 消息提醒（站内信）相关 API
 */

/**
 * 获取我的站内信分页列表
 * @param params 分页查询参数
 * @returns Promise<PageResultNotifyMessageRespVO> 站内信分页数据
 */
export function getMyNotifyMessagePage(params: NotifyMessagePageReqVO) {
  const headers: Record<string, any> = {
    'tenant-id': 1, // 默认租户ID
  }

  return http.get<PageResultNotifyMessageRespVO>('/admin-api/system/notify-message/my-page', params, headers)
}

/**
 * 通过ID获取消息提醒详情
 * @param id 消息提醒ID
 * @returns Promise<NotifyMessageRespVO> 消息提醒详情
 */
export function getNotifyMessageById(id: number) {
  const headers: Record<string, any> = {
    'tenant-id': 1, // 默认租户ID
  }

  return http.get<NotifyMessageRespVO>(`/admin-api/system/notify-message/get?id=${id}`, undefined, headers)
}

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
  return http.get<PageResultNotifyMessageRespVO>('/admin-api/system/notify-message/my-page', params)
}

/**
 * 通过ID获取消息提醒详情
 * @param id 消息提醒ID
 * @returns Promise<NotifyMessageRespVO> 消息提醒详情
 */
export function getNotifyMessageById(id: number) {
  return http.get<NotifyMessageRespVO>(`/admin-api/system/notify-message/my-get?id=${id}`)
}

/**
 * 获取未读站内信数量
 * @returns Promise<number> 未读消息数量
 */
export function getUnreadCount() {
  return http.get<number>('/admin-api/system/notify-message/get-unread-count')
}

import type { NoticePageReqVO, NoticeRespVO, PageResultNoticeRespVO } from './types/notice'
import { http } from '@/http/http'

/**
 * 通知公告相关 API
 */

/**
 * 获取通知公告分页列表
 * @param params 分页查询参数
 * @returns Promise<PageResultNoticeRespVO> 通知公告分页数据
 */
export function getNoticePage(params: NoticePageReqVO) {
  const headers: Record<string, any> = {
    'tenant-id': 1, // 默认租户ID
  }

  return http.get<PageResultNoticeRespVO>('/admin-api/system/notice/page', params, headers)
}

/**
 * 通过ID获取通知公告详情
 * @param id 通知公告ID
 * @returns Promise<NoticeRespVO> 通知公告详情
 */
export function getNoticeById(id: number) {
  const headers: Record<string, any> = {
    'tenant-id': 1, // 默认租户ID
  }

  return http.get<NoticeRespVO>(`/admin-api/system/notice/get?id=${id}`, undefined, headers)
}

/**
 * 通知公告相关类型定义
 */

// 通知公告信息响应 VO
export interface NoticeRespVO {
  /** 通知公告序号 */
  id: number
  /** 公告标题 */
  title: string
  /** 公告类型 */
  type: number
  /** 公告内容 */
  content: string
  /** 状态，参见 CommonStatusEnum 枚举类 */
  status: number
  /** 创建时间 */
  createTime: string
}

// 分页结果
export interface PageResultNoticeRespVO {
  /** 数据 */
  list: NoticeRespVO[]
  /** 总量 */
  total: number
}

// 通知公告分页查询参数
export interface NoticePageReqVO {
  /** 通知公告名称，模糊匹配 */
  title?: string
  /** 展示状态，参见 CommonStatusEnum 枚举类 */
  status?: number
  /** 页码，从 1 开始 */
  pageNo: number
  /** 每页条数，最大值为 100 */
  pageSize: number
}

// 通知公告状态枚举
export enum NoticeStatusEnum {
  /** 启用 */
  ENABLE = 0,
  /** 禁用 */
  DISABLE = 1,
}

// 通知公告类型枚举（根据实际业务调整）
export enum NoticeTypeEnum {
  /** 系统通知 */
  SYSTEM = 1,
  /** 公告 */
  ANNOUNCEMENT = 2,
  /** 活动 */
  ACTIVITY = 3,
}

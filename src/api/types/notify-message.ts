/**
 * 消息提醒（站内信）相关类型定义
 */

// 站内信信息响应 VO
export interface NotifyMessageRespVO {
  /** ID */
  id: number
  /** 用户编号 */
  userId: number
  /** 用户类型，参见 UserTypeEnum 枚举 */
  userType: string
  /** 模版编号 */
  templateId: number
  /** 模板编码 */
  templateCode: string
  /** 模版发送人名称 */
  templateNickname: string
  /** 模版内容 */
  templateContent: string
  /** 模版类型 */
  templateType: number
  /** 模版参数 */
  templateParams: Record<string, any>
  /** 是否已读 */
  readStatus: boolean
  /** 阅读时间 */
  readTime?: string
  /** 创建时间 */
  createTime: string
}

// 分页结果
export interface PageResultNotifyMessageRespVO {
  /** 数据 */
  list: NotifyMessageRespVO[]
  /** 总量 */
  total: number
}

// 我的站内信分页查询参数
export interface NotifyMessagePageReqVO {
  /** 是否已读 */
  readStatus?: boolean
  /** 创建时间 */
  createTime?: string[]
  /** 页码，从 1 开始 */
  pageNo: number
  /** 每页条数，最大值为 100 */
  pageSize: number
}

// 消息类型枚举（根据实际业务调整）
export enum NotifyMessageTypeEnum {
  /** 系统消息 */
  SYSTEM = 1,
  /** 审批消息 */
  APPROVAL = 2,
  /** 考勤消息 */
  ATTENDANCE = 3,
  /** 项目消息 */
  PROJECT = 4,
  /** 其他消息 */
  OTHER = 5,
}

// 读取状态枚举
export enum ReadStatusEnum {
  /** 未读 */
  UNREAD = 0,
  /** 已读 */
  READ = 1,
}

/**
 * 考勤相关类型定义
 */

// 考勤记录项
export interface AttendanceRecordItem {
  /** 识别时间（字符串或时间戳） */
  recognizeTime: string | number
  /** 打卡结果 */
  result: number
  /** 考勤机 */
  deviceSn: string
}

// 今日考勤记录响应
export interface TodayAttendanceRecordRespVO {
  /** 上班打卡 */
  onDuty: AttendanceRecordItem | null
  /** 下班打卡 */
  offDuty: AttendanceRecordItem | null
  /** 考勤结果 */
  result: number
}

// 考勤状态枚举
export enum AttendanceResult {
  /** 正常 */
  NORMAL = 1,
  /** 迟到 */
  LATE = 2,
  /** 早退 */
  EARLY_LEAVE = 3,
  /** 缺卡 */
  MISS_CARD = 4,
  /** 请假 */
  LEAVE = 5,
  /** 缺勤 */
  ABSENTEEISM = 6,
}

/**
 * 重置人脸响应类型
 */
export interface ResetFaceResult {
  /** 状态码 */
  code: number
  /** 响应数据 */
  data: string
  /** 响应消息 */
  msg: string
}

/**
 * 手动考勤记录响应VO
 */
export interface AttendanceManualRespVO {
  /** 考勤归档记录ID */
  id: number
  /** 用户ID */
  userId: number
  /** 用户昵称 */
  nickname: string
  /** 考勤归档状态 */
  status: number
  /** 转换映射 */
  transMap?: Record<string, any>
}

/**
 * 手动考勤请求VO
 */
export interface AttendanceManualReqVO {
  /** 考勤记录ID */
  id: number
  /** 考勤人ID */
  userId: number
  /** 考勤人状态 1-正常 6-缺勤 */
  status: number
}

export interface EduScheduleSaveReqVO {
  /** 学期周数（如：[1,2,3]） */
  week: number[]
  /** 星期几（1=周一，7=周日） */
  weekday: number
  /** 节次（从1开始） */
  section: number
  /** 备注 */
  remark?: string
}

export interface EduScheduleRespVO {
  /** 主键ID */
  id: number
  /** 用户ID */
  userId: number
  /** 学期ID */
  termId: number
  /** 第几周（单周） */
  week: number
  /** 星期几（1=周一，7=周日） */
  weekday: number
  /** 节次（从1开始） */
  section: number
  /** 备注 */
  remark?: string
}

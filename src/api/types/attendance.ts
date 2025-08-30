/**
 * 考勤相关类型定义
 */

// 考勤记录项
export interface AttendanceRecordItem {
  /** 识别时间 */
  recognizeTime: string
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
}

// 考勤状态枚举
export enum AttendanceResult {
  /** 正常 */
  NORMAL = 1,
  /** 迟到 */
  LATE = 2,
  /** 早退 */
  EARLY_LEAVE = 3,
  /** 异常 */
  ABNORMAL = 4,
}

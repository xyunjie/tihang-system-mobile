import type { TodayAttendanceRecordRespVO } from './types/attendance'
import { http } from '@/http/http'

/**
 * 考勤相关 API
 */

/**
 * 获取今日考勤记录
 * @returns Promise<TodayAttendanceRecordRespVO> 今日考勤记录
 */
export function getTodayAttendanceRecord() {
  const headers: Record<string, any> = {
    'tenant-id': 1, // 默认租户ID
  }

  return http.get<TodayAttendanceRecordRespVO>('/admin-api/system/attendance-record/get-today-record', undefined, headers)
}

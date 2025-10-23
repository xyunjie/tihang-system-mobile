import type { AttendanceManualReqVO, AttendanceManualRespVO, EduScheduleRespVO, EduScheduleSaveReqVO, ResetFaceResult, TodayAttendanceRecordRespVO } from './types/attendance'
import { http } from '@/http/http'
import { useUserStore } from '@/store'

/**
 * 考勤相关 API
 */

/**
 * 获取今日考勤记录
 * @returns Promise<TodayAttendanceRecordRespVO> 今日考勤记录
 */
export function getTodayAttendanceRecord() {
  return http.get<TodayAttendanceRecordRespVO>('/admin-api/system/attendance-record/get-today-record')
}

/**
 * 重置人脸/上传考勤照片
 * @param file 人脸图片文件路径
 */
export function resetFace(file: string): Promise<ResetFaceResult> {
  return new Promise((resolve, reject) => {
    // 使用userStore获取token，保持一致性
    const userStore = useUserStore()
    const token = userStore.userInfo.accessToken || uni.getStorageSync('accessToken') || 'test1'

    uni.uploadFile({
      url: '/admin-api/system/moredian/reset-face',
      filePath: file,
      name: 'file',
      header: {
        Authorization: `Bearer ${token}`,
      },
      success: (res) => {
        try {
          console.log('上传响应:', res)
          const result = JSON.parse(res.data) as ResetFaceResult
          if (result.code === 0) {
            resolve(result)
          }
          else {
            reject(new Error(result.msg || '上传失败'))
          }
        }
        catch (error) {
          console.error('响应数据解析失败:', error, res.data)
          reject(new Error('响应数据解析失败'))
        }
      },
      fail: (error) => {
        console.error('上传请求失败:', error)
        reject(new Error(error.errMsg || '网络请求失败'))
      },
    })
  })
}

/**
 * 获取手动考勤列表
 * @returns Promise<AttendanceManualRespVO[]> 手动考勤列表
 */
export function getManualAttendanceList() {
  return http.get<AttendanceManualRespVO[]>('/admin-api/system/attendance-record/get-manual-list')
}

/**
 * 添加手动考勤
 * @param data 手动考勤请求数据
 * @returns Promise<number> 考勤记录ID
 */
export function addManualAttendance(data: AttendanceManualReqVO) {
  return http.post<number>('/admin-api/system/attendance-record/manual-attendance', data)
}

/**
 * 获取个人课程安排
 */
export function getEduSchedule() {
  return http.get<EduScheduleRespVO[]>('/admin-api/system/edu-schedule/get', {}, {
    'tenant-id': 1,
  })
}

/**
 * 创建个人课程安排
 */
export function createEduSchedule(data: EduScheduleSaveReqVO) {
  return http.post<number>('/admin-api/system/edu-schedule/create', data, {
    'tenant-id': 1,
  })
}

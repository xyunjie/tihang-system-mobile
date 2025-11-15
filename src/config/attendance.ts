// 统一的考勤状态配置与样式映射
export type AttendanceStatusCode = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatusCode, string> = {
  1: '正常',
  2: '迟到',
  3: '早退',
  4: '缺卡',
  5: '请假',
  6: '缺勤',
  7: '上课',
}

export function getAttendanceLabel(code?: number | null): string {
  if (!code || !(code in ATTENDANCE_STATUS_LABELS)) return '未知'
  return ATTENDANCE_STATUS_LABELS[code as AttendanceStatusCode]
}

// 统一 wd-tag 的类型映射（用于状态小标签）
export function getAttendanceTagType(code?: number | null): 'primary' | 'success' | 'warning' | 'danger' | 'default' {
  switch (code) {
    case 1: return 'success' // 正常
    case 2: return 'warning' // 迟到
    case 3: return 'warning' // 早退
    case 4: return 'danger'  // 缺卡
    case 5: return 'primary' // 请假
    case 6: return 'danger'  // 缺勤
    case 7: return 'primary' // 上课（突出显示）
    default: return 'default'
  }
}

// 日历圆点颜色（深浅色模式），与统计色系统一：
// 正常=蓝，迟到/早退=黄，缺卡=灰，请假=绿，缺勤=红
export function getAttendanceDotClass(isDark: boolean, code?: number | null): string {
  switch (code) {
    case 1: return isDark ? 'bg-blue-400' : 'bg-blue-600'
    case 2:
    case 3: return isDark ? 'bg-yellow-400' : 'bg-yellow-600'
    case 4: return isDark ? 'bg-gray-400' : 'bg-gray-500'
    case 5: return isDark ? 'bg-green-400' : 'bg-green-600'
    case 6: return isDark ? 'bg-red-400' : 'bg-red-600'
    case 7: return isDark ? 'bg-sky-400' : 'bg-sky-600'
    default: return isDark ? 'bg-gray-500' : 'bg-gray-400'
  }
}

// 首页状态徽标背景色（不区分深浅色，仅使用统一色阶）
export function getAttendanceBadgeBgClass(code?: number | null): string {
  switch (code) {
    case 1: return 'bg-blue-600/80'
    case 2:
    case 3: return 'bg-yellow-600/80'
    case 4: return 'bg-gray-600/80'
    case 5: return 'bg-green-600/80'
    case 6: return 'bg-red-600/80'
    case 7: return 'bg-sky-600/80'
    default: return 'bg-white/20'
  }
}
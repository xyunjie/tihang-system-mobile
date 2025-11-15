<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "考勤记录"
  }
}
</route>

<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import { getAttendanceRecord, getAttendanceStatistics, getCalendarStatistics } from '@/api/attendance'
import InlineCalendar from '@/components/InlineCalendar.vue'
import ThemeCard from '@/components/ThemeCard.vue'
import { getAttendanceDotClass, getAttendanceLabel, getAttendanceTagType } from '@/config/attendance'
import { useAppStore } from '@/store/app'

defineOptions({ name: 'AttendanceRecord' })

// 主题适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const cardClass = computed(() => (isDark.value ? 'bg-gray-800' : 'bg-white'))
const titleClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-900'))
const textClass = computed(() => (isDark.value ? 'text-gray-300' : 'text-gray-600'))
const borderClass = computed(() => (isDark.value ? 'border-white/10' : 'border-gray-100'))

// 当日记录（后端接口数据）
const dayRecord = ref<import('@/api/types/attendance').AttendanceArchiveRespVO | null>(null)

// 使用自研内联日历：单选日期、内联展示、左右滑动切月
const calendarValue = ref<number>(Date.now())
const selectedDateStr = computed(() => dayjs(calendarValue.value).format('YYYY-MM-DD'))
// 面板月份（用于顶部标题与统计）
const panelMonthTs = ref<number>(dayjs(calendarValue.value).startOf('month').valueOf())
const monthTitle = computed(() => dayjs(panelMonthTs.value).format('YYYY年MM月'))
// 可选择范围（向前/向后 12 个月）
const minDate = dayjs().subtract(12, 'month').valueOf()
const maxDate = dayjs().add(12, 'month').valueOf()
// 点选即变更
function onCalendarChange({ value }: { value: number }) {
  calendarValue.value = value
  panelMonthTs.value = dayjs(value).startOf('month').valueOf()
}
function onMonthChange(panelTs: number) {
  panelMonthTs.value = panelTs
}

// 当日详情（UI 映射）
const selectedRecord = computed(() => {
  if (!dayRecord.value)
    return null
  const r = dayjs
  return {
    date: dayRecord.value.attendanceDate,
    checkIn: dayRecord.value.checkInTime ? r(dayRecord.value.checkInTime).format('HH:mm') : undefined,
    checkOut: dayRecord.value.checkOutTime ? r(dayRecord.value.checkOutTime).format('HH:mm') : undefined,
    status: dayRecord.value.status,
    location: dayRecord.value.checkInDevice || dayRecord.value.checkOutDevice
      ? [dayRecord.value.checkInDevice, dayRecord.value.checkOutDevice].filter(Boolean).join(' · ')
      : undefined,
    remark: dayRecord.value.remark,
  }
})

// 加载：当日考勤记录
async function loadAttendanceRecordForDay(isoDate: string) {
  try {
    const res = await getAttendanceRecord(isoDate)
    if (res.code === 0 && res.data) {
      dayRecord.value = res.data
    }
    else {
      dayRecord.value = null
    }
  }
  catch (error) {
    dayRecord.value = null
  }
}

// 月度统计（后端接口数据）
const periodSummary = ref({
  normal: 0,
  late: 0,
  early: 0,
  absence: 0,
  leave: 0,
})

async function loadStatisticsForMonth(ts: number) {
  try {
    const archiveDate = dayjs(ts).startOf('month').format('YYYY-MM-DD')
    const res = await getAttendanceStatistics(archiveDate)
    if (res.code === 0 && res.data) {
      periodSummary.value = {
        normal: res.data.normal || 0,
        late: res.data.late || 0,
        early: res.data.leaveEarly || 0,
        absence: res.data.absenteeism || 0,
        leave: res.data.leave || 0,
      }
    }
    else {
      uni.showToast({ icon: 'none', title: res.msg || '统计数据加载失败' })
      periodSummary.value = { normal: 0, late: 0, early: 0, absence: 0, leave: 0 }
    }
  }
  catch (error) {
    uni.showToast({ icon: 'none', title: '网络错误，请稍后重试' })
  }
}

// 监听月份变化，立即加载统计
watch(panelMonthTs, (ts) => {
  loadStatisticsForMonth(ts)
}, { immediate: true })

// 日历统计（每日状态映射：当月日期->状态编号）
const calendarStats = ref<Record<number, number>>({})
async function loadCalendarStatisticsForMonth(ts: number) {
  try {
    const archiveDate = dayjs(ts).startOf('month').format('YYYY-MM-DD')
    const res = await getCalendarStatistics(archiveDate)
    if (res.code === 0 && res.data) {
      calendarStats.value = res.data || {}
    }
    else {
      calendarStats.value = {}
    }
  }
  catch {
    calendarStats.value = {}
  }
}

// 同步加载：月份变化时同时拉取日历统计
watch(panelMonthTs, (ts) => {
  loadCalendarStatisticsForMonth(ts)
}, { immediate: true })

// 监听选择的日期，拉取当日记录
watch(selectedDateStr, (d) => {
  loadAttendanceRecordForDay(d)
}, { immediate: true })

// 判断是否为当前面板月份
function isSamePanelMonth(ts: number): boolean {
  return dayjs(ts).format('YYYY-MM') === dayjs(panelMonthTs.value).format('YYYY-MM')
}

// 判断是否显示打点：仅在当前面板月份且当月日期存在状态
function hasRecordTs(ts: number): boolean {
  if (!isSamePanelMonth(ts))
    return false
  const day = dayjs(ts).date()
  return calendarStats.value[day] != null
}

// 判断是否为当前选中日期
function isSelected(ts: number): boolean {
  return dayjs(calendarValue.value).isSame(ts, 'day')
}

// 删除重复的圆点与视图滑动逻辑（周/月），仅保留月份滑动

// 状态文本与样式
// 统一：状态文本与标签类型
const statusText = (s: number) => getAttendanceLabel(s)
const statusTagType = (s: number) => getAttendanceTagType(s)

// 圆点颜色：按日状态映射颜色（与顶部统计一致）
function dotColorClass(ts: number): string {
  const day = dayjs(ts).date()
  const status = calendarStats.value[day]
  return getAttendanceDotClass(isDark.value, status)
}

// 展示逻辑：是否为仅提示的特殊状态（请假/缺勤/上课）
const isSpecialStatus = computed(() => {
  const s = selectedRecord.value?.status
  return s === 5 || s === 6 || s === 7
})

// 展示逻辑：在对应时间后追加提示
const checkInDisplay = computed(() => {
  const t = selectedRecord.value?.checkIn
  const s = selectedRecord.value?.status
  let extra = ''
  if (s === 2)
    extra = '（迟到）'
  else if (s === 4 && !t)
    extra = '（缺卡）'
  return `${t || '--:--'}${extra}`
})

const checkOutDisplay = computed(() => {
  const t = selectedRecord.value?.checkOut
  const s = selectedRecord.value?.status
  let extra = ''
  if (s === 3)
    extra = '（早退）'
  else if (s === 4 && !t)
    extra = '（缺卡）'
  return `${t || '--:--'}${extra}`
})

const workDurationDisplay = computed(() => {
  const v = dayRecord.value?.workDuration
  if (v == null)
    return '--'
  const n = Number(v)
  const fixed = Math.round(n * 10) / 10
  return `${fixed} 小时`
})

const deviceInfoDisplay = computed(() => {
  const inDev = dayRecord.value?.checkInDevice?.trim()
  const outDev = dayRecord.value?.checkOutDevice?.trim()
  const list = [inDev, outDev].filter(Boolean) as string[]
  if (list.length === 0)
    return '暂无设备信息'
  if (list.length === 1)
    return list[0]
  return inDev === outDev ? String(inDev) : `${inDev} · ${outDev}`
})

// 是否可跳转到请假详情
const canNavigateToLeaveDetail = computed(() => {
  const status = selectedRecord.value?.status
  const pid = dayRecord.value?.processInstanceId
  return status === 5 && !!pid
})

function tryNavigateToLeaveDetail() {
  if (!canNavigateToLeaveDetail.value)
    return
  const pid = dayRecord.value?.processInstanceId
  if (!pid)
    return
  const url = `/pages-sub/bpm/approval/index?processInstanceId=${encodeURIComponent(pid)}`
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="min-h-screen px-4 py-2">
    <!-- 1. 年月 -->
    <ThemeCard card-class="mb-4" :padding="false">
      <!-- 头部：月份与导航 -->
      <view class="flex items-center justify-between border-b px-4 py-3" :class="borderClass">
        <!-- 左侧：上月 -->
        <view class="w-10 flex items-center justify-center">
          <view
            class="h-7 w-7 flex items-center justify-center rounded-full" :class="isDark ? 'bg-white/5' : 'bg-gray-100'" @click="panelMonthTs = dayjs(panelMonthTs).subtract(1, 'month').valueOf()"
          >
            <text :class="titleClass" class="text-sm">
              ‹
            </text>
          </view>
        </view>
        <!-- 中间：标题居中 -->
        <view class="flex-1 text-center">
          <text :class="titleClass" class="text-lg font-semibold">
            {{ monthTitle }}
          </text>
        </view>
        <!-- 右侧：下月 -->
        <view class="w-10 flex items-center justify-center">
          <view class="h-7 w-7 flex items-center justify-center rounded-full" :class="isDark ? 'bg-white/5' : 'bg-gray-100'" @click="panelMonthTs = dayjs(panelMonthTs).add(1, 'month').valueOf()">
            <text :class="titleClass" class="text-sm">
              ›
            </text>
          </view>
        </view>
      </view>
      <!-- 2. 考勤统计（顶部纵向布局，无总计、无标签） -->
      <view class="grid grid-cols-5 gap-2 px-4 py-3 text-center">
        <view class="flex flex-col items-center">
          <text :class="textClass" class="text-xs">
            正常
          </text>
          <text :class="isDark ? 'text-blue-400' : 'text-blue-600'" class="text-sm font-semibold">
            {{ periodSummary.normal }}
          </text>
        </view>
        <view class="flex flex-col items-center">
          <text :class="textClass" class="text-xs">
            迟到
          </text>
          <text :class="isDark ? 'text-yellow-400' : 'text-yellow-600'" class="text-sm font-semibold">
            {{ periodSummary.late }}
          </text>
        </view>
        <view class="flex flex-col items-center">
          <text :class="textClass" class="text-xs">
            早退
          </text>
          <text :class="isDark ? 'text-yellow-400' : 'text-yellow-600'" class="text-sm font-semibold">
            {{ periodSummary.early }}
          </text>
        </view>
        <view class="flex flex-col items-center">
          <text :class="textClass" class="text-xs">
            缺勤
          </text>
          <text :class="isDark ? 'text-red-400' : 'text-red-600'" class="text-sm font-semibold">
            {{ periodSummary.absence }}
          </text>
        </view>
        <view class="flex flex-col items-center">
          <text :class="textClass" class="text-xs">
            请假
          </text>
          <text :class="isDark ? 'text-green-400' : 'text-green-600'" class="text-sm font-semibold">
            {{ periodSummary.leave }}
          </text>
        </view>
      </view>
      <!-- 日历面板：使用自研 InlineCalendar，支持左右滑动切月 -->
      <view class="px-4 pb-2">
        <InlineCalendar
          v-model="calendarValue"
          :first-day-of-week="0"
          :min-date="minDate"
          :max-date="maxDate"
          :show-panel-title="false"
          :panel-month="panelMonthTs"
          @change="onCalendarChange"
          @month-change="onMonthChange"
        >
          <template #date-cell="{ day }">
            <!-- 固定每个日期单元的内部高度，避免有圆点时高度不一致 -->
            <view class="relative h-10 w-full flex flex-col items-center justify-center">
              <text class="leading-none" :class="isSelected(day.date) ? 'text-white' : ''">{{ dayjs(day.date).date() }}</text>
              <!-- 为圆点预留固定高度，占位，保证数值垂直位置一致 -->
              <view class="mt-0.5 h-2 flex items-center justify-center">
                <view
                  v-if="!isSelected(day.date) && hasRecordTs(day.date)"
                  class="h-1.5 w-1.5 rounded-full ring-1"
                  :class="[dotColorClass(day.date), isDark ? 'ring-gray-700/60' : 'ring-white/80']"
                />
              </view>
            </view>
          </template>
        </InlineCalendar>
      </view>
      <!-- 已移除：底部周/月视图切换区域（避免未定义变量引用） -->
    </ThemeCard>

    <!-- 合并：当日考勤记录卡片（上班时间 / 下班时间 / 时长与设备） -->
    <ThemeCard :padding="false" :card-class="canNavigateToLeaveDetail ? 'cursor-pointer active:opacity-80' : ''" @click="tryNavigateToLeaveDetail">
      <view class="flex items-center justify-between border-b px-4 py-3" :class="borderClass">
        <view :class="titleClass" class="text-base font-semibold">
          {{ selectedDateStr }}
        </view>
        <wd-tag v-if="selectedRecord" size="small" :type="statusTagType(selectedRecord.status)" plain>
          {{ statusText(selectedRecord.status) }}
        </wd-tag>
        <wd-tag v-else size="small" type="default" plain>
          暂无信息
        </wd-tag>
      </view>
      <view class="p-4">
        <!-- 无记录：展示统一占位 -->
        <view v-if="!selectedRecord" class="py-2">
          <text :class="textClass" class="text-sm">
            暂无信息
          </text>
        </view>

        <!-- 特殊状态：请假/缺勤/上课，只展示提示信息 -->
        <view v-else-if="isSpecialStatus" class="mb-1">
          <text :class="textClass" class="text-sm">
            当日状态：{{ statusText(selectedRecord?.status || 0) }}
          </text>
          <view v-if="selectedRecord?.remark" :class="textClass" class="mt-1 text-sm">
            备注：{{ selectedRecord.remark }}
          </view>
        </view>

        <!-- 正常/迟到/早退/缺卡：展示上下班时间，并在对应时间后追加提示（统一字号） -->
        <template v-else>
          <view class="flex items-baseline gap-2">
            <text class="text-sm" :class="textClass">
              上班时间：
            </text>
            <text class="text-base font-semibold" :class="selectedRecord?.checkIn ? 'text-green-500' : (isDark ? 'text-gray-400' : 'text-gray-500')">
              {{ checkInDisplay }}
            </text>
          </view>
          <view class="mt-3 flex items-baseline gap-2">
            <text class="text-sm" :class="textClass">
              下班时间：
            </text>
            <text class="text-base font-semibold" :class="selectedRecord?.checkOut ? 'text-blue-500' : (isDark ? 'text-gray-400' : 'text-gray-500')">
              {{ checkOutDisplay }}
            </text>
          </view>
          <view class="mt-3 flex items-center gap-2">
            <text :class="textClass" class="text-sm">
              工作时长：
            </text>
            <text class="text-sm font-semibold" :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">
              {{ workDurationDisplay }}
            </text>
          </view>
          <view class="mt-2 flex items-center gap-2">
            <text :class="textClass" class="text-sm">
              考勤设备：
            </text>
            <text class="text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
              {{ deviceInfoDisplay }}
            </text>
          </view>
          <view v-if="selectedRecord?.remark" :class="textClass" class="mt-2 text-sm">
            备注：{{ selectedRecord.remark }}
          </view>
        </template>
      </view>
    </ThemeCard>
  </view>
</template>

<style scoped>
</style>

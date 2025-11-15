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
import ThemeCard from '@/components/ThemeCard.vue'
import { getAttendanceDotClass, getAttendanceLabel, getAttendanceTagType } from '@/config/attendance'
import { useAppStore } from '@/store/app'

defineOptions({ name: 'AttendanceRecord' })

// 主题适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
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
// uni-calendar 需要字符串日期
const minDateStr = computed(() => dayjs(minDate).format('YYYY-MM-DD'))
const maxDateStr = computed(() => dayjs(maxDate).format('YYYY-MM-DD'))
const calendarDateStr = computed(() => dayjs(calendarValue.value).format('YYYY-MM-DD'))
// 点选即变更
// 使用 uni-calendar 的事件
function onUniCalendarChange(e: { fulldate: string }) {
  const ts = dayjs(e.fulldate).valueOf()
  calendarValue.value = ts
  panelMonthTs.value = dayjs(ts).startOf('month').valueOf()
}
function onUniMonthSwitch(e: { year: number, month: number }) {
  const ts = dayjs(`${e.year}-${String(e.month).padStart(2, '0')}-01`).valueOf()
  panelMonthTs.value = ts
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

// uni-calendar 的打点数组（仅当前面板月份）
const selectedMarks = computed(() => {
  const baseMonth = dayjs(panelMonthTs.value)
  const entries = Object.entries(calendarStats.value)
  return entries.map(([d, code]) => ({
    date: baseMonth.date(Number(d)).format('YYYY-MM-DD'),
    info: '',
    data: { code },
  }))
})

// 判断是否为当前选中日期
// 已由 uni-calendar 负责选中态

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
      <!-- 日历面板：使用 uni-calendar 官方组件 -->
      <view
        class="calendar-override px-2 pb-2"
        :class="isDark ? 'uni-calendar-dark' : ''"
      >
        <uni-calendar
          :insert="true"
          :lunar="false"
          :start-date="minDateStr"
          :end-date="maxDateStr"
          :date="calendarDateStr"
          :selected="selectedMarks"
          :show-month="false"
          @change="onUniCalendarChange"
          @month-switch="onUniMonthSwitch"
        />
      </view>
      <!-- 分隔符：位于日历与统计之间，使用统一边框色 -->
      <wd-divider>考勤统计</wd-divider>
      <!-- 2. 考勤统计（移动到日历下方） -->
      <view class="grid grid-cols-5 gap-2 px-4 pb-3 pt-1 text-center">
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
/* 深色模式下，调整官方日历的文字与选中态颜色 */
.uni-calendar-dark :deep(.uni-calendar__weeks-day-text) {
  color: #9ca3af; /* text-gray-400 */
}
.uni-calendar-dark :deep(.uni-calendar-item__weeks-box-text) {
  color: #e5e7eb; /* text-gray-200 */
}
.uni-calendar-dark :deep(.uni-calendar-item--isDay-text) {
  color: #93c5fd; /* text-sky-300 */
}

/* 深色模式：头部与容器 */
.uni-calendar-dark :deep(.uni-calendar__content) {
  background-color: transparent;
}
.uni-calendar-dark :deep(.uni-calendar__header) {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}
.uni-calendar-dark :deep(.uni-calendar__header-text) {
  color: #e5e7eb; /* text-gray-200 */
}
.uni-calendar-dark :deep(.uni-calendar__header-btn) {
  border-left-color: #9ca3af; /* text-gray-400 */
  border-top-color: #9ca3af; /* text-gray-400 */
}
.uni-calendar-dark :deep(.uni-calendar__backtoday) {
  background-color: #1f2937; /* bg-gray-800 */
  color: #93c5fd; /* text-sky-300 */
}
.uni-calendar-dark :deep(.uni-calendar__weeks-day) {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}
.uni-calendar-dark :deep(.uni-calendar__box-bg-text) {
  color: #6b7280; /* text-gray-500 */
  opacity: 0.15;
}

/* 通用覆盖：缩小单元格高度、去除非当月背景块，优化观感 */
.calendar-override :deep(.uni-calendar-item__weeks-box-item) {
  width: 68rpx;
  height: 68rpx;
}
.calendar-override :deep(.uni-calendar-item--disable) {
  background-color: transparent;
}
.calendar-override :deep(.uni-calendar__weeks-day-text) {
  font-weight: 500;
}

/* 需求：不显示“今日”字样，仅保留高亮选中背景 */
.calendar-override :deep(.uni-calendar-item__weeks-lunar-text.uni-calendar-item--isDay-text) {
  display: none;
}
.uni-calendar-dark :deep(.uni-calendar-item--disable) {
  color: #6b7280; /* text-gray-500 */
  opacity: 0.55;
}
.uni-calendar-dark :deep(.uni-calendar-item--disable .uni-calendar-item__weeks-box-text),
.uni-calendar-dark :deep(.uni-calendar-item--disable .uni-calendar-item__weeks-lunar-text) {
  color: #6b7280; /* text-gray-500 */
}
.uni-calendar-dark :deep(.uni-calendar-item--disable .uni-calendar-item__weeks-box-circle) {
  opacity: 0.45;
}
</style>

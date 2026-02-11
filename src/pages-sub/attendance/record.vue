<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "考勤记录"
  }
}
</route>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getAttendanceRecord, getAttendanceStatistics, getCalendarStatistics } from '@/api/attendance'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'
import dayjs from 'dayjs'
import { getAttendanceDotClass, getAttendanceLabel, getAttendanceTagType } from '@/config/attendance'

defineOptions({
  name: 'AttendanceRecord',
})

// 主题适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))

// 动态设置背景色
function setPageBackgroundColor() {
  const bgColor = isDark.value ? '#020617' : '#f5f7fa'
  uni.setBackgroundColor({
    backgroundColor: bgColor,
    backgroundColorTop: bgColor,
    backgroundColorBottom: bgColor,
  })
}

onShow(() => {
  setPageBackgroundColor()
})

watch(() => isDark.value, () => {
  setPageBackgroundColor()
})

// 当前选中日期
const currentDate = ref(dayjs().format('YYYY-MM-DD'))
const currentMonth = ref(dayjs().format('YYYY-MM'))

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
  <view class="min-h-screen pb-6 box-border flex flex-col" :class="isDark ? 'bg-[#020617]' : 'bg-[#f5f7fa]'">
    <!-- 顶部日历区域 -->
    <view class="flex-shrink-0">
      <ThemeCard :padding="false" card-class="m-4 shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
        <view class="p-4 bg-white dark:bg-slate-800">
          <view
            class="calendar-override"
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
        </view>
      </ThemeCard>
    </view>

    <!-- 统计数据区域 -->
    <view class="flex-shrink-0 px-4 mb-4">
      <view class="flex justify-between items-center gap-3">
        <view class="flex-1 p-3 rounded-xl flex flex-col items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800">
          <view class="text-xl font-bold mb-1 font-mono tracking-tight" :class="isDark ? 'text-blue-400' : 'text-blue-600'">
            {{ periodSummary.normal }}
          </view>
          <view class="text-xs" :class="textSecondaryClass">
            正常
          </view>
        </view>
        <view class="flex-1 p-3 rounded-xl flex flex-col items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800">
          <view class="text-xl font-bold mb-1 font-mono tracking-tight" :class="isDark ? 'text-yellow-400' : 'text-yellow-600'">
            {{ periodSummary.late }}
          </view>
          <view class="text-xs" :class="textSecondaryClass">
            迟到
          </view>
        </view>
        <view class="flex-1 p-3 rounded-xl flex flex-col items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800">
          <view class="text-xl font-bold mb-1 font-mono tracking-tight" :class="isDark ? 'text-yellow-400' : 'text-yellow-600'">
            {{ periodSummary.early }}
          </view>
          <view class="text-xs" :class="textSecondaryClass">
            早退
          </view>
        </view>
        <view class="flex-1 p-3 rounded-xl flex flex-col items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800">
          <view class="text-xl font-bold mb-1 font-mono tracking-tight" :class="isDark ? 'text-red-400' : 'text-red-600'">
            {{ periodSummary.absence }}
          </view>
          <view class="text-xs" :class="textSecondaryClass">
            缺勤
          </view>
        </view>
        <view class="flex-1 p-3 rounded-xl flex flex-col items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800">
          <view class="text-xl font-bold mb-1 font-mono tracking-tight" :class="isDark ? 'text-green-400' : 'text-green-600'">
            {{ periodSummary.leave }}
          </view>
          <view class="text-xs" :class="textSecondaryClass">
            请假
          </view>
        </view>
      </view>
    </view>

    <!-- 当日记录详情 -->
    <view class="flex-1 px-4 min-h-0">
      <ThemeCard :padding="false" card-class="shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl h-full flex flex-col">
        <view 
          class="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-2xl"
          :class="canNavigateToLeaveDetail ? 'cursor-pointer active:opacity-80' : ''"
          @click="tryNavigateToLeaveDetail"
        >
          <view class="font-bold text-base" :class="textPrimaryClass">
            {{ selectedDateStr }}
          </view>
          <wd-tag v-if="selectedRecord" size="small" :type="statusTagType(selectedRecord.status)" plain>
            {{ statusText(selectedRecord.status) }}
          </wd-tag>
          <wd-tag v-else size="small" type="default" plain>
            暂无信息
          </wd-tag>
        </view>

        <view class="p-5 flex-1 bg-white dark:bg-slate-800 rounded-b-2xl">
          <!-- 无记录 -->
          <view v-if="!selectedRecord" class="py-2 text-center">
            <text class="text-sm" :class="textSecondaryClass">
              暂无考勤信息
            </text>
          </view>

          <!-- 特殊状态 -->
          <view v-else-if="isSpecialStatus" class="mb-1">
             <view class="flex items-center gap-2 mb-2">
               <text class="text-sm" :class="textSecondaryClass">当日状态：</text>
               <text class="font-medium" :class="textPrimaryClass">{{ statusText(selectedRecord?.status || 0) }}</text>
             </view>
             <view v-if="selectedRecord?.remark" class="text-sm" :class="textSecondaryClass">
                备注：{{ selectedRecord.remark }}
             </view>
          </view>

          <!-- 正常打卡记录 -->
          <template v-else>
            <view class="relative pl-6 pb-8 border-l-2 border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
              <view class="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-800 bg-blue-500 shadow-sm" />
              
              <view class="mb-1 text-xs font-medium opacity-60" :class="textMutedClass">上班打卡</view>
              <view class="flex items-baseline gap-2 mb-2">
                <view class="text-2xl font-bold font-mono tracking-tight" :class="selectedRecord?.checkIn ? textPrimaryClass : textMutedClass">
                  {{ checkInDisplay.split('（')[0] }}
                </view>
                <view v-if="checkInDisplay.includes('（')" class="text-xs text-orange-500">
                  {{ checkInDisplay.split('（')[1].replace('）', '') }}
                </view>
              </view>
              <view class="flex items-center gap-1.5 text-xs" :class="textSecondaryClass">
                <wd-icon name="location" size="14px" />
                <text>{{ dayRecord?.checkInDevice ? `设备: ${dayRecord.checkInDevice}` : '暂无位置信息' }}</text>
              </view>
            </view>

            <view class="relative pl-6 pt-2 border-l-2 border-transparent">
              <view class="absolute -left-[9px] top-2 w-4 h-4 rounded-full border-4 border-white dark:border-slate-800 bg-blue-500 shadow-sm" />
              
              <view class="mb-1 text-xs font-medium opacity-60" :class="textMutedClass">下班打卡</view>
              <view class="flex items-baseline gap-2 mb-2">
                <view class="text-2xl font-bold font-mono tracking-tight" :class="selectedRecord?.checkOut ? textPrimaryClass : textMutedClass">
                  {{ checkOutDisplay.split('（')[0] }}
                </view>
                <view v-if="checkOutDisplay.includes('（')" class="text-xs text-orange-500">
                  {{ checkOutDisplay.split('（')[1].replace('）', '') }}
                </view>
              </view>
              <view class="flex items-center gap-1.5 text-xs" :class="textSecondaryClass">
                <wd-icon name="location" size="14px" />
                <text>{{ dayRecord?.checkOutDevice ? `设备: ${dayRecord.checkOutDevice}` : '暂无位置信息' }}</text>
              </view>
            </view>

            <view class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <view class="flex items-center gap-2">
                <text class="text-sm" :class="textSecondaryClass">工作时长</text>
                <text class="text-sm font-bold font-mono" :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">{{ workDurationDisplay }}</text>
              </view>
            </view>
          </template>
        </view>
      </ThemeCard>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 覆盖 page 背景色 */
:global(page) {
  background-color: #f5f7fa;
}
:global(.dark page) {
  background-color: #020617;
}

:deep(.wd-calendar-view) {
  background: transparent !important;
}

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

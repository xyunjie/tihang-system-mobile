<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import { useAppStore } from '@/store/app'

interface Props {
  modelValue: number
  firstDayOfWeek?: number
  minDate?: number
  maxDate?: number
  showPanelTitle?: boolean
  // 受控面板月份（传入当月任意时间戳，内部取该月月初）
  panelMonth?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: number): void
  (e: 'change', payload: { value: number }): void
  (e: 'month-change', panelMonthTs: number): void
}>()

// 主题适配：今天背景在暗色/亮色下保持浅色突出
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

const first = computed(() => props.firstDayOfWeek ?? 1)

const panel = ref(dayjs((props.panelMonth ?? props.modelValue)).startOf('month'))

watch(() => props.modelValue, (v) => {
  const d = dayjs(v)
  if (!d.isSame(panel.value, 'month')) {
    panel.value = d.startOf('month')
    emit('month-change', panel.value.valueOf())
  }
})

// 受控面板：外部传入的面板月份变化
watch(() => props.panelMonth, (v) => {
  if (v === undefined) return
  const d = dayjs(v).startOf('month')
  if (!d.isSame(panel.value, 'month')) {
    panel.value = d
    emit('month-change', panel.value.valueOf())
  }
})

function goPrevMonth() {
  panel.value = panel.value.subtract(1, 'month')
  emit('month-change', panel.value.valueOf())
}
function goNextMonth() {
  panel.value = panel.value.add(1, 'month')
  emit('month-change', panel.value.valueOf())
}

const touch = {
  x: 0,
  y: 0,
}
function onTouchStart(e: any) {
  const t = e.touches ? e.touches[0] : e
  touch.x = t.pageX
  touch.y = t.pageY
}
function onTouchEnd(e: any) {
  const t = e.changedTouches ? e.changedTouches[0] : e
  const dx = t.pageX - touch.x
  const dy = t.pageY - touch.y
  const threshold = 40
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
    if (dx < 0) {
      goNextMonth()
    } else {
      goPrevMonth()
    }
  }
}

function weekIndex(weekday: number) {
  // dayjs weekday: 0 Sunday .. 6 Saturday; first day default 1 (Monday)
  return (weekday - first.value + 7) % 7
}

const days = computed(() => {
  const start = panel.value
  const daysInMonth = start.daysInMonth()
  const firstWeekday = start.day() // 0-6
  const leading = weekIndex(firstWeekday)
  const grid: Array<{
    date: number
    isCurrentMonth: boolean
    isToday: boolean
    disabled: boolean
  }> = []
  // previous month days
  const prevMonth = start.subtract(leading, 'day')
  for (let i = 0; i < leading; i++) {
    const d = prevMonth.add(i, 'day')
    grid.push(makeDay(d, false))
  }
  // current month days
  for (let i = 0; i < daysInMonth; i++) {
    const d = start.add(i, 'day')
    grid.push(makeDay(d, true))
  }
  // trailing to 42
  const remaining = 42 - grid.length
  const afterStart = start.add(daysInMonth, 'day')
  for (let i = 0; i < remaining; i++) {
    const d = afterStart.add(i, 'day')
    grid.push(makeDay(d, false))
  }
  return grid
})

function makeDay(d: dayjs.Dayjs, isCurrent: boolean) {
  const ts = d.valueOf()
  const disabled =
    (props.minDate !== undefined && ts < props.minDate!) ||
    (props.maxDate !== undefined && ts > props.maxDate!)
  return {
    date: ts,
    isCurrentMonth: isCurrent,
    isToday: dayjs().isSame(d, 'day'),
    disabled,
  }
}

function onDayClick(day: { date: number; disabled: boolean }) {
  if (day.disabled) return
  emit('update:modelValue', day.date)
  emit('change', { value: day.date })
  const d = dayjs(day.date).startOf('month')
  if (!d.isSame(panel.value, 'month')) {
    panel.value = d
    emit('month-change', panel.value.valueOf())
  }
}

const weekLabels = computed(() => {
  // Sunday-first base labels, rotate by firstDayOfWeek
  const base = ['日', '一', '二', '三', '四', '五', '六']
  const order: string[] = []
  for (let i = 0; i < 7; i++) {
    order.push(base[(i + first.value) % 7])
  }
  return order
})
</script>

<template>
  <view class="select-none" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <!-- optional panel title -->
    <view v-if="showPanelTitle" class="mb-2 text-center">
      <text class="text-sm font-medium">{{ dayjs(panel.valueOf()).format('YYYY年MM月') }}</text>
    </view>
    <!-- week headers -->
    <view class="grid grid-cols-7 gap-1 px-1 py-2 text-center">
      <view v-for="w in weekLabels" :key="w">
        <text class="text-xs text-gray-500">{{ w }}</text>
      </view>
    </view>
    <!-- days grid -->
    <view class="grid grid-cols-7 gap-1">
      <view
        v-for="day in days"
        :key="day.date"
        class="relative flex h-10 items-center justify-center rounded"
        :class="[
          // 非当月日期降低透明度；当月不再设置透明背景，避免覆盖选中/今天底色
          day.isCurrentMonth ? '' : 'opacity-50',
          day.disabled ? 'pointer-events-none opacity-30' : 'cursor-pointer',
          // 选中态：实心圆角蓝底 + 白字
          dayjs(modelValue).isSame(day.date, 'day')
            ? [isDark ? 'bg-blue-600' : 'bg-blue-500', 'rounded-xl', 'text-white']
            : '',
          // 今天：浅色背景（在未选中时才生效）
          (!dayjs(modelValue).isSame(day.date, 'day') && day.isToday)
            ? (isDark ? 'bg-blue-900/20' : 'bg-blue-100')
            : ''
        ]"
        @click="onDayClick(day)"
      >
        <slot name="date-cell" :day="day">
          <text class="text-sm">{{ dayjs(day.date).date() }}</text>
        </slot>
      </view>
    </view>
  </view>
  
</template>

<style scoped>
</style>
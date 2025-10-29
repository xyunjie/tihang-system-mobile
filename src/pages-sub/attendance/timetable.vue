<!-- 课程表展示（只读） -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "课程表",
    "navigationStyle": "default",
    "enablePullDownRefresh": false,
    "backgroundTextStyle": "dark"
  }
}
</route>

<script setup lang="ts">
import type { EduScheduleRespVO } from '@/api/types/attendance'
import { onLoad } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import { getEduSchedule } from '@/api/attendance'
import { useAppStore } from '@/store/app'

defineOptions({ name: 'AttendanceTimetable' })

// 一周（周一-周日）
const days = ['周一', '周二', '周三', '周四', '周五']
// 每天五节课时间段
const slots = [
  { label: '第1节', time: '8:00-9:40' },
  { label: '第2节', time: '10:00-11:40' },
  { label: '第3节', time: '14:00-15:40' },
  { label: '第4节', time: '16:00-17:40' },
  { label: '第5节', time: '19:00-20:40' },
]
// 分割线索引：5节制在第2、4节后；8节制在第4、6节后
const lunchDividerIndex = slots.length >= 8 ? 3 : 1
const eveningDividerIndex = slots.length >= 8 ? 5 : 3

// 课程表选择数据：key = `${dayIndex}-${slotIndex}` -> 选中的周次数组
const tableData = reactive<Record<string, number[]>>({})

// 只读页面：去除所有编辑状态与临时选择

// 深色模式样式
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const cardClass = computed(() => (isDark.value ? 'bg-gray-800' : 'bg-white'))
const borderClass = computed(() => (isDark.value ? 'border-gray-700' : 'border-gray-200'))
const titleClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-500'))

function getKey(dayIndex: number, slotIndex: number) {
  return `${dayIndex}-${slotIndex}`
}

// 解析节次数字
function getPeriodNumber(label: string) {
  const m = label.match(/\d+/)
  return m ? Number(m[0]) : label
}

// 拆分上课/下课时间
function splitTime(time: string) {
  try {
    const [start, end] = time.split('-').map(s => s.trim())
    const pad = (t: string) => {
      const [h, m] = t.split(':')
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    return { start: pad(start), end: pad(end) }
  }
  catch {
    return { start: time, end: '' }
  }
}

// 去除编辑相关方法

function getCellClass(dayIndex: number, slotIndex: number) {
  const key = getKey(dayIndex, slotIndex)
  const has = (tableData[key] || []).length > 0
  // 根据深色模式调整单元格底色与文字颜色
  const appStore = useAppStore()
  const isDark = appStore.theme === 'dark'
  const base = isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'
  const withShadow = isDark ? 'bg-gray-800 text-gray-200 shadow-sm' : 'bg-white text-gray-700 shadow-sm'
  return has ? withShadow : base
}

// 新增：判断单元格是否有课
function hasCourse(dayIndex: number, slotIndex: number) {
  const key = getKey(dayIndex, slotIndex)
  return (tableData[key] || []).length > 0
}

// 新增：获取已选周次数量
function getCellCount(dayIndex: number, slotIndex: number) {
  const key = getKey(dayIndex, slotIndex)
  return (tableData[key] || []).length
}

// 页面状态：加载中 & 未配置学期信息
const loading = ref(true)
const emptyTerm = ref(false)

// 查看弹窗（只读）
const viewerVisible = ref(false)
const viewerDayIndex = ref<number>(0)
const viewerSlotIndex = ref<number>(0)
const viewerWeeks = computed<number[]>(() => {
  const key = getKey(viewerDayIndex.value, viewerSlotIndex.value)
  return tableData[key] || []
})
const viewerTitle = computed(() => {
  const slot = slots[viewerSlotIndex.value]
  return `${days[viewerDayIndex.value]} · ${slot.label}`
})

function openView(dayIndex: number, slotIndex: number) {
  viewerDayIndex.value = dayIndex
  viewerSlotIndex.value = slotIndex
  viewerVisible.value = true
}
function closeView() {
  viewerVisible.value = false
}

// 加载本地存储
onLoad(async () => {
  try {
    const raw = uni.getStorageSync('simple_timetable')
    if (raw) {
      const parsed = JSON.parse(String(raw)) as Record<string, number[]>
      Object.keys(parsed).forEach(k => (tableData[k] = parsed[k]))
    }
    else {
      // 无本地数据，保持空表，等待后端数据
    }
  }
  catch (e) {
    // ignore
  }

  // 尝试拉取后端课程表数据并覆盖本地
  try {
    const res = await getEduSchedule()
    console.log('getEduSchedule', res)
    if (res && res.code === 0 && Array.isArray(res.data)) {
      emptyTerm.value = false
      applyServerSchedules(res.data)
    }
    else if (res && res.code === 1002034002) {
      // 未配置学期信息：展示空状态，不写入本地
      emptyTerm.value = true
      // 清空内存中的课表，避免误展示旧数据
      Object.keys(tableData).forEach(k => (tableData[k] = []))
    }
  }
  catch {}
  finally {
    loading.value = false
  }
})

function applyServerSchedules(list: EduScheduleRespVO[]) {
  // 清空现有表格数据
  Object.keys(tableData).forEach(k => (tableData[k] = []))
  // 将后端返回的每条记录映射为 key=weekday-1_section-1 的周次数组
  list.forEach((item) => {
    const dayIdx = item.weekday - 1
    const sectionIdx = item.section - 1
    const key = `${dayIdx}-${sectionIdx}`
    const weeks = tableData[key] || []
    if (!weeks.includes(item.week))
      weeks.push(item.week)
    tableData[key] = weeks
  })
  // 每格周次排序，提升展示一致性
  Object.keys(tableData).forEach(k => tableData[k].sort((a, b) => a - b))
  // 同步本地存储，便于后续离线展示
  uni.setStorageSync('simple_timetable', JSON.stringify(tableData))
}
</script>

<template>
  <view class="min-h-screen">
    <!-- 加载中 -->
    <view v-if="loading" class="flex items-center justify-center py-20">
      <view class="flex flex-col items-center gap-3">
        <view class="h-6 w-6 animate-spin border-2 border-gray-300 border-t-sky-500 rounded-full" />
        <text class="text-sm" :class="textClass">
          加载中...
        </text>
      </view>
    </view>

    <!-- 未配置学期信息空状态 -->
    <view v-else-if="emptyTerm" class="mt-4 px-4">
      <view class="border rounded-xl p-8 text-center shadow-sm" :class="[cardClass, borderClass]">
        <view class="text-base font-medium" :class="titleClass">
          系统未配置学期信息，请联系管理员配置学期信息！
        </view>
      </view>
    </view>

    <!-- 课程表网格 -->
    <view v-else class="mt-4 px-4">
      <view class="overflow-hidden border rounded-xl shadow-sm" :class="[cardClass, borderClass]">
        <!-- 表头：时间 + 7天 -->
        <view class="sticky top-0 z-10 grid" :class="cardClass" style="grid-template-columns: 35px repeat(5, 1fr);">
          <view class="h-12 flex items-center justify-center text-sm font-medium" :class="titleClass" />
          <view v-for="(d, di) in days" :key="di" class="h-12 flex items-center justify-center text-sm font-medium" :class="titleClass">
            {{ d }}
          </view>
        </view>

        <!-- 正文：时间段行 + 分割线（中午/晚上） -->
        <view>
          <template v-for="(slot, si) in slots" :key="si">
            <view class="grid" style="grid-template-columns: 35px repeat(5, 1fr);">
              <!-- 左侧时间列（上：节次数字；下：两行小号时间） -->
              <view class="h-16 flex flex-col items-center justify-center rounded-none px-1 py-2" :class="cardClass" :style="(si === lunchDividerIndex || si === eveningDividerIndex) ? 'border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB;' : 'border-top: 1px solid #E5E7EB;'">
                <view class="text-sm font-semibold" :class="titleClass">
                  {{ getPeriodNumber(slot.label) }}
                </view>
                <view class="text-10px leading-tight font-mono" :class="textClass">
                  {{ splitTime(slot.time).start }}
                </view>
                <view class="text-10px leading-tight font-mono" :class="textClass">
                  {{ splitTime(slot.time).end }}
                </view>
              </view>
              <!-- 单元格 -->
              <view
                v-for="(d, di) in days"
                :key="di"
                class="relative h-16 overflow-hidden px-2 py-2 transition-all active:scale-98" :style="(si === lunchDividerIndex || si === eveningDividerIndex) ? 'border-top: 1px solid #E5E7EB; border-left: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB;' : 'border-top: 1px solid #E5E7EB; border-left: 1px solid #E5E7EB;'"
                :class="[{ [isDark ? 'bg-sky-900/30' : 'bg-sky-50']: hasCourse(di, si) }, getCellClass(di, si)]"
                @tap="openView(di, si)"
              >
                <view class="h-full w-full flex flex-col items-center justify-center gap-1">
                  <view v-if="hasCourse(di, si)" class="inline-flex items-center rounded-full px-2 py-0.5 text-11px" :class="isDark ? 'bg-sky-900/40 text-sky-300' : 'bg-sky-100 text-sky-700'">
                    有课
                  </view>
                  <text v-if="hasCourse(di, si)" class="text-9px" :class="isDark ? 'text-sky-300' : 'text-sky-700'">
                    已选 {{ getCellCount(di, si) }} 周
                  </text>
                  <text v-else class="text-12px" :class="textClass">
                    空闲
                  </text>
                </view>
                <view v-if="hasCourse(di, si)" class="absolute bottom-1 right-1" style="width: 0; height: 0; border-right: 10px solid transparent; border-top: 10px solid #60a5fa;" />
              </view>
            </view>
            <!-- 分割线：中午 -->
            <view v-if="si === lunchDividerIndex" class="h-8 flex items-center justify-center border-y text-xs" :class="[borderClass, textClass]">
              午休
            </view>
            <!-- 分割线：晚上 -->
            <view v-if="si === eveningDividerIndex" class="h-8 flex items-center justify-center border-y text-xs" :class="[borderClass, textClass]">
              晚上
            </view>
          </template>
        </view>
      </view>
    </view>

    <!-- 只读查看弹窗：仅关闭，无提交按钮 -->
    <wd-popup v-model="viewerVisible" position="bottom" :mask-closable="true">
      <view class="p-4" :class="cardClass">
        <view class="mb-2 text-base font-semibold" :class="titleClass">
          {{ viewerTitle }}
        </view>
        <view class="text-xs" :class="textClass">
          时间：{{ splitTime(slots[viewerSlotIndex].time).start }} - {{ splitTime(slots[viewerSlotIndex].time).end }}
        </view>
        <view class="mt-3">
          <view v-if="viewerWeeks.length > 0" class="flex flex-wrap gap-2">
            <view v-for="w in viewerWeeks" :key="w" class="rounded-full px-2 py-0.5 text-11px" :class="isDark ? 'bg-sky-900/40 text-sky-300' : 'bg-sky-100 text-sky-700'">
              第{{ w }}周
            </view>
          </view>
          <view v-else class="text-sm" :class="textClass">
            当前为空闲，无课程安排
          </view>
        </view>
        <view class="mt-4 flex justify-end">
          <wd-button type="primary" size="small" @click="closeView">关闭</wd-button>
        </view>
      </view>
    </wd-popup>
  
  </view>
</template>

<style scoped>
/* 课程表样式细节（使用原子类为主） */
:deep(.wd-checkbox__btn-check),
:deep(.wd-checkbox__check) {
  display: none !important;
}
:deep(.wd-checkbox.is-checked .wd-checkbox__label) {
  color: #fff;
}
</style>

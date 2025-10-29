<script setup lang="ts">
import { computed, defineEmits, ref } from 'vue'
import { getClass } from '@/api/bpm'
import { getEduTermSimpleList } from '@/api/edu'
import { useAppStore } from '@/store/app'

interface Props {
  processDefinitionId: string
  processKey: string
  readonly?: boolean
  businessKey?: string // 审批详情回显时传入业务主键
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  businessKey: '',
})

const emit = defineEmits<{
  'form-data-change': [formData: Record<string, any>]
  'approval-update': [shouldUpdate: boolean]
}>()

// 表单与校验
const form = ref()
const rules = {
  termId: [{ required: true, message: '请选择学期' }],
}

// 主题
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const titleClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-500'))
const cardClass = computed(() => (isDark.value ? 'bg-gray-800' : 'bg-white'))
const borderClass = computed(() => (isDark.value ? 'border-gray-700' : 'border-gray-200'))

// 选项与课表结构
// 学期选项（动态加载自后端）
const semesterOptions = ref<Array<{ value: string, label: string }>>([])
const weeksOptions = Array.from({ length: 20 }, (_, i) => i + 1)
const days = ['周一', '周二', '周三', '周四', '周五']
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

// 表单数据
const formData = ref({
  termId: '' as string,
})

// 课程表数据：key = `${dayIndex}-${slotIndex}` -> weeks[]
const tableData = ref<Record<string, number[]>>({})
const editor = ref({ visible: false, dayIndex: 0, slotIndex: 0 })
// 只读预览弹窗
const viewerVisible = ref(false)
const viewerDayIndex = ref(0)
const viewerSlotIndex = ref(0)
const viewerWeeks = computed<number[]>(() => {
  const key = getKey(viewerDayIndex.value, viewerSlotIndex.value)
  return tableData.value[key] || []
})
const viewerTitle = computed(() => {
  const slot = slots[viewerSlotIndex.value]
  return `${days[viewerDayIndex.value]} · ${slot.label}`
})
// 底部弹窗的周次临时选中（与 timetable 保持一致，使用数字数组）
const tempWeeks = ref<number[]>([])
function getKey(dayIndex: number, slotIndex: number) {
  return `${dayIndex}-${slotIndex}`
}

// 解析节次数字（与 timetable 保持一致）
function getPeriodNumber(label: string) {
  const m = label.match(/\d+/)
  return m ? Number(m[0]) : label
}

// 拆分上课/下课时间（与 timetable 保持一致）
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

function openEdit(dayIndex: number, slotIndex: number) {
  // 审批回显只读模式下不可编辑
  if (props.readonly)
    return
  const key = getKey(dayIndex, slotIndex)
  tempWeeks.value = [...(tableData.value[key] || [])]
  editor.value.dayIndex = dayIndex
  editor.value.slotIndex = slotIndex
  editor.value.visible = true
}

function openView(dayIndex: number, slotIndex: number) {
  viewerDayIndex.value = dayIndex
  viewerSlotIndex.value = slotIndex
  viewerVisible.value = true
}

function closeView() {
  viewerVisible.value = false
}

function handleCellTap(dayIndex: number, slotIndex: number) {
  if (props.readonly) {
    openView(dayIndex, slotIndex)
  }
  else {
    openEdit(dayIndex, slotIndex)
  }
}

function closeEdit() {
  editor.value.visible = false
}

function saveEdit() {
  const key = getKey(editor.value.dayIndex, editor.value.slotIndex)
  tableData.value[key] = [...tempWeeks.value]
  editor.value.visible = false
  emitFormDataChange()
}

function getCellClass(dayIndex: number, slotIndex: number) {
  const key = getKey(dayIndex, slotIndex)
  const has = (tableData.value[key] || []).length > 0
  const base = isDark.value ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'
  const withShadow = isDark.value ? 'bg-gray-800 text-gray-200 shadow-sm' : 'bg-white text-gray-700 shadow-sm'
  return has ? withShadow : base
}

function hasCourse(dayIndex: number, slotIndex: number) {
  const key = getKey(dayIndex, slotIndex)
  return (tableData.value[key] || []).length > 0
}

function getCellCount(dayIndex: number, slotIndex: number) {
  const key = getKey(dayIndex, slotIndex)
  return (tableData.value[key] || []).length
}

function emitFormDataChange() {
  const schedule: Record<string, Record<string, number[]>> = {}
  Object.entries(tableData.value)
    .filter(([, weeks]) => weeks && weeks.length > 0)
    .forEach(([key, weeks]) => {
      const [dayIndex, slotIndex] = key.split('-').map(n => Number(n))
      const dayKey = String(dayIndex + 1)
      const sectionKey = String(slotIndex + 1)
      if (!schedule[dayKey])
        schedule[dayKey] = {}
      schedule[dayKey][sectionKey] = weeks
    })
  emit('form-data-change', {
    termId: formData.value.termId,
    course: schedule,
  })
}

function triggerApprovalUpdate() {
  emitFormDataChange()
  emit('approval-update', true)
}

// 学期选择器确认事件（选中后触发审批更新）
function handleSemesterPickerConfirm(event: any) {
  triggerApprovalUpdate()
}

// 无业务数据初始化逻辑，组件内自采集

defineExpose({
  async validate() {
    const res = await form.value.validate()
    if (!res.valid)
      return false
    // 至少有一个课表项
    const hasAny = Object.values(tableData.value).some(arr => (arr || []).length > 0)
    if (!hasAny) {
      uni.showToast({ title: '请在课表中选择周次', icon: 'none' })
      return false
    }
    return true
  },
  getFormData() {
    const schedule: Record<string, Record<string, number[]>> = {}
    Object.entries(tableData.value)
      .filter(([, weeks]) => weeks && weeks.length > 0)
      .forEach(([key, weeks]) => {
        const [dayIndex, slotIndex] = key.split('-').map(n => Number(n))
        const dayKey = String(dayIndex + 1)
        const sectionKey = String(slotIndex + 1)
        if (!schedule[dayKey])
          schedule[dayKey] = {}
        schedule[dayKey][sectionKey] = weeks
      })
    return {
      termId: formData.value.termId,
      course: schedule,
    }
  },
})

// 加载学期列表（后端）
async function loadSemesters() {
  try {
    const list = (await getEduTermSimpleList()).data || []
    semesterOptions.value = (list || []).map((item: any) => ({
      label: item?.name ?? String(item?.id ?? ''),
      value: String(item?.id ?? ''),
    }))
  }
  catch (error) {
    semesterOptions.value = []
  }
}

// 审批详情回显：加载课程申报详情
async function loadClassData() {
  if (!props.businessKey)
    return
  const id = Number(props.businessKey)
  if (!id || Number.isNaN(id))
    return
  try {
    uni.showLoading({ title: '加载数据...' })
    const response = await getClass(id)
    const classData = response.data
    // 学期赋值
    const termId = String(classData.termId ?? '')
    formData.value.termId = termId

    // 解析课程信息（JSON）
    let parsed: any = {}
    try {
      parsed = typeof classData.course === 'string'
        ? JSON.parse(classData.course as any)
        : (classData.course || {})
    }
    catch (e) {
      parsed = {}
    }

    // 映射到内部 tableData 结构：key = `${dayIndex}-${slotIndex}` -> weeks[]
    const nextTable: Record<string, number[]> = {}
    Object.entries(parsed || {}).forEach(([dayKey, sections]: any) => {
      Object.entries(sections || {}).forEach(([sectionKey, weeks]: any) => {
        const dayIndex = Number(dayKey) - 1
        const slotIndex = Number(sectionKey) - 1
        const key = getKey(dayIndex, slotIndex)
        nextTable[key] = Array.isArray(weeks) ? weeks.map((n: any) => Number(n)) : []
      })
    })
    tableData.value = nextTable
  }
  catch (error) {
    console.error('加载课表申报详情失败:', error)
    uni.showToast({ title: '加载详情失败', icon: 'none' })
  }
  finally {
    uni.hideLoading()
  }
}

// 初始化组件
onMounted(async () => {
  await loadSemesters()
  // 如果是审批详情页，通过 businessKey 回显表单
  await loadClassData()
  // 发送初始表单数据（即使是空数据）
  triggerApprovalUpdate()
  console.log('课表申报组件初始化完成，发送初始表单数据')
})
</script>

<template>
  <view>
    <wd-form ref="form" :model="formData" :rules="rules">
      <!-- 学期选择（暂用本地假数据作为下拉） -->
      <wd-cell title-width="80px" title="学期" required vertical>
        <wd-picker
          v-model="formData.termId"
          placeholder="请选择学期"
          :disabled="props.readonly"
          :columns="semesterOptions"
          @confirm="handleSemesterPickerConfirm"
        />
      </wd-cell>

      <!-- 课表编辑：样式与 timetable 保持一致，上下结构 -->
      <wd-cell title-width="80px" title="课表" vertical>
        <view class="overflow-hidden border rounded-xl shadow-sm" :class="[cardClass, borderClass]">
          <!-- 表头：时间 + 5天 -->
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
                <!-- 单元格（上下结构：顶部标签 + 下方说明） -->
                <view
                  v-for="(d, di) in days"
                  :key="di"
                  class="relative h-16 overflow-hidden px-2 py-2 transition-all active:scale-98"
                  :style="(si === lunchDividerIndex || si === eveningDividerIndex) ? 'border-top: 1px solid #E5E7EB; border-left: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB;' : 'border-top: 1px solid #E5E7EB; border-left: 1px solid #E5E7EB;'"
                  :class="[{ [isDark ? 'bg-sky-900/30' : 'bg-sky-50']: hasCourse(di, si) }, getCellClass(di, si)]"
                  @tap="handleCellTap(di, si)"
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
                晚间
              </view>
            </template>
          </view>
        </view>
      </wd-cell>
    </wd-form>

    <!-- 周次编辑弹窗（与 timetable 风格一致） -->
    <wd-popup v-model="editor.visible" position="bottom" :safe-area-inset-bottom="true">
      <view class="max-h-80vh flex flex-col rounded-t-4" :class="cardClass">
        <!-- 头部 -->
        <view class="flex items-center justify-between border-b px-5 py-4" :class="borderClass">
          <view class="text-lg font-semibold" :class="titleClass">
            选择周次
          </view>
          <wd-button type="text" @click="closeEdit">
            取消
          </wd-button>
        </view>
        <!-- 周次选择 -->
        <view class="px-5 py-4">
          <view class="mb-2 text-xs" :class="textClass">
            选择有课的周次（1-20周）
          </view>
          <wd-checkbox-group v-model="tempWeeks" shape="button" checked-color="#4D7FFF">
            <view class="grid grid-cols-4 gap-2">
              <wd-checkbox v-for="w in weeksOptions" :key="w" :model-value="w" class="w-full text-center">
                第{{ w }}周
              </wd-checkbox>
            </view>
          </wd-checkbox-group>
        </view>
        <!-- 底部确认 -->
        <view class="border-t px-5 py-4" :class="borderClass">
          <wd-button type="primary" block @click="saveEdit">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 只读预览弹窗：显示已选周次，仅关闭 -->
    <wd-popup v-model="viewerVisible" position="bottom" :mask-closable="true" :safe-area-inset-bottom="true">
      <view class="max-h-80vh flex flex-col rounded-t-4" :class="cardClass">
        <!-- 头部 -->
        <view class="flex items-center justify-between border-b px-5 py-4" :class="borderClass">
          <view class="text-lg font-semibold" :class="titleClass">
            已选周次预览
          </view>
          <wd-button type="text" @click="closeView">
            关闭
          </wd-button>
        </view>
        <!-- 预览内容 -->
        <view class="px-5 py-4">
          <view class="mb-2 text-xs" :class="textClass">
            {{ viewerTitle }}
          </view>
          <view v-if="viewerWeeks.length > 0" class="flex flex-wrap gap-2">
            <view v-for="w in viewerWeeks" :key="w" class="rounded-full px-2 py-0.5 text-11px" :class="isDark ? 'bg-sky-900/40 text-sky-300' : 'bg-sky-100 text-sky-700'">
              第{{ w }}周
            </view>
          </view>
          <view v-else class="text-sm" :class="textClass">
            当前为空闲，无课程安排
          </view>
        </view>
        <!-- 底部仅关闭，无编辑按钮 -->
        <view class="border-t px-5 py-4" :class="borderClass">
          <wd-button type="primary" block @click="closeView">
            关闭
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<style scoped>
/* 使用与 timetable 相同的样式细节 */
:deep(.wd-checkbox__btn-check),
:deep(.wd-checkbox__check) {
  display: none !important;
}
:deep(.wd-checkbox.is-checked .wd-checkbox__label) {
  color: #fff;
}
</style>

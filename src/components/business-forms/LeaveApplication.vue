<script setup lang="ts">
import { computed, defineEmits, ref, watch } from 'vue'
import { getLeave } from '@/api/bpm'
import { getDictDataListByType } from '@/api/dict'
import { uploadFile } from '@/api/user'
import { useAppStore } from '@/store/app'
import { DictTypeEnum } from '@/utils/dictTypes'

// 组件属性
interface Props {
  processDefinitionId: string
  processKey: string
  businessKey?: string // 业务主键，用于获取具体的请假申请数据
  readonly?: boolean
  initialData?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  businessKey: '',
  readonly: false,
  initialData: () => ({}),
})

// 组件事件
const emit = defineEmits<{
  'form-data-change': [formData: Record<string, any>]
  'approval-update': [shouldUpdate: boolean] // 新增：通知父组件是否需要更新审批步骤
}>()

const form = ref()

// 表单验证规则
const rules = {
  type: [
    { required: true, message: '请选择请假类型' },
  ],
  startTime: [
    { required: true, message: '请选择开始时间' },
  ],
  endTime: [
    { required: true, message: '请选择结束时间' },
  ],
  reason: [
    { required: true, message: '请输入请假原因' },
    { required: true, min: 5, message: '请假原因至少5个字符' },
  ],
}

// 响应式数据
const defaultValue = ref<number>(new Date(new Date().setHours(0, 0, 0, 0)).getTime())

// 表单数据
const formData = ref({
  type: '',
  startTime: '',
  endTime: '',
  reason: '',
  day: 0,
  attachments: [] as string[], // 只保存文件链接
})

// 图片上传相关状态
const uploadingImages = ref<Array<{ id: string, progress: number }>>([])

// 请假类型数据
const leaveTypeColumns = ref<Array<{ label: string, value: string, id: number }>>([])
// 选择器显示状态
const showLeaveTypePicker = ref(false)
// 当前选中的请假类型索引
const selectedLeaveTypeIndex = ref<string>('')
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)

// 主题与样式（暗色模式适配）
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const uploadBoxClass = computed(() => (isDark.value ? 'border-white/10 bg-white/6' : 'border-gray-200 bg-gray-50'))
const uploadTextClass = computed(() => (isDark.value ? 'text-gray-300' : 'text-gray-500'))
const addButtonBoxClass = computed(() => (isDark.value ? 'border-white/20 bg-white/4' : 'border-gray-200 bg-gray-50'))
const addButtonPlusTextClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-300'))
const addButtonHintClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-gray-400'))
const tipTextClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-gray-400'))

// 计算请假天数
const leaveDays = computed(() => {
  if (!formData.value.startTime || !formData.value.endTime)
    return 0
  console.log('开始时间', formData.value.startTime, '结束时间', formData.value.endTime)
  const start = new Date(Number(formData.value.startTime))
  const end = new Date(Number(formData.value.endTime))
  const diffTime = Math.abs(end.getTime() - start.getTime())
  console.log(diffTime)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
})

// 发送表单数据变化（仅发送数据，不触发审批更新）
function emitFormDataChange() {
  const formDataToEmit = {
    type: formData.value.type,
    day: leaveDays.value,
    startTime: formData.value.startTime,
    endTime: formData.value.endTime,
    reason: formData.value.reason,
    attachments: formData.value.attachments,
  }

  // 只发送表单数据，不触发审批更新
  emit('form-data-change', formDataToEmit)
}

// 触发审批步骤更新（当关键字段变化时主动调用）
async function triggerApprovalUpdate() {
  // 先发送最新的表单数据
  await emitFormDataChange()

  emit('approval-update', true)
}

// 监听表单数据变化，但只发送数据不触发审批更新
watch(
  () => [formData.value, leaveDays.value],
  () => {
    emitFormDataChange()
  },
  { deep: true },
)

// 初始化组件
onMounted(async () => {
  // 加载请假类型字典
  await loadLeaveTypes()

  // 如果有businessKey，则获取具体的请假申请数据
  if (props.businessKey) {
    await loadLeaveData()
  }

  // 发送初始表单数据（即使是空数据）
  triggerApprovalUpdate()
  console.log('请假申请组件初始化完成，发送初始表单数据')
})

// 加载请假类型字典
async function loadLeaveTypes() {
  try {
    const response = await getDictDataListByType(DictTypeEnum.BPM_OA_LEAVE_TYPE)
    if (response.data) {
      leaveTypeColumns.value = response.data.map(item => ({
        label: item.label,
        value: item.value,
        id: item.id,
      }))
    }
  }
  catch (error) {
    console.error('加载请假类型失败:', error)
    uni.showToast({ title: '加载请假类型失败', icon: 'none' })
  }
}

// 加载具体的请假申请数据
async function loadLeaveData() {
  if (!props.businessKey)
    return

  try {
    const leaveId = Number(props.businessKey)
    if (Number.isNaN(leaveId)) {
      console.error('无效的businessKey:', props.businessKey)
      return
    }
    uni.showLoading({ title: '正在加载数据...' })

    const response = await getLeave(leaveId)
    const leaveData = response.data // 注意：response是包装类型，实际数据在data.data中

    // 填充表单数据
    formData.value.type = String(leaveData.type || '')
    formData.value.reason = leaveData.reason || ''
    selectedLeaveTypeIndex.value = String(leaveData.type || '')

    // 处理时间格式，将日期字符串转为时间戳
    if (leaveData.startTime) {
      formData.value.startTime = leaveData.startTime
    }
    if (leaveData.endTime) {
      formData.value.endTime = leaveData.endTime
    }

    // 填充附件数据
    if (Array.isArray(leaveData.attachments)) {
      formData.value.attachments = leaveData.attachments
    }
    uni.hideLoading()

    console.log('加载请假申请数据成功:', formData.value)
  }
  catch (error) {
    console.error('加载请假申请数据失败:', error)
    uni.showToast({ title: '加载请假申请数据失败', icon: 'none' })
  }
}

// 请假类型确认时触发更新
function handleLeaveTypeConfirm(value: any) {
  console.log('选择器确认事件:', value)
  const selectItem = value.selectedItems
  const { value: selectValue } = selectItem
  selectedLeaveTypeIndex.value = selectValue
  formData.value.type = selectValue
  showLeaveTypePicker.value = false
  triggerApprovalUpdate()
}

// 开始日期确认时触发更新
function handleStartDateConfirm(value: any) {
  try {
    // 处理时间戳转换为日期格式
    const timestamp = value.value // 获取时间戳
    if (!timestamp)
      return

    formData.value.startTime = String(timestamp)
    showStartDatePicker.value = false

    // 开始时间选择后立即触发审批更新
    triggerApprovalUpdate()
  }
  catch (error) {
    console.error('处理开始日期时出错:', error)
    uni.showToast({ title: '日期处理失败，请重试', icon: 'none' })
  }
}

// 结束日期确认时触发更新
function handleEndDateConfirm(value: any) {
  try {
    // 处理时间戳转换为日期格式
    const timestamp = value.value // 获取时间戳
    if (!timestamp)
      return

    formData.value.endTime = String(timestamp)
    showEndDatePicker.value = false

    // 结束时间选择后立即触发审批更新
    triggerApprovalUpdate()
  }
  catch (error) {
    console.error('处理结束日期时出错:', error)
    uni.showToast({ title: '日期处理失败，请重试', icon: 'none' })
  }
}

// 图片选择和上传
function handleSelectImage() {
  if (formData.value.attachments.length >= 9) {
    uni.showToast({ title: '最多只能上传9张图片', icon: 'none' })
    return
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const tempFilePath = res.tempFilePaths[0]
        uploadImage(tempFilePath)
      }
    },
    fail: (err) => {
      console.error('选择图片失败:', err)
      uni.showToast({ title: '选择图片失败', icon: 'none' })
    },
  })
}

// 上传图片
async function uploadImage(filePath: string) {
  if (!filePath) {
    uni.showToast({ title: '文件路径无效', icon: 'none' })
    return
  }

  // 生成临时ID用于跟踪上传进度
  const tempId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 添加到上传中列表
  uploadingImages.value.push({ id: tempId, progress: 0 })

  try {
    // 使用通用文件上传接口
    const fileUrl = await uploadFile(filePath)

    // 成功后更新附件列表
    formData.value.attachments.push(fileUrl)
    uni.showToast({ title: '上传成功', icon: 'success' })

    // 移除上传中状态
    const index = uploadingImages.value.findIndex(item => item.id === tempId)
    if (index > -1) {
      uploadingImages.value.splice(index, 1)
    }

    triggerApprovalUpdate()
  }
  catch (error) {
    console.error('上传图片失败:', error)
    uni.showToast({ title: '上传图片失败', icon: 'none' })
    // 移除上传中状态
    const index = uploadingImages.value.findIndex(item => item.id === tempId)
    if (index > -1) {
      uploadingImages.value.splice(index, 1)
    }
  }
}

// 删除附件
function handleDeleteAttachment(index: number) {
  if (index >= 0 && index < formData.value.attachments.length) {
    formData.value.attachments.splice(index, 1)
    uni.showToast({ title: '删除成功', icon: 'success' })
  }
  triggerApprovalUpdate()
}

// 预览图片
function handlePreviewImage(url: string, index: number) {
  uni.previewImage({
    urls: formData.value.attachments,
    current: index,
  })
}

// 暴露表单验证和提交方法供父组件调用
defineExpose({
  async validate() {
    if (uploadingImages.value.length > 0) {
      // 这里仍然需要弹窗提示，因为这不是表单字段验证
      uni.showToast({ title: '请等待图片上传完成', icon: 'none' })
      return false
    }

    const res = await form.value.validate()
    if (!res.valid) {
      return false
    }
    return true
  },

  getFormData() {
    return {
      startTime: formData.value.startTime,
      endTime: formData.value.endTime,
      day: leaveDays.value,
      type: Number(formData.value.type),
      reason: formData.value.reason.trim(),
      attachments: formData.value.attachments,
    }
  },
})
</script>

<template>
  <view class="leave-application">
    <!-- 表单内容 -->
    <view>
      <wd-form ref="form" :model="formData" :rules="rules">
        <!-- 请假类型 -->
        <wd-cell title-width="80px" title="请假类型" required center>
          <wd-picker
            v-model="selectedLeaveTypeIndex"
            v-model:visible="showLeaveTypePicker"
            :columns="leaveTypeColumns"
            placeholder="请选择请假类型"
            prop="type"
            :readonly="props.readonly"
            @confirm="handleLeaveTypeConfirm"
            @cancel="showLeaveTypePicker = false"
          />
        </wd-cell>

        <!-- 开始时间 -->
        <wd-cell title-width="80px" title="开始时间" required center>
          <wd-datetime-picker
            v-model="formData.startTime"
            :default-value="defaultValue"
            type="date"
            placeholder="请选择开始时间"
            prop="startTime"
            :readonly="props.readonly"
            @confirm="handleStartDateConfirm"
          />
        </wd-cell>

        <!-- 结束时间 -->
        <wd-cell title-width="80px" title="结束时间" required center>
          <wd-datetime-picker
            v-model="formData.endTime"
            :default-value="defaultValue"
            type="date"
            placeholder="请选择结束时间"
            prop="endTime"
            :readonly="props.readonly"
            @confirm="handleEndDateConfirm"
          />
        </wd-cell>

        <!-- 请假天数 -->
        <wd-cell title-width="80px" title="请假天数" center>
          <text>
            {{ leaveDays }}天
          </text>
        </wd-cell>

        <!-- 请假原因 -->
        <wd-cell title-width="80px" title="请假原因" vertical required center>
          <wd-textarea
            v-model="formData.reason"
            placeholder="请详细说明请假原因..."
            :maxlength="200"
            show-word-limit
            :rows="4"
            prop="reason"
            :readonly="props.readonly"
            @blur="triggerApprovalUpdate"
          />
        </wd-cell>

        <!-- 附件上传 -->
        <wd-cell title-width="80px" title="附件上传" vertical center>
          <!-- 图片列表 -->
          <view>
            <!-- 已上传的图片 -->
            <view
              v-for="(imageUrl, index) in formData.attachments"
              :key="index"
              style="display: inline-block; position: relative; width: 100px; height: 100px; margin: 5px;"
            >
              <image
                :src="imageUrl"
                style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;"
                mode="aspectFill"
                @click="handlePreviewImage(imageUrl, index)"
              />
              <!-- 删除按钮 -->
              <view
                v-if="!props.readonly"
                style="position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;"
                class="bg-red-500"
                @click="handleDeleteAttachment(index)"
              >
                <text class="text-xs text-white">
                  ×
                </text>
              </view>
            </view>

            <!-- 上传中的图片 -->
            <view
              v-for="uploadItem in uploadingImages"
              :key="uploadItem.id"
              style="display: inline-block; position: relative; width: 100px; height: 100px; margin: 5px;"
            >
              <view style="width: 100%; height: 100%; border-radius: 8px; display: flex; align-items: center; justify-content: center;" class="border" :class="uploadBoxClass">
                <text class="text-xs" :class="uploadTextClass">
                  上传中...
                </text>
              </view>
              <!-- 上传进度遮罩 -->
              <view style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 8px; display: flex; align-items: center; justify-content: center;" class="bg-black/50">
                <text class="text-xs text-white">
                  {{ uploadItem.progress }}%
                </text>
              </view>
            </view>

            <!-- 添加图片按钮 -->
            <view
              v-if="!props.readonly && formData.attachments.length + uploadingImages.length < 9"
              style="display: inline-block; width: 100px; height: 100px; margin: 5px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column;"
              class="border-2 border-dashed"
              :class="addButtonBoxClass"
              @click="handleSelectImage"
            >
              <text class="text-2xl" :class="addButtonPlusTextClass">
                +
              </text>
              <text class="mt-1 text-xs" :class="addButtonHintClass">
                添加图片
              </text>
            </view>
          </view>

          <text class="mt-2 block text-xs" :class="tipTextClass">
            最多上传9张图片！
          </text>
        </wd-cell>
      </wd-form>
    </view>
  </view>
</template>

<style scoped>
/* 使用组件库默认样式 */
</style>

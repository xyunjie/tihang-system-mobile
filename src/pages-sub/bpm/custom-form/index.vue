<route lang="json">
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "自定义表单"
  }
}
</route>

<script setup lang="ts">
import type { ActivityNode, ApprovalDetailRespVO, BpmCustomFormCreateReqVO, FormField, GetApprovalDetailReqVO, ProcessDefinitionRespVO } from '@/api/types/bpm'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { createCustomFormProcess, getApprovalDetail, getProcessDefinitionDetail } from '@/api/bpm'
import ApprovalSteps from '@/components/ApprovalSteps.vue'
import DynamicFormField from '@/components/DynamicFormField.vue'
import ThemeCard from '@/components/ThemeCard.vue'
import { WECHAT_SHARE_IMAGE_URL } from '@/config/share'
import { useAppStore } from '@/store/app'

const form = ref()
// 页面参数
const processInfo = ref<{
  processDefinitionId: string
  processKey: string
}>({
  processDefinitionId: '',
  processKey: '',
})

const processDetail = ref<ProcessDefinitionRespVO>()

// 表单数据
const formData = ref<Record<string, any>>({})

// 表单字段配置
const formFields = ref<FormField[]>([])

// 审批流程
const approvalSteps = ref<Array<{
  name: string
  description: string
  candidateUsers: Array<{
    id: number
    nickname: string
    avatar: string
  }>
  status: 'finished' | 'process' | 'error'
}>>([])

// 审批节点（提供给 ApprovalSteps 组件使用）
const approvalActivityNodes = ref<ActivityNode[]>([])

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 主题状态管理与深色模式样式
const appStore = useAppStore()
const isDark = computed(() => appStore?.theme === 'dark')

const emptyCardMainTextClass = computed(() => (
  isDark.value ? 'mb-2 text-lg text-gray-200 font-medium' : 'mb-2 text-lg text-gray-600 font-medium'
))

const emptyCardSubTextClass = computed(() => (
  isDark.value ? 'text-sm text-gray-400' : 'text-sm text-gray-400'
))

const bottomBarClass = computed(() => [
  'fixed bottom-0 left-0 right-0 border-t px-4 py-3 backdrop-blur-sm rounded-t-lg',
  isDark.value
    ? 'border-gray-700 bg-gray-800/70'
    : 'border-gray-200 bg-white/70',
])

// 页面加载
onLoad((options) => {
  processInfo.value.processDefinitionId = options.processDefinitionId || ''
  processInfo.value.processKey = options.processKey || ''

  // 加载流程定义详情
  loadApprovalDetail()
  getProcessDefinition()

  // 开启分享菜单（好友消息与朋友圈）
  try {
    uni.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    })
  }
  catch (e) {
    console.warn('开启分享菜单失败：', e)
  }
})

// 分享给好友
onShareAppMessage(() => {
  const title = processDetail.value?.name

  const imageUrl = processDetail.value?.icon || WECHAT_SHARE_IMAGE_URL

  const queryParams: string[] = []
  if (processInfo.value.processDefinitionId)
    queryParams.push(`processDefinitionId=${encodeURIComponent(processInfo.value.processDefinitionId)}`)
  if (processInfo.value.processKey)
    queryParams.push(`processKey=${encodeURIComponent(processInfo.value.processKey)}`)
  const path = `/pages-sub/bpm/custom-form/index${queryParams.length ? `?${queryParams.join('&')}` : ''}`

  return {
    title,
    path,
    imageUrl,
  }
})

// 分享到朋友圈
onShareTimeline(() => {
  const title = processDetail.value?.name

  const imageUrl = processDetail.value?.icon || WECHAT_SHARE_IMAGE_URL

  const queryParams: string[] = []
  if (processInfo.value.processDefinitionId)
    queryParams.push(`processDefinitionId=${encodeURIComponent(processInfo.value.processDefinitionId)}`)
  if (processInfo.value.processKey)
    queryParams.push(`processKey=${encodeURIComponent(processInfo.value.processKey)}`)

  return {
    title,
    query: queryParams.join('&'),
    imageUrl,
  }
})

// 加载流程定义详情
async function loadApprovalDetail() {
  if (!processInfo.value.processDefinitionId)
    return

  loading.value = true
  try {
    const requestData: GetApprovalDetailReqVO = {
      processDefinitionId: processInfo.value.processDefinitionId,
      processVariablesStr: JSON.stringify(formData.value),
      activityId: 'StartUserNode', // 发起人节点
    }

    const response = await getApprovalDetail(requestData)
    if (response.data) {
      // 缓存原始节点供 ApprovalSteps 使用
      approvalActivityNodes.value = response.data.activityNodes || []
      // 更新审批步骤信息
      updateApprovalSteps(response.data)
    }
  }
  catch (error) {
    console.error('加载流程定义详情失败:', error)
    uni.showToast({ title: '加载流程信息失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

async function getProcessDefinition() {
  if (!processInfo.value.processDefinitionId)
    return

  try {
    const response = await getProcessDefinitionDetail({
      id: processInfo.value.processDefinitionId,
    })
    if (response.data) {
      processDetail.value = response.data
      // 设置标题为name
      uni.setNavigationBarTitle({ title: response.data.name || '自定义表单' })
      formFields.value = (response.data.formFields || []).map((field) => {
        try {
          // 尝试解析JSON字符串为对象
          return typeof field === 'string' ? JSON.parse(field) : field
        }
        catch (e) {
          console.error('解析表单字段失败:', e)
          return field
        }
      })
    }
  }
  catch (error) {
    console.error('加载流程定义失败:', error)
    uni.showToast({ title: '加载流程定义失败', icon: 'none' })
  }
}

// 更新审批步骤
function updateApprovalSteps(approvalDetail: ApprovalDetailRespVO) {
  if (approvalDetail.activityNodes && approvalDetail.activityNodes.length > 0) {
    approvalSteps.value = approvalDetail.activityNodes.map((node) => {
      let status: 'finished' | 'process' | 'error' = 'process'

      // 根据节点类型和状态设置步骤状态
      if (node.nodeType === 10) { // 发起人节点
        status = 'finished'
      }

      return {
        name: node.name + getApprovalMethodName(node.approveMethod),
        description: node.candidateUsers.length > 0
          ? `候选人：${node.candidateUsers.map(user => user.nickname).join('、')}`
          : '待分配',
        candidateUsers: node.candidateUsers,
        status,
      }
    })
  }
}

// 获取审批方式名称
function getApprovalMethodName(method: number | null) {
  switch (method) {
    case 1:
      return ' (顺序审批)'
    case 2:
      return ' (会签)'
    case 3:
      return ' (或签)'
    case 4:
      return ' (随机)'
    default:
      return ''
  }
}

// 提交表单
async function handleSubmit() {
  if (!form.value)
    return
  try {
    const result = await form.value.validate()
    if (result.valid === false) {
      return
    }
  }
  catch (e) {
    uni.showToast({ title: '请完善必填项', icon: 'none' })
    return
  }

  submitting.value = true
  uni.showLoading({ title: '正在提交...', mask: true })
  try {
    const submitData: BpmCustomFormCreateReqVO = {
      processDefinitionId: processInfo.value.processDefinitionId,
      variables: formData.value,
    }

    const response = await createCustomFormProcess(submitData)

    uni.showToast({ title: '提交成功', icon: 'success' })
    console.log('自定义表单流程创建成功，ID:', response.data)

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
  catch (error) {
    console.error('提交自定义表单失败:', error)
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  }
  finally {
    submitting.value = false
    uni.hideLoading()
  }
}

// 更新表单字段值
function updateFieldValue(fieldLabel: string, value: any) {
  console.log('更新字段值:', fieldLabel, value.value)
  if (formData.value[fieldLabel] === value.value)
    return
  formData.value[fieldLabel] = value.value
  console.log('保存的值', formData.value[fieldLabel])
  // 重新加载审批详情（如果表单数据影响审批流程）
  loadApprovalDetail()
}
</script>

<template>
  <view>
    <!-- 表单内容 -->
    <view class="px-4 py-3">
      <!-- 动态表单字段 -->
      <ThemeCard v-if="formFields.length > 0" card-class="mb-4 mt-2">
        <wd-form ref="form" :model="formData">
          <wd-cell-group title="表单信息">
            <DynamicFormField
              v-for="field in formFields"
              :key="field._fc_id"
              :field="field"
              :model-value="formData[field.field] ?? null"
              @update:model-value="updateFieldValue(field.field, $event)"
            />
          </wd-cell-group>
        </wd-form>
      </ThemeCard>

      <!-- 无表单字段提示 -->
      <ThemeCard v-else card-class="mb-6 text-center">
        <view class="mb-4 text-6xl">
          📝
        </view>
        <view :class="emptyCardMainTextClass">
          暂无表单字段
        </view>
        <view :class="emptyCardSubTextClass">
          请配置表单字段后再使用
        </view>
      </ThemeCard>

      <!-- 审批流程（统一使用 ApprovalSteps 组件，并传入已缓存的节点数据） -->
      <ThemeCard v-if="processInfo.processDefinitionId">
        <ApprovalSteps
          :process-definition-id="processInfo.processDefinitionId"
          :process-variables="formData"
          :activity-nodes="approvalActivityNodes"
          activity-id="StartUserNode"
        />
      </ThemeCard>
    </view>

    <!-- 底部按钮 -->
    <view :class="bottomBarClass" style="z-index: 2;">
      <wd-button
        type="primary"
        block
        size="large"
        class="rounded-lg"
        :disabled="formFields.length === 0 || submitting"
        @click="handleSubmit"
      >
        提交申请
      </wd-button>
    </view>
  </view>
</template>

<style scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>

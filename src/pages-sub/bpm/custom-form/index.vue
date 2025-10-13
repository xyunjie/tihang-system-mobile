<route lang="json">
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "自定义表单"
  }
}
</route>

<script setup lang="ts">
import type { ApprovalDetailRespVO, BpmCustomFormCreateReqVO, FormField, GetApprovalDetailReqVO } from '@/api/types/bpm'
import { ref } from 'vue'
import { createCustomFormProcess, getApprovalDetail, getProcessDefinitionDetail } from '@/api/bpm'
import DynamicFormField from '@/components/DynamicFormField.vue'

const form = ref()
// 页面参数
const processInfo = ref<{
  processDefinitionId: string
  processKey: string
}>({
  processDefinitionId: '',
  processKey: '',
})

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

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 页面加载
onLoad((options) => {
  processInfo.value.processDefinitionId = options.processDefinitionId || ''
  processInfo.value.processKey = options.processKey || ''

  // 加载流程定义详情
  loadApprovalDetail()
  getProcessDefinition()
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
  await form.value.validate()
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
  <view class="min-h-screen bg-gray-50 pb-5">
    <!-- 表单内容 -->
    <view class="px-4 py-3">
      <!-- 动态表单字段 -->
      <view v-if="formFields.length > 0" class="mb-6">
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
      </view>

      <!-- 无表单字段提示 -->
      <view v-else class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <view class="p-6 text-center">
          <view class="mb-4 text-6xl">
            📝
          </view>
          <view class="mb-2 text-lg text-gray-600 font-medium">
            暂无表单字段
          </view>
          <view class="text-sm text-gray-400">
            请配置表单字段后再使用
          </view>
        </view>
      </view>

      <!-- 审批流程 -->
      <view v-if="approvalSteps.length > 0">
        <wd-divider>审批流程</wd-divider>
        <wd-cell
          vertical
          class="mt-4 border-b border-gray-100 last:border-b-0"
        >
          <view class="py-2">
            <wd-steps :active="0" vertical>
              <wd-step
                v-for="(step, index) in approvalSteps"
                :key="index"
                :title="step.name"
              >
                <template #description>
                  <view class="flex flex-wrap gap-2">
                    <view v-for="user in step.candidateUsers" :key="user.id" class="flex items-center">
                      <template v-if="user.avatar">
                        <image :src="user.avatar" class="h-6 w-6 rounded-full" />
                      </template>
                      <template v-else>
                        <view class="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-sm text-white">
                          {{ user.nickname.charAt(0) }}
                        </view>
                      </template>
                      <text class="ml-2">
                        {{ user.nickname }}
                      </text>
                    </view>
                  </view>
                </template>
              </wd-step>
            </wd-steps>
          </view>
        </wd-cell>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-3" style="z-index: 2;">
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

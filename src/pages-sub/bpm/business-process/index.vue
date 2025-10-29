<route lang="json">
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "业务申请"
  }
}
</route>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getProcessDefinitionList } from '@/api/bpm'
import ApprovalSteps from '@/components/ApprovalSteps.vue'
import CourseScheduleApplication from '@/components/business-forms/CourseScheduleApplication.vue'
import LeaveApplication from '@/components/business-forms/LeaveApplication.vue'
import ThemeCard from '@/components/ThemeCard.vue'
import { submitBusinessForm } from '@/pages-sub/utils/businessApiConfig'
import { getBusinessTitle } from '@/pages-sub/utils/businessComponentConfig'
import { useAppStore } from '@/store/app'

// 主题状态管理
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

const errorPageTextClass = computed(() => [
  'mt-4 text-lg font-semibold',
  isDark.value ? 'text-gray-100' : 'text-gray-800',
])

const errorPageSubTextClass = computed(() => [
  'mt-2 text-sm',
  isDark.value ? 'text-gray-400' : 'text-gray-500',
])

const bottomBarClass = computed(() => [
  'fixed bottom-0 left-0 right-0 border-t px-4 py-3 backdrop-blur-sm rounded-t-lg',
  isDark.value
    ? 'border-gray-700 bg-gray-800/70'
    : 'border-gray-200 bg-white/70',
])

// 页面参数
const processDefinitionId = ref<string>('')
const processKey = ref<string>('')
const loading = ref(true)

// 业务组件实例引用
const businessFormRef = ref<any>(null)

// 审批步骤组件引用
const approvalStepsRef = ref<any>(null)

// 审批流程变量
const processVariables = ref<Record<string, any>>({})

// 提交状态
const submitting = ref(false)

// 是否支持当前业务类型
const isSupportedBusinessType = ref(false)

// 页面加载
onLoad((options) => {
  processDefinitionId.value = options.processDefinitionId || ''
  processKey.value = options.processKey || ''

  // 设置导航栏标题
  setNavigationTitle()

  // 检查业务类型支持
  checkBusinessTypeSupport()

  // 若无流程定义ID但有key，尝试根据key自动匹配流程定义
  if (!processDefinitionId.value && processKey.value) {
    tryAutoResolveProcessDefinitionId()
  }
})

// 设置导航栏标题
function setNavigationTitle() {
  const title = getBusinessTitle(processKey.value)
  uni.setNavigationBarTitle({ title })
}

// 检查业务类型支持
function checkBusinessTypeSupport() {
  loading.value = true

  try {
    // 检查是否支持当前业务类型
    const supportedTypes = ['oa_leave', 'oa_class'] // 扩展支持

    if (supportedTypes.includes(processKey.value)) {
      isSupportedBusinessType.value = true
      console.log(`业务类型支持: ${processKey.value}`)
    }
    else {
      isSupportedBusinessType.value = false
      console.warn(`不支持的业务类型: ${processKey.value}`)
      uni.showToast({
        title: `暂不支持 ${processKey.value} 业务类型`,
        icon: 'none',
        duration: 3000,
      })
    }
  }
  catch (error) {
    console.error('检查业务类型失败:', error)
    isSupportedBusinessType.value = false
    uni.showToast({
      title: '加载业务组件失败',
      icon: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

// 根据 processKey 自动匹配流程定义ID
async function tryAutoResolveProcessDefinitionId() {
  try {
    const listResp = await getProcessDefinitionList()
    const defs = listResp?.data || []
    const matched = defs.find((d: any) => d?.key === processKey.value)
    if (matched?.id) {
      processDefinitionId.value = matched.id
      console.log('匹配到流程定义ID:', matched.id)
    }
  }
  catch (e) {
    console.warn('根据key匹配流程定义ID失败:', e)
  }
}

// 处理表单提交
async function handleSubmit() {
  console.log('处理表单提交')
  if (!businessFormRef.value) {
    uni.showToast({ title: '业务组件未加载', icon: 'error' })
    return
  }

  // 验证表单
  const isValid = await businessFormRef.value.validate()
  console.log('表单数据验证结果:', isValid)
  if (!isValid) {
    return
  }
  console.log('表单数据验证成功')

  // 获取表单数据
  const formData = businessFormRef.value.getFormData()
  if (!formData) {
    uni.showToast({ title: '获取表单数据失败', icon: 'error' })
    return
  }
  console.log('表单数据:', formData)

  submitting.value = true
  uni.showLoading({ title: '提交中...' })

  try {
    console.log('提交业务表单数据:', formData)
    // 使用统一的业务表单提交处理
    const response = await submitBusinessForm(processKey.value, formData)
    console.log('业务表单提交结果:', response)
    uni.hideLoading()
    uni.showToast({ title: '提交成功', icon: 'success' })
    console.log('业务申请提交成功，ID:', response.data.data)

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
  catch (error) {
    uni.hideLoading()
    console.log('业务申请提交失败:', error)
    uni.showToast({ title: '提交失败，请重试', icon: 'error' })
  }
  finally {
    submitting.value = false
  }
}

// 处理表单数据变化（用于更新审批流程变量）
function handleFormDataChange(formData: Record<string, any>) {
  processVariables.value = formData
}

// 处理审批更新通知（仅在业务组件通知时才更新）
function handleApprovalUpdate(shouldUpdate: boolean) {
  if (shouldUpdate && approvalStepsRef.value) {
    approvalStepsRef.value.loadApprovalDetail()
  }
}

// 返回上一页
function handleGoBack() {
  uni.navigateBack()
}
</script>

<template>
  <view>
    <!-- 加载状态 -->
    <view v-if="loading" class="min-h-screen flex items-center justify-center">
      <wd-loading />
    </view>

    <!-- 不支持的业务类型 -->
    <view v-else-if="!isSupportedBusinessType" class="min-h-screen flex flex-col items-center justify-center px-4">
      <ThemeCard card-class="text-center w-full max-w-140">
        <text class="text-6xl">
          ❌
        </text>
        <view :class="errorPageTextClass">
          暂不支持此业务类型
        </view>
        <view :class="errorPageSubTextClass">
          业务类型：{{ processKey }}
        </view>
        <wd-button type="primary" class="mt-6" @click="handleGoBack">
          返回上一页
        </wd-button>
      </ThemeCard>
    </view>

    <!-- 业务表单内容 -->
    <view v-else class="px-4 pb-20 space-y-4">
      <!-- 根据processKey静态渲染对应的业务组件 -->

      <!-- 请假申请组件 -->
      <ThemeCard card-class="mx-4 mt-4">
        <LeaveApplication
          v-if="processKey === 'oa_leave'"
          ref="businessFormRef"
          :process-definition-id="processDefinitionId"
          :process-key="processKey"
          @form-data-change="handleFormDataChange"
          @approval-update="handleApprovalUpdate"
        />
        <CourseScheduleApplication
          v-else-if="processKey === 'oa_class'"
          ref="businessFormRef"
          :process-definition-id="processDefinitionId"
          :process-key="processKey"
          @form-data-change="handleFormDataChange"
          @approval-update="handleApprovalUpdate"
        />
      </ThemeCard>

      <!-- 审批流程组件（统一在这里显示） -->
      <ThemeCard card-class="mx-4 mt-4">
        <ApprovalSteps
          v-if="processDefinitionId"
          ref="approvalStepsRef"
          :process-definition-id="processDefinitionId"
          :process-variables="processVariables"
          activity-id="StartUserNode"
        />
      </ThemeCard>

      <!-- 底部提交按钮区域（统一在这里显示） -->
      <view :class="bottomBarClass" style="z-index: 2;">
        <wd-button
          type="primary"
          block
          size="large"
          class="rounded-lg"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交申请
        </wd-button>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 自定义样式 */
</style>

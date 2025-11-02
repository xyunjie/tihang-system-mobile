<route lang="json">
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "流程详情"
  }
}
</route>

<script setup lang="ts">
import type { ApprovalDetailRespVO, BpmTaskApproveReqVO, BpmTaskCopyReqVO, BpmTaskDelegateReqVO, BpmTaskRejectReqVO, BpmTaskRespVO, BpmTaskReturnReqVO, BpmTaskSignCreateReqVO, BpmTaskTransferReqVO, FormField, GetApprovalDetailReqVO, GetTaskListByReturnReqVO } from '@/api/types/bpm'
import type { UserSimpleRespVO } from '@/api/types/user'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { approveTask, copyTask, createSignTask, delegateTask, getApprovalDetail, getTaskListByReturn, rejectTask, returnTask, transferTask } from '@/api/bpm'
import { getSimpleUserList } from '@/api/user'
import ApprovalSteps from '@/components/ApprovalSteps.vue'
import LeaveApplication from '@/components/business-forms/LeaveApplication.vue'
import DynamicFormField from '@/components/DynamicFormField.vue'
import ThemeCard from '@/components/ThemeCard.vue'
import { WECHAT_SHARE_IMAGE_URL } from '@/config/share'
import { useAppStore } from '@/store/app'
import { formatStandardDateTime } from '@/utils'

// 页面参数
const taskId = ref('')
const processInstanceId = ref('')
const activityId = ref('')

// 响应式数据
const approvalDetail = ref<ApprovalDetailRespVO | null>(null)
const loading = ref(false)
const moreActionsCollapse = ref<string[]>([])
const approvalComment = ref('')

// 委派、转办、抄送和加签共用数据
const showUserSelectDialog = ref(false)
const userSelectType = ref<'delegate' | 'transfer' | 'copy' | 'sign'>('delegate')
const operationReason = ref('')
const selectedUser = ref<UserSimpleRespVO | null>(null)
const selectedUsers = ref<UserSimpleRespVO[]>([])
const userList = ref<UserSimpleRespVO[]>([])
const loadingUsers = ref(false)
const searchKeyword = ref('')

// 加签类型
const signType = ref<'before' | 'after'>('before')

// 退回相关数据
const showReturnDialog = ref(false)
const returnNodeList = ref<BpmTaskRespVO[]>([])
const loadingReturnNodes = ref(false)
const selectedReturnNode = ref<BpmTaskRespVO | null>(null)
const returnReason = ref('')

// 主题与样式（暗色模式适配）
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const overlayBgClass = computed(() => (isDark.value ? 'bg-[#0f172a]' : 'bg-white'))
const borderBaseClass = computed(() => (isDark.value ? 'border-white/10' : 'border-gray-100'))

// 页面加载
onLoad((options) => {
  taskId.value = options.taskId || ''
  processInstanceId.value = options.processInstanceId || ''
  activityId.value = options.activityId || ''
  loadApprovalDetail()
})
// 分享给好友
onShareAppMessage(() => {
  const processName = approvalDetail.value?.processInstance?.name || ''
  const imageUrl = WECHAT_SHARE_IMAGE_URL

  const queryParams: string[] = []
  if (processInstanceId.value)
    queryParams.push(`processInstanceId=${encodeURIComponent(processInstanceId.value)}`)
  if (taskId.value)
    queryParams.push(`taskId=${encodeURIComponent(taskId.value)}`)
  if (activityId.value)
    queryParams.push(`activityId=${encodeURIComponent(activityId.value)}`)
  const path = `/pages-sub/bpm/approval/index${queryParams.length ? `?${queryParams.join('&')}` : ''}`

  return {
    title: processName,
    path,
    imageUrl,
  }
})

// 分享到朋友圈
onShareTimeline(() => {
  const processName = approvalDetail.value?.processInstance?.name || ''
  console.log('processName', processName)
  const imageUrl = WECHAT_SHARE_IMAGE_URL

  const queryParams: string[] = []
  if (processInstanceId.value)
    queryParams.push(`processInstanceId=${encodeURIComponent(processInstanceId.value)}`)
  if (taskId.value)
    queryParams.push(`taskId=${encodeURIComponent(taskId.value)}`)
  if (activityId.value)
    queryParams.push(`activityId=${encodeURIComponent(activityId.value)}`)

  return {
    title: processName,
    query: queryParams.join('&'),
    imageUrl,
  }
})

// 获取流程详情
async function loadApprovalDetail() {
  if (!taskId.value && !processInstanceId.value)
    return

  loading.value = true
  try {
    const params: GetApprovalDetailReqVO = {
      taskId: taskId.value,
      processInstanceId: processInstanceId.value,
      activityId: activityId.value,
    }

    const result = await getApprovalDetail(params)
    approvalDetail.value = (result as any).data || result
  }
  catch (error) {
    console.error('获取流程详情失败:', error)
    uni.showToast({
      title: '获取流程详情失败',
      icon: 'none',
    })
  }
  finally {
    loading.value = false
  }
}

// 加载用户列表
async function loadUserList() {
  if (userList.value.length > 0)
    return // 已加载过了

  loadingUsers.value = true
  try {
    const result = await getSimpleUserList()
    userList.value = result || []
  }
  catch (error) {
    console.error('获取用户列表失败:', error)
    uni.showToast({
      title: '获取用户列表失败',
      icon: 'none',
    })
  }
  finally {
    loadingUsers.value = false
  }
}

// 获取业务表单类型
const businessFormType = computed(() => {
  if (!approvalDetail.value?.processDefinition?.key)
    return ''
  return approvalDetail.value.processDefinition.key
})

// 获取表单字段
const formFields = computed(() => {
  // 优先从 todoTask.formFields 获取
  const fields = approvalDetail.value?.processDefinition?.formFields

  if (!fields || !Array.isArray(fields)) {
    return []
  }

  return fields.map((field: any) => {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field)
      }
      catch {
        return field
      }
    }
    return field
  })
})

// 获取表单数据
const formData = computed(() => {
  // 优先从 todoTask.formVariables 获取
  const variables = approvalDetail.value?.processInstance?.formVariables

  return variables || {}
})

// 获取字段值
function getFieldValue(field: FormField) {
  const fieldName = field.field
  return formData.value[fieldName] || null
}

// 判断当前用户是否为审批人
const isCurrentUserAssignee = computed(() => {
  // 如果没有 taskId，说明不是待办任务，不展示操作按钮
  if (!taskId.value) {
    return false
  }

  // 获取当前登录用户信息
  const systemUserInfo = uni.getStorageSync('systemUserInfo')
  if (!systemUserInfo || !approvalDetail.value?.todoTask?.assigneeUser) {
    return false
  }

  // 比较当前用户ID和审批人ID
  return systemUserInfo.id === approvalDetail.value.todoTask.assigneeUser.id
})

// 过滤用户列表
const filteredUserList = computed(() => {
  if (!searchKeyword.value.trim()) {
    return userList.value
  }

  const keyword = searchKeyword.value.toLowerCase()
  return userList.value.filter(user =>
    user.nickname?.toLowerCase().includes(keyword)
    || user.deptName?.toLowerCase().includes(keyword),
  )
})

// 转办用户列表筛选
const filteredTransferUserList = computed(() => {
  if (!searchKeyword.value.trim()) {
    return userList.value
  }

  const keyword = searchKeyword.value.toLowerCase()
  return userList.value.filter(user =>
    user.nickname?.toLowerCase().includes(keyword)
    || user.deptName?.toLowerCase().includes(keyword),
  )
})

// 获取操作类型的中文描述
const operationText = computed(() => {
  switch (userSelectType.value) {
    case 'delegate': return '委派'
    case 'transfer': return '转办'
    case 'copy': return '抄送'
    case 'sign': return '加签'
    default: return '操作'
  }
})

// 是否为多选模式
const isMultiSelect = computed(() => {
  return userSelectType.value === 'copy' || userSelectType.value === 'sign'
})

// 操作按钮处理
async function handleDelegate() {
  if (!taskId.value) {
    uni.showToast({
      title: '任务ID不能为空',
      icon: 'none',
    })
    return
  }

  // 加载用户列表
  await loadUserList()

  // 设置为委派模式并显示对话框
  userSelectType.value = 'delegate'
  showUserSelectDialog.value = true
}

async function handleTransfer() {
  if (!taskId.value) {
    uni.showToast({
      title: '任务ID不能为空',
      icon: 'none',
    })
    return
  }

  // 加载用户列表
  await loadUserList()

  // 设置为转办模式并显示对话框
  userSelectType.value = 'transfer'
  showUserSelectDialog.value = true
}

// 统一的操作确认处理
async function handleOperationConfirm() {
  // 验证用户选择
  if (isMultiSelect.value) {
    if (selectedUsers.value.length === 0) {
      uni.showToast({
        title: `请选择${operationText.value}人`,
        icon: 'none',
      })
      return
    }
  }
  else {
    if (!selectedUser.value) {
      uni.showToast({
        title: `请选择${operationText.value}人`,
        icon: 'none',
      })
      return
    }
  }

  // 验证原因（抄送可选）
  if (userSelectType.value !== 'copy' && (!operationReason.value || operationReason.value.trim() === '')) {
    uni.showToast({
      title: `请填写${operationText.value}原因`,
      icon: 'none',
    })
    return
  }

  try {
    // 显示加载提示
    uni.showLoading({
      title: `${operationText.value}中...`,
      mask: true,
    })

    let result
    if (userSelectType.value === 'delegate') {
      // 构造委派数据
      const delegateData: BpmTaskDelegateReqVO = {
        id: taskId.value,
        delegateUserId: selectedUser.value!.id,
        reason: operationReason.value.trim(),
      }
      result = await delegateTask(delegateData)
    }
    else if (userSelectType.value === 'transfer') {
      // 构造转办数据
      const transferData: BpmTaskTransferReqVO = {
        id: taskId.value,
        assigneeUserId: selectedUser.value!.id,
        reason: operationReason.value.trim(),
      }
      result = await transferTask(transferData)
    }
    else if (userSelectType.value === 'copy') {
      // 构造抄送数据
      const copyData: BpmTaskCopyReqVO = {
        id: taskId.value,
        copyUserIds: selectedUsers.value.map(user => user.id),
        reason: operationReason.value.trim() || undefined,
      }
      result = await copyTask(copyData)
    }
    else {
      // 构造加签数据
      const signData: BpmTaskSignCreateReqVO = {
        id: taskId.value,
        userIds: selectedUsers.value.map(user => user.id),
        type: signType.value,
        reason: operationReason.value.trim(),
      }
      result = await createSignTask(signData)
    }

    uni.hideLoading()

    // 检查结果
    const data = (result as any).data || result
    if (data === true || data?.data === true) {
      uni.showToast({
        title: `${operationText.value}成功`,
        icon: 'success',
      })

      // 关闭对话框并清空数据
      handleOperationCancel()

      // 延迟返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
    else {
      throw new Error(`${operationText.value}失败`)
    }
  }
  catch (error) {
    uni.hideLoading()
    console.error(`${operationText.value}失败:`, error)
    uni.showToast({
      title: error?.message || `${operationText.value}失败，请重试`,
      icon: 'none',
      duration: 2000,
    })
  }
}

// 统一的取消操作
function handleOperationCancel() {
  showUserSelectDialog.value = false
  selectedUser.value = null
  selectedUsers.value = []
  operationReason.value = ''
  searchKeyword.value = ''
}

// 选择用户
function handleSelectUser(user: UserSimpleRespVO) {
  if (isMultiSelect.value) {
    // 多选模式（抄送）
    const index = selectedUsers.value.findIndex(u => u.id === user.id)
    if (index > -1) {
      selectedUsers.value.splice(index, 1)
    }
    else {
      selectedUsers.value.push(user)
    }
  }
  else {
    // 单选模式（委派、转办）
    selectedUser.value = user
  }
}

// 检查用户是否被选中
function isUserSelected(user: UserSimpleRespVO): boolean {
  if (isMultiSelect.value) {
    return selectedUsers.value.some(u => u.id === user.id)
  }
  else {
    return selectedUser.value?.id === user.id
  }
}

// 移除已选中的用户
function removeSelectedUser(user: UserSimpleRespVO) {
  if (isMultiSelect.value) {
    const index = selectedUsers.value.findIndex(u => u.id === user.id)
    if (index > -1) {
      selectedUsers.value.splice(index, 1)
    }
  }
  else {
    selectedUser.value = null
  }
}

async function handleApprove() {
  if (!taskId.value) {
    uni.showToast({
      title: '任务ID不能为空',
      icon: 'none',
    })
    return
  }

  try {
    // 显示确认对话框
    const modalResult = await uni.showModal({
      title: '确认操作',
      content: '确定要通过此任务吗？',
      confirmText: '确定',
      cancelText: '取消',
    })

    if (!modalResult.confirm) {
      return
    }

    // 显示加载提示
    uni.showLoading({
      title: '审批中...',
      mask: true,
    })

    // 构造审批数据
    const approveData: BpmTaskApproveReqVO = {
      id: taskId.value,
      reason: approvalComment.value || undefined,
      variables: formData.value || {},
    }

    // 调用审批接口
    const result = await approveTask(approveData)

    uni.hideLoading()

    // 检查结果
    const data = (result as any).data || result
    if (data === true || data?.data === true) {
      uni.showToast({
        title: '审批通过成功',
        icon: 'success',
      })

      // 延迟返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
    else {
      throw new Error('审批失败')
    }
  }
  catch (error) {
    uni.hideLoading()
    console.error('审批通过失败:', error)
    uni.showToast({
      title: error?.message || '审批失败，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
}

async function handleReject() {
  if (!taskId.value) {
    uni.showToast({
      title: '任务ID不能为空',
      icon: 'none',
    })
    return
  }

  // 检查审批意见是否为空（拒绝时必须填写意见）
  if (!approvalComment.value || approvalComment.value.trim() === '') {
    uni.showToast({
      title: '拒绝时必须填写审批意见',
      icon: 'none',
      duration: 2000,
    })
    return
  }

  try {
    // 显示确认对话框
    const modalResult = await uni.showModal({
      title: '确认操作',
      content: '确定要拒绝此任务吗？拒绝后流程将结束。',
      confirmText: '确定拒绝',
      cancelText: '取消',
    })

    if (!modalResult.confirm) {
      return
    }

    // 显示加载提示
    uni.showLoading({
      title: '审批中...',
      mask: true,
    })

    // 构造拒绝数据
    const rejectData: BpmTaskRejectReqVO = {
      id: taskId.value,
      reason: approvalComment.value.trim(),
    }

    // 调用拒绝接口
    const result = await rejectTask(rejectData)

    uni.hideLoading()

    // 检查结果
    const data = (result as any).data || result
    if (data === true || data?.data === true) {
      uni.showToast({
        title: '审批拒绝成功',
        icon: 'success',
      })

      // 延迟返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
    else {
      throw new Error('拒绝失败')
    }
  }
  catch (error) {
    uni.hideLoading()
    console.error('审批拒绝失败:', error)
    uni.showToast({
      title: error?.message || '拒绝失败，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
}

function handleCopy() {
  if (!taskId.value) {
    uni.showToast({
      title: '任务ID不能为空',
      icon: 'none',
    })
    return
  }

  // 加载用户列表
  loadUserList()

  // 设置为抄送模式并显示对话框
  userSelectType.value = 'copy'
  showUserSelectDialog.value = true
}

async function handleAddSign() {
  if (!taskId.value) {
    uni.showToast({
      title: '任务ID不能为空',
      icon: 'none',
    })
    return
  }

  // 加载用户列表
  await loadUserList()

  // 设置为加签模式并显示对话框
  userSelectType.value = 'sign'
  signType.value = 'before' // 默认为前加签
  showUserSelectDialog.value = true
}

async function handleReturn() {
  if (!taskId.value || !processInstanceId.value) {
    uni.showToast({
      title: '任务ID或流程实例 ID不能为空',
      icon: 'none',
    })
    return
  }

  try {
    // 显示加载提示
    uni.showLoading({
      title: '加载可退回节点...',
      mask: true,
    })

    loadingReturnNodes.value = true

    // 构造请求参数
    const params: GetTaskListByReturnReqVO = {
      id: taskId.value,
    }

    // 调用接口获取可退回节点
    const result = await getTaskListByReturn(params)
    const data = (result as any).data || result

    uni.hideLoading()

    if (Array.isArray(data) && data.length > 0) {
      returnNodeList.value = data
      showReturnDialog.value = true
    }
    else {
      uni.showToast({
        title: '当前没有可退回的节点',
        icon: 'none',
      })
    }
  }
  catch (error) {
    uni.hideLoading()
    console.error('获取可退回节点失败:', error)
    uni.showToast({
      title: '获取可退回节点失败',
      icon: 'none',
    })
  }
  finally {
    loadingReturnNodes.value = false
  }
}

function getStatusImage() {
  switch (approvalDetail.value?.processInstance?.status) {
    case 1:
      return 'https://file.tihangstudio.cn/image/bpm-running.svg'
    case 2:
      return 'https://file.tihangstudio.cn/image/bpm-approve.svg'
    case 3:
      return 'https://file.tihangstudio.cn/image/bpm-reject.svg'
    case 4:
      return 'https://file.tihangstudio.cn/image/bpm-cancel.svg'
    default:
      return ''
  }
}

// 选择退回节点
function handleSelectReturnNode(node: BpmTaskRespVO) {
  selectedReturnNode.value = node
}

// 取消退回
function handleReturnCancel() {
  showReturnDialog.value = false
  selectedReturnNode.value = null
  returnReason.value = ''
  returnNodeList.value = []
}

// 确认退回
async function handleReturnConfirm() {
  if (!selectedReturnNode.value) {
    uni.showToast({
      title: '请选择退回节点',
      icon: 'none',
    })
    return
  }

  if (!returnReason.value || returnReason.value.trim() === '') {
    uni.showToast({
      title: '请填写退回原因',
      icon: 'none',
    })
    return
  }

  try {
    // 显示加载提示
    uni.showLoading({
      title: '正在退回...',
      mask: true,
    })

    // 构造退回请求参数
    const returnData: BpmTaskReturnReqVO = {
      id: taskId.value,
      targetTaskDefinitionKey: selectedReturnNode.value.taskDefinitionKey,
      reason: returnReason.value.trim(),
    }

    // 调用退回接口
    const result = await returnTask(returnData)

    uni.hideLoading()

    // 检查返回结果
    const data = (result as any).data !== undefined ? (result as any).data : result
    if (data === true || (typeof data === 'object' && data.data === true)) {
      uni.showToast({
        title: '退回成功',
        icon: 'success',
      })

      // 关闭对话框
      handleReturnCancel()

      // 刷新页面数据
      setTimeout(() => {
        loadApprovalDetail()
      }, 1500)
    }
    else {
      uni.showToast({
        title: '退回失败',
        icon: 'none',
      })
    }
  }
  catch (error) {
    uni.hideLoading()
    console.error('退回任务失败:', error)
    uni.showToast({
      title: '退回失败，请重试',
      icon: 'none',
    })
  }
}
</script>

<template>
  <view class="min-h-screen">
    <!-- 加载状态 -->
    <view v-if="loading">
      <wd-skeleton theme="paragraph" />
    </view>

    <!-- 主要内容 -->
    <view v-else class="pb-2">
      <!-- 流程信息 -->
      <ThemeCard card-class="mx-4 mt-4" padding="p-2">
        <view class="relative border-b p-4" :class="borderBaseClass">
          <!-- 右上角状态图标 -->
          <view class="absolute right-4 top-1">
            <image
              :src="getStatusImage()"
              class="h-24 w-24"
              mode="aspectFit"
            />
          </view>

          <view class="mb-2 pr-12 text-lg font-semibold" :class="isDark ? 'text-gray-100' : 'text-gray-800'">
            {{ approvalDetail?.processInstance?.name || '流程办理' }}
          </view>
          <view class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            编号: {{ approvalDetail?.processInstance?.id }}
          </view>
        </view>
      </ThemeCard>

      <!-- 自定义表单字段（对齐 business-process 的卡片样式） -->
      <ThemeCard card-class="mx-4 mt-4">
        <wd-cell-group title="表单信息">
          <LeaveApplication
            v-if="businessFormType === 'oa_leave'"
            :process-definition-id="approvalDetail?.processDefinition?.id || ''"
            :process-key="businessFormType"
            :business-key="approvalDetail?.processInstance?.businessKey"
            :readonly="true"
          />
          <CourseScheduleApplication
            v-else-if="businessFormType === 'oa_class'"
            :process-definition-id="approvalDetail?.processDefinition?.id || ''"
            :process-key="businessFormType"
            :business-key="approvalDetail?.processInstance?.businessKey"
            :readonly="true"
          />
          <DynamicFormField
            v-for="field in formFields"
            v-else-if="formFields.length > 0"
            :key="field._fc_id || field.field"
            :field="field"
            :model-value="getFieldValue(field)"
            readonly
          />
          <view v-else class="p-6 text-center">
            <view class="mb-4 text-6xl">
              📝
            </view>
            <view class="mb-2 text-lg text-gray-600 font-medium">
              暂无表单字段
            </view>
            <view class="text-sm text-gray-400">
              该流程无需填写表单
            </view>
          </view>
        </wd-cell-group>
      </ThemeCard>

      <!-- 审批流程（对齐 business-process 的卡片样式） -->
      <ThemeCard v-if="approvalDetail?.processDefinition?.id || (approvalDetail?.activityNodes && approvalDetail.activityNodes.length > 0)" card-class="mx-4 mt-4">
        <ApprovalSteps
          :process-definition-id="approvalDetail?.processDefinition?.id"
          :process-instance-id="processInstanceId"
          :process-variables="formData"
          :activity-id="activityId || 'StartUserNode'"
          :with-variables="false"
          :activity-nodes="approvalDetail?.activityNodes"
        />
      </ThemeCard>
    </view>

    <!-- 底部操作区域 -->
    <ThemeCard v-if="approvalDetail?.status === 1 && isCurrentUserAssignee" card-class="mx-4 mt-4" padding="p-1">
      <!-- 审批意见输入区域 -->
      <view class="border-b px-4 pb-3 pt-4" :class="borderBaseClass">
        <view class="mb-3 flex items-center">
          <wd-icon name="edit-outline" class="mr-2 text-blue-500" size="16px" />
          <text class="text-sm font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            审批意见
          </text>
          <text class="ml-1 text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            （选填）
          </text>
        </view>
        <wd-textarea
          v-model="approvalComment"
          placeholder="请输入您的审批意见..."
          :maxlength="200"
          :show-word-limit="true"
          :auto-height="true"
          :min-height="60"
          class="rounded-1 focus:border-blue-500 focus:bg-transparent" :class="[isDark ? 'border-white/12 bg-white/6 text-gray-100 placeholder:text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-500']"
        />
      </view>

      <!-- 操作按钮区域 -->
      <view class="px-4 pb-4 pt-3">
        <!-- 主要操作按钮 -->

        <view class="mb-3 flex justify-center gap-3">
          <wd-button
            type="success"
            size="large"
            class="h-12 flex-1 rounded-4 border-none from-green-500 to-green-600 bg-gradient-to-br text-white font-semibold shadow-green-500/30 shadow-lg transition-all duration-300 active:scale-98 active:shadow-md"
            @click="handleApprove"
          >
            <wd-icon name="check-circle" class="mr-2" size="18px" />
            <text class="font-medium">
              通过
            </text>
          </wd-button>
          <wd-button
            type="error"
            size="large"
            class="h-12 flex-1 rounded-4 border-none from-red-500 to-red-600 bg-gradient-to-br text-white font-semibold shadow-lg shadow-red-500/30 transition-all duration-300 active:scale-98 active:shadow-md"
            @click="handleReject"
          >
            <wd-icon name="close-circle" class="mr-2" size="18px" />
            <text class="font-medium">
              拒绝
            </text>
          </wd-button>
        </view>

        <!-- 更多操作折叠面板 -->
        <view class="mt-4">
          <wd-collapse v-model="moreActionsCollapse" class="overflow-hidden rounded-3 shadow-sm" :class="isDark ? 'bg-white/6' : 'bg-gray-50'">
            <wd-collapse-item name="moreActions">
              <template #title="{ expanded }">
                <view
                  class="flex items-center justify-center border-1 rounded-3 px-4 py-3 transition-all duration-300"
                  :class="[isDark ? 'border-white/10' : 'border-gray-200', expanded ? (isDark ? 'bg-blue-500/10 border-blue-400/40 rounded-b-0' : 'bg-blue-50 border-blue-200 rounded-b-0') : '']"
                >
                  <wd-icon
                    name="more-2"
                    class="mr-2 transition-all duration-300"
                    :class="[isDark ? 'text-gray-400' : 'text-gray-500', { 'text-blue-500 rotate-90': expanded }]"
                    size="16px"
                  />
                  <text
                    class="text-sm font-medium transition-colors duration-300"
                    :class="expanded ? (isDark ? 'text-blue-400' : 'text-blue-500') : (isDark ? 'text-gray-300' : 'text-gray-600')"
                  >
                    {{ expanded ? '收起更多操作' : '更多操作' }}
                  </text>
                  <wd-icon
                    :name="expanded ? 'arrow-up' : 'arrow-down'"
                    class="ml-auto transition-all duration-300"
                    :class="[isDark ? 'text-gray-500' : 'text-gray-400', expanded ? (isDark ? 'text-blue-400 rotate-180' : 'text-blue-500 rotate-180') : '']"
                    size="14px"
                  />
                </view>
              </template>

              <!-- 折叠面板内容 -->
              <view class="border-1 border-t-0 rounded-b-3 p-4" :class="[isDark ? 'border-white/10 bg-white/6' : 'border-blue-200 bg-white']">
                <view class="flex flex-col gap-3">
                  <!-- 第一行：转办、委派 -->
                  <view class="flex gap-3">
                    <wd-button
                      type="info"
                      size="medium"
                      class="h-11 flex-1 rounded-3 border-none from-blue-500 to-blue-600 bg-gradient-to-br text-white font-medium shadow-blue-500/20 shadow-md transition-all duration-300 active:scale-98"
                      @click="handleTransfer"
                    >
                      <wd-icon name="share" class="mr-1" size="16px" />
                      <text>转办</text>
                    </wd-button>
                    <wd-button
                      type="info"
                      size="medium"
                      class="h-11 flex-1 rounded-3 border-none from-purple-500 to-purple-600 bg-gradient-to-br text-white font-medium shadow-md shadow-purple-500/20 transition-all duration-300 active:scale-98"
                      @click="handleDelegate"
                    >
                      <wd-icon name="user-add" class="mr-1" size="16px" />
                      <text>委派</text>
                    </wd-button>
                  </view>

                  <!-- 第二行：抄送、加签 -->
                  <view class="flex gap-3">
                    <wd-button
                      type="info"
                      size="medium"
                      class="h-11 flex-1 rounded-3 border-none from-cyan-500 to-cyan-600 bg-gradient-to-br text-white font-medium shadow-cyan-500/20 shadow-md transition-all duration-300 active:scale-98"
                      @click="handleCopy"
                    >
                      <wd-icon name="copy" class="mr-1" size="16px" />
                      <text>抄送</text>
                    </wd-button>
                    <wd-button
                      type="info"
                      size="medium"
                      class="h-11 flex-1 rounded-3 border-none from-emerald-500 to-emerald-600 bg-gradient-to-br text-white font-medium shadow-emerald-500/20 shadow-md transition-all duration-300 active:scale-98"
                      @click="handleAddSign"
                    >
                      <wd-icon name="add" class="mr-1" size="16px" />
                      <text>加签</text>
                    </wd-button>
                  </view>

                  <!-- 第三行：退回、取消 -->
                  <view class="flex gap-3">
                    <wd-button
                      type="warning"
                      size="medium"
                      class="h-11 flex-1 rounded-3 border-none from-orange-500 to-orange-600 bg-gradient-to-br text-white font-medium shadow-md shadow-orange-500/20 transition-all duration-300 active:scale-98"
                      @click="handleReturn"
                    >
                      <wd-icon name="back" class="mr-1" size="16px" />
                      <text>退回</text>
                    </wd-button>
                  </view>
                </view>
              </view>
            </wd-collapse-item>
          </wd-collapse>
        </view>
      </view>
    </ThemeCard>

    <!-- 用户选择对话框（委派和转办共用） -->
    <wd-popup
      v-model="showUserSelectDialog"
      position="bottom"
      :lock-scroll="true"
      :close-on-click-modal="false"
      custom-style="border-radius: 20px 20px 0 0; max-height: 90vh; min-height: 60vh;"
    >
      <view class="h-full flex flex-col" :class="overlayBgClass">
        <!-- 头部 -->
        <view class="flex-shrink-0 border-b px-5 py-4" :class="borderBaseClass">
          <view class="flex items-center justify-between">
            <view class="text-lg text-gray-800 font-semibold">
              {{ operationText }}任务
            </view>
            <wd-icon
              name="close"
              size="20px"
              class="cursor-pointer text-gray-400"
              @click="handleOperationCancel"
            />
          </view>
          <view class="mt-2 text-sm text-gray-500">
            将任务{{ operationText }}给其他用户处理
          </view>
        </view>

        <!-- 内容区域 -->
        <view class="flex-1 overflow-y-auto px-5 py-4">
          <!-- 操作原因 -->
          <view class="mb-6">
            <view class="mb-3 flex items-center">
              <wd-icon name="edit-outline" class="mr-2 text-blue-500" size="16px" />
              <text class="text-sm text-gray-700 font-medium">
                {{ operationText }}原因
              </text>
              <text v-if="userSelectType !== 'copy'" class="ml-1 text-xs text-red-500">
                *
              </text>
              <text v-else class="ml-1 text-xs text-gray-400">
                （选填）
              </text>
            </view>
            <wd-textarea
              v-model="operationReason"
              :placeholder="`请说明${operationText}的原因...`"
              :maxlength="200"
              :show-word-limit="true"
              :auto-height="true"
              :min-height="80"
              class="border-gray-200 rounded-3 bg-gray-50 focus:border-blue-500 focus:bg-white"
            />
          </view>

          <!-- 加签类型选择 -->
          <view v-if="userSelectType === 'sign'" class="mb-6">
            <view class="mb-3 flex items-center">
              <wd-icon name="arrow-right" class="mr-2 text-blue-500" size="16px" />
              <text class="text-sm text-gray-700 font-medium">
                加签类型
              </text>
              <text class="ml-1 text-xs text-red-500">
                *
              </text>
            </view>
            <view class="flex gap-3">
              <view
                class="flex-1 cursor-pointer border rounded-3 p-3 transition-colors"
                :class="{
                  'border-blue-500 bg-blue-50': signType === 'before',
                  'border-gray-200 bg-white': signType !== 'before',
                }"
                @click="signType = 'before'"
              >
                <view class="flex items-center">
                  <wd-icon
                    name="arrow-left"
                    class="mr-2"
                    :color="signType === 'before' ? '#4D7FFF' : '#9CA3AF'"
                    size="16px"
                  />
                  <view>
                    <view class="text-sm font-medium" :class="signType === 'before' ? 'text-blue-600' : 'text-gray-700'">
                      前加签
                    </view>
                    <view class="text-xs text-gray-500">
                      在当前节点之前加签
                    </view>
                  </view>
                </view>
              </view>
              <view
                class="flex-1 cursor-pointer border rounded-3 p-3 transition-colors"
                :class="{
                  'border-blue-500 bg-blue-50': signType === 'after',
                  'border-gray-200 bg-white': signType !== 'after',
                }"
                @click="signType = 'after'"
              >
                <view class="flex items-center">
                  <wd-icon
                    name="arrow-right"
                    class="mr-2"
                    :color="signType === 'after' ? '#4D7FFF' : '#9CA3AF'"
                    size="16px"
                  />
                  <view>
                    <view class="text-sm font-medium" :class="signType === 'after' ? 'text-blue-600' : 'text-gray-700'">
                      后加签
                    </view>
                    <view class="text-xs text-gray-500">
                      在当前节点之后加签
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 用户选择 -->
          <view class="mb-6">
            <view class="mb-3 flex items-center">
              <wd-icon name="user" class="mr-2 text-blue-500" size="16px" />
              <text class="text-sm text-gray-700 font-medium">
                选择{{ operationText }}人
              </text>
              <text class="ml-1 text-xs text-red-500">
                *
              </text>
            </view>

            <!-- 搜索框 -->
            <view class="mb-3">
              <wd-search
                v-model="searchKeyword"
                placeholder="搜索用户姓名或部门"
                :use-action-slot="false"
                bg="#f5f5f5"
              />
            </view>

            <!-- 已选中的用户 -->
            <!-- 单选模式 -->
            <view
              v-if="!isMultiSelect && selectedUser"
              class="mb-3 flex items-center border border-blue-200 rounded-3 bg-blue-50 p-3"
            >
              <view class="h-8 w-8 flex items-center justify-center rounded-full bg-blue-500 text-sm text-white font-medium">
                {{ selectedUser.nickname?.charAt(0) || '?' }}
              </view>
              <view class="ml-3 flex-1">
                <view class="text-sm text-gray-800 font-medium">
                  {{ selectedUser.nickname }}
                </view>
                <view v-if="selectedUser.deptName" class="text-xs text-gray-500">
                  {{ selectedUser.deptName }}
                </view>
              </view>
              <wd-icon
                name="close"
                size="16px"
                class="cursor-pointer text-gray-400"
                @click="selectedUser = null"
              />
            </view>

            <!-- 多选模式 -->
            <view v-if="isMultiSelect && selectedUsers.length > 0" class="mb-3">
              <view class="mb-2 text-sm text-gray-600 font-medium">
                已选中 {{ selectedUsers.length }} 人
              </view>
              <view class="flex flex-wrap gap-2">
                <view
                  v-for="user in selectedUsers"
                  :key="user.id"
                  class="flex items-center border border-blue-200 rounded-full bg-blue-50 px-3 py-1"
                >
                  <view class="h-6 w-6 flex items-center justify-center rounded-full bg-blue-500 text-xs text-white font-medium">
                    {{ user.nickname?.charAt(0) || '?' }}
                  </view>
                  <view class="ml-2 text-sm text-gray-800 font-medium">
                    {{ user.nickname }}
                  </view>
                  <wd-icon
                    name="close"
                    size="14px"
                    class="ml-2 cursor-pointer text-gray-400"
                    @click="removeSelectedUser(user)"
                  />
                </view>
              </view>
            </view>

            <!-- 用户列表 -->
            <view v-if="loadingUsers" class="py-8 text-center">
              <wd-loading />
              <view class="mt-2 text-sm text-gray-500">
                加载中...
              </view>
            </view>

            <view v-else-if="filteredUserList.length === 0" class="py-8 text-center">
              <view class="mb-2 text-lg text-gray-400">
                {{ searchKeyword.trim() ? '🔍' : '😔' }}
              </view>
              <view class="text-sm text-gray-500">
                {{ searchKeyword.trim() ? '没有找到相关用户' : '暂无可用用户' }}
              </view>
            </view>

            <view v-else class="min-h-48 overflow-y-auto space-y-2">
              <view
                v-for="user in filteredUserList"
                :key="user.id"
                class="flex cursor-pointer items-center border border-gray-200 rounded-3 p-3 transition-colors"
                :class="{
                  'border-blue-500 bg-blue-50': isUserSelected(user),
                  'hover:bg-gray-50': !isUserSelected(user),
                }"
                @click="handleSelectUser(user)"
              >
                <view class="h-8 w-8 flex items-center justify-center rounded-full bg-gray-500 text-sm text-white font-medium">
                  {{ user.nickname?.charAt(0) || '?' }}
                </view>
                <view class="ml-3 flex-1">
                  <view class="text-sm text-gray-800 font-medium">
                    {{ user.nickname }}
                  </view>
                  <view v-if="user.deptName" class="text-xs text-gray-500">
                    {{ user.deptName }}
                  </view>
                </view>
                <wd-icon
                  v-if="isUserSelected(user)"
                  name="check"
                  color="#4D7FFF"
                  size="16px"
                />
              </view>
            </view>
          </view>
        </view>

        <!-- 底部按钮 -->
        <view class="flex-shrink-0 border-t px-5 py-4" :class="[borderBaseClass, overlayBgClass]" style="position: sticky; bottom: 0; z-index: 10; box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);">
          <view class="flex justify-center gap-3">
            <wd-button
              size="large"
              custom-style="min-width: 120px;"
              @click="handleOperationCancel"
            >
              取消
            </wd-button>
            <wd-button
              type="primary"
              size="large"
              custom-style="min-width: 120px;"
              :disabled="(isMultiSelect ? selectedUsers.length === 0 : !selectedUser) || (userSelectType !== 'copy' && !operationReason.trim())"
              @click="handleOperationConfirm"
            >
              确定{{ operationText }}
            </wd-button>
          </view>
        </view>
      </view>
    </wd-popup>

    <!-- 退回节点选择对话框 -->
    <wd-popup
      v-model="showReturnDialog"
      position="bottom"
      :lock-scroll="true"
      :close-on-click-modal="false"
      custom-style="border-radius: 20px 20px 0 0; max-height: 85vh; min-height: 50vh;"
    >
      <view class="h-full flex flex-col" :class="overlayBgClass">
        <!-- 头部 -->
        <view class="flex-shrink-0 border-b px-5 py-4" :class="borderBaseClass">
          <view class="flex items-center justify-between">
            <view class="text-lg text-gray-800 font-semibold">
              选择退回节点
            </view>
            <wd-icon
              name="close"
              size="20px"
              class="cursor-pointer text-gray-400"
              @click="handleReturnCancel"
            />
          </view>
          <view class="mt-2 text-sm text-gray-500">
            选择要退回的节点
          </view>
        </view>

        <!-- 内容区域 -->
        <view class="flex-1 overflow-y-auto px-5 py-4">
          <!-- 退回原因 -->
          <view class="mb-6">
            <view class="mb-3 flex items-center">
              <wd-icon name="edit-outline" class="mr-2 text-orange-500" size="16px" />
              <text class="text-sm text-gray-700 font-medium">
                退回原因
              </text>
              <text class="ml-1 text-xs text-red-500">
                *
              </text>
            </view>
            <wd-textarea
              v-model="returnReason"
              placeholder="请说明退回的原因..."
              :maxlength="200"
              :show-word-limit="true"
              :auto-height="true"
              :min-height="80"
              class="border-gray-200 rounded-3 bg-gray-50 focus:border-orange-500 focus:bg-white"
            />
          </view>

          <!-- 节点选择 -->
          <view class="mb-6">
            <view class="mb-3 flex items-center">
              <wd-icon name="arrow-left" class="mr-2 text-orange-500" size="16px" />
              <text class="text-sm text-gray-700 font-medium">
                选择退回节点
              </text>
              <text class="ml-1 text-xs text-red-500">
                *
              </text>
            </view>

            <!-- 加载状态 -->
            <view v-if="loadingReturnNodes" class="py-8 text-center">
              <wd-loading />
              <view class="mt-2 text-sm text-gray-500">
                加载中...
              </view>
            </view>

            <!-- 空状态 -->
            <view v-else-if="returnNodeList.length === 0" class="py-8 text-center">
              <view class="mb-2 text-lg text-gray-400">
                😔
              </view>
              <view class="text-sm text-gray-500">
                暂无可退回节点
              </view>
            </view>

            <!-- 节点列表 -->
            <view v-else class="space-y-3">
              <view
                v-for="node in returnNodeList"
                :key="node.id"
                class="cursor-pointer border rounded-3 p-4 transition-colors"
                :class="{
                  'border-orange-500 bg-orange-50': selectedReturnNode?.id === node.id,
                  'border-gray-200 bg-white hover:bg-gray-50': selectedReturnNode?.id !== node.id,
                }"
                @click="handleSelectReturnNode(node)"
              >
                <view class="flex items-center justify-between">
                  <view class="flex-1">
                    <view class="text-sm text-gray-800 font-medium">
                      {{ node.name }}
                    </view>
                    <view v-if="node.assigneeUser" class="mt-1 text-xs text-gray-500">
                      处理人：{{ node.assigneeUser.nickname }}
                    </view>
                    <view v-if="node.createTime" class="mt-1 text-xs text-gray-400">
                      创建时间：{{ formatStandardDateTime(node.createTime) }}
                    </view>
                  </view>
                  <wd-icon
                    v-if="selectedReturnNode?.id === node.id"
                    name="check"
                    color="#FB923C"
                    size="16px"
                  />
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 底部按钮 -->
        <view class="flex-shrink-0 border-t px-5 py-4" :class="[borderBaseClass, overlayBgClass]" style="position: sticky; bottom: 0; z-index: 10; box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);">
          <view class="flex justify-center gap-3">
            <wd-button
              size="large"
              custom-style="min-width: 120px;"
              @click="handleReturnCancel"
            >
              取消
            </wd-button>
            <wd-button
              type="warning"
              size="large"
              custom-style="min-width: 120px;"
              :disabled="!selectedReturnNode || !returnReason.trim()"
              @click="handleReturnConfirm"
            >
              确定退回
            </wd-button>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<style scoped>
/* 折叠面板自定义样式 */
:deep(.wd-collapse-item__header) {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

:deep(.wd-collapse-item__content) {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}
</style>

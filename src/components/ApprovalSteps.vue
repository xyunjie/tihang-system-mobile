<script setup lang="ts">
import type { ActivityNode, ApprovalDetailRespVO, CandidateUserInfo, TaskInfo } from '@/api/types/bpm'
import { ref, watch } from 'vue'
import { getApprovalDetail } from '@/api/bpm'

// 组件属性
interface Props {
  processDefinitionId?: string
  processInstanceId?: string
  processVariables?: Record<string, any>
  activityId?: string
  withVariables?: boolean // 是否携带流程参数，默认true
  activityNodes?: ActivityNode[] // 外部传入的审批节点，如果传入则直接使用，不再调用接口
}

const props = withDefaults(defineProps<Props>(), {
  processVariables: () => ({}),
  activityId: 'StartUserNode',
  withVariables: true,
  activityNodes: undefined,
})

// 审批流程步骤
const approvalSteps = ref<Array<{
  id: string
  name: string
  description: string
  candidateUsers: CandidateUserInfo[]
  status: 'finished' | 'process' | 'error'
  tasks: TaskInfo[] // 添加任务信息，包含reason
}>>([])

// 计算当前活跃步骤
const currentActiveStep = computed(() => {
  // 检查是否有发起人节点状态为 -1，如果有，则活跃步骤在发起人节点
  const startNodeIndex = approvalSteps.value.findIndex(step => step.status === 'process' && step.id && step.id.includes('Start'))
  if (startNodeIndex >= 0) {
    return startNodeIndex
  }

  // 否则查找第一个进行中的步骤
  const processIndex = approvalSteps.value.findIndex(step => step.status === 'process')
  return processIndex >= 0 ? processIndex : approvalSteps.value.length - 1
})

// 监听 processVariables 和 activityNodes 变化
watch(
  () => [props.processVariables, props.activityNodes],
  ([newVariables, newActivityNodes]) => {
    // 如果传入了 activityNodes，直接使用
    if (newActivityNodes && Array.isArray(newActivityNodes) && newActivityNodes.length > 0) {
      updateApprovalStepsFromNodes(newActivityNodes)
      return
    }

    // 检查是否有有效的表单数据（不是空对象）
    const hasValidData = newVariables && Object.keys(newVariables).length > 0

    if (hasValidData && props.processDefinitionId) {
      loadApprovalDetail()
    }
  },
  { deep: true, immediate: true },
)

// 初始化时处理
onMounted(() => {
  // 如果传入了 activityNodes，直接使用
  if (props.activityNodes && props.activityNodes.length > 0) {
    updateApprovalStepsFromNodes(props.activityNodes)
    return
  }

  // 如果已经有有效的 processVariables，则立即加载
  const hasValidData = props.processVariables && Object.keys(props.processVariables).length > 0

  if ((props.processDefinitionId && hasValidData) || props.processInstanceId) {
    loadApprovalDetail()
  }
})

// 加载流程定义详情
async function loadApprovalDetail() {
  if (!props.processDefinitionId && !props.processInstanceId) {
    return
  }

  try {
    const params: any = {
      processDefinitionId: props.processDefinitionId,
      processInstanceId: props.processInstanceId,
      activityId: props.activityId,
    }

    // 根据 withVariables 参数决定是否携带流程参数
    if (props.withVariables) {
      params.processVariablesStr = JSON.stringify(props.processVariables)
    }

    const response = await getApprovalDetail(params)

    if (response.data) {
      // 更新审批步骤信息
      updateApprovalSteps(response.data)
    }
  }
  catch (error) {
    uni.showToast({ title: '加载审批流程失败', icon: 'none' })
  }
}

// 更新审批步骤
function updateApprovalSteps(approvalDetail: ApprovalDetailRespVO) {
  if (approvalDetail.activityNodes && approvalDetail.activityNodes.length > 0) {
    updateApprovalStepsFromNodes(approvalDetail.activityNodes)
  }
  else {
    approvalSteps.value = []
  }
}

// 从节点数据更新审批步骤
function updateApprovalStepsFromNodes(nodes: ActivityNode[]) {
  let currentStepStatus = ''
  approvalSteps.value = nodes.map((node, index) => {
    const status = calculateStepStatus(node, currentStepStatus)
    currentStepStatus = status
    return {
      id: node.id,
      name: node.name + getApprovalMethodName(node.approveMethod),
      description: node.candidateUsers && node.candidateUsers.length > 0
        ? `候选人：${node.candidateUsers.map(user => user.nickname).join('、')}`
        : '待分配',
      candidateUsers: node.candidateUsers || [],
      status,
      tasks: node.tasks || [], // 添加任务信息
    }
  })
}

/**
 * 计算步骤状态
 * @param node 当前节点
 * @param index 节点索引
 * @param allNodes 所有节点
 * @returns 步骤状态
 */
function calculateStepStatus(
  node: ActivityNode,
  currentStepStatus: string,
): 'finished' | 'process' | 'error' {
  if (currentStepStatus === 'process') {
    return undefined
  }
  // 发起人节点特殊处理
  if (node.nodeType === 10) {
    // 状态 -1 表示用户正在准备发起审批，当前流程处理在发起人节点
    if (node.status === -1) {
      return 'process'
    }
    // 其他情况下发起人节点为已完成
    return 'finished'
  }

  if (node.status === -1) {
    return undefined
  }

  // 根据节点状态判断
  if (node.status === 0) {
    // 待审批
    return 'process'
  }
  else if (node.status === 1) {
    // 审批中
    return 'process'
  }
  else if (node.status === 2) {
    // 审批通过
    return 'finished'
  }
  else if (node.status === 3) {
    // 审批不通过
    return 'error'
  }
  else if (node.status === 4) {
    // 已取消
    return 'error'
  }
  else if (node.status === 5) {
    // 已退回
    return 'error'
  }
  else if (node.status === 6) {
    // 委派中
    return 'process'
  }
  else if (node.status === 7) {
    // 待审批通过
    return 'process'
  }
  // 默认状态
  return 'error'
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

// 获取任务状态文本
function getTaskStatusText(status: number) {
  switch (status) {
    case 0:
      return '待审批'
    case 1:
      return '审批中'
    case 2:
      return '审批通过'
    case 3:
      return '审批不通过'
    case 4:
      return '已取消'
    case 5:
      return '已退回'
    case 6:
      return '委派中'
    case 7:
      return '审批通过中'
    default:
      return '未知状态'
  }
}

/**
 * 获取任务状态颜色
 * @param status 任务状态
 * @returns CSS 颜色类
 */
function getTaskStatusColor(status: number): string {
  switch (status) {
    case 0:
      return '#f59e0b' // 待审批 - 黄色
    case 1:
      return '#3b82f6' // 审批中 - 蓝色
    case 2:
      return '#10b981' // 审批通过 - 绿色
    case 3:
      return '#ef4444' // 审批不通过 - 红色
    case 4:
      return '#6b7280' // 已取消 - 灰色
    case 5:
      return '#f97316' // 已退回 - 橙色
    case 6:
      return '#8b5cf6' // 委派中 - 紫色
    case 7:
      return '#22c55e' // 审批通过中 - 浅绿色
    default:
      return '#6b7280' // 默认灰色
  }
}

/**
 * 判断是否显示 loading 效果
 * 只有正在审批的步骤才显示 loading
 * @param step 当前步骤
 * @param index 步骤索引
 * @returns 是否显示 loading
 */
function shouldShowLoading(step: any, index: number): boolean {
  // 只有 process 状态才可能显示 loading
  if (step.status !== 'process') {
    return false
  }

  // 检查是否有正在进行中的任务（状态 1: 审批中）
  if (step.tasks && step.tasks.length > 0) {
    const hasActiveTask = step.tasks.some((task: any) => task.status === 1)
    return hasActiveTask
  }

  // 检查是否为当前活跃步骤
  return false
}

// 暴露方法供父组件调用
defineExpose({
  loadApprovalDetail,
  approvalSteps: approvalSteps.value,
})
</script>

<template>
  <view class="approval-steps">
    <wd-divider>审批流程</wd-divider>
    <!-- 审批流程 -->
    <wd-cell vertical>
      <view class="p-2">
        <wd-steps :active="currentActiveStep" vertical>
          <wd-step
            v-for="(step, index) in approvalSteps"
            :key="index"
            :title="step.name"
            :status="step.status"
          >
            <!-- 为所有状态提供统一的图标插槽 -->
            <template #icon>
              <!-- 只有正在审批的步骤才显示 loading 效果 -->
              <wd-loading
                v-if="shouldShowLoading(step, index)"
                size="16px"
                color="#3b82f6"
              />
              <!-- 已完成状态显示勾号 -->
              <wd-icon
                v-else-if="step.status === 'finished'"
                name="check"
                size="16px"
                color="#10b981"
              />
              <!-- 错误状态显示叉号 -->
              <wd-icon
                v-else-if="step.status === 'error'"
                name="close"
                size="16px"
                color="#ef4444"
              />

              <view
                v-else-if="step.status === 'process'"
                class="ml-2 h-4 w-4 rounded-full bg-blue-500"
              />
              <!-- 其他状态显示默认图标 -->
              <view
                v-else
                class="ml-2 h-4 w-4 rounded-full bg-gray-300"
              />
            </template>
            <template #description>
              <!-- 候选用户信息 -->
              <view class="mb-2 flex flex-wrap gap-2">
                <view v-for="user in step.candidateUsers" :key="user.id" class="flex items-center">
                  <template v-if="user.avatar">
                    <image :src="user.avatar" class="h-6 w-6 rounded-full" />
                  </template>
                  <template v-else>
                    <view class="h-6 w-6 flex items-center justify-center rounded-full bg-indigo-500 text-xs text-white">
                      {{ user.nickname.charAt(0) }}
                    </view>
                  </template>
                  <text class="ml-2 text-sm">
                    {{ user.nickname }}
                  </text>
                </view>
              </view>

              <!-- 审批意见显示 -->
              <view v-if="step.tasks && step.tasks.length > 0">
                <view
                  v-for="task in step.tasks"
                  :key="task.id"
                  class="mb-2 rounded bg-gray-50 p-2"
                >
                  <!-- 审批人信息 -->
                  <view v-if="task.assigneeUser" class="mb-1 flex items-center">
                    <template v-if="task.assigneeUser?.avatar">
                      <image :src="task.assigneeUser.avatar" class="mr-2 h-5 w-5 rounded-full" />
                    </template>
                    <template v-else>
                      <view class="mr-2 h-5 w-5 flex items-center justify-center rounded-full bg-gray-500 text-xs text-white">
                        {{ task.assigneeUser?.nickname?.charAt(0) || '?' }}
                      </view>
                    </template>
                    <text class="text-xs text-gray-700 font-medium">
                      {{ task.assigneeUser?.nickname || '未知用户' }}
                    </text>
                    <text
                      v-if="step.id !== 'StartUserNode'"
                      class="ml-2 text-xs"
                      :style="{ color: getTaskStatusColor(task.status) }"
                    >
                      {{ getTaskStatusText(task.status) }}
                    </text>
                  </view>

                  <!-- 审批意见 -->
                  <view v-if="task.reason && step.id !== 'StartUserNode'" class="text-xs text-gray-700 leading-tight">
                    <text class="text-gray-500">
                      审批意见：
                    </text>
                    <text>{{ task.reason }}</text>
                  </view>
                </view>
              </view>
            </template>
          </wd-step>
        </wd-steps>
      </view>
    </wd-cell>
  </view>
</template>

<style scoped>
.approval-steps {
  /* 可以添加特定样式 */
}

/* 为 loading 图标添加自定义样式 */
:deep(.wd-loading) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

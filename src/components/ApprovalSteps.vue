<script setup lang="ts">
import type { ActivityNode, ApprovalDetailRespVO, CandidateUserInfo, TaskInfo } from '@/api/types/bpm'
import { computed, onMounted, ref, watch } from 'vue'
import { getApprovalDetail } from '@/api/bpm'
import { useAppStore } from '@/store/app'

const props = withDefaults(defineProps<Props>(), {
  processVariables: () => ({}),
  activityId: 'StartUserNode',
  withVariables: true,
  activityNodes: undefined,
})
// 主题状态管理
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

// 组件属性
interface Props {
  processDefinitionId?: string
  processInstanceId?: string
  processVariables?: Record<string, any>
  activityId?: string
  withVariables?: boolean // 是否携带流程参数，默认true
  activityNodes?: ActivityNode[] // 外部传入的审批节点，如果传入则直接使用，不再调用接口
}

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
      return ' (随机)'
    case 2:
      return ' (会签)'
    case 3:
      return ' (或签)'
    case 4:
      return ' (依次审批)'
    default:
      return ''
  }
}

const taskTextClass = computed(() => {
  return isDark.value
    ? 'text-xs text-gray-300 leading-tight'
    : 'text-xs text-gray-700 leading-tight'
})

const candidateItemClass = computed(() => {
  return isDark.value
    ? 'rounded bg-gray-800 px-3 py-2'
    : 'rounded bg-gray-50 px-3 py-2'
})

const candidateItemNameClass = computed(() => {
  return isDark.value
    ? 'text-xs text-gray-200'
    : 'text-xs text-gray-700'
})

// 获取用户在该步骤的任务状态（无任务则视为待审批）
function getUserTaskStatus(step: any, userId: number): number {
  if (!step || !step.tasks || step.tasks.length === 0) return 0
  const task = step.tasks.find((t: any) => t.assigneeUser && t.assigneeUser.id === userId)
  return task ? Number(task.status ?? 0) : 0
}

function getUserStatusText(status: number): string {
  switch (status) {
    case 1: return '审批中'
    case 2: return '已通过'
    case 3: return '已拒绝'
    case 5: return '已退回'
    case 6: return '委派中'
    default: return '待审批'
  }
}

// 合并审批人与候选人，生成参与者列表（带状态与意见）
function getParticipants(step: any): Array<{ id: number; nickname: string; avatar?: string; status?: number; reason?: string }> {
  const approverMap = new Map<number, { id: number; nickname: string; avatar?: string; status?: number; reason?: string }>()
  const candidateMap = new Map<number, { id: number; nickname: string; avatar?: string; status?: number }>()

  // 先收集审批人（来源于任务），保留任务出现顺序
  if (step?.tasks && step.tasks.length > 0) {
    step.tasks.forEach((t: any) => {
      const uid = t.assigneeUser?.id
      approverMap.set(uid, {
        id: uid,
        nickname: t.assigneeUser?.nickname,
        avatar: t.assigneeUser?.avatar,
        status: Number(t.status ?? 0),
        reason: t.reason || '',
      })
    })
  }

  // 再收集候选人（不覆盖审批人），按候选人原始顺序
  if (step?.candidateUsers && step.candidateUsers.length > 0) {
    step.candidateUsers.forEach((u: any) => {
      if (!approverMap.has(u.id)) {
        candidateMap.set(u.id, {
          id: u.id,
          nickname: u.nickname,
          avatar: u.avatar,
          status: getUserTaskStatus(step, u.id),
        })
      }
    })
  }

  // 返回时确保“审批人优先，候选人随后”
  return [...Array.from(approverMap.values()), ...Array.from(candidateMap.values())]
}

function isStartNode(step: any): boolean {
  return !!(step?.id && String(step.id).includes('Start'))
}

function getUserStatusClass(status: number): string {
  // 主题感知的小徽标样式
  const base = 'ml-2 rounded-full px-2 py-0.5 text-11px'
  if (isDark.value) {
    switch (status) {
      case 1: return base + ' bg-blue-900/40 text-blue-300 border border-blue-700'
      case 2: return base + ' bg-green-900/40 text-green-300 border border-green-700'
      case 3: return base + ' bg-red-900/40 text-red-300 border border-red-700'
      case 5: return base + ' bg-orange-900/40 text-orange-300 border border-orange-700'
      case 6: return base + ' bg-violet-900/40 text-violet-300 border border-violet-700'
      default: return base + ' bg-gray-800 text-gray-300 border border-gray-700'
    }
  }
  else {
    switch (status) {
      case 1: return base + ' bg-blue-50 text-blue-700 border border-blue-200'
      case 2: return base + ' bg-green-50 text-green-700 border border-green-200'
      case 3: return base + ' bg-red-50 text-red-700 border border-red-200'
      case 5: return base + ' bg-orange-50 text-orange-700 border border-orange-200'
      case 6: return base + ' bg-violet-50 text-violet-700 border border-violet-200'
      default: return base + ' bg-gray-50 text-gray-700 border border-gray-200'
    }
  }
}

const smallAvatarPlaceholderClass = computed(() => {
  return isDark.value
    ? 'mr-2 h-5 w-5 flex items-center justify-center rounded-full bg-gray-600 text-xs text-gray-200'
    : 'mr-2 h-5 w-5 flex items-center justify-center rounded-full bg-gray-500 text-xs text-white'
})

const processStepClass = computed(() => {
  return isDark.value
    ? 'ml-2 h-4 w-4 rounded-full bg-blue-400'
    : 'ml-2 h-4 w-4 rounded-full bg-blue-500'
})

const defaultStepClass = computed(() => {
  return isDark.value
    ? 'ml-2 h-4 w-4 rounded-full bg-gray-600'
    : 'ml-2 h-4 w-4 rounded-full bg-gray-300'
})

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
  <view>
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
                :class="processStepClass"
              />
              <!-- 其他状态显示默认图标 -->
              <view
                v-else
                :class="defaultStepClass"
              />
            </template>
            <template #description>
              <!-- 参与者（审批人 + 候选人合并） -->
              <view v-if="(step.candidateUsers && step.candidateUsers.length) || (step.tasks && step.tasks.length)" class="mt-3 mb-2">
                <view class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <view
                    v-for="p in getParticipants(step)"
                    :key="p.id"
                    :class="candidateItemClass"
                  >
                    <view v-if="p.id" class="flex items-center gap-2">
                      <template v-if="p.avatar">
                        <image :src="p.avatar" class="h-6 w-6 rounded-full" />
                      </template>
                      <template v-else>
                        <view :class="smallAvatarPlaceholderClass">
                          {{ p.nickname.charAt(0) }}
                        </view>
                      </template>
                      <text :class="candidateItemNameClass">{{ p.nickname }}</text>
                      <text v-if="!isStartNode(step) && p.status" :class="getUserStatusClass(p.status)">
                        {{ getUserStatusText(p.status) }}
                      </text>
                    </view>
                    <!-- 驳回原因单独一行展示（仅在被拒绝时显示），带前缀 -->
                    <view v-if="!isStartNode(step) && p.status && p.reason" :class="p.id ? 'mt-2' : ''">
                      <text :class="taskTextClass">审批意见：{{ p.reason }}</text>
                    </view>
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

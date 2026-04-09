<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "队伍详情"
  }
}
</route>

<script lang="ts" setup>
import type { ProjectTeamInfo, ProjectTeamMember, ProjectTeamPlan, ProjectTeamReport } from '@/api/types/project'
import { computed, ref } from 'vue'
import {
  createPlan as createPlanApi,
  deletePlan as deletePlanApi,
  getMyTeams,
  getReportPage,
  getTeamMemberList,
  getTeamDetail,
  getPlanList,
  updatePlan as updatePlanApi,
  updatePlanProgress,
} from '@/api/project'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'

defineOptions({
  name: 'TeamDetail',
})

interface TeamMemberExt extends ProjectTeamMember {
  className: string
  studentNo?: string
  phone?: string
  intro?: string
}

interface TeamPlanExt extends ProjectTeamPlan {
  assigneeId?: number
  assigneeName?: string
}

interface TeamReportExt extends ProjectTeamReport {
  reviewerName?: string
  authorName?: string
}

// 页面参数
const teamId = ref<number>(0)
const loading = ref(true)

// 数据
const team = ref<ProjectTeamInfo | null>(null)
const members = ref<TeamMemberExt[]>([])
const plans = ref<TeamPlanExt[]>([])
const reports = ref<TeamReportExt[]>([])

// UI 状态
const userStore = useUserStore()
const currentUserId = computed(() => Number(userStore.userInfo.userId || 0))
const isCaptain = computed(() => members.value.some(m => Number(m.userId) === currentUserId.value && (m.isCaptain || m.role === 'captain')))
const showPlanDetailModal = ref(false)
const selectedPlan = ref<TeamPlanExt | null>(null)
const isCreatingPlan = ref(false)

// 编辑计划表单
const editingPlan = ref<{
  title: string
  content: string
  status: number
  progress: number | string
  startTime: number | string
  endTime: number | string
  assigneeId: string
}>({
  title: '',
  content: '',
  status: 0,
  progress: 0,
  startTime: '',
  endTime: '',
  assigneeId: '',
})
const savingPlan = ref(false)

// 主题适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))
const borderMutedClass = computed(() => (isDark.value ? 'divide-white/10' : 'divide-slate-100'))
const avatarMutedBgClass = computed(() => (isDark.value ? 'bg-white/10' : 'bg-slate-100'))

// Tab 状态
const currentTab = ref(0)
const tabs = ['计划', '成员', '周报']

onLoad((options) => {
  if (options.id) {
    teamId.value = Number(options.id)
    loadData()
  }
})

onPullDownRefresh(async () => {
  await loadData()
  uni.stopPullDownRefresh()
})

function mapMemberRole(role?: string, isCaptainFlag?: boolean): string {
  if (isCaptainFlag)
    return 'captain'
  const value = String(role || '').toLowerCase()
  if (['captain', 'leader', 'owner', 'manager'].includes(value))
    return 'captain'
  return 'member'
}

function parsePlanStatusToNumber(status?: string | number): number {
  if (typeof status === 'number')
    return status
  const s = String(status || '').toLowerCase()
  if (['pending', 'todo', 'created'].includes(s))
    return 0
  if (['in_progress', 'inprogress', 'running', 'doing'].includes(s))
    return 1
  if (['completed', 'done', 'finished'].includes(s))
    return 2
  if (['delayed', 'delay', 'overdue', '延期'].includes(s))
    return 3
  return 0
}

function mapPlanStatusToApi(status: number): string {
  const mapping: Record<number, string> = {
    0: 'pending',
    1: 'in_progress',
    2: 'completed',
    3: 'delayed',
  }
  return mapping[status] || 'pending'
}

function formatDateOnly(value: string | number): string {
  if (!value)
    return ''

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value

  const d = new Date(value)
  if (Number.isNaN(d.getTime()))
    return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toPickerTimestamp(value: string | number | undefined): number {
  if (typeof value === 'number')
    return value

  if (!value)
    return Date.now()

  const normalized = String(value).replace(/-/g, '/')
  const ts = new Date(normalized).getTime()
  return Number.isNaN(ts) ? Date.now() : ts
}

function clampProgress(value: number | string): number {
  const n = Number(value)
  if (Number.isNaN(n))
    return 0
  return Math.min(100, Math.max(0, Math.round(n)))
}

function parseDateToDateTime(raw?: string): string {
  if (!raw)
    return ''
  return String(raw).includes(' ') ? String(raw) : `${raw} 00:00:00`
}

function hydrateTeamDetail(raw: any): ProjectTeamInfo {
  return {
    id: Number(raw?.id || teamId.value),
    projectId: Number(raw?.projectId || 0),
    categoryId: Number(raw?.categoryId || 0),
    name: raw?.name || '未命名队伍',
    description: raw?.description || '',
    captainId: Number(raw?.captainUserId || 0),
    captainName: members.value.find(m => m.isCaptain)?.userName,
    recruitCount: raw?.maxMembers,
    currentCount: raw?.currentMembers,
    status: Number(raw?.status || 0),
    createTime: raw?.createTime,
  }
}

function enrichCaptainNameFromMyTeams(base: ProjectTeamInfo, myTeamsRaw: any[]): ProjectTeamInfo {
  const matched = myTeamsRaw.find(item => Number(item?.id) === Number(base.id))
  if (!matched)
    return base

  const captain = matched?.members?.find((m: any) => m?.isCaptain)
  return {
    ...base,
    captainName: captain?.nickname || captain?.userName || base.captainName,
  }
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const [teamRes, membersRes, plansRes, reportsRes, myTeamsRes] = await Promise.all([
      getTeamDetail(teamId.value),
      getTeamMemberList(teamId.value),
      getPlanList(teamId.value),
      getReportPage({ teamId: teamId.value, pageNo: 1, pageSize: 100 }),
      getMyTeams(),
    ])

    if (membersRes.code === 0 && membersRes.data) {
      members.value = membersRes.data.map((m: any) => ({
        id: Number(m.id),
        teamId: Number(m.teamId),
        userId: Number(m.userId),
        userName: m.userName || m.nickname || `用户${m.userId || ''}`,
        userAvatar: m.userAvatar || m.avatar,
        userDeptName: m.userDeptName,
        userSchoolDeptName: m.userSchoolDeptName,
        role: mapMemberRole(m.role, m.isCaptain),
        isCaptain: !!m.isCaptain,
        status: m.status,
        className: m.userSchoolDeptName || m.userDeptName || '未知班级',
        studentNo: m.studentNo,
        phone: m.phone,
        intro: m.intro || m.remark,
        joinTime: m.joinTime,
      }))
    }
    else {
      members.value = []
    }

    if (teamRes.code === 0 && teamRes.data) {
      const baseTeam = hydrateTeamDetail(teamRes.data)
      const myTeamsRaw = (myTeamsRes.code === 0 && myTeamsRes.data) ? myTeamsRes.data : []
      team.value = enrichCaptainNameFromMyTeams(baseTeam, myTeamsRaw)
      uni.setNavigationBarTitle({ title: team.value.name || '队伍详情' })
    }
    else {
      team.value = null
    }

    if (plansRes.code === 0 && plansRes.data) {
      plans.value = plansRes.data.map((p: any) => ({
        ...p,
        assigneeName: p.userName || p.assigneeName,
        status: parsePlanStatusToNumber(p.status),
        startTime: parseDateToDateTime(p.startDate || p.startTime),
        endTime: parseDateToDateTime(p.endDate || p.endTime),
      }))
    }
    else {
      plans.value = []
    }

    if (reportsRes.code === 0 && reportsRes.data?.list) {
      reports.value = reportsRes.data.list.map((r: any) => ({
        ...r,
        authorName: r.userName || r.authorName,
        status: String(r.reviewStatus || '').toLowerCase() === 'approved' ? 1 : 0,
        reportDate: parseDateToDateTime(r.reportDate),
      }))
    }
    else {
      reports.value = []
    }
  }
  catch (error) {
    console.error('加载队伍详情失败:', error)
    uni.showToast({
      title: '加载失败，请稍后重试',
      icon: 'none',
    })
  }
  finally {
    loading.value = false
  }
}

// 打开计划详情
function openPlanDetail(plan: TeamPlanExt) {
  selectedPlan.value = plan
  isCreatingPlan.value = false
  editingPlan.value = {
    title: plan.title,
    content: plan.content || '',
    status: Number(plan.status || 0),
    progress: plan.progress ?? 0,
    startTime: toPickerTimestamp(plan.startTime),
    endTime: toPickerTimestamp(plan.endTime),
    assigneeId: String(plan.assigneeId || ''),
  }
  showPlanDetailModal.value = true
}

function openCreatePlanModal() {
  if (!isCaptain.value) {
    uni.showToast({ title: '仅队长可新增计划', icon: 'none' })
    return
  }

  const now = Date.now()
  selectedPlan.value = null
  isCreatingPlan.value = true
  editingPlan.value = {
    title: '',
    content: '',
    status: 0,
    progress: 0,
    startTime: now,
    endTime: now,
    assigneeId: String(currentUserId.value || ''),
  }
  showPlanDetailModal.value = true
}

// 关闭详情弹窗
function closePlanDetail() {
  showPlanDetailModal.value = false
  selectedPlan.value = null
  isCreatingPlan.value = false
}

function onProgressBlur() {
  editingPlan.value.progress = clampProgress(editingPlan.value.progress)
}

function onStartTimeConfirm(payload: { value: string | number }) {
  editingPlan.value.startTime = payload.value
}

function onEndTimeConfirm(payload: { value: string | number }) {
  editingPlan.value.endTime = payload.value
}

async function completePlan(plan: TeamPlanExt) {
  if (!isCaptain.value) {
    uni.showToast({ title: '仅队长可操作', icon: 'none' })
    return
  }

  try {
    const res = await updatePlanProgress({
      id: plan.id,
      progress: 100,
      status: 'completed',
    })
    if (res.code !== 0) {
      uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
      return
    }

    plan.status = 2
    plan.progress = 100
    uni.showToast({ title: '计划已完成', icon: 'success' })
  }
  catch (error) {
    console.error('完成计划失败:', error)
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

async function deletePlan(planId: number) {
  if (!isCaptain.value) {
    uni.showToast({ title: '仅队长可删除', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，是否继续？',
    success: async (res) => {
      if (!res.confirm)
        return

      try {
        const result = await deletePlanApi(planId)
        if (result.code !== 0) {
          uni.showToast({ title: result.msg || '删除失败', icon: 'none' })
          return
        }

        plans.value = plans.value.filter(item => item.id !== planId)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
      catch (error) {
        console.error('删除计划失败:', error)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    },
  })
}

function openReportDetail(report: TeamReportExt) {
  uni.setStorageSync('projectReportDetail', {
    ...report,
    authorName: report.authorName || team.value?.captainName || team.value?.name || '未知作者',
  })
  uni.navigateTo({
    url: `/pages-sub/project/report-detail?id=${report.id}`,
  })
}

// 保存计划修改
async function savePlan() {
  if (!isCaptain.value) {
    uni.showToast({ title: '仅队长可修改', icon: 'none' })
    return
  }

  if (!editingPlan.value.title.trim()) {
    uni.showToast({ title: '请输入计划标题', icon: 'none' })
    return
  }

  if (!team.value?.projectId || !team.value?.categoryId) {
    uni.showToast({ title: '队伍信息不完整，无法保存', icon: 'none' })
    return
  }

  savingPlan.value = true

  try {
    const progress = clampProgress(editingPlan.value.progress)
    editingPlan.value.progress = progress

    const assigneeId = Number(editingPlan.value.assigneeId || currentUserId.value || 0)
    const payload: Record<string, any> = {
      projectId: Number(team.value.projectId),
      categoryId: Number(team.value.categoryId),
      teamId: Number(teamId.value),
      userId: assigneeId || Number(currentUserId.value || 0),
      planType: 'weekly',
      title: editingPlan.value.title,
      description: editingPlan.value.content,
      content: editingPlan.value.content,
      assignerId: Number(currentUserId.value || 0),
      assigneeType: 'member',
      startDate: formatDateOnly(editingPlan.value.startTime),
      endDate: formatDateOnly(editingPlan.value.endTime),
      status: mapPlanStatusToApi(Number(editingPlan.value.status || 0)),
      progress,
      priority: 2,
    }

    let saveResult: any
    if (isCreatingPlan.value) {
      saveResult = await createPlanApi(payload)
    }
    else if (selectedPlan.value) {
      payload.id = selectedPlan.value.id
      saveResult = await updatePlanApi(payload)
    }

    if (!saveResult || saveResult.code !== 0) {
      uni.showToast({ title: saveResult?.msg || '保存失败', icon: 'none' })
      return
    }

    uni.showToast({
      title: isCreatingPlan.value ? '新增成功' : '保存成功',
      icon: 'success',
    })

    closePlanDetail()
    await loadData()
  }
  catch (error) {
    console.error('保存失败:', error)
    uni.showToast({
      title: '保存失败',
      icon: 'none',
    })
  }
  finally {
    savingPlan.value = false
  }
}

// 格式化日期
function formatDate(date?: string): string {
  if (!date)
    return '-'
  return date.split(' ')[0]
}

// 获取计划状态颜色
function getPlanStatusColor(status: number): string {
  const colors: Record<number, string> = {
    0: isDark.value ? 'text-gray-400 bg-gray-500/15' : 'text-gray-600 bg-gray-50',
    1: isDark.value ? 'text-blue-400 bg-blue-500/15' : 'text-blue-600 bg-blue-50',
    2: isDark.value ? 'text-green-400 bg-green-500/15' : 'text-green-600 bg-green-50',
    3: isDark.value ? 'text-red-400 bg-red-500/15' : 'text-red-600 bg-red-50',
  }
  return colors[status] || colors[0]
}

function getPlanStatusText(status: number): string {
  const texts: Record<number, string> = {
    0: '待开始',
    1: '进行中',
    2: '已完成',
    3: '已延期',
  }
  return texts[status] || '未知'
}

// 获取进度条颜色
function getProgressColor(progress: number): string {
  if (progress >= 80)
    return 'bg-green-500'
  if (progress >= 50)
    return 'bg-blue-500'
  if (progress >= 30)
    return 'bg-orange-500'
  return 'bg-gray-400'
}

function getMemberRoleText(role?: string): string {
  return role === 'captain' ? '队长' : '成员'
}

function openMemberDetail(member: TeamMemberExt) {
  const q = [
    `teamId=${encodeURIComponent(String(teamId.value))}`,
    `userId=${encodeURIComponent(String(member.userId))}`,
    `name=${encodeURIComponent(member.userName || '')}`,
    `className=${encodeURIComponent(member.className || '')}`,
    `role=${encodeURIComponent(getMemberRoleText(member.role))}`,
    `studentNo=${encodeURIComponent(member.studentNo || '')}`,
    `phone=${encodeURIComponent(member.phone || '')}`,
    `intro=${encodeURIComponent(member.intro || '')}`,
    `joinTime=${encodeURIComponent(member.joinTime || '')}`,
  ].join('&')

  uni.navigateTo({
    url: `/pages-sub/project/member?${q}`,
  })
}

// 获取周报状态
function getReportStatusColor(status: number): string {
  return status === 0
    ? (isDark.value ? 'text-orange-400 bg-orange-500/15' : 'text-orange-600 bg-orange-50')
    : (isDark.value ? 'text-green-400 bg-green-500/15' : 'text-green-600 bg-green-50')
}

function getReportStatusText(status: number): string {
  return status === 0 ? '待审阅' : '已审阅'
}

// 状态选项
const statusOptions = [
  { label: '待开始', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
  { label: '已延期', value: 3 },
]
</script>

<template>
  <view class="min-h-screen" :class="isDark ? 'bg-slate-950' : 'bg-[#f5f7fa]'">
    <!-- 加载中 -->
    <view v-if="loading" class="p-4">
      <wd-skeleton theme="paragraph" />
    </view>

    <view v-else-if="team">
      <!-- 队伍头部信息 -->
      <view class="px-4 pt-4">
        <ThemeCard :padding="false" card-class="mb-4">
          <view class="p-4">
            <view class="text-lg font-bold mb-1" :class="textPrimaryClass">
              {{ team.name }}
            </view>
            <view class="text-xs mb-2" :class="textMutedClass">
              {{ team.description }}
            </view>
            <view class="flex items-center gap-3 text-xs" :class="textMutedClass">
              <view class="flex items-center gap-1">
                <wd-icon name="user" size="12px" />
                <text>队长: {{ team.captainName || '暂无' }}</text>
              </view>
              <view class="flex items-center gap-1">
                <wd-icon name="user-circle" size="12px" />
                <text>{{ team.currentCount || 0 }} 名成员</text>
              </view>
            </view>
          </view>
        </ThemeCard>
      </view>

      <!-- Tab 切换 -->
      <view class="px-4 mb-4">
        <wd-tabs v-model="currentTab">
          <wd-tab v-for="tab in tabs" :key="tab" :title="tab" />
        </wd-tabs>
      </view>

      <!-- 计划 Tab -->
      <view v-show="currentTab === 0" class="px-4">
        <view class="mb-3 flex items-center justify-between">
          <view class="text-sm font-medium" :class="textSecondaryClass">计划列表</view>
          <wd-button size="small" type="primary" @click="openCreatePlanModal">
            新增计划
          </wd-button>
        </view>
        <view v-if="plans.length === 0" class="py-12 text-center">
          <wd-icon name="folder-open" size="32px" :color="isDark ? '#64748b' : '#94a3b8'" class="mb-2" />
          <view class="text-sm" :class="textMutedClass">暂无计划</view>
        </view>
        <view v-else class="space-y-3 pb-2">
          <wd-swipe-action
            v-for="plan in plans"
            :key="plan.id"
            custom-class="plan-swipe-item"
          >
            <template #right>
              <view class="swipe-actions-right">
                <view
                  class="swipe-action-btn swipe-action-btn--done"
                  @click.stop="completePlan(plan)"
                >
                  完成
                </view>
                <view
                  class="swipe-action-btn swipe-action-btn--delete"
                  @click.stop="deletePlan(plan.id)"
                >
                  删除
                </view>
              </view>
            </template>
            <ThemeCard
              :padding="false"
              card-class="shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.99] transition-transform duration-200 rounded-4"
              @click="openPlanDetail(plan)"
            >
              <view class="p-4">
                <!-- 标题 + 状态 -->
                <view class="flex items-start justify-between mb-2">
                  <view class="flex items-center gap-2 flex-1">
                    <view class="text-sm font-semibold" :class="textPrimaryClass">
                      {{ plan.title }}
                    </view>
                    <view class="text-[10px] px-1.5 py-0.5 rounded" :class="getPlanStatusColor(Number(plan.status))">
                      {{ getPlanStatusText(Number(plan.status)) }}
                    </view>
                  </view>
                  <view class="flex items-center gap-1 text-xs" :class="textMutedClass">
                    <wd-icon name="calendar" size="12px" />
                    <text>{{ formatDate(plan.endTime) }}</text>
                  </view>
                </view>

                <!-- 内容摘要 -->
                <view v-if="plan.content" class="text-xs mb-2 line-clamp-2" :class="textSecondaryClass">
                  {{ plan.content }}
                </view>

                <!-- 负责人 + 进度 -->
                <view class="flex items-center justify-between">
                  <view class="flex items-center gap-2 text-xs" :class="textMutedClass">
                    <view v-if="plan.assigneeName" class="flex items-center gap-1">
                      <wd-icon name="user" size="12px" />
                      <text>{{ plan.assigneeName }}</text>
                    </view>
                    <view v-if="plan.progress !== undefined" class="flex items-center gap-1">
                      <text>{{ plan.progress }}%</text>
                    </view>
                  </view>
                  <view class="h-1.5 rounded-full overflow-hidden w-20" :class="isDark ? 'bg-slate-700' : 'bg-gray-200'">
                    <view
                      class="h-full rounded-full"
                      :class="getProgressColor(Number(plan.progress || 0))"
                      :style="{ width: `${Number(plan.progress || 0)}%` }"
                    />
                  </view>
                </view>
              </view>
            </ThemeCard>
          </wd-swipe-action>
        </view>
      </view>

      <!-- 成员 Tab -->
      <view v-show="currentTab === 1" class="px-4">
        <view v-if="members.length === 0" class="py-12 text-center">
          <wd-icon name="user-group" size="32px" :color="isDark ? '#64748b' : '#94a3b8'" class="mb-2" />
          <view class="text-sm" :class="textMutedClass">暂无成员</view>
        </view>
        <view v-else>
          <ThemeCard :padding="false" card-class="overflow-hidden">
            <view class="divide-y" :class="borderMutedClass">
              <view
                v-for="member in members"
                :key="member.id"
                class="flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
                @tap="openMemberDetail(member)"
              >
                <view class="h-10 w-10 flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 dark:border-slate-700" :class="avatarMutedBgClass">
                  <image v-if="member.userAvatar" :src="member.userAvatar" mode="aspectFill" class="h-full w-full" />
                  <view v-else class="text-xs font-bold" :class="textSecondaryClass">
                    {{ (member.userName || '用户').slice(-2) }}
                  </view>
                </view>

                <view class="min-w-0 flex-1">
                  <view class="flex items-center gap-2 mb-0.5">
                    <view class="truncate text-sm font-medium" :class="textPrimaryClass">
                      {{ member.userName || '-' }}
                    </view>
                    <view class="flex flex-wrap items-center gap-1">
                      <view
                        class="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      >
                        {{ member.className }}
                      </view>
                      <view
                        class="px-1.5 py-0.5 text-[10px] rounded"
                        :class="member.role === 'captain'
                          ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200/60 dark:border-orange-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'"
                      >
                        {{ getMemberRoleText(member.role) }}
                      </view>
                    </view>
                  </view>
                </view>

                <wd-icon name="arrow-right" size="14px" class="text-slate-300" />
              </view>
            </view>
          </ThemeCard>
        </view>
      </view>

      <!-- 周报 Tab -->
      <view v-show="currentTab === 2" class="px-4">
        <view v-if="reports.length === 0" class="py-12 text-center">
          <wd-icon name="notes" size="32px" :color="isDark ? '#64748b' : '#94a3b8'" class="mb-2" />
          <view class="text-sm" :class="textMutedClass">暂无周报</view>
        </view>
        <view v-else>
          <ThemeCard :padding="false" card-class="overflow-hidden">
            <view class="divide-y" :class="borderMutedClass">
              <view
                v-for="report in reports"
                :key="report.id"
                class="px-4 py-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
                @tap="openReportDetail(report)"
              >
                <view class="flex items-start justify-between">
                  <view class="min-w-0 flex-1">
                    <view class="truncate text-sm font-medium" :class="textPrimaryClass">
                      {{ report.title || '周报' }}
                    </view>
                    <view class="mt-1 text-xs" :class="textMutedClass">
                      {{ formatDate(report.reportDate) }}
                    </view>
                  </view>
                  <wd-icon name="arrow-right" size="14px" class="text-slate-300" />
                </view>
              </view>
            </view>
          </ThemeCard>
        </view>
      </view>
    </view>

    <!-- 计划详情弹窗 -->
    <wd-popup
      v-model="showPlanDetailModal"
      position="bottom"
      :close-on-click-modal="false"
      :close-on-click-overlay="false"
    >
      <view class="p-4 pb-8 max-h-[80vh] overflow-y-auto">
        <!-- 标题栏 -->
        <view class="flex items-center justify-between mb-4">
          <view class="text-lg font-semibold" :class="textPrimaryClass">
            {{ isCreatingPlan ? '新增计划' : '计划详情' }}
          </view>
          <wd-icon name="close" size="20px" :color="isDark ? '#9ca3af' : '#64748b'" @click="closePlanDetail" />
        </view>

        <view v-if="selectedPlan || isCreatingPlan" class="space-y-4">
          <!-- 计划标题 -->
          <view>
            <wd-input
              v-model="editingPlan.title"
              label="计划标题"
              label-width="70px"
              placeholder="请输入计划标题"
              required
            />
          </view>

          <!-- 计划状态 -->
          <view>
            <wd-picker
              v-model="editingPlan.status"
              label="状态"
              label-width="70px"
              :columns="[
                {
                  label: '状态',
                  valueKey: 'value',
                  options: statusOptions,
                }
              ]"
            />
          </view>

          <!-- 进度（数字输入框） -->
          <view v-if="editingPlan.status !== 0">
            <wd-input
              v-model="editingPlan.progress"
              type="number"
              label="进度"
              label-width="70px"
              placeholder="0-100"
              :min="0"
              :max="100"
              @blur="onProgressBlur"
            />
          </view>

          <!-- 计划内容 -->
          <view>
            <wd-textarea
              v-model="editingPlan.content"
              label="计划内容"
              label-width="70px"
              placeholder="请输入计划内容"
              rows="4"
              maxlength="500"
              show-word-limit
            />
          </view>

          <!-- 时间范围（两行展示） -->
          <view class="flex flex-col gap-3">
            <wd-datetime-picker
              v-model="editingPlan.startTime"
              label="开始时间"
              label-width="70px"
              type="date"
              placeholder="请选择开始时间"
              @confirm="onStartTimeConfirm"
            />
            <wd-datetime-picker
              v-model="editingPlan.endTime"
              label="结束时间"
              label-width="70px"
              type="date"
              placeholder="请选择结束时间"
              @confirm="onEndTimeConfirm"
            />
          </view>

          <!-- 负责人 -->
          <view>
            <wd-picker
              v-model="editingPlan.assigneeId"
              label="负责人"
              label-width="70px"
              :columns="[
                {
                  label: '成员',
                  valueKey: 'value',
                  options: members.map(m => ({ label: m.userName || '-', value: String(m.userId) })),
                }
              ]"
              placeholder="选择负责人"
            />
          </view>

          <!-- 操作按钮（居中） -->
          <view class="mt-6 flex gap-3 justify-center">
            <view style="width: 48%">
              <wd-button type="primary" block :loading="savingPlan" @click="savePlan">
                保存修改
              </wd-button>
            </view>
            <view style="width: 48%">
              <wd-button block @click="closePlanDetail">
                取消
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
}

:deep(.plan-swipe-item) {
  margin: 0 2px;
  border-radius: 16rpx;
  overflow: hidden;
}

.swipe-actions-right {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 12rpx;
}

.swipe-action-btn {
  min-width: 108rpx;
  height: calc(100% - 16rpx);
  margin: 8rpx 0;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24rpx;
  font-weight: 500;
  border-radius: 16rpx;
  overflow: hidden;
}

.swipe-action-btn--done {
  background: linear-gradient(180deg, #34c759 0%, #28b44c 100%);
}

.swipe-action-btn--delete {
  background: linear-gradient(180deg, #ff4d4f 0%, #ef4444 100%);
}
</style>

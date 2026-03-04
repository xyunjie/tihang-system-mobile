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
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'
import { getTeamsByStatus } from '@/pages/project/mockData'

defineOptions({
  name: 'TeamDetail',
})

// 页面参数
const teamId = ref<number>(0)
const loading = ref(true)

// 数据
const team = ref<ProjectTeamInfo | null>(null)
const members = ref<ProjectTeamMember[]>([])
const plans = ref<ProjectTeamPlan[]>([])
const reports = ref<ProjectTeamReport[]>([])

// 主题适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))

// Tab 状态
const currentTab = ref(0)
const tabs = ['成员', '计划', '周报']

onLoad((options) => {
  if (options.id) {
    teamId.value = Number(options.id)
    loadData()
  }
})

// 加载数据
async function loadData() {
  loading.value = true
  try {
    // 使用假数据
    const teamsData = getTeamsByStatus()
    team.value = teamsData.all.find(t => t.id === teamId.value) || teamsData.all[0]

    // 为了演示，直接使用固定的成员、计划、周报数据
    // 实际项目中应该根据 teamId 获取对应的数据
    const mockMembers: ProjectTeamMember[] = [
      { id: 1, teamId: teamId.value, userId: 1, userName: '张三', userAvatar: '', role: 'captain', joinTime: '2026-01-01 00:00:00' },
      { id: 2, teamId: teamId.value, userId: 2, userName: '李华', userAvatar: '', role: 'member', joinTime: '2026-01-05 00:00:00' },
      { id: 3, teamId: teamId.value, userId: 3, userName: '王芳', userAvatar: '', role: 'member', joinTime: '2026-01-08 00:00:00' },
      { id: 4, teamId: teamId.value, userId: 4, userName: '赵明', userAvatar: '', role: 'member', joinTime: '2026-01-10 00:00:00' },
      { id: 5, teamId: teamId.value, userId: 5, userName: '刘强', userAvatar: '', role: 'member', joinTime: '2026-01-12 00:00:00' },
      { id: 6, teamId: teamId.value, userId: 6, userName: '陈静', userAvatar: '', role: 'member', joinTime: '2026-01-15 00:00:00' },
      { id: 7, teamId: teamId.value, userId: 7, userName: '杨光', userAvatar: '', role: 'member', joinTime: '2026-01-18 00:00:00' },
      { id: 8, teamId: teamId.value, userId: 8, userName: '周杰', userAvatar: '', role: 'member', joinTime: '2026-01-20 00:00:00' },
    ]

    const mockPlans: ProjectTeamPlan[] = [
      {
        id: 1,
        teamId: teamId.value,
        title: '用户界面设计',
        content: '完成应用首页、详情页等主要界面的UI设计',
        status: 2,
        startTime: '2026-01-01 00:00:00',
        endTime: '2026-01-31 23:59:59',
        progress: 100,
      },
      {
        id: 2,
        teamId: teamId.value,
        title: '前端框架搭建',
        content: '搭建 Vue 3 + Vite 前端项目框架',
        status: 2,
        startTime: '2026-02-01 00:00:00',
        endTime: '2026-02-15 23:59:59',
        progress: 100,
      },
      {
        id: 3,
        teamId: teamId.value,
        title: 'API接口对接',
        content: '完成后端API接口对接与数据联调',
        status: 1,
        startTime: '2026-02-16 00:00:00',
        endTime: '2026-03-15 23:59:59',
        progress: 75,
      },
      {
        id: 4,
        teamId: teamId.value,
        title: '功能模块开发',
        content: '完成用户管理、项目管理等核心功能模块开发',
        status: 1,
        startTime: '2026-03-01 00:00:00',
        endTime: '2026-04-30 23:59:59',
        progress: 60,
      },
    ]

    const mockReports: ProjectTeamReport[] = [
      {
        id: 1,
        teamId: teamId.value,
        title: '第一周周报',
        content: '本周完成了项目框架搭建和基础组件开发。下周计划开始用户管理模块开发。',
        reportDate: '2026-01-07 00:00:00',
        status: 1,
        reviewComment: '工作进展顺利，继续保持。',
        reviewTime: '2026-01-08 10:00:00',
        reviewerId: 1,
        reviewerName: '张三',
        createTime: '2026-01-07 18:00:00',
      },
      {
        id: 2,
        teamId: teamId.value,
        title: '第二周周报',
        content: '本周完成了登录注册功能和用户信息管理页面。下周计划开始项目管理模块开发。',
        reportDate: '2026-01-14 00:00:00',
        status: 1,
        reviewComment: '功能完成质量良好。',
        reviewTime: '2026-01-15 09:30:00',
        reviewerId: 1,
        reviewerName: '张三',
        createTime: '2026-01-14 17:30:00',
      },
    ]

    members.value = mockMembers
    plans.value = mockPlans
    reports.value = mockReports

    // 延迟模拟网络请求
    await new Promise(resolve => setTimeout(resolve, 500))

    if (team.value) {
      uni.setNavigationBarTitle({ title: team.value.name || '队伍详情' })
    }
  }
  finally {
    loading.value = false
  }
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

// 格式化日期
function formatDate(date?: string): string {
  if (!date)
    return '-'
  return date.split(' ')[0]
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

// 获取周报状态
function getReportStatusColor(status: number): string {
  return status === 0
    ? (isDark.value ? 'text-orange-400 bg-orange-500/15' : 'text-orange-600 bg-orange-50')
    : (isDark.value ? 'text-green-400 bg-green-500/15' : 'text-green-600 bg-green-50')
}

function getReportStatusText(status: number): string {
  return status === 0 ? '待审阅' : '已审阅'
}
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
            <view class="flex items-start justify-between mb-2">
              <view class="flex-1">
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
            </view>
          </view>
        </ThemeCard>
      </view>

      <!-- Tab 切换 -->
      <view class="px-4 mb-4">
        <wd-tabs v-model="currentTab">
          <wd-tab title="成员" />
          <wd-tab title="计划" />
          <wd-tab title="周报" />
        </wd-tabs>
      </view>

      <!-- 成员 Tab -->
      <view v-show="currentTab === 0" class="px-4">
        <view v-if="members.length === 0" class="py-12 text-center">
          <view class="text-sm" :class="textMutedClass">暂无成员</view>
        </view>
        <view v-else class="space-y-2">
          <ThemeCard
            v-for="member in members"
            :key="member.id"
            :padding="false"
          >
            <view class="flex items-center gap-3 p-3">
              <image
                v-if="member.userAvatar"
                :src="member.userAvatar"
                class="w-10 h-10 rounded-full"
                mode="aspectFill"
              />
              <view v-else class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                {{ (member.userName || '?')[0] }}
              </view>
              <view class="flex-1">
                <view class="flex items-center gap-2">
                  <view class="text-sm font-medium" :class="textPrimaryClass">{{ member.userName }}</view>
                  <view v-if="member.role === 'captain'" class="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                    队长
                  </view>
                </view>
              </view>
            </view>
          </ThemeCard>
        </view>
      </view>

      <!-- 计划 Tab -->
      <view v-show="currentTab === 1" class="px-4">
        <view v-if="plans.length === 0" class="py-12 text-center">
          <view class="text-sm" :class="textMutedClass">暂无计划</view>
        </view>
        <view v-else class="space-y-3">
          <ThemeCard
            v-for="plan in plans"
            :key="plan.id"
            :padding="false"
          >
            <view class="p-4">
              <view class="flex items-start justify-between mb-2">
                <view class="font-medium text-sm" :class="textPrimaryClass">{{ plan.title }}</view>
                <view class="text-[10px] px-1.5 py-0.5 rounded" :class="getPlanStatusColor(plan.status)">
                  {{ getPlanStatusText(plan.status) }}
                </view>
              </view>
              <view v-if="plan.content" class="text-xs mb-2 line-clamp-2" :class="textSecondaryClass">
                {{ plan.content }}
              </view>
              <view class="flex items-center justify-between text-xs" :class="textMutedClass">
                <view class="flex items-center gap-1">
                  <wd-icon name="calendar" size="12px" />
                  <text>{{ formatDate(plan.startTime) }} ~ {{ formatDate(plan.endTime) }}</text>
                </view>
              </view>
              <!-- 进度条 -->
              <view v-if="plan.progress !== undefined" class="mt-2">
                <view class="flex items-center justify-between text-xs mb-1">
                  <view :class="textMutedClass">进度</view>
                  <view class="font-medium" :class="textPrimaryClass">{{ plan.progress }}%</view>
                </view>
                <view class="h-1.5 rounded-full overflow-hidden" :class="isDark ? 'bg-slate-700' : 'bg-gray-200'">
                  <view
                    class="h-full rounded-full"
                    :class="getProgressColor(plan.progress)"
                    :style="{ width: `${plan.progress}%` }"
                  />
                </view>
              </view>
            </view>
          </ThemeCard>
        </view>
      </view>

      <!-- 周报 Tab -->
      <view v-show="currentTab === 2" class="px-4">
        <view v-if="reports.length === 0" class="py-12 text-center">
          <view class="text-sm" :class="textMutedClass">暂无周报</view>
        </view>
        <view v-else class="space-y-3">
          <ThemeCard
            v-for="report in reports"
            :key="report.id"
            :padding="false"
          >
            <view class="p-4">
              <view class="flex items-start justify-between mb-2">
                <view class="font-medium text-sm" :class="textPrimaryClass">{{ report.title || '周报' }}</view>
                <view class="text-[10px] px-1.5 py-0.5 rounded" :class="getReportStatusColor(report.status)">
                  {{ getReportStatusText(report.status) }}
                </view>
              </view>
              <view class="text-xs mb-2 line-clamp-3" :class="textSecondaryClass">
                {{ report.content }}
              </view>
              <view class="flex items-center justify-between text-xs" :class="textMutedClass">
                <view class="flex items-center gap-1">
                  <wd-icon name="calendar" size="12px" />
                  <text>{{ formatDate(report.reportDate) }}</text>
                </view>
              </view>
              <!-- 审阅意见 -->
              <view v-if="report.reviewComment" class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <view class="text-xs" :class="textSecondaryClass">
                  审阅意见: {{ report.reviewComment }}
                </view>
              </view>
            </view>
          </ThemeCard>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
}
</style>

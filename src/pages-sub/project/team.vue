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
import { getTeamDetail, getTeamMemberList, getPlanList, getReportPage } from '@/api/project'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'

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
    await Promise.all([
      loadTeam(),
      loadMembers(),
      loadPlans(),
      loadReports(),
    ])
  }
  finally {
    loading.value = false
  }
}

async function loadTeam() {
  const response = await getTeamDetail(teamId.value)
  if (response.code === 0 && response.data) {
    team.value = response.data
    uni.setNavigationBarTitle({ title: response.data.name || '队伍详情' })
  }
}

async function loadMembers() {
  const response = await getTeamMemberList(teamId.value)
  if (response.code === 0 && response.data) {
    members.value = response.data
  }
}

async function loadPlans() {
  const response = await getPlanList(teamId.value)
  if (response.code === 0 && response.data) {
    plans.value = response.data
  }
}

async function loadReports() {
  const response = await getReportPage({ teamId: teamId.value, pageNo: 1, pageSize: 10 })
  if (response.code === 0 && response.data) {
    reports.value = response.data.list
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
      <!-- 队伍头部 -->
      <view class="px-4 pt-4">
        <ThemeCard :padding="false" card-class="mb-4">
          <view class="p-4">
            <view class="flex items-start justify-between mb-2">
              <view class="text-xl font-bold" :class="textPrimaryClass">
                {{ team.name }}
              </view>
              <view class="text-xs px-2 py-0.5 rounded" :class="isDark ? 'bg-slate-700' : 'bg-gray-100'">
                {{ team.categoryName }}
              </view>
            </view>
            <view v-if="team.description" class="text-sm mb-3" :class="textSecondaryClass">
              {{ team.description }}
            </view>
            <view class="flex items-center gap-4 text-xs" :class="textMutedClass">
              <view class="flex items-center gap-1">
                <wd-icon name="user" size="12px" />
                <text>队长: {{ team.captainName || '暂无' }}</text>
              </view>
              <view class="flex items-center gap-1">
                <wd-icon name="friends" size="12px" />
                <text>{{ team.currentCount || 0 }}/{{ team.recruitCount || 0 }} 人</text>
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
              <view v-else class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {{ (member.userName || '?')[0] }}
              </view>
              <view class="flex-1">
                <view class="text-sm font-medium" :class="textPrimaryClass">
                  {{ member.userName }}
                </view>
                <view v-if="member.role === 'captain'" class="text-[10px] text-orange-500">
                  队长
                </view>
              </view>
              <view class="text-xs" :class="textMutedClass">
                {{ formatDate(member.joinTime) }} 加入
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
                <view class="font-medium" :class="textPrimaryClass">{{ plan.title }}</view>
                <view class="text-[10px] px-1.5 py-0.5 rounded" :class="getPlanStatusColor(plan.status)">
                  {{ getPlanStatusText(plan.status) }}
                </view>
              </view>
              <view v-if="plan.content" class="text-xs mb-2 line-clamp-2" :class="textSecondaryClass">
                {{ plan.content }}
              </view>
              <view class="flex items-center gap-3 text-xs" :class="textMutedClass">
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
                <view class="font-medium" :class="textPrimaryClass">{{ report.title || '周报' }}</view>
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

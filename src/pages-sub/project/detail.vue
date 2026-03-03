<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "项目详情"
  }
}
</route>

<script lang="ts" setup>
import type { ProjectBaseInfo, ProjectStatistics, ProjectTeamInfo, ProjectTeamMember } from '@/api/types/project'
import { computed, ref } from 'vue'
import { getMyTeam, getProjectDetail, getProjectStatistics, getTeamList, getTeamMemberList } from '@/api/project'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'

defineOptions({
  name: 'ProjectDetail',
})

// 页面参数
const projectId = ref<number>(0)
const loading = ref(true)

// 数据
const project = ref<ProjectBaseInfo | null>(null)
const statistics = ref<ProjectStatistics | null>(null)
const teams = ref<ProjectTeamInfo[]>([])
const myTeam = ref<ProjectTeamInfo | null>(null)
const teamMembers = ref<ProjectTeamMember[]>([])

// 主题适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))

// Tab 状态
const currentTab = ref(0)
const tabs = ['概览', '队伍', '我的']

onLoad((options) => {
  if (options.id) {
    projectId.value = Number(options.id)
    loadData()
  }
})

// 加载数据
async function loadData() {
  loading.value = true
  try {
    await Promise.all([
      loadProject(),
      loadStatistics(),
      loadTeams(),
      loadMyTeam(),
    ])
  }
  finally {
    loading.value = false
  }
}

async function loadProject() {
  const response = await getProjectDetail(projectId.value)
  if (response.code === 0 && response.data) {
    project.value = response.data
    uni.setNavigationBarTitle({ title: response.data.name || '项目详情' })
  }
}

async function loadStatistics() {
  const response = await getProjectStatistics(projectId.value)
  if (response.code === 0 && response.data) {
    statistics.value = response.data
  }
}

async function loadTeams() {
  const response = await getTeamList(projectId.value)
  if (response.code === 0 && response.data) {
    teams.value = response.data
  }
}

async function loadMyTeam() {
  try {
    const response = await getMyTeam(projectId.value)
    if (response.code === 0 && response.data) {
      myTeam.value = response.data
      // 加载队伍成员
      loadTeamMembers(response.data.id)
    }
  }
  catch {
    // 未加入任何队伍
    myTeam.value = null
  }
}

async function loadTeamMembers(teamId: number) {
  const response = await getTeamMemberList(teamId)
  if (response.code === 0 && response.data) {
    teamMembers.value = response.data
  }
}

// 获取状态样式
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    recruiting: isDark.value ? 'text-blue-400 bg-blue-500/15' : 'text-blue-600 bg-blue-50',
    planning: isDark.value ? 'text-orange-400 bg-orange-500/15' : 'text-orange-600 bg-orange-50',
    in_progress: isDark.value ? 'text-green-400 bg-green-500/15' : 'text-green-600 bg-green-50',
    completed: isDark.value ? 'text-purple-400 bg-purple-500/15' : 'text-purple-600 bg-purple-50',
    archived: isDark.value ? 'text-gray-400 bg-gray-500/15' : 'text-gray-600 bg-gray-50',
  }
  return colors[status] || (isDark.value ? 'text-gray-400 bg-white/10' : 'text-gray-600 bg-gray-50')
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    recruiting: '招募中',
    planning: '计划制定中',
    in_progress: '执行中',
    completed: '已结项',
    archived: '已归档',
  }
  return texts[status] || '未知'
}

// 格式化日期
function formatDate(date?: string): string {
  if (!date)
    return '-'
  return date.split(' ')[0]
}

// 跳转到队伍详情
function goToTeam(teamId: number) {
  uni.navigateTo({
    url: `/pages-sub/project/team?id=${teamId}`,
  })
}

// 获取进度条颜色
function getProgressColor(rate: number): string {
  if (rate >= 80)
    return 'bg-green-500'
  if (rate >= 50)
    return 'bg-blue-500'
  if (rate >= 30)
    return 'bg-orange-500'
  return 'bg-gray-400'
}
</script>

<template>
  <view class="min-h-screen" :class="isDark ? 'bg-slate-950' : 'bg-[#f5f7fa]'">
    <!-- 加载中 -->
    <view v-if="loading" class="p-4">
      <wd-skeleton theme="paragraph" />
    </view>

    <view v-else-if="project">
      <!-- 项目头部信息 -->
      <view class="px-4 pt-4">
        <ThemeCard :padding="false" card-class="mb-4">
          <view class="p-4">
            <!-- 封面图 -->
            <view v-if="project.coverImage" class="mb-3 aspect-[16/9] overflow-hidden rounded-xl">
              <image :src="project.coverImage" class="w-full h-full object-cover" mode="aspectFill" />
            </view>

            <!-- 状态 + 年度 -->
            <view class="flex items-center gap-2 mb-2">
              <view class="rounded-full px-2.5 py-1 text-[10px] font-medium" :class="getStatusColor(project.status)">
                {{ getStatusText(project.status) }}
              </view>
              <view class="text-xs" :class="textMutedClass">
                {{ project.year }} 年度
              </view>
            </view>

            <!-- 项目名称 -->
            <view class="text-xl font-bold mb-2" :class="textPrimaryClass">
              {{ project.name }}
            </view>

            <!-- 项目目标 -->
            <view v-if="project.goal" class="text-sm mb-3" :class="textSecondaryClass">
              {{ project.goal }}
            </view>

            <!-- 时间范围 -->
            <view class="flex items-center gap-4 text-xs" :class="textMutedClass">
              <view class="flex items-center gap-1">
                <wd-icon name="calendar" size="12px" />
                <text>{{ formatDate(project.startTime) }} ~ {{ formatDate(project.endTime) }}</text>
              </view>
            </view>
          </view>
        </ThemeCard>
      </view>

      <!-- Tab 切换 -->
      <view class="px-4 mb-4">
        <wd-tabs v-model="currentTab">
          <wd-tab title="概览" />
          <wd-tab title="队伍" />
          <wd-tab title="我的" />
        </wd-tabs>
      </view>

      <!-- 概览 Tab -->
      <view v-show="currentTab === 0" class="px-4">
        <!-- 统计数据 -->
        <ThemeCard v-if="statistics" :padding="false" card-class="mb-4">
          <view class="p-4">
            <view class="text-base font-semibold mb-3" :class="textPrimaryClass">
              项目统计
            </view>
            <view class="grid grid-cols-4 gap-4">
              <view class="text-center">
                <view class="text-2xl font-bold text-blue-500">{{ statistics.teamCount }}</view>
                <view class="text-xs" :class="textMutedClass">队伍</view>
              </view>
              <view class="text-center">
                <view class="text-2xl font-bold text-green-500">{{ statistics.memberCount }}</view>
                <view class="text-xs" :class="textMutedClass">成员</view>
              </view>
              <view class="text-center">
                <view class="text-2xl font-bold text-orange-500">{{ statistics.planCount }}</view>
                <view class="text-xs" :class="textMutedClass">计划</view>
              </view>
              <view class="text-center">
                <view class="text-2xl font-bold text-purple-500">{{ statistics.reportCount }}</view>
                <view class="text-xs" :class="textMutedClass">周报</view>
              </view>
            </view>

            <!-- 计划完成率 -->
            <view class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <view class="flex items-center justify-between text-sm mb-2">
                <view :class="textSecondaryClass">计划完成率</view>
                <view class="font-semibold" :class="textPrimaryClass">{{ statistics.planCompletionRate }}%</view>
              </view>
              <view class="h-2 rounded-full overflow-hidden" :class="isDark ? 'bg-slate-700' : 'bg-gray-200'">
                <view
                  class="h-full rounded-full transition-all duration-500"
                  :class="getProgressColor(statistics.planCompletionRate)"
                  :style="{ width: `${statistics.planCompletionRate}%` }"
                />
              </view>
            </view>
          </view>
        </ThemeCard>

        <!-- 项目描述 -->
        <ThemeCard v-if="project.description" :padding="false">
          <view class="p-4">
            <view class="text-base font-semibold mb-2" :class="textPrimaryClass">
              项目描述
            </view>
            <view class="text-sm leading-relaxed" :class="textSecondaryClass">
              {{ project.description }}
            </view>
          </view>
        </ThemeCard>
      </view>

      <!-- 队伍 Tab -->
      <view v-show="currentTab === 1" class="px-4">
        <view v-if="teams.length === 0" class="py-12 text-center">
          <view class="text-sm" :class="textMutedClass">暂无队伍</view>
        </view>
        <view v-else class="space-y-3">
          <ThemeCard
            v-for="team in teams"
            :key="team.id"
            :padding="false"
            card-class="active:scale-[0.99] transition-transform"
            @click="goToTeam(team.id)"
          >
            <view class="p-4">
              <view class="flex items-center justify-between mb-2">
                <view class="font-semibold" :class="textPrimaryClass">{{ team.name }}</view>
                <view class="text-xs px-2 py-0.5 rounded" :class="isDark ? 'bg-slate-700' : 'bg-gray-100'">
                  {{ team.categoryName }}
                </view>
              </view>
              <view class="flex items-center justify-between text-xs" :class="textMutedClass">
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
      </view>

      <!-- 我的 Tab -->
      <view v-show="currentTab === 2" class="px-4">
        <view v-if="!myTeam" class="py-12 text-center">
          <view class="text-sm mb-2" :class="textMutedClass">您还未加入任何队伍</view>
          <wd-button type="primary" size="small" @click="currentTab = 1">
            查看队伍列表
          </wd-button>
        </view>
        <view v-else class="space-y-3">
          <!-- 我的队伍 -->
          <ThemeCard :padding="false" @click="goToTeam(myTeam.id)">
            <view class="p-4">
              <view class="flex items-center justify-between mb-2">
                <view class="font-semibold" :class="textPrimaryClass">{{ myTeam.name }}</view>
                <view class="text-xs px-2 py-0.5 rounded" :class="isDark ? 'bg-slate-700' : 'bg-gray-100'">
                  {{ myTeam.categoryName }}
                </view>
              </view>
              <view class="text-xs" :class="textMutedClass">
                队长: {{ myTeam.captainName || '暂无' }} · {{ teamMembers.length }} 名成员
              </view>
            </view>
          </ThemeCard>

          <!-- 队伍成员 -->
          <ThemeCard :padding="false">
            <view class="p-4">
              <view class="text-sm font-semibold mb-3" :class="textPrimaryClass">
                队伍成员
              </view>
              <view class="space-y-2">
                <view
                  v-for="member in teamMembers"
                  :key="member.id"
                  class="flex items-center justify-between py-1"
                >
                  <view class="flex items-center gap-2">
                    <image
                      v-if="member.userAvatar"
                      :src="member.userAvatar"
                      class="w-8 h-8 rounded-full"
                      mode="aspectFill"
                    />
                    <view v-else class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                      {{ (member.userName || '?')[0] }}
                    </view>
                    <view>
                      <view class="text-sm" :class="textPrimaryClass">{{ member.userName }}</view>
                      <view v-if="member.role === 'captain'" class="text-[10px] text-orange-500">队长</view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </ThemeCard>

          <!-- 快捷操作 -->
          <ThemeCard :padding="false">
            <view class="p-4">
              <view class="text-sm font-semibold mb-3" :class="textPrimaryClass">
                快捷操作
              </view>
              <view class="grid grid-cols-2 gap-3">
                <view
                  class="flex flex-col items-center justify-center py-3 rounded-xl active:opacity-70"
                  :class="isDark ? 'bg-slate-800' : 'bg-gray-50'"
                  @click="uni.navigateTo({ url: `/pages-sub/project/plan?teamId=${myTeam.id}` })"
                >
                  <wd-icon name="notes" size="24px" :color="isDark ? '#60a5fa' : '#3b82f6'" />
                  <view class="text-xs mt-1" :class="textSecondaryClass">计划管理</view>
                </view>
                <view
                  class="flex flex-col items-center justify-center py-3 rounded-xl active:opacity-70"
                  :class="isDark ? 'bg-slate-800' : 'bg-gray-50'"
                  @click="uni.navigateTo({ url: `/pages-sub/project/report?teamId=${myTeam.id}` })"
                >
                  <wd-icon name="writing" size="24px" :color="isDark ? '#4ade80' : '#22c55e'" />
                  <view class="text-xs mt-1" :class="textSecondaryClass">周报管理</view>
                </view>
              </view>
            </view>
          </ThemeCard>
        </view>
      </view>
    </view>
  </view>
</template>

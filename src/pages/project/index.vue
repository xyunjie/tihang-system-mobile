<route lang="jsonc">
{
  "layout": "tabbar",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "项目",
    "enablePullDownRefresh": true,
    "navigationBarBackgroundColor": "#2563eb",
    "navigationBarTextStyle": "white"
  }
}
</route>

<script lang="ts" setup>
import type { ProjectTeamInfo } from '@/api/types/project'
import { computed, ref, watch } from 'vue'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'
import { getTeamsByStatus } from './mockData'

defineOptions({
  name: 'ProjectTab',
})

// 页面状态
const loading = ref(true)
const refreshing = ref(false)

// 主题适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const date = now.getDate()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${month}月${date}日 ${weekdays[now.getDay()]}`
})

// 队伍列表（按状态分组）
const teamsData = ref<{
  inProgress: Array<ProjectTeamInfo & { project: any }>
  recruiting: Array<ProjectTeamInfo & { project: any }>
  completed: Array<ProjectTeamInfo & { project: any }>
  all: Array<ProjectTeamInfo & { project: any }>
}>({
    inProgress: [],
    recruiting: [],
    completed: [],
    all: [],
})

// 统计数据
const stats = computed(() => ({
  total: teamsData.value.all.length,
  inProgress: teamsData.value.inProgress.length,
  recruiting: teamsData.value.recruiting.length,
  completed: teamsData.value.completed.length,
}))

onShow(() => {
  loadTeams()
})

// 下拉刷新
onPullDownRefresh(async () => {
  await handleRefresh()
})

async function handleRefresh() {
  refreshing.value = true
  await loadTeams(false)
  uni.stopPullDownRefresh()
}

// 加载队伍列表
async function loadTeams(showLoading = true) {
  if (showLoading)
    loading.value = true

  try {
    // 使用假数据
    teamsData.value = getTeamsByStatus()

    // 延迟模拟网络请求
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  catch (error) {
    console.error('加载队伍列表失败:', error)
  }
  finally {
    loading.value = false
    refreshing.value = false
  }
}

// 获取项目状态颜色
function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    recruiting: isDark.value ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50',
    planning: isDark.value ? 'text-orange-400 bg-orange-500/10' : 'text-orange-600 bg-orange-50',
    in_progress: isDark.value ? 'text-green-400 bg-green-500/10' : 'text-green-600 bg-green-50',
    completed: isDark.value ? 'text-gray-400 bg-white/10' : 'text-gray-600 bg-gray-50',
    archived: isDark.value ? 'text-gray-400 bg-white/10' : 'text-gray-600 bg-gray-50',
  }
  return statusColors[status] || (isDark.value ? 'text-gray-400 bg-white/10' : 'text-gray-600 bg-gray-50')
}

// 获取项目状态文本
function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    recruiting: '招募中',
    planning: '计划中',
    in_progress: '进行中',
    completed: '已结束',
    archived: '已归档',
  }
  return statusTexts[status] || '未知'
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

// 跳转到队伍详情
function goToTeamDetail(teamId: number) {
  uni.navigateTo({ url: `/pages-sub/project/team?id=${teamId}` })
}

// 动态设置背景色
function setPageBackgroundColor() {
  const bgColor = isDark.value ? '#020617' : '#f5f7fa'
  uni.setBackgroundColor({
    backgroundColor: bgColor,
    backgroundColorTop: bgColor,
    backgroundColorBottom: bgColor,
  })
}

// 监听主题变化
watch(() => isDark.value, () => {
  setPageBackgroundColor()
})

onMounted(() => {
  setPageBackgroundColor()
})
</script>

<template>
  <view class="relative min-h-screen bg-[#f5f7fa] dark:bg-slate-950">
    <!-- 顶部背景 -->
    <view class="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#2563eb] to-[#3b82f6] rounded-b-[1.5rem] shadow-sm z-0" />

    <!-- 头部区域 (仅占位，用于撑开高度) -->
    <view class="relative z-10 pt-14 px-5 pb-3 text-white">
      <view class="flex justify-between items-center mb-1">
        <view class="text-lg font-semibold opacity-95 tracking-wide">我的项目</view>
      </view>
    </view>

    <!-- 核心统计卡片 (重叠布局) -->
    <view class="relative z-10 px-4 mt-2">
      <ThemeCard card-class="mb-6 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] dark:shadow-blue-900/20 overflow-hidden border-0" :padding="false">
        <view class="grid grid-cols-3 py-6 bg-white dark:bg-slate-800">
          <!-- 进行中 -->
          <view class="flex flex-col items-center justify-center gap-2">
            <view class="p-3 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400">
              <wd-icon name="check-outline" size="24px" />
            </view>
            <view class="text-xs font-medium" :class="textSecondaryClass">进行中 {{ stats.inProgress }}</view>
          </view>

          <!-- 招募中 -->
          <view class="flex flex-col items-center justify-center gap-2">
            <view class="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <wd-icon name="user-circle" size="24px" />
            </view>
            <view class="text-xs font-medium" :class="textSecondaryClass">招募中 {{ stats.recruiting }}</view>
          </view>

          <!-- 已结束 -->
          <view class="flex flex-col items-center justify-center gap-2">
            <view class="p-3 rounded-2xl bg-gray-50 dark:bg-white/10 text-gray-600 dark:text-gray-400">
              <wd-icon name="stop" size="24px" />
            </view>
            <view class="text-xs font-medium" :class="textSecondaryClass">已结束 {{ stats.completed }}</view>
          </view>
        </view>
      </ThemeCard>
    </view>

    <!-- 主要内容区 -->
    <view class="px-4 pb-24 space-y-6">
      <!-- 加载中 -->
      <view v-if="loading" class="space-y-3">
        <view v-for="n in 3" :key="n" class="animate-pulse">
          <ThemeCard :padding="false">
            <view class="p-4">
              <view class="h-5 w-3/4 rounded mb-3" :class="isDark ? 'bg-white/12' : 'bg-gray-200'" />
              <view class="h-3 w-1/2 rounded mb-2" :class="isDark ? 'bg-white/8' : 'bg-gray-100'" />
              <view class="h-3 w-2/3 rounded" :class="isDark ? 'bg-white/8' : 'bg-gray-100'" />
            </view>
          </ThemeCard>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="stats.total === 0" class="flex flex-col items-center justify-center py-12 opacity-40">
        <wd-icon name="folder" size="48px" class="mb-3" :color="isDark ? '#64748b' : '#94a3b8'" />
        <view class="text-sm font-medium" :class="textSecondaryClass">
          暂未加入任何队伍
        </view>
      </view>

      <!-- 队伍列表 -->
      <view v-else class="space-y-4">
        <!-- 进行中的队伍 -->
        <view v-if="stats.inProgress > 0">
          <view class="mb-3 px-1">
            <view class="flex items-center gap-2">
              <view class="w-1 h-4 rounded-full bg-green-500" />
              <view class="text-sm font-semibold" :class="textPrimaryClass">进行中</view>
            </view>
          </view>
          <view class="space-y-3">
            <ThemeCard
              v-for="team in teamsData.inProgress"
              :key="team.id"
              :padding="false"
              card-class="shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.99] transition-transform duration-200"
              @click="goToTeamDetail(team.id)"
            >
              <view class="p-4">
                <!-- 项目名称 + 状态 -->
                <view class="flex items-center justify-between mb-2">
                  <view class="flex items-center gap-2">
                    <view class="rounded px-2 py-0.5 text-[10px] font-medium" :class="getStatusColor(team.project.status)">
                      {{ getStatusText(team.project.status) }}
                    </view>
                    <view class="text-xs" :class="textMutedClass">
                      {{ team.project.year }}年度
                    </view>
                  </view>
                  <wd-icon name="arrow-right" size="16px" :color="isDark ? '#64748b' : '#94a3b8'" />
                </view>

                <!-- 项目名称 -->
                <view class="text-sm font-semibold mb-1" :class="textPrimaryClass">
                  {{ team.project.name }}
                </view>

                <!-- 队伍名称 + 成员数 -->
                <view class="flex items-center gap-3 text-xs mb-2" :class="textSecondaryClass">
                  <view class="flex items-center gap-1">
                    <wd-icon name="user" size="12px" />
                    <text>{{ team.name }}</text>
                  </view>
                  <view class="flex items-center gap-1">
                    <wd-icon name="user-circle" size="12px" />
                    <text>{{ team.currentCount }}人</text>
                  </view>
                </view>

                <!-- 进度条（如果有） -->
                <view class="h-1.5 rounded-full overflow-hidden" :class="isDark ? 'bg-slate-700' : 'bg-gray-200'">
                  <view
                    class="h-full rounded-full"
                    :class="getProgressColor(75)"
                    style="width: 75%"
                  />
                </view>
              </view>
            </ThemeCard>
          </view>
        </view>

        <!-- 招募中的队伍 -->
        <view v-if="stats.recruiting > 0">
          <view class="mb-3 px-1">
            <view class="flex items-center gap-2">
              <view class="w-1 h-4 rounded-full bg-blue-500" />
              <view class="text-sm font-semibold" :class="textPrimaryClass">招募中</view>
            </view>
          </view>
          <view class="space-y-3">
            <ThemeCard
              v-for="team in teamsData.recruiting"
              :key="team.id"
              :padding="false"
              card-class="shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.99] transition-transform duration-200"
              @click="goToTeamDetail(team.id)"
            >
              <view class="p-4">
                <!-- 项目名称 + 状态 -->
                <view class="flex items-center justify-between mb-2">
                  <view class="flex items-center gap-2">
                    <view class="rounded px-2 py-0.5 text-[10px] font-medium" :class="getStatusColor(team.project.status)">
                      {{ getStatusText(team.project.status) }}
                    </view>
                    <view class="text-xs" :class="textMutedClass">
                      {{ team.project.year }}年度
                    </view>
                  </view>
                  <wd-icon name="arrow-right" size="16px" :color="isDark ? '#64748b' : '#94a3b8'" />
                </view>

                <!-- 项目名称 -->
                <view class="text-sm font-semibold mb-1" :class="textPrimaryClass">
                  {{ team.project.name }}
                </view>

                <!-- 队伍名称 + 成员数 -->
                <view class="flex items-center gap-3 text-xs mb-2" :class="textSecondaryClass">
                  <view class="flex items-center gap-1">
                    <wd-icon name="user" size="12px" />
                    <text>{{ team.name }}</text>
                  </view>
                  <view class="flex items-center gap-1">
                    <wd-icon name="user-circle" size="12px" />
                    <text>{{ team.currentCount }}/{{ team.recruitCount }}人</text>
                  </view>
                </view>

                <!-- 招募进度 -->
                <view class="h-1.5 rounded-full overflow-hidden" :class="isDark ? 'bg-slate-700' : 'bg-gray-200'">
                  <view
                    class="h-full rounded-full bg-blue-500"
                    :style="{ width: `${(team.currentCount / team.recruitCount) * 100}%` }"
                  />
                </view>
              </view>
            </ThemeCard>
          </view>
        </view>

        <!-- 已结束的队伍 -->
        <view v-if="stats.completed > 0">
          <view class="mb-3 px-1">
            <view class="flex items-center gap-2">
              <view class="w-1 h-4 rounded-full bg-gray-400" />
              <view class="text-sm font-semibold" :class="textPrimaryClass">已结束</view>
            </view>
          </view>
          <view class="space-y-3">
            <ThemeCard
              v-for="team in teamsData.completed"
              :key="team.id"
              :padding="false"
              card-class="shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.99] transition-transform duration-200 opacity-70"
              @click="goToTeamDetail(team.id)"
            >
              <view class="p-4">
                <!-- 项目名称 + 状态 -->
                <view class="flex items-center justify-between mb-2">
                  <view class="flex items-center gap-2">
                    <view class="rounded px-2 py-0.5 text-[10px] font-medium" :class="getStatusColor(team.project.status)">
                      {{ getStatusText(team.project.status) }}
                    </view>
                  </view>
                  <wd-icon name="arrow-right" size="16px" :color="isDark ? '#64748b' : '#94a3b8'" />
                </view>

                <!-- 项目名称 -->
                <view class="text-sm font-semibold mb-1" :class="textPrimaryClass">
                  {{ team.project.name }}
                </view>

                <!-- 队伍名称 -->
                <view class="flex items-center gap-2 text-xs" :class="textSecondaryClass">
                  <view class="flex items-center gap-1">
                    <wd-icon name="user" size="12px" />
                    <text>{{ team.name }}</text>
                  </view>
                </view>
              </view>
            </ThemeCard>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
  -webkit-appearance: none;
  background: transparent;
}
</style>

<style>
/* 强制覆盖 page 背景色 */
page {
  background-color: #f5f7fa;
}
.dark page {
  background-color: #020617;
}
</style>

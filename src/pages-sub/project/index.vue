<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "我的项目",
    "navigationStyle": "custom"
  }
}
</route>

<script lang="ts" setup>
import type { ProjectBaseInfo, ProjectStatistics } from '@/api/types/project'
import { computed, ref } from 'vue'
import { getMyProjects, getProjectStatistics } from '@/api/project'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'

defineOptions({
  name: 'ProjectList',
})

// 页面状态
const projects = ref<ProjectBaseInfo[]>([])
const projectStats = ref<Record<number, ProjectStatistics>>({})
const loading = ref(true)
const refreshing = ref(false)

// 主题适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))

// 状态栏高度
const statusBarHeight = ref(0)

onLoad(() => {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
  loadProjects()
})

// 加载项目列表
async function loadProjects(showLoading = true) {
  if (showLoading)
    loading.value = true

  try {
    const response = await getMyProjects()
    if (response.code === 0 && response.data) {
      projects.value = response.data
      // 加载每个项目的统计数据
      for (const project of response.data) {
        loadProjectStats(project.id)
      }
    }
  }
  catch (error) {
    console.error('加载项目列表失败:', error)
  }
  finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载项目统计
async function loadProjectStats(projectId: number) {
  try {
    const response = await getProjectStatistics(projectId)
    if (response.code === 0 && response.data) {
      projectStats.value[projectId] = response.data
    }
  }
  catch (error) {
    console.error('加载项目统计失败:', error)
  }
}

// 下拉刷新
async function handleRefresh() {
  refreshing.value = true
  await loadProjects(false)
  uni.stopPullDownRefresh()
}

// 获取项目状态颜色
function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    recruiting: isDark.value ? 'text-blue-400 bg-blue-500/15' : 'text-blue-600 bg-blue-50',
    planning: isDark.value ? 'text-orange-400 bg-orange-500/15' : 'text-orange-600 bg-orange-50',
    in_progress: isDark.value ? 'text-green-400 bg-green-500/15' : 'text-green-600 bg-green-50',
    completed: isDark.value ? 'text-purple-400 bg-purple-500/15' : 'text-purple-600 bg-purple-50',
    archived: isDark.value ? 'text-gray-400 bg-gray-500/15' : 'text-gray-600 bg-gray-50',
  }
  return statusColors[status] || (isDark.value ? 'text-gray-400 bg-white/10' : 'text-gray-600 bg-gray-50')
}

// 获取项目状态文本
function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    recruiting: '招募中',
    planning: '计划制定中',
    in_progress: '执行中',
    completed: '已结项',
    archived: '已归档',
  }
  return statusTexts[status] || '未知'
}

// 格式化日期
function formatDate(date?: string): string {
  if (!date)
    return '-'
  return date.split(' ')[0]
}

// 跳转到项目详情
function goToDetail(projectId: number) {
  uni.navigateTo({
    url: `/pages-sub/project/detail?id=${projectId}`,
  })
}

// 计算进度条颜色
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
    <!-- 自定义导航栏 -->
    <view
      class="fixed top-0 left-0 right-0 z-50"
      :style="{ paddingTop: `${statusBarHeight}px` }"
    >
      <!-- 渐变背景 -->
      <view class="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500" />
      <!-- 装饰 -->
      <view class="absolute right-[-30px] top-[-20px] h-28 w-28 rounded-full bg-white/10" />

      <!-- 导航内容 -->
      <view class="relative px-4 pb-4">
        <view class="flex items-center justify-between py-2">
          <view class="text-xl font-bold text-white">
            我的项目
          </view>
          <view class="flex items-center gap-2">
            <view
              class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"
              @click="uni.navigateBack()"
            >
              <wd-icon name="arrow-left" size="18px" color="#fff" />
            </view>
          </view>
        </view>
        <view class="mt-1 text-sm text-white/80">
          参与的项目一览
        </view>
      </view>
    </view>

    <!-- 占位区域 -->
    <view :style="{ height: `${statusBarHeight + 90}px` }" />

    <!-- 加载中 -->
    <view v-if="loading" class="px-4 pt-4">
      <view v-for="n in 3" :key="n" class="mb-4">
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
    <view v-else-if="projects.length === 0" class="flex flex-col items-center justify-center py-20">
      <view class="mb-4 h-16 w-16 rounded-2xl bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
        <wd-icon name="folder" size="32px" :color="isDark ? '#64748b' : '#94a3b8'" />
      </view>
      <view class="text-base font-medium mb-1" :class="textPrimaryClass">
        暂无参与的项目
      </view>
      <view class="text-sm" :class="textMutedClass">
        加入项目后即可在此查看
      </view>
    </view>

    <!-- 项目列表 -->
    <view v-else class="px-4 pb-4 space-y-4">
      <ThemeCard
        v-for="project in projects"
        :key="project.id"
        :padding="false"
        card-class="shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.99] transition-transform duration-200"
        @click="goToDetail(project.id)"
      >
        <view class="p-4">
          <!-- 头部：状态 + 年度 -->
          <view class="flex items-center justify-between mb-3">
            <view class="flex items-center gap-2">
              <view
                class="rounded-full px-2.5 py-1 text-[10px] font-medium"
                :class="getStatusColor(project.status)"
              >
                {{ getStatusText(project.status) }}
              </view>
              <view class="text-xs" :class="textMutedClass">
                {{ project.year }} 年度
              </view>
            </view>
            <wd-icon name="arrow-right" size="16px" :color="isDark ? '#64748b' : '#94a3b8'" />
          </view>

          <!-- 项目名称 -->
          <view class="text-base font-semibold mb-2" :class="textPrimaryClass">
            {{ project.name }}
          </view>

          <!-- 项目目标 -->
          <view v-if="project.goal" class="line-clamp-2 text-xs mb-3" :class="textSecondaryClass">
            {{ project.goal }}
          </view>

          <!-- 时间范围 -->
          <view class="flex items-center gap-2 text-xs mb-3" :class="textMutedClass">
            <wd-icon name="calendar" size="12px" />
            <text>{{ formatDate(project.startTime) }} ~ {{ formatDate(project.endTime) }}</text>
          </view>

          <!-- 统计数据 -->
          <view v-if="projectStats[project.id]" class="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <view class="text-center">
              <view class="text-base font-bold" :class="textPrimaryClass">
                {{ projectStats[project.id].teamCount }}
              </view>
              <view class="text-[10px]" :class="textMutedClass">队伍</view>
            </view>
            <view class="text-center">
              <view class="text-base font-bold" :class="textPrimaryClass">
                {{ projectStats[project.id].memberCount }}
              </view>
              <view class="text-[10px]" :class="textMutedClass">成员</view>
            </view>
            <view class="text-center">
              <view class="text-base font-bold" :class="textPrimaryClass">
                {{ projectStats[project.id].planCount }}
              </view>
              <view class="text-[10px]" :class="textMutedClass">计划</view>
            </view>
            <view class="text-center">
              <view class="text-base font-bold" :class="textPrimaryClass">
                {{ projectStats[project.id].reportCount }}
              </view>
              <view class="text-[10px]" :class="textMutedClass">周报</view>
            </view>
          </view>

          <!-- 计划完成率 -->
          <view v-if="projectStats[project.id]" class="mt-3">
            <view class="flex items-center justify-between text-xs mb-1">
              <view :class="textMutedClass">计划完成率</view>
              <view class="font-medium" :class="textPrimaryClass">
                {{ projectStats[project.id].planCompletionRate }}%
              </view>
            </view>
            <view class="h-1.5 rounded-full overflow-hidden" :class="isDark ? 'bg-slate-700' : 'bg-gray-200'">
              <view
                class="h-full rounded-full transition-all duration-300"
                :class="getProgressColor(projectStats[project.id].planCompletionRate)"
                :style="{ width: `${projectStats[project.id].planCompletionRate}%` }"
              />
            </view>
          </view>
        </view>
      </ThemeCard>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
}
</style>

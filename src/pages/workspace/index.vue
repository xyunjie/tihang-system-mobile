<!-- 工作台页面 -->
<route lang="jsonc" type="page">
{
  "layout": "tabbar",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "工作台",
    "enablePullDownRefresh": true,
    "navigationBarBackgroundColor": "#2563eb",
    "navigationBarTextStyle": "white"
  }
}
</route>

<script setup lang="ts">
import type { BpmCategoryRespVO, BpmTaskStatisticsRespVO, ProcessDefinitionRespVO } from '@/api/types/bpm'
import { computed, reactive, ref } from 'vue'
import { getCategorySimpleList, getProcessDefinitionList, getTaskStatistics } from '@/api/bpm'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'

defineOptions({
  name: 'Workspace',
})

// 页面状态管理
const pageState = reactive({
  loading: false,
  refreshing: false,
  error: null as string | null,
  categoriesLoading: false,
})

// 下拉刷新相关状态
const isRefreshing = ref(false)

// 审批分类数据
const bpmCategories = ref<BpmCategoryRespVO[]>([])

// 流程定义数据
const processDefinitions = ref<ProcessDefinitionRespVO[]>([])
const processDefinitionsLoading = ref(false)

// 统计数据
const statistics = ref<BpmTaskStatisticsRespVO>({
  pendingCount: 0,
  completedCount: 0,
  ccCount: 0,
  todayCount: 0,
})

// 主题适配：浅色/深色
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const borderMutedClass = computed(() => (isDark.value ? 'border-white/10' : 'border-gray-100'))
const subTileBgClass = computed(() => (isDark.value ? 'bg-white/6 border border-white/8' : 'bg-slate-50 border border-slate-100'))

// 按分类获取流程定义
const processDefinitionsByCategory = computed(() => {
  const categoryMap: Record<string, {
    id: number
    name: string
    code: string
    processes: ProcessDefinitionRespVO[]
  }> = {}

  // 首先基于获取到的分类数据创建分类结构
  bpmCategories.value.forEach((category) => {
    categoryMap[category.code] = {
      id: category.id,
      name: category.name,
      code: category.code,
      processes: [],
    }
  })

  // 然后将流程定义分配到对应的分类中
  processDefinitions.value.forEach((process) => {
    const categoryCode = process.category
    if (categoryCode && categoryMap[categoryCode]) {
      categoryMap[categoryCode].processes.push(process)
    }
    else {
      if (!categoryMap.Other) {
        categoryMap.Other = {
          id: 0,
          name: '其他',
          code: 'Other',
          processes: [],
        }
      }
      categoryMap.Other.processes.push(process)
    }
  })

  // 只返回有流程定义的分类
  const result: Record<string, typeof categoryMap[string]> = {}
  Object.entries(categoryMap).forEach(([key, value]) => {
    if (value.processes.length > 0) {
      result[key] = value
    }
  })

  return result
})

// 启动流程定义
async function startProcess(processDefinition: ProcessDefinitionRespVO) {
  try {
    if (processDefinition.formType === 20) {
      uni.navigateTo({
        url: `/pages-sub/bpm/business-process/index?processDefinitionId=${processDefinition.id}&processKey=${processDefinition.key}`,
      })
    }
    else if (processDefinition.formType === 10) {
      uni.navigateTo({
        url: `/pages-sub/bpm/custom-form/index?processDefinitionId=${processDefinition.id}&processKey=${processDefinition.key}`,
      })
    }
    else {
      uni.showToast({
        title: `${processDefinition.name}流程启动功能开发中`,
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '启动流程失败，请重试',
      icon: 'error',
    })
  }
}

// 获取审批分类列表
async function loadBpmCategories() {
  pageState.categoriesLoading = true
  try {
    const response = await getCategorySimpleList()
    if (response && response.code === 0) {
      bpmCategories.value = response.data || []
    }
  }
  catch (error) {
    console.error('获取审批分类异常:', error)
  }
  finally {
    pageState.categoriesLoading = false
  }
}

// 获取流程定义列表
async function loadProcessDefinitions() {
  processDefinitionsLoading.value = true
  try {
    const response = await getProcessDefinitionList()
    if (response && response.code === 0) {
      processDefinitions.value = response.data || []
    }
  }
  catch (error) {
    console.error('获取流程定义异常:', error)
  }
  finally {
    processDefinitionsLoading.value = false
  }
}

// 获取任务统计数据
async function loadTaskStatistics() {
  try {
    const response = await getTaskStatistics()
    if (response && response.code === 0) {
      statistics.value = response.data
    }
  }
  catch (error) {
    console.error('获取任务统计异常:', error)
  }
}

function navigateToTodoList() {
  uni.navigateTo({ url: '/pages-sub/bpm/todo/index' })
}

function navigateToDoneList() {
  uni.navigateTo({ url: '/pages-sub/bpm/done/index' })
}

function navigateToCopyList() {
  uni.navigateTo({ url: '/pages-sub/bpm/copy/index' })
}

function navigateToMyApprovalList() {
  uni.navigateTo({ url: '/pages-sub/bpm/my-approval/index' })
}

async function initPage(loading: boolean = true) {
  pageState.loading = loading
  try {
    await Promise.all([
      loadBpmCategories(),
      loadProcessDefinitions(),
      loadTaskStatistics(),
    ])
  }
  catch (error) {
    pageState.error = '加载失败，请重试'
  }
  finally {
    pageState.loading = false
  }
}

async function handlePullDownRefresh() {
  if (isRefreshing.value) return
  isRefreshing.value = true
  pageState.refreshing = true
  try {
    await Promise.all([
      loadBpmCategories(),
      loadProcessDefinitions(),
      loadTaskStatistics(),
    ])
    uni.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })
  }
  catch (error) {
    uni.showToast({ title: '刷新失败，请重试', icon: 'none', duration: 2000 })
  }
  finally {
    pageState.refreshing = false
    isRefreshing.value = false
    uni.stopPullDownRefresh()
  }
}

onLoad(() => {
  initPage()
})

onShow(() => {
  initPage(false)
})

onPullDownRefresh(() => {
  handlePullDownRefresh()
})

// 动态设置背景色
function setPageBackgroundColor() {
  const bgColor = isDark.value ? '#020617' : '#f5f7fa'
  uni.setBackgroundColor({
    backgroundColor: bgColor,
    backgroundColorTop: bgColor,
    backgroundColorBottom: bgColor,
  })
}

watch(() => isDark.value, () => {
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
         <!-- 可以放置一些顶部操作，目前留空或放标题 -->
         <view class="text-xl font-bold opacity-95 tracking-wide text-shadow-sm">工作台</view>
      </view>
    </view>

    <!-- 核心统计卡片 (重叠布局) -->
    <view class="relative z-10 px-4 mt-2">
      <ThemeCard card-class="mb-6 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] dark:shadow-blue-900/20 overflow-hidden border-0" :padding="false">
        <view class="grid grid-cols-4 py-6 bg-white dark:bg-slate-800">
          <!-- 待办任务 -->
          <view class="flex flex-col items-center justify-center gap-2 active:opacity-70 transition-opacity" @click="navigateToTodoList">
            <view class="relative p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <wd-icon name="fill-camera" size="24px" />
              <view v-if="statistics.pendingCount > 0" class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] bg-red-500 text-white rounded-full px-1 border-2 border-white dark:border-slate-800">
                {{ statistics.pendingCount > 99 ? '99+' : statistics.pendingCount }}
              </view>
            </view>
            <view class="text-xs font-medium" :class="textSecondaryClass">待办任务</view>
          </view>

          <!-- 已办任务 -->
          <view class="flex flex-col items-center justify-center gap-2 active:opacity-70 transition-opacity" @click="navigateToDoneList">
            <view class="p-3 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400">
              <wd-icon name="check-outline" size="24px" />
            </view>
            <view class="text-xs font-medium" :class="textSecondaryClass">已办任务</view>
          </view>

          <!-- 今日抄送 -->
          <view class="flex flex-col items-center justify-center gap-2 active:opacity-70 transition-opacity" @click="navigateToCopyList">
             <view class="relative p-3 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <wd-icon name="edit-outline" size="24px" />
              <view v-if="statistics.ccCount > 0" class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] bg-red-500 text-white rounded-full px-1 border-2 border-white dark:border-slate-800">
                {{ statistics.ccCount > 99 ? '99+' : statistics.ccCount }}
              </view>
            </view>
            <view class="text-xs font-medium" :class="textSecondaryClass">今日抄送</view>
          </view>

          <!-- 我的审批 -->
          <view class="flex flex-col items-center justify-center gap-2 active:opacity-70 transition-opacity" @click="navigateToMyApprovalList">
            <view class="p-3 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <wd-icon name="user" size="24px" />
            </view>
            <view class="text-xs font-medium" :class="textSecondaryClass">我的审批</view>
          </view>
        </view>
      </ThemeCard>
    </view>

    <!-- 流程应用区域 -->
    <view class="px-4 pb-24 space-y-5">
      <!-- 加载状态 -->
      <view v-if="pageState.loading" class="pt-4">
        <wd-skeleton theme="paragraph" />
      </view>

      <view v-else-if="Object.keys(processDefinitionsByCategory).length > 0">
        <view
          v-for="(categoryData, categoryKey) in processDefinitionsByCategory"
          :key="categoryKey"
        >
          <view class="flex items-center gap-2 mb-3 px-1">
             <view class="w-1 h-4 rounded-full bg-blue-500" />
             <view class="text-base font-bold tracking-tight" :class="textPrimaryClass">{{ categoryData.name }}</view>
          </view>
          
          <ThemeCard :padding="false" card-class="shadow-sm border border-slate-100 dark:border-slate-800">
            <view class="grid grid-cols-4 gap-y-6 py-5">
              <view
                v-for="process in categoryData.processes"
                :key="process.id"
                class="flex flex-col items-center gap-2 active:opacity-60 transition-opacity"
                @click="startProcess(process)"
              >
                <!-- 图标容器 -->
                <view class="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <image
                    v-if="process.icon"
                    :src="process.icon"
                    class="h-6 w-6 object-contain"
                    mode="aspectFit"
                  />
                  <view v-else class="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {{ process.name.slice(0, 1) }}
                  </view>
                </view>

                <!-- 流程名称 -->
                <view class="px-2 w-full text-center">
                  <view class="text-xs font-medium leading-tight truncate" :class="textSecondaryClass">
                    {{ process.name }}
                  </view>
                </view>
              </view>
            </view>
          </ThemeCard>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-else class="py-12 flex flex-col items-center justify-center opacity-40">
         <wd-icon name="search" size="32px" color="#94a3b8" class="mb-2" />
         <view class="text-sm text-slate-400">暂无流程应用</view>
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

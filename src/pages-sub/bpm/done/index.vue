<route lang="json">
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "已办任务"
  }
}
</route>

<script setup lang="ts">
import type { BpmTaskRespVO, GetTaskDonePageReqVO } from '@/api/types/bpm'
import { reactive, ref, computed } from 'vue'
import { getTaskDonePage } from '@/api/bpm'
import { formatStandardDateTime } from '@/utils'
import { useAppStore } from '@/store/app'
import ThemeCard from '@/components/ThemeCard.vue'

// 页面数据
const taskList = ref<BpmTaskRespVO[]>([])
const pagingRef = ref()

const firstLoad = ref(true)

// 搜索表单 - 简化为基本分页参数
const searchForm = reactive<GetTaskDonePageReqVO>({
  pageNo: 1,
  pageSize: 10,
})

// 查询任务列表
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...searchForm,
      pageNo,
      pageSize,
    }

    const response = await getTaskDonePage(params)
    console.log('查询已办任务列表响应:', response)
    if (response.code === 0) {
      const { list } = response.data
      if (firstLoad.value) {
        firstLoad.value = false
      }
      // 完成分页加载，z-paging会自动判断是否还有更多数据
      pagingRef.value?.complete(list)
    }
    else {
      // 加载失败
      pagingRef.value?.complete(false)
      uni.showToast({
        title: response.msg || '加载失败',
        icon: 'none',
      })
    }
  }
  catch (error) {
    console.error('查询已办任务列表失败:', error)
    pagingRef.value?.complete(false)
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none',
    })
  }
}

// 查看任务详情
function handleViewDetail(task: BpmTaskRespVO) {
  // 跳转到审批详情页面（只读模式）
  uni.navigateTo({
    url: `/pages-sub/bpm/approval/index?taskId=${task.id}&processInstanceId=${task.processInstanceId}`,
  })
}

// 格式化时间
function formatTime(timeStr: string | number) {
  return formatStandardDateTime(timeStr)
}

// 获取任务状态文本
function getTaskStatusText(status: number) {
  switch (status) {
    case 1:
      return '已完成'
    case 2:
      return '已拒绝'
    case 3:
      return '已取消'
    default:
      return '已处理'
  }
}

// 获取任务状态颜色
function getTaskStatusColor(status: number) {
  // 深色/浅色下返回完整的文本/背景/边框类，参考通知公告页面
  if (isDark.value) {
    switch (status) {
      case 1: return 'text-green-400 bg-green-500/12 border border-green-500/20'
      case 2: return 'text-red-400 bg-red-500/12 border border-red-500/20'
      case 3: return 'text-gray-400 bg-white/6 border border-white/12'
      default: return 'text-blue-400 bg-blue-500/12 border border-blue-500/20'
    }
  }
  else {
    switch (status) {
      case 1: return 'text-green-600 bg-green-50 border border-green-200'
      case 2: return 'text-red-600 bg-red-50 border border-red-200'
      case 3: return 'text-gray-600 bg-gray-50 border border-gray-200'
      default: return 'text-blue-600 bg-blue-50 border border-blue-200'
    }
  }
}

// 主题适配：浅色/深色，与通知公告页面保持一致
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-600'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-gray-400'))
onShow(() => {
  queryList(1, 10)
})
</script>

<template>
  <view class="min-h-screen">
    <!-- 任务列表 - 可滚动区域 -->
    <view>
      <z-paging
        style="top: 0px"
        ref="pagingRef"
        v-model="taskList"
        :refresher-enabled="true"
        :loading-more-enabled="true"
        :auto-show-back-to-top="true"
        :auto-clean-list-when-reload="true"
        :refresher-threshold="80"
        refresher-default-text="下拉刷新"
        refresher-pulling-text="下拉刷新"
        refresher-refreshing-text="正在刷新..."
        refresher-complete-text="刷新完成"
        loading-more-default-text="点击加载更多"
        loading-more-loading-text="正在加载..."
        loading-more-no-more-text="没有更多了"
        loading-more-fail-text="加载失败，点击重试"
        empty-view-text="暂无已办任务"
        @query="queryList"
      >
        <view v-if="firstLoad" class="p-4">
          <!-- 骨架屏：匹配 ThemeCard 卡片结构、状态徽标与详情提示 -->
          <view v-for="n in 3" :key="n" class="mb-4">
            <ThemeCard :padding="false">
              <view class="p-4">
                <!-- 头部：标题 + 右侧状态徽标占位 -->
                <view class="mb-3 flex items-center justify-between">
                  <view class="h-4 w-2/3 rounded" :class="isDark ? 'bg-white/12' : 'bg-gray-200'" />
                  <view class="h-5 w-16 rounded-full" :class="isDark ? 'bg-white/10' : 'bg-gray-200'" />
                </view>

                <!-- 详情信息占位：两行图标 + 文本 -->
                <view class="space-y-2">
                  <view class="flex items-center">
                    <view class="h-3 w-3 rounded-full" :class="isDark ? 'bg-white/16' : 'bg-gray-300'" />
                    <view class="ml-2 h-3 w-28 rounded" :class="isDark ? 'bg-white/12' : 'bg-gray-200'" />
                  </view>
                  <view class="flex items-center">
                    <view class="h-3 w-3 rounded-full" :class="isDark ? 'bg-white/16' : 'bg-gray-300'" />
                    <view class="ml-2 h-3 w-36 rounded" :class="isDark ? 'bg-white/12' : 'bg-gray-200'" />
                  </view>
                </view>

                <!-- 底部提示占位：点击查看详情 -->
                <view class="mt-3 flex items-center justify-end">
                  <view class="h-3 w-20 rounded" :class="isDark ? 'bg-white/12' : 'bg-gray-300'" />
                  <view class="ml-1 h-3 w-3 rounded" :class="isDark ? 'bg-white/16' : 'bg-gray-300'" />
                </view>
              </view>
            </ThemeCard>
          </view>
        </view>
        <view v-else class="p-4">
          <view
            v-for="task in taskList"
            :key="task.id"
            class="mb-4"
            @click="handleViewDetail(task)"
          >
            <!-- 任务卡片采用 ThemeCard，适配深色模式背景与阴影 -->
            <ThemeCard class="cursor-pointer transition-shadow hover:shadow-md" :padding="false">
              <view class="p-4">
              <!-- 任务头部信息 -->
              <view class="mb-3 flex items-center justify-between">
                <view class="mr-3 flex-1 text-base font-semibold" :class="textPrimaryClass">
                  {{ task.processInstance.name }}
                </view>
                <!-- 任务状态标签 -->
                <view class="rounded-full px-2 py-1 text-xs" :class="getTaskStatusColor(task.status)">
                  {{ getTaskStatusText(task.status) }}
                </view>
              </view>

              <!-- 任务详情 -->
              <view class="mb-3">
                <view v-if="task.processInstance.summary" class="mb-1.5 flex flex-col items-start">
                  <view v-for="item in task.processInstance.summary" :key="item.key">
                    <div class="ml-1.5 text-xs" :class="textSecondaryClass">
                      {{ item.key }}: {{ item.value }}
                    </div>
                  </view>
                </view>
                <view v-else class="mb-1.5 flex items-center">
                <wd-icon name="user" size="12px" :class="textSecondaryClass" />
                  <text class="ml-1.5 text-xs" :class="textSecondaryClass">
                    申请人：{{ task.processInstance.startUser.nickname }}
                  </text>
                </view>
                <view class="mb-1.5 flex items-center">
                <wd-icon name="time" size="12px" :class="textSecondaryClass" />
                  <text class="ml-1.5 text-xs" :class="textSecondaryClass">
                    创建时间：{{ formatTime(task.createTime) }}
                  </text>
                </view>
                <view v-if="task.endTime" class="flex items-center">
                <wd-icon name="check" size="12px" :class="textSecondaryClass" />
                  <text class="ml-1.5 text-xs" :class="textSecondaryClass">
                    完成时间：{{ formatTime(task.endTime) }}
                  </text>
                </view>
              </view>

              <!-- 查看详情提示 -->
              <view class="flex items-center justify-end text-xs" :class="textMutedClass">
                <text>点击查看详情</text>
                <wd-icon name="arrow-right" size="12px" class="ml-1" :class="textMutedClass" />
              </view>
              </view>
            </ThemeCard>
          </view>
        </view>
      </z-paging>
    </view>
  </view>
</template>

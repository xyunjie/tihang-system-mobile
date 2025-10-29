<route lang="json">
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "我的审批"
  }
}
</route>

<script setup lang="ts">
import type { BpmProcessInstanceMyRespVO, BpmTaskRespVO, GetProcessInstanceMyPageReqVO } from '@/api/types/bpm'
import { computed, reactive, ref } from 'vue'
import { getProcessInstanceMyPage } from '@/api/bpm'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'
import { formatStandardDateTime } from '@/utils'

defineOptions({
  name: 'MyApproval',
})

// 页面数据
const approvalList = ref<BpmProcessInstanceMyRespVO[]>([])
const pagingRef = ref()
const firstLoad = ref(true)

// 搜索表单 - 简化为基本分页参数
const searchForm = reactive<GetProcessInstanceMyPageReqVO>({
  pageNo: 1,
  pageSize: 10,
})

// 查询审批列表
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...searchForm,
      pageNo,
      pageSize,
    }

    const response = await getProcessInstanceMyPage(params)
    console.log('查询我的审批列表响应:', response)
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
    console.error('查询我的审批列表失败:', error)
    pagingRef.value?.complete(false)
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none',
    })
  }
}

// 查看任务详情
function handleViewDetail(task: BpmProcessInstanceMyRespVO) {
  // 跳转到审批详情页面（只读模式）
  uni.navigateTo({
    url: `/pages-sub/bpm/approval/index?processInstanceId=${task.id}`,
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
      return '进行中'
    case 2:
      return '已完成'
    case 3:
      return '已拒绝'
    case 4:
      return '已取消'
    default:
      return '未知'
  }
}
// 主题适配：浅色/深色，与通知公告页面保持一致
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-600'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-gray-400'))
// 获取任务状态颜色
function getTaskStatusColor(status: number) {
  // 深色/浅色下返回完整的文本/背景/边框类，参考通知公告页面
  if (isDark.value) {
    switch (status) {
      case 1: return 'text-blue-400 bg-blue-500/12 border border-blue-500/20'
      case 2: return 'text-green-400 bg-green-500/12 border border-green-500/20'
      case 3: return 'text-red-400 bg-red-500/12 border border-red-500/20'
      case 4: return 'text-gray-400 bg-white/6 border border-white/12'
      default: return 'text-gray-400 bg-white/6 border border-white/12'
    }
  }
  else {
    switch (status) {
      case 1: return 'text-blue-600 bg-blue-50 border border-blue-200'
      case 2: return 'text-green-600 bg-green-50 border border-green-200'
      case 3: return 'text-red-600 bg-red-50 border border-red-200'
      case 4: return 'text-gray-600 bg-gray-50 border border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border border-gray-200'
    }
  }
}

function calcDuration(duration: number) {
  if (duration < 1000) {
    return `${duration}毫秒`
  }

  // 转换为秒
  const totalSeconds = Math.floor(duration / 1000)
  if (totalSeconds < 60) {
    return `${totalSeconds}秒`
  }

  // 转换为分钟
  const totalMinutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  if (totalMinutes < 60) {
    return remainingSeconds > 0 ? `${totalMinutes}分${remainingSeconds}秒` : `${totalMinutes}分钟`
  }

  // 转换为小时
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  if (totalHours < 24) {
    let result = `${totalHours}小时`
    if (remainingMinutes > 0) {
      result += `${remainingMinutes}分钟`
    }
    return result
  }

  // 转换为天
  const totalDays = Math.floor(totalHours / 24)
  const remainingHours = totalHours % 24
  let result = `${totalDays}天`
  if (remainingHours > 0) {
    result += `${remainingHours}小时`
  }
  return result
}

onShow(() => {
  queryList(1, 10)
})
</script>

<template>
  <view class="min-h-screen">
    <!-- 审批列表 - 可滚动区域 -->
    <view>
      <z-paging
        ref="pagingRef"
        v-model="approvalList"
        style="top: 0px"
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
        empty-view-text="暂无我的审批"
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
            v-for="task in approvalList"
            :key="task.id"
            class="mb-4"
            @click="handleViewDetail(task)"
          >
            <!-- 审批卡片采用 ThemeCard，适配深色模式背景与阴影 -->
            <ThemeCard class="cursor-pointer transition-shadow hover:shadow-md" :padding="false">
              <view class="p-4">
                <!-- 审批头部信息 -->
                <view class="mb-3 flex items-center justify-between">
                  <view class="mr-3 flex-1 text-base font-semibold" :class="textPrimaryClass">
                    {{ task.name || '未知流程' }}
                  </view>
                  <!-- 审批状态标签 -->
                  <view class="rounded-full px-2 py-1 text-xs" :class="getTaskStatusColor(task.status)">
                    {{ getTaskStatusText(task.status) }}
                  </view>
                </view>

                <!-- 审批详情 -->
                <view class="mb-3">
                  <!-- 始终显示发起人信息 -->
                  <view v-if="task.startUser" class="mb-1.5 flex items-center">
                    <wd-icon name="user" size="12px" :class="textSecondaryClass" />
                    <text class="ml-1.5 text-xs" :class="textSecondaryClass">
                      发起人：{{ task.startUser.nickname }}
                    </text>
                  </view>

                  <view v-if="task.id" class="mb-1.5 flex items-start">
                    <wd-icon name="code" size="12px" :class="textSecondaryClass" />
                    <text class="ml-1.5 text-xs" :class="textSecondaryClass">
                      编号：{{ task.id }}
                    </text>
                  </view>
                  <view v-if="task.categoryName" class="mb-1.5 flex items-center">
                    <wd-icon name="filter1" size="12px" :class="textSecondaryClass" />
                    <text class="ml-1.5 text-xs" :class="textSecondaryClass">
                      分类：{{ task.categoryName }}
                    </text>
                  </view>
                  <view class="mb-1.5 flex items-center">
                    <wd-icon name="time" size="12px" :class="textSecondaryClass" />
                    <text class="ml-1.5 text-xs" :class="textSecondaryClass">
                      创建时间：{{ formatTime(task.startTime) }}
                    </text>
                  </view>
                  <view v-if="task.endTime" class="mb-1.5 flex items-center">
                    <wd-icon name="check" size="12px" :class="textSecondaryClass" />
                    <text class="ml-1.5 text-xs" :class="textSecondaryClass">
                      完成时间：{{ formatTime(task.endTime) }}
                    </text>
                  </view>
                  <view v-if="task.durationInMillis" class="flex items-center">
                    <wd-icon name="detection" size="12px" :class="textSecondaryClass" />
                    <text class="ml-1.5 text-xs" :class="textSecondaryClass">
                      耗时：{{ calcDuration(task.durationInMillis) }}
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

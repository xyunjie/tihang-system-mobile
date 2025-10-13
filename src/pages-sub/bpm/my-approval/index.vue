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
import { reactive, ref } from 'vue'
import { getProcessInstanceMyPage } from '@/api/bpm'
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

// 获取任务状态颜色
function getTaskStatusColor(status: number) {
  switch (status) {
    case 1:
      return 'text-blue-600'
    case 2:
      return 'text-green-600'
    case 3:
      return 'text-red-600'
    case 4:
      return 'text-gray-600'
    default:
      return 'text-gray-600'
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
  <view class="min-h-screen bg-gray-50">
    <!-- 审批列表 - 可滚动区域 -->
    <view>
      <z-paging
        ref="pagingRef"
        v-model="approvalList"
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
        <view v-if="firstLoad">
          <!-- 显示骨架平面 -->
          <wd-skeleton theme="paragraph" />
        </view>
        <view v-else class="p-4">
          <view
            v-for="task in approvalList"
            :key="task.id"
            class="mb-4"
            @click="handleViewDetail(task)"
          >
            <!-- 审批卡片 -->
            <view class="cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <!-- 审批头部信息 -->
              <view class="mb-3 flex items-center justify-between">
                <view class="mr-3 flex-1 text-base text-gray-800 font-semibold">
                  {{ task.name || '未知流程' }}
                </view>
                <!-- 审批状态标签 -->
                <view class="rounded-full bg-gray-100 px-2 py-1 text-xs" :class="getTaskStatusColor(task.status)">
                  {{ getTaskStatusText(task.status) }}
                </view>
              </view>

              <!-- 审批详情 -->
              <view class="mb-3">
                <!-- 始终显示发起人信息 -->
                <view v-if="task.startUser" class="mb-1.5 flex items-center">
                  <wd-icon name="user" size="12px" />
                  <text class="ml-1.5 text-xs text-gray-600">
                    发起人：{{ task.startUser.nickname }}
                  </text>
                </view>

                <view v-if="task.id" class="mb-1.5 flex items-start">
                  <wd-icon name="code" size="12px" />
                  <text class="ml-1.5 text-xs text-gray-600">
                    编号：{{ task.id }}
                  </text>
                </view>
                <view v-if="task.categoryName" class="mb-1.5 flex items-center">
                  <wd-icon name="filter1" size="12px" />
                  <text class="ml-1.5 text-xs text-gray-600">
                    分类：{{ task.categoryName }}
                  </text>
                </view>
                <view class="mb-1.5 flex items-center">
                  <wd-icon name="time" size="12px" />
                  <text class="ml-1.5 text-xs text-gray-600">
                    创建时间：{{ formatTime(task.startTime) }}
                  </text>
                </view>
                <view v-if="task.endTime" class="mb-1.5 flex items-center">
                  <wd-icon name="check" size="12px" />
                  <text class="ml-1.5 text-xs text-gray-600">
                    完成时间：{{ formatTime(task.endTime) }}
                  </text>
                </view>
                <view v-if="task.durationInMillis" class="flex items-center">
                  <wd-icon name="detection" size="12px" />
                  <text class="ml-1.5 text-xs text-gray-600">
                    耗时：{{ calcDuration(task.durationInMillis) }}
                  </text>
                </view>
              </view>

              <!-- 查看详情提示 -->
              <view class="flex items-center justify-end text-xs text-gray-400">
                <text>点击查看详情</text>
                <wd-icon name="arrow-right" size="12px" class="ml-1" />
              </view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </view>
</template>

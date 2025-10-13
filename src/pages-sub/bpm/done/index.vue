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
import { reactive, ref } from 'vue'
import { getTaskDonePage } from '@/api/bpm'
import { formatStandardDateTime } from '@/utils'

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
  switch (status) {
    case 1:
      return 'text-green-600'
    case 2:
      return 'text-red-600'
    case 3:
      return 'text-gray-600'
    default:
      return 'text-blue-600'
  }
}
onShow(() => {
  queryList(1, 10)
})
</script>

<template>
  <view class="min-h-screen bg-gray-50">
    <!-- 任务列表 - 可滚动区域 -->
    <view>
      <z-paging
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
        <view v-if="firstLoad">
          <!-- 显示骨架平面 -->
          <wd-skeleton theme="paragraph" />
        </view>
        <view v-else class="p-4">
          <view
            v-for="task in taskList"
            :key="task.id"
            class="mb-4"
            @click="handleViewDetail(task)"
          >
            <!-- 任务卡片 -->
            <view class="cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <!-- 任务头部信息 -->
              <view class="mb-3 flex items-center justify-between">
                <view class="mr-3 flex-1 text-base text-gray-800 font-semibold">
                  {{ task.processInstance.name }}
                </view>
                <!-- 任务状态标签 -->
                <view class="rounded-full bg-gray-100 px-2 py-1 text-xs" :class="getTaskStatusColor(task.status)">
                  {{ getTaskStatusText(task.status) }}
                </view>
              </view>

              <!-- 任务详情 -->
              <view class="mb-3">
                <view v-if="task.processInstance.summary" class="mb-1.5 flex flex-col items-start">
                  <view v-for="item in task.processInstance.summary" :key="item.key">
                    <div class="ml-1.5 text-xs text-gray-600">
                      {{ item.key }}: {{ item.value }}
                    </div>
                  </view>
                </view>
                <view v-else class="mb-1.5 flex items-center">
                  <wd-icon name="user" size="12px" />
                  <text class="ml-1.5 text-xs text-gray-600">
                    申请人：{{ task.processInstance.startUser.nickname }}
                  </text>
                </view>
                <view class="mb-1.5 flex items-center">
                  <wd-icon name="time" size="12px" />
                  <text class="ml-1.5 text-xs text-gray-600">
                    创建时间：{{ formatTime(task.createTime) }}
                  </text>
                </view>
                <view v-if="task.endTime" class="flex items-center">
                  <wd-icon name="check" size="12px" />
                  <text class="ml-1.5 text-xs text-gray-600">
                    完成时间：{{ formatTime(task.endTime) }}
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

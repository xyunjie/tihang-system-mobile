<route lang="json">
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "待办任务"
  }
}
</route>

<script setup lang="ts">
import type { BpmTaskRespVO, GetTaskTodoPageReqVO } from '@/api/types/bpm'
import { reactive, ref } from 'vue'
import { getTaskTodoPage } from '@/api/bpm'
import { formatStandardDateTime } from '@/utils'

// 页面数据
const taskList = ref<BpmTaskRespVO[]>([])
const pagingRef = ref()

const firstLoad = ref(true)

// 搜索表单 - 简化为基本分页参数
const searchForm = reactive<GetTaskTodoPageReqVO>({
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

    const response = await getTaskTodoPage(params)
    console.log('查询任务列表响应:', response)
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
    console.error('查询任务列表失败:', error)
    pagingRef.value?.complete(false)
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none',
    })
  }
}

// 处理任务
function handleApprove(task: BpmTaskRespVO) {
  // 跳转到默认审批页面
  uni.navigateTo({
    url: `/pages-sub/bpm/approval/index?taskId=${task.id}&processInstanceId=${task.processInstanceId}`,
  })
}

// 格式化时间
function formatTime(timeStr: string) {
  return formatStandardDateTime(timeStr)
}
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
        empty-view-text="暂无待办任务"
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
          >
            <!-- 任务卡片 -->
            <view class="rounded-xl bg-white p-4 shadow-sm">
              <!-- 任务头部信息 -->
              <view class="mb-3 flex items-center justify-between">
                <view class="mr-3 flex-1 text-base text-gray-800 font-semibold">
                  {{ task.processInstance.name }}
                </view>
              </view>

              <!-- 任务详情 -->
              <view class="mb-4">
                <view v-if="task.processInstance.summary" class="mb-1.5 flex flex-col items-start">
                  <view v-for="item in task.processInstance.summary" :key="item.key">
                    <div class="ml-1.5 text-xs text-gray-600">
                      {{ item.key }}: {{ item.value }}
                    </div>
                  </view>
                </view>
                <view v-else>
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
              </view>

              <!-- 操作按钮 -->
              <view class="flex justify-end gap-3">
                <wd-button
                  type="primary"
                  @click.stop="handleApprove(task)"
                >
                  办理
                </wd-button>
              </view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </view>
</template>

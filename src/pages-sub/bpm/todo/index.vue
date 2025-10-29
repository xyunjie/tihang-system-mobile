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
import { computed, reactive, ref } from 'vue'
import { getTaskTodoPage } from '@/api/bpm'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'
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

// 主题适配：浅色/深色，与通知公告页面保持一致
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-600'))
</script>

<template>
  <view class="min-h-screen">
    <!-- 任务列表 - 可滚动区域 -->

    <view>
      <z-paging
        ref="pagingRef"
        v-model="taskList"
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
        empty-view-text="暂无待办任务"
        @query="queryList"
      >
        <view v-if="firstLoad" class="p-4">
          <!-- 骨架屏：匹配 ThemeCard 卡片结构与信息行 -->
          <view v-for="n in 3" :key="n" class="mb-4">
            <ThemeCard :padding="false">
              <view class="p-4">
                <!-- 头部标题占位 -->
                <view class="mb-3 flex items-center justify-between">
                  <view class="h-4 w-2/3 rounded" :class="isDark ? 'bg-white/12' : 'bg-gray-200'" />
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
              </view>
            </ThemeCard>
          </view>
        </view>
        <view v-else class="p-4">
          <view
            v-for="task in taskList"
            :key="task.id"
            class="mb-4"
          >
            <!-- 任务卡片采用 ThemeCard，适配深色模式背景与阴影 -->
            <ThemeCard :padding="false">
              <view class="p-4">
                <!-- 任务头部信息 -->
                <view class="mb-3 flex items-center justify-between">
                  <view class="mr-3 flex-1 text-base font-semibold" :class="textPrimaryClass">
                    {{ task.processInstance.name }}
                  </view>
                </view>

                <!-- 任务详情 -->
                <view class="mb-4">
                  <view v-if="task.processInstance.summary" class="mb-1.5 flex flex-col items-start">
                    <view v-for="item in task.processInstance.summary" :key="item.key">
                      <div class="ml-1.5 text-xs" :class="textSecondaryClass">
                        {{ item.key }}: {{ item.value }}
                      </div>
                    </view>
                  </view>
                  <view v-else>
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
            </ThemeCard>
          </view>
        </view>
      </z-paging>
    </view>
  </view>
</template>

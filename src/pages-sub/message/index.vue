<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "消息提醒"
  }
}
</route>

<script lang="ts" setup>
import type { NotifyMessagePageReqVO, NotifyMessageRespVO } from '@/api/types/notify-message'
import { getMyNotifyMessagePage, getUnreadCount } from '@/api/notify-message'
import { formatRelativeTime } from '@/utils'

defineOptions({
  name: 'MessageList',
})

// 数据状态
const messageList = ref<NotifyMessageRespVO[]>([])
const pagingRef = ref()
const firstLoad = ref(true)

// 筛选状态
const filterTab = ref<'all' | 'unread' | 'read'>('all')
const unreadCount = ref(0)
const total = ref(0)

// 基础分页参数
const baseParams = reactive({})

// 页面加载
onLoad(() => {
})

onShow(() => {
  loadUnreadCount()
})

// 加载未读消息数量
async function loadUnreadCount() {
  try {
    const response = await getUnreadCount()

    if (response.code === 0 && typeof response.data === 'number') {
      unreadCount.value = response.data
    }
  }
  catch (error) {
    console.error('获取未读消息数量失败:', error)
  }
}

// 加载消息提醒列表
async function queryList(pageNo: number, pageSize: number) {
  try {
    // 根据筛选条件设置参数
    const params: NotifyMessagePageReqVO = {
      pageNo,
      pageSize,
      ...baseParams,
    }

    if (filterTab.value === 'unread') {
      params.readStatus = false
    }
    else if (filterTab.value === 'read') {
      params.readStatus = true
    }

    const response = await getMyNotifyMessagePage(params)

    console.log('消息提醒列表查询响应:', response)

    if (response.code === 0 && response.data) {
      const { list } = response.data
      total.value = response.data.total

      if (firstLoad.value) {
        firstLoad.value = false
        // 首次加载后更新未读数量
        await loadUnreadCount()
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
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('❌ 加载消息提醒列表错误:', error)
    pagingRef.value?.complete(false)
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
}

// 切换筛选标签
function switchFilterTab(tab: 'all' | 'unread' | 'read') {
  if (filterTab.value === tab)
    return

  filterTab.value = tab
  pagingRef.value?.reload()
}

// 跳转到消息详情
function navigateToDetail(message: NotifyMessageRespVO) {
  uni.navigateTo({
    url: `/pages-sub/message/detail?id=${message.id}`,
  })
}

// 格式化消息时间
function formatMessageTime(createTime: string | number): string {
  if (!createTime)
    return ''

  return formatRelativeTime(createTime)
}

// 获取消息类型文本
function getMessageTypeText(templateType: number): string {
  switch (templateType) {
    case 1: return '系统消息'
    case 2: return '审批消息'
    case 3: return '考勤消息'
    case 4: return '项目消息'
    default: return '其他消息'
  }
}

// 获取消息类型颜色
function getMessageTypeColor(templateType: number): string {
  switch (templateType) {
    case 1: return 'text-blue-600 bg-blue-50' // 系统消息
    case 2: return 'text-orange-600 bg-orange-50' // 审批消息
    case 3: return 'text-green-600 bg-green-50' // 考勤消息
    case 4: return 'text-purple-600 bg-purple-50' // 项目消息
    default: return 'text-gray-600 bg-gray-50'
  }
}

// 将HTML内容转换为纯文本显示
function getPlainTextContent(htmlContent: string): string {
  if (!htmlContent)
    return ''

  // 移除HTML标签并解码HTML实体
  return htmlContent
    .replace(/<[^>]*>/g, '') // 移除HTML标签
    .replace(/&nbsp;/g, ' ') // 替换非断空格
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .trim()
}
</script>

<template>
  <view class="min-h-screen bg-gray-50">
    <!-- 使用z-paging的全屏模式，筛选标签放在slot="top"内 -->
    <z-paging
      ref="pagingRef"
      v-model="messageList"
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
      empty-view-text="暂无消息提醒"
      @query="queryList"
    >
      <!-- 筛选标签栏固定在顶部 -->
      <template #top>
        <view class="bg-white px-4 py-3 shadow-sm">
          <view class="flex items-center justify-between">
            <view class="flex rounded-lg bg-gray-100 p-1">
              <view
                class="rounded-md px-4 py-2 text-sm font-medium transition-all"
                :class="filterTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'"
                @click="switchFilterTab('all')"
              >
                全部
              </view>
              <view
                class="relative rounded-md px-4 py-2 text-sm font-medium transition-all"
                :class="filterTab === 'unread' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'"
                @click="switchFilterTab('unread')"
              >
                未读

                <view v-if="unreadCount > 0" class="absolute h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-xs text-white -right-1 -top-1">
                  <span class="px-1.5 py-0.5 text-white font-medium">
                    {{ unreadCount > 99 ? '99+' : unreadCount }}
                  </span>
                </view>
              </view>
              <view
                class="rounded-md px-4 py-2 text-sm font-medium transition-all"
                :class="filterTab === 'read' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'"
                @click="switchFilterTab('read')"
              >
                已读
              </view>
            </view>

            <view class="text-sm text-gray-500">
              共 {{ total }} 条消息
            </view>
          </view>
        </view>
      </template>

      <!-- 骨架屏 -->
      <view v-if="firstLoad" class="p-4">
        <wd-skeleton theme="paragraph" />
      </view>

      <!-- 消息列表内容 -->
      <view v-else class="px-4 pt-2">
        <view
          v-for="message in messageList"
          :key="message.id"
          class="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm transition-all active:scale-98"
          @click="navigateToDetail(message)"
        >
          <view class="p-4" :class="{ 'bg-blue-50/30': !message.readStatus }">
            <view class="mb-3 flex items-start justify-between">
              <view class="flex flex-1 items-start">
                <view class="mr-3 h-10 w-10 flex flex-shrink-0 items-center justify-center rounded-full" :class="getMessageTypeColor(message.templateType)">
                  <view class="h-5 w-5 rounded bg-current" />
                </view>
                <view class="min-w-0 flex-1">
                  <view class="mb-1 flex items-center justify-between">
                    <view class="truncate text-sm text-gray-800 font-medium">
                      {{ message.templateNickname || '系统' }}
                    </view>
                    <view v-if="!message.readStatus" class="ml-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                  </view>
                  <view class="line-clamp-2 mb-2 text-sm text-gray-700 leading-relaxed" :class="{ 'font-medium': !message.readStatus }">
                    {{ getPlainTextContent(message.templateContent) }}
                  </view>
                  <view class="flex items-center justify-between">
                    <view class="rounded-full px-2 py-1 text-xs font-medium" :class="getMessageTypeColor(message.templateType)">
                      {{ getMessageTypeText(message.templateType) }}
                    </view>
                    <view class="text-xs text-gray-400">
                      {{ formatMessageTime(message.createTime) }}
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>

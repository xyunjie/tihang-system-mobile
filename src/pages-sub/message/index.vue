<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "消息提醒"
  }
}
</route>

<script lang="ts" setup>
import type { NotifyMessagePageReqVO, NotifyMessageRespVO } from '@/api/types/notify-message'
import { getMyNotifyMessagePage } from '@/api/notify-message'

defineOptions({
  name: 'MessageList',
})

// 分页参数
const pageParams = reactive<NotifyMessagePageReqVO>({
  pageNo: 1,
  pageSize: 10,
})

// 数据状态
const messageList = ref<NotifyMessageRespVO[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const total = ref(0)

// 筛选状态
const filterTab = ref<'all' | 'unread' | 'read'>('all')
const unreadCount = ref(0)

// 页面加载
onLoad(() => {
  loadMessageList()
})

// 下拉刷新
onPullDownRefresh(() => {
  refreshMessageList()
})

// 触底加载更多
onReachBottom(() => {
  if (!loading.value && hasMore.value) {
    loadMoreMessages()
  }
})

// 加载消息提醒列表
async function loadMessageList() {
  if (loading.value)
    return

  try {
    loading.value = true

    // 根据筛选条件设置参数
    const params = { ...pageParams }
    if (filterTab.value === 'unread') {
      params.readStatus = false
    }
    else if (filterTab.value === 'read') {
      params.readStatus = true
    }

    const response = await getMyNotifyMessagePage(params)

    if (response.code === 0 && response.data) {
      messageList.value = response.data.list
      total.value = response.data.total
      hasMore.value = response.data.list.length >= pageParams.pageSize

      // 统计未读消息数量
      updateUnreadCount()

      console.log('✨ 消息提醒列表加载完成:', {
        count: response.data.list.length,
        total: response.data.total,
        hasMore: hasMore.value,
      })
    }
    else {
      console.warn('⚠️ 获取消息提醒列表失败:', response.msg)
      uni.showToast({
        title: response.msg || '获取消息提醒失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('❌ 加载消息提醒列表错误:', error)
    uni.showToast({
      title: '获取消息提醒失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    loading.value = false
  }
}

// 刷新消息提醒列表
async function refreshMessageList() {
  try {
    refreshing.value = true
    pageParams.pageNo = 1

    // 根据筛选条件设置参数
    const params = { ...pageParams }
    if (filterTab.value === 'unread') {
      params.readStatus = false
    }
    else if (filterTab.value === 'read') {
      params.readStatus = true
    }

    const response = await getMyNotifyMessagePage(params)

    if (response.code === 0 && response.data) {
      messageList.value = response.data.list
      total.value = response.data.total
      hasMore.value = response.data.list.length >= pageParams.pageSize

      // 统计未读消息数量
      updateUnreadCount()

      uni.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500,
      })
    }
    else {
      uni.showToast({
        title: response.msg || '刷新失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('❌ 刷新消息提醒列表错误:', error)
    uni.showToast({
      title: '刷新失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    refreshing.value = false
    uni.stopPullDownRefresh()
  }
}

// 加载更多消息提醒
async function loadMoreMessages() {
  if (loading.value || !hasMore.value)
    return

  try {
    loading.value = true
    pageParams.pageNo += 1

    // 根据筛选条件设置参数
    const params = { ...pageParams }
    if (filterTab.value === 'unread') {
      params.readStatus = false
    }
    else if (filterTab.value === 'read') {
      params.readStatus = true
    }

    const response = await getMyNotifyMessagePage(params)

    if (response.code === 0 && response.data) {
      messageList.value.push(...response.data.list)
      hasMore.value = response.data.list.length >= pageParams.pageSize

      console.log('✨ 加载更多消息提醒完成:', {
        newCount: response.data.list.length,
        totalCount: messageList.value.length,
        hasMore: hasMore.value,
      })
    }
    else {
      pageParams.pageNo -= 1 // 恢复页码
      uni.showToast({
        title: response.msg || '加载更多失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('❌ 加载更多消息提醒错误:', error)
    pageParams.pageNo -= 1 // 恢复页码
    uni.showToast({
      title: '加载更多失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    loading.value = false
  }
}

// 切换筛选标签
function switchFilterTab(tab: 'all' | 'unread' | 'read') {
  if (filterTab.value === tab)
    return

  filterTab.value = tab
  pageParams.pageNo = 1
  loadMessageList()
}

// 跳转到消息详情
function navigateToDetail(message: NotifyMessageRespVO) {
  uni.navigateTo({
    url: `/pages-sub/message/detail?id=${message.id}`,
  })
}

// 统计未读消息数量
function updateUnreadCount() {
  unreadCount.value = messageList.value.filter(msg => !msg.readStatus).length
}

// 格式化消息时间
function formatMessageTime(createTime: string): string {
  if (!createTime)
    return ''

  try {
    const date = new Date(createTime)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 7) {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
      })
    }
    else if (diffDays > 0) {
      return `${diffDays}天前`
    }
    else if (diffHours > 0) {
      return `${diffHours}小时前`
    }
    else {
      return '刚刚'
    }
  }
  catch (error) {
    console.error('时间格式化错误:', error)
    return createTime
  }
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

// 获取消息图标
function getMessageIcon(templateType: number): string {
  switch (templateType) {
    case 1: return '🔔' // 系统消息
    case 2: return '📋' // 审批消息
    case 3: return '⏰' // 考勤消息
    case 4: return '📁' // 项目消息
    default: return '💬'
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
    <!-- 筛选标签栏 -->
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
            <view v-if="unreadCount > 0" class="absolute min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-xs text-white -right-1 -top-1">
              {{ unreadCount > 99 ? '99+' : unreadCount }}
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

    <!-- 消息列表 -->
    <view class="px-4 pt-2">
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
                <text class="text-lg">
                  {{ getMessageIcon(message.templateType) }}
                </text>
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

      <!-- 加载更多指示器 -->
      <view v-if="loading && messageList.length > 0" class="py-4 text-center">
        <view class="mb-2 animate-spin text-2xl">
          🔄
        </view>
        <view class="text-sm text-gray-500">
          加载中...
        </view>
      </view>

      <!-- 没有更多数据 -->
      <view v-if="!hasMore && messageList.length > 0" class="py-4 text-center">
        <view class="text-sm text-gray-400">
          — 没有更多消息了 —
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="messageList.length === 0 && !loading" class="py-20 text-center">
        <view class="mb-4 text-6xl">
          {{ filterTab === 'unread' ? '📪' : '💬' }}
        </view>
        <view class="mb-2 text-lg text-gray-600 font-medium">
          {{ filterTab === 'unread' ? '暂无未读消息' : filterTab === 'read' ? '暂无已读消息' : '暂无消息提醒' }}
        </view>
        <view class="text-sm text-gray-400">
          {{ filterTab === 'unread' ? '所有消息都已阅读' : '还没有收到任何消息' }}
        </view>
      </view>

      <!-- 首次加载状态 -->
      <view v-if="loading && messageList.length === 0" class="py-20 text-center">
        <view class="mb-4 animate-spin text-4xl">
          🔄
        </view>
        <view class="text-lg text-gray-600 font-medium">
          加载中...
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>

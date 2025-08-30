<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "通知公告"
  }
}
</route>

<script lang="ts" setup>
import type { NoticePageReqVO, NoticeRespVO } from '@/api/types/notice'
import { getNoticePage } from '@/api/notice'

defineOptions({
  name: 'NotificationList',
})

// 分页参数
const pageParams = reactive<NoticePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  status: 0, // 只显示启用的通知
})

// 数据状态
const notificationList = ref<NoticeRespVO[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const total = ref(0)

// 搜索关键词
const searchKeyword = ref('')

// 页面加载
onLoad(() => {
  loadNotificationList()
})

// 下拉刷新
onPullDownRefresh(() => {
  refreshNotificationList()
})

// 触底加载更多
onReachBottom(() => {
  if (!loading.value && hasMore.value) {
    loadMoreNotifications()
  }
})

// 加载通知公告列表
async function loadNotificationList() {
  if (loading.value)
    return

  try {
    loading.value = true

    const response = await getNoticePage(pageParams)

    if (response.code === 0 && response.data) {
      notificationList.value = response.data.list
      total.value = response.data.total
      hasMore.value = response.data.list.length >= pageParams.pageSize

      console.log('✨ 通知公告列表加载完成:', {
        count: response.data.list.length,
        total: response.data.total,
        hasMore: hasMore.value,
      })
    }
    else {
      console.warn('⚠️ 获取通知公告列表失败:', response.msg)
      uni.showToast({
        title: response.msg || '获取通知公告失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('❌ 加载通知公告列表错误:', error)
    uni.showToast({
      title: '获取通知公告失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    loading.value = false
  }
}

// 刷新通知公告列表
async function refreshNotificationList() {
  try {
    refreshing.value = true
    pageParams.pageNo = 1

    const response = await getNoticePage(pageParams)

    if (response.code === 0 && response.data) {
      notificationList.value = response.data.list
      total.value = response.data.total
      hasMore.value = response.data.list.length >= pageParams.pageSize

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
    console.error('❌ 刷新通知公告列表错误:', error)
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

// 加载更多通知公告
async function loadMoreNotifications() {
  if (loading.value || !hasMore.value)
    return

  try {
    loading.value = true
    pageParams.pageNo += 1

    const response = await getNoticePage(pageParams)

    if (response.code === 0 && response.data) {
      notificationList.value.push(...response.data.list)
      hasMore.value = response.data.list.length >= pageParams.pageSize

      console.log('✨ 加载更多通知公告完成:', {
        newCount: response.data.list.length,
        totalCount: notificationList.value.length,
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
    console.error('❌ 加载更多通知公告错误:', error)
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

// 搜索通知公告
async function searchNotifications() {
  pageParams.pageNo = 1
  pageParams.title = searchKeyword.value.trim() || undefined
  await loadNotificationList()
}

// 清除搜索
function clearSearch() {
  searchKeyword.value = ''
  pageParams.title = undefined
  pageParams.pageNo = 1
  loadNotificationList()
}

// 跳转到通知详情
function navigateToDetail(notification: NoticeRespVO) {
  uni.navigateTo({
    url: `/pages-sub/notification/detail?id=${notification.id}`,
  })
}

// 格式化通知公告时间
function formatNotificationTime(createTime: string): string {
  if (!createTime)
    return ''

  try {
    const date = new Date(createTime)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }
  catch (error) {
    console.error('时间格式化错误:', error)
    return createTime
  }
}

// 获取通知类型文本
function getNotificationTypeText(type: number): string {
  switch (type) {
    case 1: return '系统通知'
    case 2: return '公告'
    case 3: return '活动'
    default: return '通知'
  }
}

// 获取通知类型颜色
function getNotificationTypeColor(type: number): string {
  switch (type) {
    case 1: return 'text-blue-600 bg-blue-50 border-blue-200' // 系统通知
    case 2: return 'text-red-600 bg-red-50 border-red-200' // 公告
    case 3: return 'text-green-600 bg-green-50 border-green-200' // 活动
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

// 获取通知图标
function getNotificationIcon(type: number): string {
  switch (type) {
    case 1: return '🔔' // 系统通知
    case 2: return '📢' // 公告
    case 3: return '🎉' // 活动
    default: return '📢'
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
    <!-- 搜索栏 -->
    <view class="bg-white px-4 py-3 shadow-sm">
      <view class="flex items-center">
        <wd-input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索通知公告标题..."
          clearable
          custom-style="flex: 1; margin-right: 12rpx;"
          @confirm="searchNotifications"
          @clear="clearSearch"
        />
        <wd-button
          type="primary"
          size="small"
          custom-style="border-radius: 8rpx; font-size: 24rpx; padding: 0 16rpx;"
          @click="searchNotifications"
        >
          搜索
        </wd-button>
      </view>
    </view>

    <!-- 统计信息 -->
    <view v-if="total > 0" class="px-4 py-2">
      <view class="text-sm text-gray-500">
        共找到 {{ total }} 条通知公告
      </view>
    </view>

    <!-- 通知公告列表 -->
    <view class="px-4 pt-2">
      <view
        v-for="notification in notificationList"
        :key="notification.id"
        class="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm transition-all active:scale-98"
        @click="navigateToDetail(notification)"
      >
        <view class="p-4">
          <view class="mb-3 flex items-start justify-between">
            <view class="flex flex-1 items-start">
              <text class="mr-3 text-xl">
                {{ getNotificationIcon(notification.type) }}
              </text>
              <view class="flex-1">
                <view class="line-clamp-2 mb-2 text-base text-gray-800 font-medium">
                  {{ notification.title }}
                </view>
                <view class="line-clamp-3 text-sm text-gray-600 leading-relaxed">
                  {{ getPlainTextContent(notification.content) }}
                </view>
              </view>
            </view>
            <view class="ml-3 rounded-full px-2 py-1 text-xs font-medium" :class="getNotificationTypeColor(notification.type)">
              {{ getNotificationTypeText(notification.type) }}
            </view>
          </view>

          <view class="flex items-center justify-between">
            <view class="text-xs text-gray-400">
              📅 {{ formatNotificationTime(notification.createTime) }}
            </view>
            <view class="text-xs text-blue-500">
              查看详情 ›
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多指示器 -->
      <view v-if="loading && notificationList.length > 0" class="py-4 text-center">
        <view class="mb-2 animate-spin text-2xl">
          🔄
        </view>
        <view class="text-sm text-gray-500">
          加载中...
        </view>
      </view>

      <!-- 没有更多数据 -->
      <view v-if="!hasMore && notificationList.length > 0" class="py-4 text-center">
        <view class="text-sm text-gray-400">
          — 没有更多通知公告了 —
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="notificationList.length === 0 && !loading" class="py-20 text-center">
        <view class="mb-4 text-6xl">
          📢
        </view>
        <view class="mb-2 text-lg text-gray-600 font-medium">
          暂无通知公告
        </view>
        <view class="text-sm text-gray-400">
          {{ searchKeyword ? '换个关键词试试' : '暂时没有发布的通知公告' }}
        </view>
      </view>

      <!-- 首次加载状态 -->
      <view v-if="loading && notificationList.length === 0" class="py-20 text-center">
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

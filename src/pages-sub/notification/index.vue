<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "通知公告"
  }
}
</route>

<script lang="ts" setup>
import type { NoticePageReqVO, NoticeRespVO } from '@/api/types/notice'
import { computed } from 'vue'
import { getNoticePage } from '@/api/notice'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'
import { formatStandardDateTime } from '@/utils'

defineOptions({
  name: 'NotificationList',
})

// 数据状态
const notificationList = ref<NoticeRespVO[]>([])
const pagingRef = ref()
const firstLoad = ref(true)

// 搜索关键词
const searchKeyword = ref('')

// 基础分页参数
const baseParams = reactive({
  status: 0, // 只显示启用的通知
})

// 页面加载
onLoad(() => {
  // z-paging会自动触发首次加载
})

// 主题适配：浅色/深色
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-600'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-gray-400'))
// 加载通知公告列表
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params: NoticePageReqVO = {
      pageNo,
      pageSize,
      ...baseParams,
      title: searchKeyword.value.trim() || undefined,
    }

    const response = await getNoticePage(params)

    console.log('通知公告列表查询响应:', response)

    if (response.code === 0 && response.data) {
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
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('❌ 加载通知公告列表错误:', error)
    pagingRef.value?.complete(false)
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
}

// 搜索通知公告
function searchNotifications() {
  pagingRef.value?.reload()
}

// 清除搜索 - 现在由wd-search组件自动处理
function clearSearch() {
  searchKeyword.value = ''
  searchNotifications()
}

// 跳转到通知详情
function navigateToDetail(notification: NoticeRespVO) {
  uni.navigateTo({
    url: `/pages-sub/notification/detail?id=${notification.id}`,
  })
}

// 格式化通知公告时间
function formatNotificationTime(createTime: string | number): string {
  if (!createTime)
    return ''

  return formatStandardDateTime(createTime)
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
  if (isDark.value) {
    switch (type) {
      case 1: return 'text-blue-400 bg-blue-500/12 border-blue-500/20'
      case 2: return 'text-orange-400 bg-orange-500/12 border-orange-500/20'
      case 3: return 'text-green-400 bg-green-500/12 border-green-500/20'
      default: return 'text-gray-400 bg-white/6 border-white/12'
    }
  }
  else {
    switch (type) {
      case 1: return 'text-blue-600 bg-blue-50 border-blue-200' // 系统通知
      case 2: return 'text-red-600 bg-red-50 border-red-200' // 公告
      case 3: return 'text-green-600 bg-green-50 border-green-200' // 活动
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
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
  <view class="min-h-screen">
    <!-- 使用z-paging的全屏模式，搜索框放在slot="top"内 -->
    <z-paging
      ref="pagingRef"
      v-model="notificationList"
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
      empty-view-text="暂无通知公告"
      @query="queryList"
    >
      <!-- 搜索栏固定在顶部 -->
      <template #top>
        <!-- 顶部搜索不再使用白底，保持与页面统一背景 -->
        <view class="px-4 py-3">
          <view class="flex items-center gap-3">
            <view class="flex-1">
              <wd-search
                v-model="searchKeyword"
                placeholder="搜索通知公告标题..."
                cancel-txt="搜索"
                :custom-style="isDark
                  ? 'background-color: rgba(255,255,255,0.08); border-radius: 20rpx; color: #e5e7eb;'
                  : 'border-radius: 20rpx'"
                @search="searchNotifications"
                @cancel="searchNotifications"
              />
            </view>
          </view>
        </view>
      </template>

      <!-- 骨架屏 -->
      <view v-if="firstLoad" class="p-4">
        <wd-skeleton theme="paragraph" />
      </view>

      <!-- 通知公告列表内容 -->
      <view v-else class="px-4 pt-2">
        <ThemeCard
          v-for="notification in notificationList"
          :key="notification.id"
          card-class="mb-4 transition-all active:scale-98"
          :padding="false"
          @click="navigateToDetail(notification)"
        >
          <view class="p-4">
            <view class="mb-3 flex items-start justify-between">
              <view class="flex flex-1 items-start">
                <view class="mr-3 h-8 w-8 flex items-center justify-center rounded-lg" :class="getNotificationTypeColor(notification.type)">
                  <view class="h-4 w-4 rounded bg-current" />
                </view>
                <view class="flex-1">
                  <view class="line-clamp-2 mb-2 text-base font-medium" :class="textPrimaryClass">
                    {{ notification.title }}
                  </view>
                  <view class="line-clamp-3 text-sm leading-relaxed" :class="textSecondaryClass">
                    {{ getPlainTextContent(notification.content) }}
                  </view>
                </view>
              </view>
              <view class="ml-3 rounded-full px-2 py-1 text-xs font-medium" :class="getNotificationTypeColor(notification.type)">
                {{ getNotificationTypeText(notification.type) }}
              </view>
            </view>

            <view class="flex items-center justify-between">
              <view class="text-xs" :class="textMutedClass">
                {{ formatNotificationTime(notification.createTime) }}
              </view>
              <view class="text-xs" :class="isDark ? 'text-blue-400' : 'text-blue-500'">
                查看详情 ›
              </view>
            </view>
          </view>
        </ThemeCard>
      </view>
    </z-paging>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>

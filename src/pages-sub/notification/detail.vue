<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "通知详情"
  }
}
</route>

<script lang="ts" setup>
import type { NoticeRespVO } from '@/api/types/notice'
import { getNoticeById } from '@/api/notice'
import { formatStandardDateTime } from '@/utils'

defineOptions({
  name: 'NotificationDetail',
})

// 通知公告详情数据
const notification = ref<NoticeRespVO | null>(null)
const loading = ref(false)
const notificationId = ref<number>(0)

// 页面加载
onLoad((options) => {
  if (options?.id) {
    notificationId.value = Number(options.id)
    loadNotificationDetail()
  }
  else {
    uni.showToast({
      title: '通知ID不能为空',
      icon: 'none',
      duration: 2000,
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 2000)
  }
})

// 加载通知公告详情
async function loadNotificationDetail() {
  if (loading.value)
    return

  try {
    loading.value = true

    const response = await getNoticeById(notificationId.value)

    if (response.code === 0 && response.data) {
      notification.value = response.data

      // 动态设置页面标题
      uni.setNavigationBarTitle({
        title: response.data.title.length > 10
          ? `${response.data.title.substring(0, 10)}...`
          : response.data.title,
      })

      console.log('✨ 通知公告详情加载完成:', notification.value)
    }
    else {
      console.warn('⚠️ 获取通知公告详情失败:', response.msg)
      uni.showToast({
        title: response.msg || '获取通知详情失败',
        icon: 'none',
        duration: 2000,
      })

      setTimeout(() => {
        uni.navigateBack()
      }, 2000)
    }
  }
  catch (error) {
    console.error('❌ 加载通知公告详情错误:', error)
    uni.showToast({
      title: '获取通知详情失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    loading.value = false
  }
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
  switch (type) {
    case 1: return 'text-blue-600 bg-blue-50 border-blue-200' // 系统通知
    case 2: return 'text-red-600 bg-red-50 border-red-200' // 公告
    case 3: return 'text-green-600 bg-green-50 border-green-200' // 活动
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="min-h-screen bg-gray-50">
    <!-- 加载状态 -->
    <view v-if="loading" class="flex flex-col items-center justify-center py-20">
      <view class="mb-4 h-12 w-12 animate-spin border-2 border-blue-500 border-t-transparent rounded" />
      <view class="text-lg text-gray-600 font-medium">
        加载中...
      </view>
    </view>

    <!-- 通知详情内容 -->
    <view v-else-if="notification" class="px-4 pt-4">
      <!-- 通知头部信息 -->
      <view class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <view class="p-6">
          <!-- 标题和类型 -->
          <view class="mb-4 flex items-start justify-between">
            <view class="flex-1">
              <view class="mb-3 text-xl text-gray-800 font-bold leading-relaxed">
                {{ notification.title }}
              </view>
            </view>
          </view>

          <!-- 发布时间 -->
          <view class="border-t border-gray-100 pt-4">
            <view class="flex items-center text-sm text-gray-500">
              <view class="mr-2 h-4 w-4 rounded bg-gray-400" />
              <view>发布时间：{{ formatNotificationTime(notification.createTime) }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 通知内容 -->
      <view class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <view class="border-b border-gray-100 px-6 py-4">
          <view class="text-lg text-gray-800 font-semibold">
            通知内容
          </view>
        </view>
        <view class="p-6">
          <!-- 使用 rich-text 组件渲染 HTML 内容 -->
          <rich-text
            :nodes="notification.content"
            class="text-base text-gray-700 leading-loose"
          />
        </view>
      </view>

      <!-- 相关说明 -->
      <view class="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
        <view class="p-6">
          <view class="mb-3 text-base text-gray-800 font-semibold">
            温馨提示
          </view>
          <view class="text-sm text-gray-600 leading-relaxed space-y-2">
            <view>• 请认真阅读通知内容，了解相关要求</view>
            <view>• 如有疑问，请及时联系相关负责人</view>
            <view>• 重要通知请及时查看，避免错过时间</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="flex flex-col items-center justify-center py-20">
      <view class="mb-4 h-16 w-16 rounded-xl bg-red-100" />
      <view class="mb-2 text-lg text-gray-600 font-medium">
        通知公告不存在
      </view>
      <view class="mb-6 text-sm text-gray-400">
        该通知可能已被删除或不存在
      </view>
      <wd-button
        type="primary"
        size="medium"
        custom-style="border-radius: 12rpx; font-size: 28rpx;"
        @click="goBack"
      >
        返回上一页
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>

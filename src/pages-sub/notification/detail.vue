<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "通知详情"
  }
}
</route>

<script lang="ts" setup>
import type { NoticeRespVO } from '@/api/types/notice'
import { computed } from 'vue'
import { getNoticeById } from '@/api/notice'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'
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

// 返回上一页
function goBack() {
  uni.navigateBack()
}
// 主题适配：浅色/深色
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-700'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-gray-400'))
const borderMutedClass = computed(() => (isDark.value ? 'border-white/12' : 'border-gray-100'))
</script>

<template>
  <view class="min-h-screen">
    <!-- 加载状态 -->
    <view v-if="loading" class="flex flex-col items-center justify-center py-20">
      <view class="mb-4 h-12 w-12 animate-spin border-2 border-blue-500 border-t-transparent rounded" />
      <view class="text-lg font-medium" :class="textSecondaryClass">
        加载中...
      </view>
    </view>

    <!-- 通知详情内容 -->
    <view v-else-if="notification" class="px-4 pt-4">
      <!-- 通知头部信息 -->
      <ThemeCard class="mb-6" :padding="false">
        <view class="p-6">
          <!-- 标题和类型 -->
          <view class="mb-4 flex items-start justify-between">
            <view class="flex-1">
              <view class="mb-3 text-xl font-bold leading-relaxed" :class="textPrimaryClass">
                {{ notification.title }}
              </view>
            </view>
          </view>

          <!-- 发布时间 -->
          <view class="border-t pt-4" :class="borderMutedClass">
            <view class="flex items-center text-sm" :class="textMutedClass">
              <view class="mr-2 h-4 w-4 rounded bg-gray-400" />
              <view>发布时间：{{ formatNotificationTime(notification.createTime) }}</view>
            </view>
          </view>
        </view>
      </ThemeCard>

      <!-- 通知内容 -->
      <ThemeCard class="mb-6" :padding="false">
        <view class="border-b px-6 py-4" :class="borderMutedClass">
          <view class="text-lg font-semibold" :class="textPrimaryClass">
            通知内容
          </view>
        </view>
        <view class="p-6">
          <!-- 使用 rich-text 组件渲染 HTML 内容 -->
          <rich-text
            :nodes="notification.content"
            class="text-base leading-loose"
            :class="textSecondaryClass"
          />
        </view>
      </ThemeCard>

      <!-- 相关说明 -->
      <ThemeCard class="mb-8" :padding="false">
        <view class="p-6">
          <view class="mb-3 text-base font-semibold" :class="textPrimaryClass">
            温馨提示
          </view>
          <view class="text-sm leading-relaxed space-y-2" :class="textSecondaryClass">
            <view>• 请认真阅读通知内容，了解相关要求</view>
            <view>• 如有疑问，请及时联系相关负责人</view>
            <view>• 重要通知请及时查看，避免错过时间</view>
          </view>
        </view>
      </ThemeCard>
    </view>

    <!-- 错误状态 -->
    <view v-else class="flex flex-col items-center justify-center py-20">
      <view class="mb-4 h-16 w-16 rounded-xl bg-red-100" />
      <view class="mb-2 text-lg font-medium" :class="textSecondaryClass">
        通知公告不存在
      </view>
      <view class="mb-6 text-sm" :class="textMutedClass">
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

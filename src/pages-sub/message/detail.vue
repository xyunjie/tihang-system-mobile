<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "消息详情"
  }
}
</route>

<script lang="ts" setup>
import type { NotifyMessageRespVO } from '@/api/types/notify-message'
import { getNotifyMessageById } from '@/api/notify-message'
import { formatStandardDateTime } from '@/utils'

defineOptions({
  name: 'MessageDetail',
})

// 消息详情数据
const message = ref<NotifyMessageRespVO | null>(null)
const loading = ref(false)
const messageId = ref<number>(0)

// 页面加载
onLoad((options) => {
  if (options?.id) {
    messageId.value = Number(options.id)
    loadMessageDetail()
  }
  else {
    uni.showToast({
      title: '消息ID不能为空',
      icon: 'none',
      duration: 2000,
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 2000)
  }
})

// 加载消息详情
async function loadMessageDetail() {
  if (loading.value)
    return

  try {
    loading.value = true

    const response = await getNotifyMessageById(messageId.value)

    if (response.code === 0 && response.data) {
      message.value = response.data

      // 动态设置页面标题
      uni.setNavigationBarTitle({
        title: '消息详情',
      })

      console.log('✨ 消息详情加载完成:', message.value)
    }
    else {
      console.warn('⚠️ 获取消息详情失败:', response.msg)
      uni.showToast({
        title: response.msg || '获取消息详情失败',
        icon: 'none',
        duration: 2000,
      })

      setTimeout(() => {
        uni.navigateBack()
      }, 2000)
    }
  }
  catch (error) {
    console.error('❌ 加载消息详情错误:', error)
    uni.showToast({
      title: '获取消息详情失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    loading.value = false
  }
}

// 格式化消息时间
function formatMessageTime(createTime: string | number): string {
  if (!createTime)
    return ''

  return formatStandardDateTime(createTime)
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
    case 1: return 'text-blue-600 bg-blue-50 border-blue-200' // 系统消息
    case 2: return 'text-orange-600 bg-orange-50 border-orange-200' // 审批消息
    case 3: return 'text-green-600 bg-green-50 border-green-200' // 考勤消息
    case 4: return 'text-purple-600 bg-purple-50 border-purple-200' // 项目消息
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

    <!-- 消息详情内容 -->
    <view v-else-if="message" class="px-4 pt-4">
      <!-- 消息头部信息 -->
      <view class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <view class="p-6">
          <!-- 发送者信息和消息状态 -->
          <view class="mb-4 flex items-start justify-between">
            <view class="flex flex-1 items-start">
              <view class="mr-4 h-12 w-12 flex flex-shrink-0 items-center justify-center rounded-full" :class="getMessageTypeColor(message.templateType)">
                <view class="h-6 w-6 rounded bg-current" />
              </view>
              <view class="flex-1">
                <view class="mb-2 text-lg text-gray-800 font-bold">
                  {{ message.templateNickname || '系统' }}
                </view>
                <view class="flex items-center">
                  <view class="rounded-full px-3 py-1 text-sm font-medium" :class="getMessageTypeColor(message.templateType)">
                    {{ getMessageTypeText(message.templateType) }}
                  </view>
                  <view v-if="!message.readStatus" class="ml-3 flex items-center">
                    <view class="mr-1 h-2 w-2 rounded-full bg-red-500" />
                    <view class="text-xs text-red-500 font-medium">
                      未读
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 发送时间 -->
          <view class="border-t border-gray-100 pt-4">
            <view class="flex items-center text-sm text-gray-500">
              <view class="mr-2 h-4 w-4 rounded bg-gray-400" />
              <view>发送时间：{{ formatMessageTime(message.createTime) }}</view>
            </view>
            <view v-if="message.readTime" class="mt-1 flex items-center text-sm text-gray-500">
              <view class="mr-2 h-4 w-4 rounded bg-green-400" />
              <view>阅读时间：{{ formatMessageTime(message.readTime) }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 消息内容 -->
      <view class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <view class="border-b border-gray-100 px-6 py-4">
          <view class="text-lg text-gray-800 font-semibold">
            消息内容
          </view>
        </view>
        <view class="p-6">
          <!-- 使用 rich-text 组件渲染 HTML 内容 -->
          <rich-text
            :nodes="message.templateContent"
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
            <view>• 重要消息请及时查看和处理</view>
            <view>• 如有疑问，请联系相关负责人</view>
            <view>• 消息内容仅供参考，具体以实际情况为准</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="flex flex-col items-center justify-center py-20">
      <view class="mb-4 h-16 w-16 rounded-xl bg-red-100" />
      <view class="mb-2 text-lg text-gray-600 font-medium">
        消息不存在
      </view>
      <view class="mb-6 text-sm text-gray-400">
        该消息可能已被删除或不存在
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

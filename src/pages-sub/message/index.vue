<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "消息提醒"
  }
}
</route>

<script lang="ts" setup>
import type { NotifyMessagePageReqVO, NotifyMessageRespVO } from '@/api/types/notify-message'
import { computed, watch } from 'vue'
import { getMyNotifyMessagePage } from '@/api/notify-message'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'
import { formatRelativeTime } from '@/utils'

defineOptions({
  name: 'MessageList',
})

// 数据状态
const messageList = ref<NotifyMessageRespVO[]>([])
const pagingRef = ref()
const firstLoad = ref(true)

// 当前选中Tab：0全部，1未读，2已读
const currentTab = ref(0)
const tabs = ['全部', '未读', '已读']

// 主题适配：浅色/深色
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))

// 动态设置背景色
function setPageBackgroundColor() {
  const bgColor = isDark.value ? '#020617' : '#f5f7fa'
  uni.setBackgroundColor({
    backgroundColor: bgColor,
    backgroundColorTop: bgColor,
    backgroundColorBottom: bgColor,
  })
}

onShow(() => {
  setPageBackgroundColor()
})

watch(() => isDark.value, () => {
  setPageBackgroundColor()
})

// 加载消息列表
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params: NotifyMessagePageReqVO = {
      pageNo,
      pageSize,
    }

    if (currentTab.value === 1) {
      params.readStatus = false
    }
    else if (currentTab.value === 2) {
      params.readStatus = true
    }

    const response = await getMyNotifyMessagePage(params)

    if (response.code === 0 && response.data) {
      const { list } = response.data
      if (firstLoad.value)
        firstLoad.value = false
      pagingRef.value?.complete(list)
    }
    else {
      pagingRef.value?.complete(false)
    }
  }
  catch (error) {
    pagingRef.value?.complete(false)
  }
}

// 切换Tab
function handleTabChange(index: number) {
  currentTab.value = index
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
  if (isDark.value) {
    switch (templateType) {
      case 1: return 'text-blue-400 bg-blue-500/10'
      case 2: return 'text-orange-400 bg-orange-500/10'
      case 3: return 'text-green-400 bg-green-500/10'
      case 4: return 'text-purple-400 bg-purple-500/10'
      default: return 'text-gray-400 bg-white/5'
    }
  }
  else {
    switch (templateType) {
      case 1: return 'text-blue-600 bg-blue-50'
      case 2: return 'text-orange-600 bg-orange-50'
      case 3: return 'text-green-600 bg-green-50'
      case 4: return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
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
    <z-paging
      ref="pagingRef"
      v-model="messageList"
      :default-page-size="10"
      :bg-color="isDark ? '#020617' : '#f5f7fa'"
      style="top: 0px;"
      @query="queryList"
    >
      <template #top>
        <view class="sticky top-0 z-10 px-4 py-3" :class="isDark ? 'bg-[#020617]' : 'bg-[#f5f7fa]'">
          <wd-tabs
            v-model="currentTab"
            :nav-style="{
              background: 'transparent',
            }"
            @change="handleTabChange"
          >
            <wd-tab
              v-for="(item, index) in tabs"
              :key="index"
              :title="item"
            />
          </wd-tabs>
        </view>
      </template>

      <view class="px-4 pb-4 space-y-3">
        <ThemeCard
          v-for="item in messageList"
          :key="item.id"
          :padding="false"
          card-class="shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.99] transition-transform duration-200"
          @click="navigateToDetail(item)"
        >
          <view class="flex gap-4 rounded-2xl bg-white p-4 dark:bg-slate-800">
            <!-- 左侧图标容器 -->
            <view
              class="h-10 w-10 flex flex-shrink-0 items-center justify-center rounded-full"
              :class="getMessageTypeColor(item.templateType)"
            >
              <wd-icon name="chat" size="20px" />
            </view>

            <view class="min-w-0 flex-1">
              <view class="mb-1.5 flex items-start justify-between gap-2">
                <view class="flex items-center gap-2">
                  <view class="truncate text-base font-medium leading-tight" :class="[textPrimaryClass, !item.readStatus ? 'font-bold' : '']">
                    {{ item.templateNickname || '系统通知' }}
                  </view>
                  <view v-if="!item.readStatus" class="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                </view>
                <view class="flex-shrink-0 text-xs" :class="textMutedClass">
                  {{ formatRelativeTime(item.createTime) }}
                </view>
              </view>

              <view class="line-clamp-2 text-sm leading-relaxed opacity-80" :class="textSecondaryClass">
                {{ getPlainTextContent(item.templateContent) }}
              </view>
            </view>
          </view>
        </ThemeCard>
      </view>
    </z-paging>
  </view>
</template>

<style lang="scss" scoped>
/* 覆盖 page 背景色 */
:global(page) {
  background-color: #f5f7fa;
}
:global(.dark page) {
  background-color: #020617;
}

:deep(.wd-tabs) {
  background: transparent !important;
}
:deep(.wd-tabs__nav) {
  background: transparent !important;
}
</style>

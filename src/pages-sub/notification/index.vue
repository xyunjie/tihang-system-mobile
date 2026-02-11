<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "通知公告"
  }
}
</route>

<script lang="ts" setup>
import type { NoticePageReqVO, NoticeRespVO } from '@/api/types/notice'
import { computed, watch } from 'vue'
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
function handleSearch(val: { value: string }) {
  searchKeyword.value = val.value || ''
  pagingRef.value?.reload()
}

// 跳转到通知详情
function navigateToDetail(item: NoticeRespVO) {
  const { id } = item
  uni.navigateTo({
    url: `/pages-sub/notification/detail?id=${id}`,
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
      case 1: return 'text-blue-400 bg-blue-500/10'
      case 2: return 'text-orange-400 bg-orange-500/10'
      case 3: return 'text-green-400 bg-green-500/10'
      default: return 'text-gray-400 bg-white/5'
    }
  }
  else {
    switch (type) {
      case 1: return 'text-blue-600 bg-blue-50'
      case 2: return 'text-orange-600 bg-orange-50'
      case 3: return 'text-green-600 bg-green-50'
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
      v-model="notificationList"
      :default-page-size="10"
      :bg-color="isDark ? '#020617' : '#f5f7fa'"
      @query="queryList"
    >
      <template #top>
        <view class="px-4 py-3" :class="isDark ? 'bg-[#020617]' : 'bg-[#f5f7fa]'">
          <wd-search
            v-model="searchKeyword"
            placeholder="搜索通知公告"
            hide-cancel
            :custom-input-style="{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
              borderRadius: '999px',
              height: '40px',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
            }"
            @search="handleSearch"
            @clear="handleSearch"
          />
        </view>
      </template>

      <view class="px-4 pb-4 space-y-3">
        <ThemeCard
          v-for="item in notificationList"
          :key="item.id"
          :padding="false"
          card-class="shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.99] transition-transform duration-200"
          @click="navigateToDetail(item)"
        >
          <view class="p-4 flex gap-4">
            <!-- 左侧图标容器 -->
            <view 
              class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              :class="isDark ? 'bg-blue-500/10' : 'bg-blue-50'"
            >
              <wd-icon 
                name="notification" 
                size="20px" 
                :color="isDark ? '#60a5fa' : '#3b82f6'" 
              />
            </view>

            <view class="flex-1 min-w-0">
              <view class="flex justify-between items-start mb-1.5 gap-2">
                <view class="text-base font-medium truncate leading-tight" :class="textPrimaryClass">
                  {{ item.title }}
                </view>
                <view class="text-xs flex-shrink-0" :class="textMutedClass">
                  {{ formatStandardDateTime(item.createTime).split(' ')[0] }}
                </view>
              </view>

              <view class="text-sm line-clamp-2 leading-relaxed mb-2.5 opacity-80" :class="textSecondaryClass">
                {{ getPlainTextContent(item.content) }}
              </view>
              
              <view class="flex items-center">
                 <view class="px-2 py-0.5 text-xs rounded-md" :class="getNotificationTypeColor(item.type)">
                   {{ getNotificationTypeText(item.type) }}
                 </view>
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
</style>

<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "周报详情"
  }
}
</route>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { getReportDetail } from '@/api/project'
import ThemeCard from '@/components/ThemeCard.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import { useAppStore } from '@/store/app'
import { formatStandardDateTime } from '@/utils'

defineOptions({
  name: 'ProjectReportDetail',
})

const reportId = ref<number>(0)
const report = ref<any | null>(null)
const loading = ref(true)

const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-700'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-gray-500'))
const borderMutedClass = computed(() => (isDark.value ? 'border-white/12' : 'border-gray-100'))
const skeletonBgClass = computed(() => (isDark.value ? 'bg-white/12' : 'bg-gray-200'))

function getReportStatusColor(status: number): string {
  return status === 0
    ? (isDark.value ? 'text-orange-400 bg-orange-500/12 border-orange-500/20' : 'text-orange-600 bg-orange-50 border-orange-200')
    : (isDark.value ? 'text-green-400 bg-green-500/12 border-green-500/20' : 'text-green-600 bg-green-50 border-green-200')
}

function getReportStatusText(status: number): string {
  return status === 0 ? '待审阅' : '已审阅'
}

function normalizeReportStatus(raw: any): number {
  const s = String(raw || '').toLowerCase()
  if (['approved', 'done', 'finished', 'passed'].includes(s))
    return 1
  if (['pending', 'submitted', 'reviewing', 'wait_review'].includes(s))
    return 0
  if (raw === 1 || raw === 0)
    return raw
  return 0
}

function formatTime(createTime: string | number): string {
  if (!createTime)
    return ''
  return formatStandardDateTime(createTime)
}

function formatDate(dateStr: string): string {
  if (!dateStr)
    return ''
  return dateStr.split(' ')[0]
}

function mapReport(raw: any): any {
  if (!raw)
    return null

  return {
    ...raw,
    status: normalizeReportStatus(raw.reviewStatus ?? raw.status),
    reportDate: raw.reportDate || raw.createTime || '',
    title: raw.title || '周报',
    authorName: raw.authorName || raw.userName || '未知作者',
    reviewerName: raw.reviewerName,
    reviewComment: raw.reviewComment,
  }
}

async function loadReport() {
  loading.value = true
  try {
    let cached = uni.getStorageSync('projectReportDetail')
    if (cached && reportId.value && String(cached.id) !== String(reportId.value)) {
      cached = null
    }

    // 先放缓存，占位更快
    if (cached)
      report.value = mapReport(cached)

    if (reportId.value > 0) {
      const detailRes = await getReportDetail(reportId.value)
      if (detailRes.code === 0 && detailRes.data) {
        report.value = mapReport(detailRes.data)
        uni.setStorageSync('projectReportDetail', detailRes.data)
      }
      else if (!report.value) {
        uni.showToast({ title: detailRes.msg || '周报不存在', icon: 'none' })
      }
    }

    if (!report.value) {
      uni.showToast({
        title: '周报不存在',
        icon: 'none',
        duration: 2000,
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1200)
      return
    }

    uni.setNavigationBarTitle({
      title: report.value?.title || '周报详情',
    })
  }
  catch (error) {
    console.error('加载周报详情失败:', error)
    if (!report.value) {
      uni.showToast({ title: '加载失败', icon: 'none' })
    }
  }
  finally {
    loading.value = false
  }
}

onLoad((options) => {
  if (options.id)
    reportId.value = Number(options.id)
  loadReport()
})
</script>

<template>
  <view class="min-h-screen">
    <view v-if="loading" class="animate-pulse px-4 pt-4">
      <ThemeCard card-class="mb-4" padding="p-4">
        <view class="mb-3 h-6 w-4/5 rounded" :class="skeletonBgClass" />
        <view class="mb-2 h-4 w-full rounded" :class="skeletonBgClass" />
        <view class="mb-4 h-4 w-3/4 rounded" :class="skeletonBgClass" />
        <view class="flex items-center justify-between">
          <view class="h-3 w-32 rounded" :class="skeletonBgClass" />
          <view class="h-3 w-24 rounded" :class="skeletonBgClass" />
        </view>
      </ThemeCard>

      <ThemeCard card-class="mb-4" padding="p-4">
        <view class="space-y-3">
          <view v-for="n in 10" :key="n">
            <view class="h-4 w-full rounded" :class="skeletonBgClass" />
          </view>
        </view>
      </ThemeCard>
    </view>

    <view v-else-if="report" class="px-4 pt-4">
      <ThemeCard card-class="mb-4" padding="p-4">
        <view class="mb-3">
          <view class="mb-3 text-xl font-bold" :class="textPrimaryClass">
            {{ report.title || '周报' }}
          </view>

          <view class="mb-3 flex flex-wrap gap-2">
            <view class="border rounded-full px-3 py-1 text-xs font-medium" :class="getReportStatusColor(report.status)">
              {{ getReportStatusText(report.status) }}
            </view>
            <view class="border rounded-full px-3 py-1 text-xs font-medium" :class="isDark ? 'text-gray-300 bg-white/6 border-white/12' : 'text-gray-600 bg-gray-50 border-gray-200'">
              {{ formatDate(report.reportDate) }}
            </view>
          </view>

          <view v-if="report.reviewComment" class="mb-3 text-sm leading-relaxed" :class="textSecondaryClass">
            审阅意见：{{ report.reviewComment }}
          </view>
        </view>

        <view class="flex items-center justify-between border-t pt-3" :class="borderMutedClass">
          <view class="flex items-center">
            <view>
              <view class="text-sm font-medium" :class="textPrimaryClass">
                {{ report.authorName || '未知作者' }}
              </view>
              <view class="text-xs" :class="textMutedClass">
                {{ formatTime(report.createTime) }}
              </view>
            </view>
          </view>

          <view v-if="report.reviewerName || report.reviewTime" class="text-xs" :class="textMutedClass">
            <text v-if="report.reviewerName" class="mr-2">审阅：{{ report.reviewerName }}</text>
            <text v-if="report.reviewTime">{{ formatTime(report.reviewTime) }}</text>
          </view>
        </view>
      </ThemeCard>

      <ThemeCard card-class="mb-4" :padding="false">
        <view v-if="report.content" class="content-body p-4">
          <MarkdownContent :content="report.content" />
        </view>
        <view v-else class="p-4 text-center" :class="textMutedClass">
          暂无周报内容
        </view>
      </ThemeCard>
    </view>

    <view v-else class="py-20 text-center">
      <view class="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gray-200" />
      <view class="mb-2 text-base font-medium" :class="textPrimaryClass">
        周报不存在
      </view>
      <view class="text-sm" :class="textMutedClass">
        该周报可能已被删除或不存在
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 代码块与图片样式在 HtmlContent 组件中已统一，这里不重复定义 */
</style>

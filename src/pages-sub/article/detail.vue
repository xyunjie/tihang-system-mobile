<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "文章详情"
  }
}
</route>

<script lang="ts" setup>
import type { ArticleDetailRespVO } from '@/api/types/article'
import { getArticleDetail } from '@/api/article'
import ThemeCard from '@/components/ThemeCard.vue'
import { computed } from 'vue'
import { useAppStore } from '@/store/app'
import { formatStandardDateTime } from '@/utils'

defineOptions({
  name: 'ArticleDetail',
})

// 页面参数
const articleId = ref<number>(0)
const article = ref<ArticleDetailRespVO | null>(null)
const loading = ref(true)
const isLoved = ref(false)
const isStarred = ref(false)

// 主题适配：浅色/深色
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-700'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-gray-500'))
const borderMutedClass = computed(() => (isDark.value ? 'border-white/12' : 'border-gray-100'))
// 骨架屏背景：深色使用半透明白，浅色保持灰色
const skeletonBgClass = computed(() => (isDark.value ? 'bg-white/12' : 'bg-gray-200'))

// 页面加载
onLoad((options) => {
  if (options.id) {
    articleId.value = options.id
    loadArticleDetail()
  }
  else {
    uni.showToast({
      title: '文章不存在',
      icon: 'none',
      duration: 2000,
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 2000)
  }
})

// 加载文章详情
async function loadArticleDetail() {
  loading.value = true

  try {
    const response = await getArticleDetail(articleId.value)

    console.log('文章详情查询响应:', response)

    if (response.code === 0 && response.data) {
      article.value = response.data
      isLoved.value = response.data.isLove
      isStarred.value = response.data.isStar
    }
    else {
      uni.showToast({
        title: response.msg || '获取文章详情失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    loading.value = false
  }
}

// 格式化时间
function formatTime(createTime: string | number): string {
  if (!createTime)
    return ''

  return formatStandardDateTime(createTime)
}

// 格式化数量
function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}
</script>

<template>
  <view class="min-h-screen" :class="isDark ? 'bg-[#0f172a]' : 'bg-gray-50'">
    <!-- 加载中 -->
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

    <!-- 文章内容 -->
    <view v-else-if="article" class="px-4 pt-4">
      <!-- 文章头部信息 -->
      <ThemeCard card-class="mb-4" padding="p-4">
        <view class="mb-3">
          <view class="mb-3 text-xl font-bold" :class="textPrimaryClass">
            {{ article.title }}
          </view>

          <!-- 标签 -->
          <view v-if="article.tagNames && article.tagNames.length > 0" class="mb-3 flex flex-wrap gap-2">
            <view
              v-for="tag in article.tagNames"
              :key="tag"
              :class="['rounded-full px-3 py-1 text-xs font-medium border', isDark ? 'text-gray-300 bg-white/6 border-white/12' : 'text-gray-600 bg-gray-50 border-gray-200']"
            >
              {{ tag }}
            </view>
          </view>

          <!-- 摘要 -->
          <view v-if="article.blogAbstract" class="mb-3 text-sm leading-relaxed" :class="textSecondaryClass">
            {{ article.blogAbstract }}
          </view>
        </view>

        <!-- 作者和时间信息 -->
        <view class="flex items-center justify-between border-t pt-3" :class="borderMutedClass">
          <view class="flex items-center">
            <view>
              <view class="text-sm font-medium" :class="textPrimaryClass">
                {{ article.authorName }}
              </view>
              <view class="text-xs" :class="textMutedClass">
                {{ formatTime(article.createTime) }}
              </view>
            </view>
          </view>

          <view class="flex items-center text-xs" :class="textMutedClass">
            <text class="mr-3">
              浏览 {{ formatCount(article.browse) }}
            </text>
            <text class="mr-3">
              点赞 {{ formatCount(article.love) }}
            </text>
            <text class="mr-3">
              收藏 {{ formatCount(article.star) }}
            </text>
            <text>评论 {{ formatCount(article.message) }}</text>
          </view>
        </view>
      </ThemeCard>

      <!-- 文章正文 -->
      <ThemeCard card-class="mb-4" :padding="false">
        <view v-if="article.content" class="p-4 content-body">
          <!-- 使用 mp-html 渲染 HTML 内容 -->
          <HtmlContent :content="article.content" />
        </view>
        <view v-else class="p-4 text-center" :class="textMutedClass">
          暂无文章内容
        </view>
      </ThemeCard>
    </view>

    <!-- 错误状态 -->
    <view v-else class="py-20 text-center">
      <view class="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gray-200" />
      <view class="mb-2 text-base font-medium" :class="textPrimaryClass">
        文章不存在
      </view>
      <view class="text-sm" :class="textMutedClass">
        该文章可能已被删除或不存在
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 代码块与图片样式在 HtmlContent 组件中已统一，这里不重复定义 */
</style>

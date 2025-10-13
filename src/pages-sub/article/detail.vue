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
import HtmlRenderer from '@/components/HtmlRenderer.vue'
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

// 处理图片点击 - 打开预览
function handleImageTap(urls: string[], index: number) {
  if (!urls || urls.length === 0) {
    return
  }

  uni.previewImage({
    urls, // 所有图片列表
    current: index, // 当前显示图片的索引
    fail() {
      uni.showToast({
        title: '图片预览失败',
        icon: 'none',
      })
    },
  })
}
</script>

<template>
  <view class="min-h-screen bg-gray-50">
    <!-- 加载中 -->
    <view v-if="loading" class="animate-pulse px-4 pt-4">
      <view class="mb-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
        <view class="mb-3 h-6 w-4/5 rounded bg-gray-200" />
        <view class="mb-2 h-4 w-full rounded bg-gray-200" />
        <view class="mb-4 h-4 w-3/4 rounded bg-gray-200" />
        <view class="flex items-center justify-between">
          <view class="h-3 w-32 rounded bg-gray-200" />
          <view class="h-3 w-24 rounded bg-gray-200" />
        </view>
      </view>

      <view class="overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
        <view class="space-y-3">
          <view v-for="n in 10" :key="n">
            <view class="h-4 w-full rounded bg-gray-200" />
          </view>
        </view>
      </view>
    </view>

    <!-- 文章内容 -->
    <view v-else-if="article" class="px-4 pt-4">
      <!-- 文章头部信息 -->
      <view class="mb-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
        <view class="mb-3">
          <view class="mb-3 text-xl text-gray-800 font-bold">
            {{ article.title }}
          </view>

          <!-- 标签 -->
          <view v-if="article.tagNames && article.tagNames.length > 0" class="mb-3 flex flex-wrap gap-2">
            <view
              v-for="tag in article.tagNames"
              :key="tag"
              class="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600 font-medium"
            >
              {{ tag }}
            </view>
          </view>

          <!-- 摘要 -->
          <view v-if="article.blogAbstract" class="mb-3 text-sm text-gray-600 leading-relaxed">
            {{ article.blogAbstract }}
          </view>
        </view>

        <!-- 作者和时间信息 -->
        <view class="flex items-center justify-between border-t border-gray-100 pt-3">
          <view class="flex items-center">
            <view>
              <view class="text-sm text-gray-800 font-medium">
                {{ article.authorName }}
              </view>
              <view class="text-xs text-gray-500">
                {{ formatTime(article.createTime) }}
              </view>
            </view>
          </view>

          <view class="flex items-center text-xs text-gray-500">
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
      </view>

      <!-- 文章正文 -->
      <view class="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
        <view v-if="article.content" class="p-4">
          <!-- 使用 HtmlRenderer 组件渲染 HTML 内容，支持数学公式和代码高亮 -->
          <HtmlRenderer
            :content="article.content"
            :enable-math="true"
            :enable-code-highlight="true"
            content-class="html-content"
            @image-tap="handleImageTap"
          />
        </view>
        <view v-else class="p-4 text-center text-gray-500">
          暂无文章内容
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="py-20 text-center">
      <view class="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gray-200" />
      <view class="mb-2 text-base text-gray-800 font-medium">
        文章不存在
      </view>
      <view class="text-sm text-gray-500">
        该文章可能已被删除或不存在
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类样式 */
</style>

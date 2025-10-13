<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "文章列表"
  }
}
</route>

<script lang="ts" setup>
import type { ArticleSearchRespVO } from '@/api/types/article'
import { getArticlePage } from '@/api/article'
import { formatStandardDateTime } from '@/utils'

defineOptions({
  name: 'ArticleList',
})

// 页面状态
const articles = ref<ArticleSearchRespVO[]>([])
const pagingRef = ref()
const firstLoad = ref(true)

// 搜索参数
const searchParams = reactive({
  keyword: '',
  tags: [] as string[],
})

// 加载文章列表
async function queryList(pageNo: number, pageSize: number) {
  try {
    const response = await getArticlePage({
      pageNo,
      pageSize,
      keyword: searchParams.keyword || undefined,
      tags: searchParams.tags.length > 0 ? searchParams.tags : undefined,
    })

    console.log('文章列表查询响应:', response)

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
    console.error('❌ 加载文章列表错误:', error)
    pagingRef.value?.complete(false)
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
}

// 搜索文章
function searchArticles() {
  pagingRef.value?.reload()
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

// 获取文章分类颜色
function getCategoryColor(tags: string[]): string {
  if (!tags || tags.length === 0)
    return 'text-gray-600 bg-gray-50'

  const tagColorMap: Record<string, string> = {
    技术分享: 'text-blue-600 bg-blue-50',
    项目经验: 'text-green-600 bg-green-50',
    学习笔记: 'text-purple-600 bg-purple-50',
    工作总结: 'text-orange-600 bg-orange-50',
    团队建设: 'text-red-600 bg-red-50',
    竞赛指导: 'text-indigo-600 bg-indigo-50',
  }

  const firstTag = tags[0]
  return tagColorMap[firstTag] || 'text-gray-600 bg-gray-50'
}

// 跳转到文章详情
function goToArticleDetail(articleId: number) {
  uni.navigateTo({
    url: `/pages-sub/article/detail?id=${articleId}`,
    fail: (error) => {
      console.error('跳转失败:', error)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none',
        duration: 2000,
      })
    },
  })
}

// 处理搜索高亮关键词
function highlightSearchKeywords(text: string | undefined): string {
  if (!text)
    return ''

  // 将HTML标签中的em标签转换为红色加粗样式
  return text.replace(
    /<em>(.*?)<\/em>/g,
    '<span style="color: #ff0000; font-weight: bold;">$1</span>',
  )
}
</script>

<template>
  <view class="min-h-screen bg-gray-50">
    <!-- 使用z-paging的全屏模式，搜索框放在slot="top"内 -->
    <z-paging
      ref="pagingRef"
      v-model="articles"
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
      empty-view-text="暂无文章"
      @query="queryList"
    >
      <!-- 搜索栏固定在顶部 -->
      <template #top>
        <view class="bg-white px-4 py-3 shadow-sm">
          <view class="flex items-center gap-3">
            <view class="flex-1">
              <wd-search
                v-model="searchParams.keyword"
                placeholder="搜索文章标题、内容..."
                cancel-txt="搜索"
                custom-style="background-color: #f5f5f5; border-radius: 20rpx;"
                @search="searchArticles"
                @cancel="searchArticles"
              />
            </view>
          </view>
        </view>
      </template>

      <!-- 骨架屏 -->
      <view v-if="firstLoad" class="p-4">
        <wd-skeleton theme="paragraph" />
      </view>

      <!-- 文章列表内容 -->
      <view v-else class="p-4">
        <view
          v-for="article in articles"
          :key="article.id"
          class="mb-4"
        >
          <!-- 文章卡片 -->
          <view
            class="overflow-hidden rounded-2xl bg-white p-4 shadow-sm transition-all active:bg-gray-50"
            @click="goToArticleDetail(article.id)"
          >
            <!-- 有封面图片的布局 -->
            <view v-if="article.coverImage" class="mb-3">
              <!-- 标题和标签 -->
              <view class="mb-3 flex items-start justify-between">
                <view class="flex-1">
                  <view class="line-clamp-2 mb-2 text-base text-gray-800 font-semibold">
                    <rich-text :nodes="highlightSearchKeywords(article.title)" />
                  </view>
                </view>
                <view v-if="article.tagNames && article.tagNames.length > 0" class="ml-3 rounded-full px-3 py-1 text-xs font-medium" :class="getCategoryColor(article.tagNames)">
                  {{ article.tagNames[0] }}
                </view>
              </view>

              <!-- 图片和摘要并排 -->
              <view class="flex gap-3">
                <!-- 封面图片 -->
                <view class="h-16 w-26 flex-shrink-0 overflow-hidden rounded-lg">
                  <image
                    :src="article.coverImage"
                    class="h-full w-full object-cover"
                    mode="aspectFill"
                  />
                </view>
                <!-- 摘要 -->
                <view v-if="article.blogAbstract" class="flex-1">
                  <view class="line-clamp-3 text-sm text-gray-500">
                    <rich-text :nodes="highlightSearchKeywords(article.blogAbstract)" />
                  </view>
                </view>
              </view>
            </view>

            <!-- 无封面图片的布局 -->
            <view v-else class="mb-3">
              <view class="flex items-start justify-between">
                <view class="flex-1">
                  <view class="line-clamp-2 mb-2 text-base text-gray-800 font-semibold">
                    <rich-text :nodes="highlightSearchKeywords(article.title)" />
                  </view>
                  <!-- 摘要占满整行 -->
                  <view v-if="article.blogAbstract" class="line-clamp-3 text-sm text-gray-500">
                    <rich-text :nodes="highlightSearchKeywords(article.blogAbstract)" />
                  </view>
                </view>
                <view v-if="article.tagNames && article.tagNames.length > 0" class="ml-3 rounded-full px-3 py-1 text-xs font-medium" :class="getCategoryColor(article.tagNames)">
                  {{ article.tagNames[0] }}
                </view>
              </view>
            </view>

            <!-- 底部信息 -->
            <view class="flex items-center justify-between">
              <view class="flex items-center text-xs text-gray-500">
                <view class="mr-2 h-3 w-3 rounded bg-gray-400" />
                <text class="mr-3">
                  {{ article.authorName }}
                </text>
                <text>{{ formatTime(article.createTime) }}</text>
              </view>
              <view class="flex items-center text-xs text-gray-400">
                <text class="mr-3">
                  浏览 {{ formatCount(article.browse) }}
                </text>
                <text>点赞 {{ formatCount(article.love) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类样式 */
</style>

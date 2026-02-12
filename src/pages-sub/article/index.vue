<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "文章列表"
  }
}
</route>

<script lang="ts" setup>
import type { ArticleSearchRespVO } from '@/api/types/article'
import { computed, watch } from 'vue'
import { getArticlePage } from '@/api/article'
import ThemeCard from '@/components/ThemeCard.vue'
import { WECHAT_SHARE_IMAGE_URL } from '@/config/share'
import { useAppStore } from '@/store/app'
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
function handleSearch(val: { value: string }) {
  searchParams.keyword = val.value || ''
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

function getCategoryColor(tags: string[]): string {
  if (!tags || tags.length === 0)
    return isDark.value ? 'text-gray-400 bg-white/6 border-white/12' : 'text-gray-600 bg-gray-50 border-gray-200'

  if (isDark.value) {
    const tagColorDark: Record<string, string> = {
      技术分享: 'text-blue-400 bg-blue-500/12 border-blue-500/20',
      项目经验: 'text-green-400 bg-green-500/12 border-green-500/20',
      学习笔记: 'text-purple-400 bg-purple-500/12 border-purple-500/20',
      工作总结: 'text-orange-400 bg-orange-500/12 border-orange-500/20',
      团队建设: 'text-red-400 bg-red-500/12 border-red-500/20',
      竞赛指导: 'text-indigo-400 bg-indigo-500/12 border-indigo-500/20',
    }
    return tagColorDark[tags[0]] || 'text-gray-400 bg-white/6 border-white/12'
  }
  else {
    const tagColorLight: Record<string, string> = {
      技术分享: 'text-blue-600 bg-blue-50 border-blue-200',
      项目经验: 'text-green-600 bg-green-50 border-green-200',
      学习笔记: 'text-purple-600 bg-purple-50 border-purple-200',
      工作总结: 'text-orange-600 bg-orange-50 border-orange-200',
      团队建设: 'text-red-600 bg-red-50 border-red-200',
      竞赛指导: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    }
    return tagColorLight[tags[0]] || 'text-gray-600 bg-gray-50 border-gray-200'
  }
}
let isNavigating = false
// 跳转到文章详情
function goToArticleDetail(articleId: number) {
  if (isNavigating) {
    // 如果已经在跳转，不再处理
    return
  }

  isNavigating = true

  uni.navigateTo({
    url: `/pages-sub/article/detail?id=${articleId}`,
    complete: () => {
      // 无论成功或失败，跳转执行完成后恢复
      isNavigating = false
    },
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

// #ifdef MP-WEIXIN
// 开启分享菜单，避免按钮灰色
try {
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  })
}
catch (e) {}

// 文章列表分享：静态路径
onShareAppMessage(() => ({
  title: '文章列表',
  path: '/pages-sub/article/index',
  imageUrl: WECHAT_SHARE_IMAGE_URL,
}))

onShareTimeline(() => ({
  title: '文章列表',
  query: '',
  imageUrl: WECHAT_SHARE_IMAGE_URL,
}))
// #endif
</script>

<template>
  <view class="min-h-screen">
    <!-- 使用z-paging的全屏模式，搜索框放在slot="top"内 -->
    <z-paging
      ref="pagingRef"
      v-model="articles"
      :default-page-size="10"
      :bg-color="isDark ? '#020617' : '#f5f7fa'"
      style="top: 0px;"
      @query="queryList"
    >
      <!-- 搜索栏固定在顶部 -->
      <template #top>
        <view class="px-4 py-3" :class="isDark ? 'bg-[#020617]' : 'bg-[#f5f7fa]'">
          <wd-search
            v-model="searchParams.keyword"
            placeholder="搜索文章标题、内容"
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

      <!-- 文章列表内容 -->
      <view class="px-4 pb-4 space-y-3">
        <ThemeCard
          v-for="article in articles"
          :key="article.id"
          card-class="shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.99] transition-transform duration-200"
          :padding="false"
          @click="goToArticleDetail(article.id)"
        >
          <view class="rounded-2xl bg-white p-4 dark:bg-slate-800">
            <!-- 有封面图片的布局 -->
            <view v-if="article.coverImage" class="flex gap-4">
              <view class="min-h-[5rem] flex flex-1 flex-col justify-between">
                <view>
                  <view class="mb-1 flex items-center justify-between gap-2">
                    <view class="line-clamp-2 text-sm font-medium leading-relaxed tracking-wide" :class="textPrimaryClass">
                      <rich-text :nodes="highlightSearchKeywords(article.title)" />
                    </view>
                  </view>
                  <view class="line-clamp-2 text-xs opacity-70" :class="textSecondaryClass">
                    <rich-text :nodes="highlightSearchKeywords(article.blogAbstract)" />
                  </view>
                </view>

                <view class="mt-2 flex items-center justify-between">
                  <view class="flex items-center gap-2 text-xs opacity-80" :class="textMutedClass">
                    <text class="font-medium">
                      {{ article.authorName }}
                    </text>
                    <text class="opacity-30">
                      |
                    </text>
                    <text>{{ formatTime(article.createTime).split(' ')[0] }}</text>
                  </view>
                  <view v-if="article.tagNames && article.tagNames.length > 0" class="border rounded px-2 py-0.5 text-[10px]" :class="getCategoryColor(article.tagNames)">
                    {{ article.tagNames[0] }}
                  </view>
                </view>
              </view>
              <!-- 封面图片 -->
              <view class="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-700">
                <image
                  :src="article.coverImage"
                  class="h-full w-full object-cover"
                  mode="aspectFill"
                />
              </view>
            </view>

            <!-- 无封面图片的布局 -->
            <view v-else>
              <view class="mb-1 flex items-start justify-between gap-2">
                <view class="line-clamp-2 text-sm font-medium leading-relaxed tracking-wide" :class="textPrimaryClass">
                  <rich-text :nodes="highlightSearchKeywords(article.title)" />
                </view>
                <view v-if="article.tagNames && article.tagNames.length > 0" class="mt-0.5 flex-shrink-0 border rounded px-2 py-0.5 text-[10px]" :class="getCategoryColor(article.tagNames)">
                  {{ article.tagNames[0] }}
                </view>
              </view>

              <view class="line-clamp-2 mb-3 text-xs opacity-70" :class="textSecondaryClass">
                <rich-text :nodes="highlightSearchKeywords(article.blogAbstract)" />
              </view>

              <view class="flex items-center justify-between text-xs" :class="textMutedClass">
                <view class="flex items-center gap-2 opacity-80">
                  <text class="font-medium">
                    {{ article.authorName }}
                  </text>
                  <text class="opacity-30">
                    |
                  </text>
                  <text>{{ formatTime(article.createTime).split(' ')[0] }}</text>
                </view>
                <view class="flex items-center gap-3 opacity-60">
                  <view class="flex items-center gap-1">
                    <wd-icon name="view" size="14px" />
                    <text>{{ formatCount(article.browse) }}</text>
                  </view>
                  <view class="flex items-center gap-1">
                    <wd-icon name="thumb-up" size="14px" />
                    <text>{{ formatCount(article.love) }}</text>
                  </view>
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

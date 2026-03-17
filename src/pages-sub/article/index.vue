<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "文章列表",
    "navigationStyle": "custom"
  }
}
</route>

<script lang="ts" setup>
import type { ArticleSearchRespVO } from '@/api/types/article'
import { computed, ref, watch } from 'vue'
import { getArticlePage, getArticleTagSimpleList } from '@/api/article'
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

// 分类标签列表
const categoryTags = ref([{ name: '全部', value: '' }])

// 当前选中的分类
const currentCategory = ref('')

// 主题适配：浅色/深色
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))

// 状态栏高度
const statusBarHeight = ref(0)

onLoad(async () => {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0

  try {
    const res = await getArticleTagSimpleList()
    if (res.code === 0 && res.data) {
      categoryTags.value = [
        { name: '全部', value: '' },
        ...res.data.map(t => ({ name: t.tagName, value: t.tagCode })),
      ]
    }
  }
  catch (e) {
    console.error('获取标签列表失败:', e)
  }
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

    if (response.code === 0 && response.data) {
      const { list } = response.data

      if (firstLoad.value) {
        firstLoad.value = false
      }

      pagingRef.value?.complete(list)
    }
    else {
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

// 切换分类
function handleCategoryChange(tag: string) {
  currentCategory.value = tag
  searchParams.tags = tag ? [tag] : []
  pagingRef.value?.reload()
}

// 格式化时间
function formatTime(createTime: string | number): string {
  if (!createTime)
    return ''

  const date = new Date(createTime)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0)
    return '今天'
  if (days === 1)
    return '昨天'
  if (days < 7)
    return `${days}天前`
  if (days < 30)
    return `${Math.floor(days / 7)}周前`

  return formatStandardDateTime(createTime).split(' ')[0]
}

// 格式化数量
function formatCount(count: number): string {
  if (!count)
    return '0'
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

// 获取分类标签颜色（循环使用6种颜色）
const tagColorsDark = [
  'text-blue-400 bg-blue-500/12 border-blue-500/20',
  'text-green-400 bg-green-500/12 border-green-500/20',
  'text-purple-400 bg-purple-500/12 border-purple-500/20',
  'text-orange-400 bg-orange-500/12 border-orange-500/20',
  'text-red-400 bg-red-500/12 border-red-500/20',
  'text-indigo-400 bg-indigo-500/12 border-indigo-500/20',
]
const tagColorsLight = [
  'text-blue-600 bg-blue-50 border-blue-200',
  'text-green-600 bg-green-50 border-green-200',
  'text-purple-600 bg-purple-50 border-purple-200',
  'text-orange-600 bg-orange-50 border-orange-200',
  'text-red-600 bg-red-50 border-red-200',
  'text-indigo-600 bg-indigo-50 border-indigo-200',
]

function getCategoryColor(tag: string): string {
  if (!tag)
    return isDark.value ? 'text-gray-400 bg-white/6 border-white/12' : 'text-gray-600 bg-gray-50 border-gray-200'

  const index = categoryTags.value.findIndex(t => t.name === tag || t.value === tag)
  const colorIndex = index <= 0 ? 0 : (index - 1) % 6
  return isDark.value ? tagColorsDark[colorIndex] : tagColorsLight[colorIndex]
}

// 判断是否为精选文章（浏览量前3或有封面图）
function isFeaturedArticle(article: ArticleSearchRespVO, index: number): boolean {
  return index === 0 && !!article.coverImage
}

let isNavigating = false
// 跳转到文章详情
function goToArticleDetail(articleId: number) {
  if (isNavigating)
    return

  isNavigating = true

  uni.navigateTo({
    url: `/pages-sub/article/detail?id=${articleId}`,
    complete: () => {
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

  return text.replace(
    /<em>(.*?)<\/em>/g,
    '<span style="color: #3b82f6; font-weight: 600;">$1</span>',
  )
}

// #ifdef MP-WEIXIN
try {
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  })
}
catch (e) {}

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
  <view class="min-h-screen" :class="isDark ? 'bg-slate-950' : 'bg-[#f5f7fa]'">
    <!-- 自定义导航栏 -->
    <view
      class="fixed top-0 left-0 right-0 z-50"
      :style="{ paddingTop: `${statusBarHeight}px` }"
    >
      <!-- 渐变背景 -->
      <view class="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500" />

      <!-- 装饰圆形 -->
      <view class="absolute right-[-40px] top-[-20px] h-32 w-32 rounded-full bg-white/10" />
      <view class="absolute left-[-30px] bottom-[-30px] h-24 w-24 rounded-full bg-white/5" />

      <!-- 导航内容 -->
      <view class="relative px-4 pb-3">
        <!-- 搜索框 -->
        <view class="mt-2">
          <wd-search
            v-model="searchParams.keyword"
            placeholder="搜索文章标题、内容..."
            hide-cancel
            :custom-input-style="{
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '12px',
              height: '40px',
            }"
            @search="handleSearch"
            @clear="handleSearch"
          />
        </view>

        <!-- 分类标签 -->
        <scroll-view scroll-x class="mt-3 -mx-4 px-4 whitespace-nowrap" :show-scrollbar="false">
          <view class="inline-flex gap-2">
            <view
              v-for="tag in categoryTags"
              :key="tag.value"
              class="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
              :class="currentCategory === tag.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'bg-white/20 text-white/90 active:bg-white/30'"
              @click="handleCategoryChange(tag.value)"
            >
              {{ tag.name }}
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 占位区域 -->
    <view :style="{ height: `${statusBarHeight + 140}px` }" />

    <!-- 文章列表 -->
    <z-paging
      ref="pagingRef"
      v-model="articles"
      :default-page-size="10"
      :bg-color="isDark ? '#020617' : '#f5f7fa'"
      style="top: 115px;"
      @query="queryList"
    >
      <view class="px-4 pb-4 space-y-3">
        <template v-for="(article, index) in articles" :key="article.id">
          <!-- 精选文章大图展示 -->
          <ThemeCard
            v-if="isFeaturedArticle(article, index)"
            :padding="false"
            card-class="overflow-hidden shadow-lg border-0"
            @click="goToArticleDetail(article.id)"
          >
            <!-- 封面图 -->
            <view class="relative aspect-[16/9] overflow-hidden">
              <image
                :src="article.coverImage"
                class="h-full w-full object-cover"
                mode="aspectFill"
              />
              <!-- 渐变遮罩 -->
              <view class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <!-- 分类标签 -->
              <view
                v-if="article.tagNames && article.tagNames.length > 0"
                class="absolute left-3 top-3 rounded-full bg-blue-500/90 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm"
              >
                {{ article.tagNames[0] }}
              </view>
              <!-- 标题 -->
              <view class="absolute bottom-0 left-0 right-0 p-4">
                <view class="line-clamp-2 text-base font-bold leading-snug text-white">
                  {{ article.title }}
                </view>
                <view class="mt-2 flex items-center gap-3 text-xs text-white/80">
                  <view class="flex items-center gap-1">
                    <wd-icon name="user" size="12px" color="rgba(255,255,255,0.8)" />
                    <text>{{ article.authorName }}</text>
                  </view>
                  <view class="flex items-center gap-1">
                    <wd-icon name="view" size="12px" color="rgba(255,255,255,0.8)" />
                    <text>{{ formatCount(article.browse) }}</text>
                  </view>
                  <view class="flex items-center gap-1">
                    <wd-icon name="thumb-up" size="12px" color="rgba(255,255,255,0.8)" />
                    <text>{{ formatCount(article.love) }}</text>
                  </view>
                </view>
              </view>
            </view>
          </ThemeCard>

          <!-- 普通文章卡片 -->
          <ThemeCard
            v-else
            :padding="false"
            card-class="shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.99] transition-transform duration-200"
            @click="goToArticleDetail(article.id)"
          >
            <view class="rounded-2xl bg-white p-4 dark:bg-slate-800">
              <!-- 有封面图：左图右文 -->
              <view v-if="article.coverImage" class="flex gap-3">
                <!-- 封面图 -->
                <view class="h-[72px] w-[100px] flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700">
                  <image
                    :src="article.coverImage"
                    class="h-full w-full object-cover"
                    mode="aspectFill"
                  />
                </view>
                <!-- 文字内容 -->
                <view class="min-h-[72px] flex flex-1 flex-col justify-between">
                  <view>
                    <view class="line-clamp-2 text-sm font-medium leading-snug" :class="textPrimaryClass">
                      {{ article.title }}
                    </view>
                  </view>
                  <view class="flex items-center justify-between">
                    <view
                      v-if="article.tagNames && article.tagNames.length > 0"
                      class="rounded px-1.5 py-0.5 text-[10px]"
                      :class="getCategoryColor(article.tagNames[0])"
                    >
                      {{ article.tagNames[0] }}
                    </view>
                    <view class="text-[10px]" :class="textMutedClass">
                      {{ formatTime(article.createTime) }}
                    </view>
                  </view>
                </view>
              </view>

              <!-- 无封面图：纯文字 -->
              <view v-else>
                <!-- 标题 + 标签 -->
                <view class="mb-2 flex items-start justify-between gap-2">
                  <view class="line-clamp-2 flex-1 text-sm font-medium leading-snug" :class="textPrimaryClass">
                    <rich-text :nodes="highlightSearchKeywords(article.title)" />
                  </view>
                  <view
                    v-if="article.tagNames && article.tagNames.length > 0"
                    class="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px]"
                    :class="getCategoryColor(article.tagNames[0])"
                  >
                    {{ article.tagNames[0] }}
                  </view>
                </view>

                <!-- 摘要 -->
                <view v-if="article.blogAbstract" class="line-clamp-2 mb-2.5 text-xs leading-relaxed" :class="textSecondaryClass">
                  <rich-text :nodes="highlightSearchKeywords(article.blogAbstract)" />
                </view>

                <!-- 底部信息 -->
                <view class="flex items-center justify-between">
                  <view class="flex items-center gap-2 text-xs" :class="textMutedClass">
                    <view class="flex items-center gap-1">
                      <wd-icon name="user" size="12px" />
                      <text>{{ article.authorName }}</text>
                    </view>
                    <text class="opacity-30">|</text>
                    <text>{{ formatTime(article.createTime) }}</text>
                  </view>
                  <view class="flex items-center gap-3 text-xs opacity-60" :class="textMutedClass">
                    <view class="flex items-center gap-1">
                      <wd-icon name="view" size="12px" />
                      <text>{{ formatCount(article.browse) }}</text>
                    </view>
                    <view class="flex items-center gap-1">
                      <wd-icon name="thumb-up" size="12px" />
                      <text>{{ formatCount(article.love) }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </ThemeCard>
        </template>
      </view>
    </z-paging>
  </view>
</template>

<style lang="scss" scoped>
/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
}
</style>

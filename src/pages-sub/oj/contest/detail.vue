<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "比赛详情"
  }
}
</route>

<script setup lang="ts">
import type { HydroOjContestDetailRespVO } from '@/pages-sub/api/type/oj'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import HtmlContent from '@/components/HtmlContent.vue'
import { getHydroOjContestInfo } from '@/pages-sub/api/oj'
import { useAppStore } from '@/store/app'
import { formatStandardDateTime } from '@/utils'

const loading = ref(true)
const detail = ref<HydroOjContestDetailRespVO | null>(null)
const errorMsg = ref('')

// 深色模式计算属性
const appStore = useAppStore()
const titleClass = computed(() => appStore.theme === 'dark' ? 'text-gray-100' : 'text-gray-900')
const textClass = computed(() => appStore.theme === 'dark' ? 'text-gray-300' : 'text-gray-600')
const subTextClass = computed(() => appStore.theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
const cardClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-800' : 'bg-white')
const borderClass = computed(() => appStore.theme === 'dark' ? 'border-gray-700' : 'border-gray-100')
const iconClass = computed(() => appStore.theme === 'dark' ? 'text-gray-400' : 'text-gray-400')
const btnSecondaryClass = computed(() => appStore.theme === 'dark'
  ? 'border-gray-700 bg-gray-800 text-gray-200 active:bg-gray-700'
  : 'border-gray-200 bg-white text-gray-700 active:bg-gray-50')
// 骨架屏底色（浅色/深色）
const skeletonClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')
// 信息胶囊底色（浅色/深色）
const chipClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')

// 折叠：题目列表，默认折叠
const activePanels = ref<string[]>([])

function toTimestamp(v?: string | number): number {
  if (!v)
    return 0
  if (typeof v === 'number')
    return v
  const t = Date.parse(v)
  return Number.isNaN(t) ? 0 : t
}

const statusTag = computed(() => {
  if (!detail.value)
    return { text: '未知', cls: appStore.theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600' }
  const now = Date.now()
  const s = toTimestamp(detail.value.startAt)
  const e = toTimestamp(detail.value.endAt)
  if (!s && !e)
    return { text: '未知', cls: appStore.theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600' }
  if (now < s)
    return { text: '未开始', cls: appStore.theme === 'dark' ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700' }
  if (e && now > e)
    return { text: '已结束', cls: appStore.theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600' }
  return { text: '进行中', cls: appStore.theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700' }
})

function displayRank(rank?: number | string) {
  if (rank === undefined || rank === null)
    return '—'
  const n = typeof rank === 'string' ? Number(rank) : rank
  if (Number.isNaN(n))
    return String(rank)
  return n === -1 ? '未参与排名' : `${n}`
}

async function loadDetail(id: string) {
  loading.value = true
  try {
    const res = await getHydroOjContestInfo(id)
    if ((res as any).code === 0 && (res as any).data) {
      detail.value = (res as any).data
      uni.setNavigationBarTitle({ title: detail.value?.title || '比赛详情' })
    }
    else {
      errorMsg.value = (res as any).msg || '加载失败'
      uni.showToast({ title: errorMsg.value, icon: 'none' })
    }
  }
  catch (err: any) {
    errorMsg.value = err?.message || '网络错误，请稍后重试'
    uni.showToast({ title: errorMsg.value, icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

onLoad((options: any) => {
  const id = options?.id ? String(options.id) : ''
  if (!id) {
    loading.value = false
    errorMsg.value = '参数缺失：id 必填'
    uni.showToast({ title: errorMsg.value, icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1200)
    return
  }
  loadDetail(id)
})

function toProblem(item: any) {
  if (!item?.pid)
    return
  const url = `/pages-sub/oj/problem/detail?id=${encodeURIComponent(item.pid)}&docId=${encodeURIComponent({ ...detail.value }.docId)}`
  uni.navigateTo({ url })
}

function goRecordList() {
  const id = detail.value?.docId
  if (!id) {
    uni.showToast({ title: '缺少比赛ID', icon: 'none' })
    return
  }
  const url = `/pages-sub/oj/contest/record?id=${encodeURIComponent(String(id))}`
  uni.navigateTo({ url } as any)
}

function goRankboard() {
  const id = detail.value?.docId
  if (!id) {
    uni.showToast({ title: '缺少比赛ID', icon: 'none' })
    return
  }
  const url = `/pages-sub/oj/contest/rank?id=${encodeURIComponent(String(id))}`
  uni.navigateTo({ url } as any)
}
</script>

<template>
  <view class="min-h-screen">
    <view v-if="loading" class="p-4 space-y-4 animate-pulse">
      <!-- 标题与状态骨架 -->
      <view class="flex items-start justify-between gap-3">
        <view class="min-w-0 flex-1">
          <view :class="skeletonClass" class="h-5 w-2/3 rounded" />
        </view>
        <view :class="skeletonClass" class="h-5 w-12 rounded-full" />
      </view>

      <!-- 基本信息骨架：时间、排名、参赛人数 -->
      <view class="space-y-2">
        <view class="flex items-center">
          <view :class="skeletonClass" class="h-3 w-16 rounded" />
          <view :class="skeletonClass" class="ml-2 h-3 w-40 rounded" />
        </view>
        <view class="flex items-center">
          <view :class="skeletonClass" class="h-3 w-16 rounded" />
          <view :class="skeletonClass" class="ml-2 h-3 w-32 rounded" />
        </view>
        <view class="flex items-center">
          <view :class="skeletonClass" class="h-3 w-16 rounded" />
          <view :class="skeletonClass" class="ml-2 h-3 w-20 rounded" />
        </view>
      </view>

      <!-- 操作按钮骨架 -->
      <view class="flex items-center gap-2">
        <view :class="skeletonClass" class="h-6 w-20 rounded-full" />
        <view :class="skeletonClass" class="h-6 w-20 rounded-full" />
      </view>

      <!-- 题目列表骨架：卡片 + 若干条目 -->
      <view :class="cardClass" class="rounded-2xl p-2 shadow-sm">
        <view class="px-4 pb-4 pt-2">
          <view class="grid grid-cols-1 gap-2">
            <view
              v-for="i in 3"
              :key="`sk-problem-${i}`"
              :class="[cardClass, borderClass]"
              class="flex items-center justify-between border rounded-xl p-3"
            >
              <view class="flex-1 pr-3">
                <view :class="skeletonClass" class="h-3 w-3/5 rounded" />
                <view :class="skeletonClass" class="mt-1 h-3 w-2/5 rounded" />
              </view>
              <view :class="skeletonClass" class="h-4 w-4 rounded" />
            </view>
          </view>
        </view>
      </view>

      <!-- 比赛介绍骨架：正文块 -->
      <view :class="cardClass" class="rounded-2xl p-4 shadow-sm">
        <view :class="skeletonClass" class="h-3 w-2/3 rounded" />
        <view :class="skeletonClass" class="mt-2 h-3 w-full rounded" />
        <view :class="skeletonClass" class="mt-2 h-3 w-5/6 rounded" />
      </view>
    </view>
    <view v-else-if="!detail" class="p-4 text-red-500">
      {{ errorMsg || '未找到比赛详情' }}
    </view>

    <view v-else class="p-4 space-y-4">
      <!-- 标题与状态：更大字号，简约对齐 -->
      <view class="flex items-start justify-between gap-3">
        <view class="min-w-0 flex-1">
          <view :class="titleClass" class="truncate text-xl font-semibold leading-tight">
            {{ detail.title }}
          </view>
        </view>
        <view class="shrink-0 rounded-full px-2.5 py-0.5 text-12px" :class="statusTag.cls">
          {{ statusTag.text }}
        </view>
      </view>

      <!-- 元信息：时间 / 排名 / 参赛人数（信息胶囊样式） -->
      <view class="flex flex-wrap items-center gap-2">
        <view :class="chipClass" class="inline-flex items-center rounded-full px-2.5 py-1 text-12px">
          <text :class="subTextClass">时间</text>
          <text class="ml-1">{{ formatStandardDateTime(detail.startAt) }} ~ {{ formatStandardDateTime(detail.endAt) }}</text>
        </view>
        <view :class="chipClass" class="inline-flex items-center rounded-full px-2.5 py-1 text-12px">
          <text :class="subTextClass">排名</text>
          <text class="ml-1">{{ displayRank(detail.rank) }}</text>
        </view>
        <view v-if="detail.userCount !== undefined" :class="chipClass" class="inline-flex items-center rounded-full px-2.5 py-1 text-12px">
          <text :class="subTextClass">参赛人数</text>
          <text class="ml-1">{{ detail.userCount }}</text>
        </view>
      </view>

      <!-- 操作按钮：提交记录 / 排行榜（按钮在题目列表上方） -->
      <view class="flex items-center gap-2">
        <view class="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-12px text-white shadow-sm active:opacity-90" @click="goRecordList">
          提交记录
        </view>
        <view :class="btnSecondaryClass" class="inline-flex items-center justify-center border rounded-full px-4 py-1.5 text-12px" @click="goRankboard">
          排行榜
        </view>
      </view>

      <!-- 题目列表：默认折叠，位于描述上方；折叠组件带圆角卡片 -->
      <view v-if="Array.isArray(detail.problems) && detail.problems.length" :class="cardClass" class="rounded-2xl p-2 shadow-sm">
        <wd-collapse v-model="activePanels" class="overflow-hidden rounded-xl bg-transparent">
          <wd-collapse-item name="problems">
            <template #title>
              <view :class="titleClass" class="w-full flex items-center justify-between text-sm font-semibold">
                <text>题目列表（{{ detail.problems.length }}）</text>
              </view>
            </template>

            <view class="px-4 pb-4 pt-2">
              <view class="grid grid-cols-1 gap-2">
                <view
                  v-for="p in detail.problems"
                  :key="`p-${p.pid}`"
                  :class="[cardClass, borderClass]"
                  class="flex items-center justify-between border rounded-xl p-3"
                  @click="toProblem(p)"
                >
                  <view :class="titleClass" class="text-sm">
                    <text class="font-semibold">
                      {{ p.pid }}
                    </text>
                    <text>{{ ' ' }}</text>
                    <text>{{ p.title || '' }}</text>
                  </view>
                  <wd-icon name="arrow-right" size="16px" :class="iconClass" />
                </view>
              </view>
            </view>
          </wd-collapse-item>
        </wd-collapse>
      </view>

      <!-- 比赛介绍：放到题目列表下方 -->
      <view v-if="detail.content" :class="cardClass" class="rounded-2xl p-4 shadow-sm">
        <HtmlContent :class="textClass" :content="detail.content || ''" />
      </view>
    </view>
  </view>
</template>

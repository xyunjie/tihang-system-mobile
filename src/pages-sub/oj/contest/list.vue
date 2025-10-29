<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "比赛列表"
  }
}
</route>

<script setup lang="ts">
import type { GetHydroOjContestPageReqVO, HydroOjContestItemRespVO } from '@/pages-sub/api/type/oj'
import { computed, ref } from 'vue'
import { getHydroOjContestPage } from '@/pages-sub/api/oj'
import { useAppStore } from '@/store/app'
import { formatStandardDateTime } from '@/utils'

defineOptions({
  name: 'ContestList',
})

const appStore = useAppStore()

// 深色模式计算属性
const cardClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-800' : 'bg-white')
const titleClass = computed(() => appStore.theme === 'dark' ? 'text-gray-100' : 'text-gray-900')
const textClass = computed(() => appStore.theme === 'dark' ? 'text-gray-300' : 'text-gray-500')

// 状态颜色计算属性
const getStatusClass = computed(() => (status: string) => {
  if (appStore.theme === 'dark') {
    switch (status) {
      case 'running':
        return 'bg-green-900/30 text-green-300'
      case 'upcoming':
        return 'bg-amber-900/30 text-amber-300'
      case 'ended':
        return 'bg-gray-700 text-gray-400'
      default:
        return 'bg-purple-900/30 text-purple-300'
    }
  }
  else {
    switch (status) {
      case 'running':
        return 'bg-green-50 text-green-700'
      case 'upcoming':
        return 'bg-amber-50 text-amber-700'
      case 'ended':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-purple-50 text-purple-700'
    }
  }
})

const contests = ref<HydroOjContestItemRespVO[]>([])
const pagingRef = ref()
const firstLoad = ref(true)

function toTimestamp(v?: string | number): number {
  if (!v)
    return 0
  if (typeof v === 'number')
    return v
  const t = Date.parse(v)
  return Number.isNaN(t) ? 0 : t
}

function contestStatus(item: HydroOjContestItemRespVO) {
  const now = Date.now()
  const s = toTimestamp(item.startAt)
  const e = toTimestamp(item.endAt)

  if (!s && !e) {
    return {
      text: '未知',
      cls: appStore.theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600',
    }
  }
  if (now < s) {
    return {
      text: '未开始',
      cls: appStore.theme === 'dark' ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700',
    }
  }
  if (e && now > e) {
    return {
      text: '已结束',
      cls: appStore.theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600',
    }
  }
  return {
    text: '进行中',
    cls: appStore.theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700',
  }
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const params: GetHydroOjContestPageReqVO = { pageNo, pageSize }
    const response = await getHydroOjContestPage(params)
    if (response.code === 0 && response.data) {
      const list = response.data.list || []
      if (firstLoad.value)
        firstLoad.value = false
      pagingRef.value?.complete(list)
    }
    else {
      pagingRef.value?.complete(false)
      uni.showToast({ title: response.msg || '加载失败', icon: 'none' })
    }
  }
  catch (error) {
    console.error('加载比赛列表失败:', error)
    pagingRef.value?.complete(false)
    uni.showToast({ title: '网络错误，请重试', icon: 'none' })
  }
}

function onTapContest(item: HydroOjContestItemRespVO) {
  const url = `/pages-sub/oj/contest/detail?id=${encodeURIComponent(item.docId)}`
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="min-h-screen">
    <z-paging
      ref="pagingRef"
      v-model="contests"
      style="top: 0px"
      :refresher-enabled="true"
      :auto-show-back-to-top="true"
      :auto-clean-list-when-reload="true"
      :refresher-threshold="80"
      refresher-default-text="下拉刷新"
      refresher-pulling-text="下拉刷新"
      @query="queryList"
    >
      <view class="p-4 space-y-3">
        <view
          v-for="(item, idx) in contests"
          :key="idx"
          :class="cardClass"
          class="rounded-2xl p-4 shadow-sm transition-all active:scale-98"
          @click="onTapContest(item)"
        >
          <!-- 标题与状态 -->
          <view class="flex items-start justify-between gap-2">
            <view class="min-w-0 flex-1">
              <view :class="titleClass" class="truncate text-base font-semibold leading-tight">
                {{ item.title || '比赛' }}
              </view>
              <view :class="textClass" class="mt-1 flex flex-wrap items-center gap-2 text-11px">
                <view :class="cardClass" class="inline-flex items-center rounded-full px-2 py-0.5">
                  <text :class="textClass" class="i-carbon-rule mr-1" />
                  {{ item.rule || '规则' }}
                </view>
                <view v-if="item.rated" class="inline-flex items-center rounded-full px-2 py-0.5" :class="getStatusClass('rated')">
                  <text class="i-carbon-star mr-1" />
                  rated
                </view>
              </view>
            </view>
            <view class="ml-2 inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-11px" :class="[contestStatus(item).cls]">
              {{ contestStatus(item).text }}
            </view>
          </view>

          <!-- 时间区间：垂直居中图标与文本 -->
          <view :class="textClass" class="mt-2 flex items-center text-12px">
            <text :class="textClass" class="i-carbon-time mr-1" />
            {{ formatStandardDateTime(item.startAt) }} ~ {{ formatStandardDateTime(item.endAt) }}
          </view>

          <!-- 排名（-1 表示未参与排名）：垂直居中图标与文本 -->
          <view v-if="item.rank !== undefined && item.rank !== null" :class="textClass" class="mt-2 flex items-center text-12px">
            <template v-if="item.rank === -1">
              <text :class="textClass" class="i-carbon-subtract-alt mr-1" /> 未参与排名
            </template>
            <template v-else>
              <text class="i-carbon-caret-up mr-1 text-red-500" /> 排名：{{ item.rank }}
            </template>
          </view>
        </view>

        <!-- 首屏骨架占位 -->
        <view v-if="firstLoad && contests.length === 0" class="space-y-3">
          <view v-for="n in 4" :key="n" :class="cardClass" class="rounded-2xl p-4 shadow-sm">
            <view :class="cardClass" class="h-4 w-2/3 rounded" />
            <view :class="cardClass" class="mt-2 h-3 w-1/3 rounded" />
            <view :class="cardClass" class="mt-4 h-3 w-full rounded" />
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<style lang="scss" scoped>
/* 使用 UnoCSS 原子类 */
</style>

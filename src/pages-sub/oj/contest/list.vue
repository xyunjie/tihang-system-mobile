<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "比赛列表"
  }
}
</route>

<script setup lang="ts">
import type { GetHydroOjContestPageReqVO, HydroOjContestItemRespVO } from '@/pages-sub/api/type/oj'
import { ref } from 'vue'
import { getHydroOjContestPage } from '@/pages-sub/api/oj'
import { formatStandardDateTime } from '@/utils'

defineOptions({ name: 'ContestList' })

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
  if (!s && !e)
    return { text: '未知', cls: 'bg-gray-100 text-gray-600' }
  if (now < s)
    return { text: '未开始', cls: 'bg-amber-50 text-amber-700' }
  if (e && now > e)
    return { text: '已结束', cls: 'bg-gray-100 text-gray-600' }
  return { text: '进行中', cls: 'bg-green-50 text-green-700' }
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
  <view class="min-h-screen bg-gray-50">
    <z-paging
      ref="pagingRef"
      v-model="contests"
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
          class="rounded-2xl bg-white p-4 shadow-sm transition-all active:scale-98"
          @click="onTapContest(item)"
        >
          <!-- 标题与状态 -->
          <view class="flex items-start justify-between gap-2">
            <view class="min-w-0 flex-1">
              <view class="truncate text-base font-semibold leading-tight">
                {{ item.title || '比赛' }}
              </view>
              <view class="mt-1 flex flex-wrap items-center gap-2 text-11px text-gray-600">
                <view class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                  <text class="i-carbon-rule mr-1 text-gray-500" />
                  {{ item.rule || '规则' }}
                </view>
                <view v-if="item.rated" class="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">
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
          <view class="mt-2 flex items-center text-12px text-gray-500">
            <text class="i-carbon-time mr-1 text-gray-400" />
            {{ formatStandardDateTime(item.startAt) }} ~ {{ formatStandardDateTime(item.endAt) }}
          </view>

          <!-- 排名（-1 表示未参与排名）：垂直居中图标与文本 -->
          <view v-if="item.rank !== undefined && item.rank !== null" class="mt-2 flex items-center text-12px text-gray-600">
            <template v-if="item.rank === -1">
              <text class="i-carbon-subtract-alt mr-1 text-gray-500" /> 未参与排名
            </template>
            <template v-else>
              <text class="i-carbon-caret-up mr-1 text-red-500" /> 排名：{{ item.rank }}
            </template>
          </view>
        </view>

        <!-- 首屏骨架占位 -->
        <view v-if="firstLoad && contests.length === 0" class="space-y-3">
          <view v-for="n in 4" :key="n" class="rounded-2xl bg-white p-4 shadow-sm">
            <view class="h-4 w-2/3 rounded bg-gray-200" />
            <view class="mt-2 h-3 w-1/3 rounded bg-gray-200" />
            <view class="mt-4 h-3 w-full rounded bg-gray-200" />
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<style lang="scss" scoped>
/* 使用 UnoCSS 原子类 */
</style>

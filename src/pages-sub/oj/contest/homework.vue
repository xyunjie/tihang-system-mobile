<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "作业列表"
  }
}
</route>

<script setup lang="ts">
import type { GetHydroOjHomeworkPageReqVO, HydroOjHomeworkItemRespVO } from '@/pages-sub/api/type/oj'
import { computed, ref } from 'vue'
import { getHydroOjHomeworkPage } from '@/pages-sub/api/oj'
import { useAppStore } from '@/store/app'
import { formatStandardDateTime } from '@/utils'

defineOptions({ name: 'HomeworkList' })

const homeworks = ref<HydroOjHomeworkItemRespVO[]>([])
const pagingRef = ref()
const firstLoad = ref(true)

// 深色模式计算属性
const appStore = useAppStore()
const cardClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-800' : 'bg-white')
const titleClass = computed(() => appStore.theme === 'dark' ? 'text-gray-100' : 'text-gray-900')
const subTextClass = computed(() => appStore.theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
const iconClass = computed(() => appStore.theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
const metaChipClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
const ratedChipClass = computed(() => appStore.theme === 'dark' ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700')
const rankUpIconClass = computed(() => appStore.theme === 'dark' ? 'text-red-400' : 'text-red-500')

function toTimestamp(v?: string | number): number {
  if (!v)
    return 0
  if (typeof v === 'number')
    return v
  const t = Date.parse(v)
  return Number.isNaN(t) ? 0 : t
}

function homeworkStatus(item: HydroOjHomeworkItemRespVO) {
  const now = Date.now()
  const s = toTimestamp(item.startAt)
  const e = toTimestamp(item.endAt)
  if (!s && !e)
    return { text: '未知', cls: appStore.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600' }
  if (now < s)
    return { text: '未开始', cls: appStore.theme === 'dark' ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700' }
  if (e && now > e)
    return { text: '已结束', cls: appStore.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600' }
  return { text: '进行中', cls: appStore.theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700' }
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const params: GetHydroOjHomeworkPageReqVO = { pageNo, pageSize }
    const response = await getHydroOjHomeworkPage(params)
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
    console.error('加载作业列表失败:', error)
    pagingRef.value?.complete(false)
    uni.showToast({ title: '网络错误，请重试', icon: 'none' })
  }
}

function onTapHomework(item: HydroOjHomeworkItemRespVO) {
  const id = item?.docId ? String(item.docId) : ''
  if (!id) {
    uni.showToast({ title: '缺少作业ID', icon: 'none' })
    return
  }
  const url = `/pages-sub/oj/contest/detail?id=${encodeURIComponent(id)}`
  uni.navigateTo({ url } as any)
}
</script>

<template>
  <view class="min-h-screen">
    <z-paging
      ref="pagingRef"
      v-model="homeworks"
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
          v-for="(item, idx) in homeworks"
          :key="idx"
          :class="cardClass"
          class="rounded-2xl p-4 shadow-sm transition-all active:scale-98"
          @click="onTapHomework(item)"
        >
          <!-- 标题与状态 -->
          <view class="flex items-start justify-between gap-2">
            <view class="min-w-0 flex-1">
              <view :class="titleClass" class="truncate text-base font-semibold leading-tight">
                {{ item.title || '作业' }}
              </view>
              <view :class="subTextClass" class="mt-1 flex flex-wrap items-center gap-2 text-11px">
                <view :class="metaChipClass" class="inline-flex items-center rounded-full px-2 py-0.5">
                  <text :class="iconClass" class="i-carbon-rule mr-1" />
                  {{ '作业' }}
                </view>
                <view v-if="item.rated" :class="ratedChipClass" class="inline-flex items-center rounded-full px-2 py-0.5">
                  <text class="i-carbon-star mr-1" />
                  rated
                </view>
              </view>
            </view>
            <view class="ml-2 inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-11px" :class="[homeworkStatus(item).cls]">
              {{ homeworkStatus(item).text }}
            </view>
          </view>

          <!-- 时间区间 -->
          <view :class="subTextClass" class="mt-2 flex items-center text-12px">
            <text :class="iconClass" class="i-carbon-time mr-1" />
            {{ formatStandardDateTime(item.startAt) }} ~ {{ formatStandardDateTime(item.endAt) }}
          </view>

          <!-- 排名（-1 表示未参与排名） -->
          <view v-if="item.rank !== undefined && item.rank !== null" :class="subTextClass" class="mt-2 flex items-center text-12px">
            <template v-if="item.rank === -1">
              <text :class="iconClass" class="i-carbon-subtract-alt mr-1" /> 未参与排名
            </template>
            <template v-else>
              <text :class="rankUpIconClass" class="i-carbon-caret-up mr-1" /> 排名：{{ item.rank }}
            </template>
          </view>
        </view>

        <!-- 首屏骨架占位 -->
        <view v-if="firstLoad && homeworks.length === 0" class="space-y-3">
          <view v-for="n in 4" :key="n" :class="cardClass" class="rounded-2xl p-4 shadow-sm">
            <view :class="appStore.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'" class="h-4 w-2/3 rounded" />
            <view :class="appStore.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'" class="mt-2 h-3 w-1/3 rounded" />
            <view :class="appStore.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'" class="mt-4 h-3 w-full rounded" />
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<style lang="scss" scoped>
/* 使用 UnoCSS 原子类 */
</style>

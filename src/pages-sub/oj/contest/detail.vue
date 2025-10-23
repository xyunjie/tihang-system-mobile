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
import { formatStandardDateTime } from '@/utils'

const loading = ref(true)
const detail = ref<HydroOjContestDetailRespVO | null>(null)
const errorMsg = ref('')

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
    return { text: '未知', cls: 'bg-gray-100 text-gray-600' }
  const now = Date.now()
  const s = toTimestamp(detail.value.startAt)
  const e = toTimestamp(detail.value.endAt)
  if (!s && !e)
    return { text: '未知', cls: 'bg-gray-100 text-gray-600' }
  if (now < s)
    return { text: '未开始', cls: 'bg-amber-50 text-amber-700' }
  if (e && now > e)
    return { text: '已结束', cls: 'bg-gray-100 text-gray-600' }
  return { text: '进行中', cls: 'bg-green-50 text-green-700' }
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
  <view class="min-h-screen bg-gray-50">
    <view v-if="loading" class="p-4 text-gray-400">
      加载中...
    </view>
    <view v-else-if="!detail" class="p-4 text-red-500">
      {{ errorMsg || '未找到比赛详情' }}
    </view>

    <view v-else class="p-4 space-y-4">
      <!-- 标题与状态 -->
      <view class="flex items-start justify-between gap-3">
        <view class="min-w-0 flex-1">
          <view class="truncate text-lg font-semibold leading-tight">
            {{ detail.title }}
          </view>
        </view>
        <view class="shrink-0 rounded-full px-2 py-0.5 text-xs" :class="statusTag.cls">
          {{ statusTag.text }}
        </view>
      </view>

      <!-- 基本信息：时间与排名、参赛人数 -->
      <view class="text-sm text-gray-600 space-y-1">
        <view class="flex items-center">
          <text class="w-16 shrink-0 text-gray-500">
            时间
          </text>
          <text class="ml-2">
            {{ formatStandardDateTime(detail.startAt) }} ~ {{ formatStandardDateTime(detail.endAt) }}
          </text>
        </view>
        <view class="flex items-center">
          <text class="w-16 shrink-0 text-gray-500">
            排名
          </text>
          <text class="ml-2">
            {{ displayRank(detail.rank) }}
          </text>
        </view>
        <view v-if="detail.userCount !== undefined" class="flex items-center">
          <text class="w-16 shrink-0 text-gray-500">
            参赛人数
          </text>
          <text class="ml-2">
            {{ detail.userCount }}
          </text>
        </view>
      </view>

      <!-- 操作按钮：提交记录 / 排行榜（按钮在题目列表上方） -->
      <view class="flex items-center gap-2">
        <view class="inline-flex items-center justify-center rounded-full bg-primary px-3 py-1 text-12px text-white active:opacity-90" @click="goRecordList">
          提交记录
        </view>
        <view class="inline-flex items-center justify-center border border-gray-200 rounded-full bg-white px-3 py-1 text-12px text-gray-700 active:bg-gray-50" @click="goRankboard">
          排行榜
        </view>
      </view>

      <!-- 题目列表：默认折叠，位于描述上方；折叠组件带圆角卡片 -->
      <view v-if="Array.isArray(detail.problems) && detail.problems.length" class="rounded-2xl bg-white p-2 shadow-sm">
        <wd-collapse v-model="activePanels" class="overflow-hidden rounded-xl bg-transparent">
          <wd-collapse-item name="problems">
            <template #title>
              <view class="w-full flex items-center justify-between text-sm text-gray-700 font-semibold">
                <text>题目列表（{{ detail.problems.length }}）</text>
              </view>
            </template>

            <view class="px-4 pb-4 pt-2">
              <view class="grid grid-cols-1 gap-2">
                <view
                  v-for="p in detail.problems"
                  :key="`p-${p.pid}`"
                  class="flex items-center justify-between border border-gray-100 rounded-xl bg-white p-3 active:bg-gray-50"
                  @click="toProblem(p)"
                >
                  <view class="text-sm text-gray-800">
                    <text class="font-semibold">
                      {{ p.pid }}
                    </text>
                    <text>{{ ' ' }}</text>
                    <text>{{ p.title || '' }}</text>
                  </view>
                  <wd-icon name="arrow-right" size="16px" color="#9ca3af" />
                </view>
              </view>
            </view>
          </wd-collapse-item>
        </wd-collapse>
      </view>

      <!-- 比赛介绍：放到题目列表下方 -->
      <view v-if="detail.content" class="rounded-2xl bg-white p-4 shadow-sm">
        <HtmlContent :content="detail.content || ''" />
      </view>
    </view>
  </view>
</template>

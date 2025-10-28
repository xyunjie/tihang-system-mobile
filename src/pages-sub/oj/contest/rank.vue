<route lang="json">
{
  "style": {
    "navigationBarTitleText": "比赛排行榜"
  }
}
</route>

<script lang="ts" setup>
import type { HydroOjContestRankItemRespVO } from '@/pages-sub/api/type/oj'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getHydroOjContestRank } from '@/pages-sub/api/oj'
import { useAppStore } from '@/store/app'

const contestId = ref<string>('')
const loading = ref<boolean>(false)
const list = ref<HydroOjContestRankItemRespVO[]>([])

// 深色模式计算属性
const appStore = useAppStore()
const cardClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-800' : 'bg-white')
const titleClass = computed(() => appStore.theme === 'dark' ? 'text-gray-100' : 'text-gray-900')
const subTextClass = computed(() => appStore.theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
const borderClass = computed(() => appStore.theme === 'dark' ? 'border-gray-700' : 'border-gray-100')
const acceptTextClass = computed(() => appStore.theme === 'dark' ? 'text-green-400' : 'text-green-600')

function displayRankText(rank: number | undefined, fallback: number) {
  if (rank === -1)
    return '—'
  return rank && rank > 0 ? String(rank) : String(fallback)
}

function rankBadgeClass(rank: number | undefined, fallback: number) {
  if (rank === -1)
    return appStore.theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-400'
  const r = rank && rank > 0 ? rank : fallback
  if (r === 1)
    return appStore.theme === 'dark' ? 'bg-amber-900/50 text-amber-200' : 'bg-amber-300 text-amber-900'
  if (r === 2)
    return appStore.theme === 'dark' ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-200 text-zinc-700'
  if (r === 3)
    return appStore.theme === 'dark' ? 'bg-orange-900/40 text-orange-200' : 'bg-orange-300 text-orange-900'
  return appStore.theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
}

async function fetchRank() {
  if (!contestId.value)
    return
  loading.value = true
  try {
    const res = await getHydroOjContestRank(contestId.value)
    // 按项目约定：通用响应 { code, data, msg }
    if ((res as any)?.code === 0 && Array.isArray((res as any).data)) {
      list.value = (res as any).data || []
    }
    else if (Array.isArray((res as any))) {
      list.value = res as any
    }
    else {
      list.value = []
    }
  }
  catch (e) {
    console.error('获取排行榜失败:', e)
    uni.showToast({ title: '获取排行榜失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

onLoad((options) => {
  const id = (options?.id as string) || ''
  if (!id) {
    uni.showToast({ title: '缺少比赛ID', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 600)
    return
  }
  contestId.value = id

  fetchRank()
})
</script>

<template>
  <view class="min-h-screen pb-6">
    <view class="px-4 pb-2 pt-4">
      <text :class="titleClass" class="text-lg font-semibold">
        排行榜
      </text>
    </view>

    <view v-if="loading" :class="subTextClass" class="px-6 py-6">
      加载中...
    </view>

    <view v-else>
      <view v-if="list.length === 0" :class="subTextClass" class="px-6 py-6">
        暂无排名数据
      </view>

      <view v-else class="mx-2 mt-3">
        <view
          v-for="(item, idx) in list"
          :key="item.uid ?? idx"
          :class="[cardClass, borderClass]"
          class="mb-2 flex items-center border rounded-xl p-3 shadow-sm"
        >
          <view class="w-12 flex justify-center">
            <text
              class="h-8 w-8 flex items-center justify-center rounded-full text-xs font-semibold"
              :class="rankBadgeClass(item.rank, idx + 1)"
            >
              {{ displayRankText(item.rank, idx + 1) }}
            </text>
          </view>

          <view class="flex flex-1 flex-col gap-1">
            <view class="flex items-center">
              <text :class="titleClass" class="truncate text-sm font-medium">
                {{ item.uname || '未知用户' }}
              </text>
              <text v-if="item.rank === -1" :class="appStore.theme==='dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500'" class="ml-2 rounded-full px-1 py-0.5 text-10px">
                不参与排名
              </text>
            </view>
            <text :class="subTextClass" class="text-xs">
              UID: {{ item.uid }}
            </text>
          </view>

          <view class="flex flex-col items-end gap-1">
            <text :class="titleClass" class="text-sm font-semibold">
              得分：{{ item.score }}
            </text>
            <text :class="acceptTextClass" class="text-xs">
              通过：{{ item.accept ?? 0 }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

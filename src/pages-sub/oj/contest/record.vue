<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "提交记录"
  }
}
</route>

<script setup lang="ts">
import type { HydroOjContestRecordItemRespVO } from '@/pages-sub/api/type/oj'
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getHydroOjContestRecord } from '@/pages-sub/api/oj'
import { formatStandardDateTime } from '@/utils'

const contestId = ref('')
const records = ref<HydroOjContestRecordItemRespVO[]>([])
const loading = ref(true)
const firstLoad = ref(true)

onLoad((options) => {
  const id = options?.id ? String(options.id) : ''
  if (!id) {
    uni.showToast({ title: '缺少比赛ID', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1200)
    return
  }
  contestId.value = id
  fetchRecords()
})

async function fetchRecords() {
  loading.value = true
  try {
    const res = await getHydroOjContestRecord(contestId.value)
    if ((res as any).code === 0) {
      records.value = (res as any).data || []
      firstLoad.value = false
    }
    else {
      uni.showToast({ title: (res as any).msg || '加载失败', icon: 'none' })
    }
  }
  catch (err: any) {
    uni.showToast({ title: err?.message || '网络错误，请稍后重试', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function getStatusStyle(statusMsg: string) {
  const msg = (statusMsg || '').toLowerCase()
  if (msg.includes('accept') || msg.includes('通过'))
    return 'text-green-700 bg-green-100'
  if (msg.includes('wrong') || msg.includes('错误'))
    return 'text-red-700 bg-red-100'
  if (msg.includes('time') || msg.includes('超时'))
    return 'text-yellow-700 bg-yellow-100'
  if (msg.includes('memory') || msg.includes('内存'))
    return 'text-orange-700 bg-orange-100'
  if (msg.includes('pending') || msg.includes('等待'))
    return 'text-blue-700 bg-blue-100'
  return 'text-gray-700 bg-gray-100'
}

function getLangMeta(lang: string | undefined) {
  const l = (lang || '').toLowerCase()
  if (!l)
    return { text: '未知', cls: 'text-gray-700 bg-gray-100' }
  if (l.includes('cpp') || l === 'c++')
    return { text: 'C++', cls: 'text-blue-700 bg-blue-100' }
  if (l === 'c')
    return { text: 'C', cls: 'text-cyan-700 bg-cyan-100' }
  if (l.startsWith('py'))
    return { text: 'Python', cls: 'text-yellow-800 bg-yellow-100' }
  if (l.includes('java'))
    return { text: 'Java', cls: 'text-orange-800 bg-orange-100' }
  if (l.includes('js'))
    return { text: 'JavaScript', cls: 'text-emerald-800 bg-emerald-100' }
  if (l.includes('ts'))
    return { text: 'TypeScript', cls: 'text-teal-800 bg-teal-100' }
  if (l.includes('go'))
    return { text: 'Go', cls: 'text-sky-800 bg-sky-100' }
  if (l.includes('rust'))
    return { text: 'Rust', cls: 'text-brown-800 bg-brown-100' }
  if (l.includes('swift'))
    return { text: 'Swift', cls: 'text-red-700 bg-red-100' }
  return { text: lang!, cls: 'text-gray-700 bg-gray-100' }
}

function onTapRecord(item: HydroOjContestRecordItemRespVO) {
  const id = typeof item.id === 'string' ? item.id : ''
  if (!id) {
    uni.showToast({ title: '缺少评测ID，暂不可查看', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages-sub/oj/record/detail?id=${encodeURIComponent(id)}` as any })
}
</script>

<template>
  <view class="min-h-screen bg-gray-50">
    <view v-if="loading" class="p-4 space-y-3">
      <view v-for="n in 4" :key="n" class="rounded-2xl bg-white p-4 shadow-sm">
        <view class="h-4 w-2/3 rounded bg-gray-200" />
        <view class="mt-2 h-3 w-1/3 rounded bg-gray-200" />
        <view class="grid grid-cols-2 mt-4 gap-2">
          <view class="h-3 w-full rounded bg-gray-200" />
          <view class="h-3 w-full rounded bg-gray-200" />
        </view>
      </view>
    </view>

    <view v-else class="p-4 space-y-3">
      <view v-if="records.length === 0 && !firstLoad" class="text-center text-gray-500">
        暂无提交记录
      </view>

      <view
        v-for="item in records"
        :key="`${String(item.id)}-${item.pid}`"
        class="rounded-2xl bg-white p-4 shadow-sm transition-all active:scale-98"
        @click="onTapRecord(item)"
      >
        <view class="flex items-start justify-between">
          <view class="min-w-0 flex-1 pr-3">
            <view class="truncate text-base font-semibold leading-tight">
              {{ item.title || `题目 #${item.pid}` }}
            </view>
            <view class="mt-1 text-xs text-gray-500">
              题目编号：#{{ item.pid }}
            </view>
          </view>
          <view :class="`px-2 py-1 rounded-full text-xs ${getStatusStyle(item.statusMsg || '')}`">
            {{ item.statusMsg || '未知状态' }}
          </view>
        </view>

        <view class="grid grid-cols-2 mt-3 gap-2 text-sm text-gray-600">
          <view class="flex items-center">
            <text class="i-carbon-time mr-2 text-gray-400" />
            {{ formatStandardDateTime(item.judgeAt) || '—' }}
          </view>
          <view class="flex items-center justify-end">
            <text class="i-carbon-ibm-watson-language mr-2 text-gray-400" />
            <view :class="`px-2 py-0.5 rounded-full text-xs ${getLangMeta(item.lang).cls}`">
              {{ getLangMeta(item.lang).text }}
            </view>
          </view>
          <view class="flex items-center">
            <text class="i-carbon-timer mr-2 text-gray-400" />
            {{ `${item.time ?? 0} ms` }}
          </view>
          <view class="flex items-center justify-end">
            <text class="i-carbon-chart-line mr-2 text-gray-400" />
            {{ `${item.score ?? 0} 分` }}
          </view>
        </view>

        <view class="mt-3 flex items-center justify-end text-xs text-gray-400">
          <text>点击查看详情</text>
          <wd-icon name="arrow-right" size="12px" class="ml-1" />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用 UnoCSS 原子类，无需自定义样式 */
</style>

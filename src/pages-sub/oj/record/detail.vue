<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "评测详情"
  }
}
</route>

<script setup lang="ts">
import type { HydroOjRecordInfoRespVO } from '@/pages-sub/api/type/oj'
import { computed, ref } from 'vue'
import HtmlContent from '@/components/HtmlContent.vue'
import { getHydroOjRecordInfo } from '@/pages-sub/api/oj'
import { formatStandardDateTime } from '@/utils'
import { useAppStore } from '@/store/app'

defineOptions({ name: 'OjRecordInfo' })

const recordId = ref<string>('')
const detail = ref<HydroOjRecordInfoRespVO | null>(null)
const loading = ref(true)

// 深色模式计算属性
const appStore = useAppStore()
const cardClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-800' : 'bg-white')
const titleClass = computed(() => appStore.theme === 'dark' ? 'text-gray-100' : 'text-gray-900')
const textClass = computed(() => appStore.theme === 'dark' ? 'text-gray-300' : 'text-gray-600')
const subTextClass = computed(() => appStore.theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
const iconClass = computed(() => appStore.theme === 'dark' ? 'text-gray-400' : 'text-gray-400')
const skeletonClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')

onLoad((options) => {
  const id = options?.id as string | undefined
  if (id) {
    recordId.value = id
    loadDetail()
  }
  else {
    uni.showToast({ title: '缺少评测ID', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})

async function loadDetail() {
  loading.value = true
  try {
    const response = await getHydroOjRecordInfo(recordId.value)
    if (response.code === 0 && response.data) {
      detail.value = response.data
      // 设置标题为题目标题（如有）
      if (detail.value?.title) {
        uni.setNavigationBarTitle({ title: detail.value.title })
      }
    }
    else {
      uni.showToast({ title: response.msg || '获取评测详情失败', icon: 'none' })
    }
  }
  catch (error) {
    uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function getStatusStyle(statusMsg?: string) {
  const msg = (statusMsg || '').toLowerCase()
  if (msg.includes('accept') || msg.includes('通过'))
    return appStore.theme === 'dark' ? 'text-green-300 bg-green-900/30' : 'text-green-700 bg-green-100'
  if (msg.includes('wrong') || msg.includes('错误'))
    return appStore.theme === 'dark' ? 'text-red-300 bg-red-900/30' : 'text-red-700 bg-red-100'
  if (msg.includes('time') || msg.includes('超时'))
    return appStore.theme === 'dark' ? 'text-yellow-300 bg-yellow-900/30' : 'text-yellow-700 bg-yellow-100'
  if (msg.includes('memory') || msg.includes('内存'))
    return appStore.theme === 'dark' ? 'text-orange-300 bg-orange-900/30' : 'text-orange-700 bg-orange-100'
  if (msg.includes('pending') || msg.includes('等待'))
    return appStore.theme === 'dark' ? 'text-blue-300 bg-blue-900/30' : 'text-blue-700 bg-blue-100'
  return appStore.theme === 'dark' ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-100'
}

function getLangMeta(lang?: string) {
  const l = (lang || '').toLowerCase()
  if (!l)
    return { text: '未知', cls: appStore.theme === 'dark' ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-100', highlight: 'plaintext' }
  if (l.includes('cpp') || l === 'c++')
    return { text: 'C++', cls: appStore.theme === 'dark' ? 'text-blue-300 bg-blue-900/30' : 'text-blue-700 bg-blue-100', highlight: 'cpp' }
  if (l === 'c')
    return { text: 'C', cls: appStore.theme === 'dark' ? 'text-cyan-300 bg-cyan-900/30' : 'text-cyan-700 bg-cyan-100', highlight: 'c' }
  if (l.startsWith('py'))
    return { text: 'Python', cls: appStore.theme === 'dark' ? 'text-yellow-300 bg-yellow-900/30' : 'text-yellow-800 bg-yellow-100', highlight: 'python' }
  if (l.includes('java'))
    return { text: 'Java', cls: appStore.theme === 'dark' ? 'text-orange-300 bg-orange-900/30' : 'text-orange-800 bg-orange-100', highlight: 'java' }
  if (l.includes('ts'))
    return { text: 'TypeScript', cls: appStore.theme === 'dark' ? 'text-teal-300 bg-teal-900/30' : 'text-teal-800 bg-teal-100', highlight: 'typescript' }
  if (l.includes('js'))
    return { text: 'JavaScript', cls: appStore.theme === 'dark' ? 'text-emerald-300 bg-emerald-900/30' : 'text-emerald-800 bg-emerald-100', highlight: 'javascript' }
  if (l.includes('go'))
    return { text: 'Go', cls: appStore.theme === 'dark' ? 'text-sky-300 bg-sky-900/30' : 'text-sky-800 bg-sky-100', highlight: 'go' }
  if (l.includes('rust'))
    return { text: 'Rust', cls: appStore.theme === 'dark' ? 'text-brown-300 bg-brown-900/30' : 'text-brown-800 bg-brown-100', highlight: 'rust' }
  if (l.includes('swift'))
    return { text: 'Swift', cls: appStore.theme === 'dark' ? 'text-red-300 bg-red-900/30' : 'text-red-700 bg-red-100', highlight: 'swift' }
  return { text: lang!, cls: appStore.theme === 'dark' ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-100', highlight: 'plaintext' }
}
</script>

<template>
  <view class="min-h-screen">
    <view v-if="loading" class="p-4 space-y-3">
      <view :class="cardClass" class="rounded-2xl p-4 shadow-sm">
        <view
          :class="skeletonClass"
          class="h-4 w-2/3 rounded"
        />
        <view :class="skeletonClass" class="mt-2 h-3 w-1/3 rounded" />
        <view :class="skeletonClass" class="mt-4 h-3 w-full rounded" />
      </view>
    </view>

    <view v-else-if="detail" class="p-4 space-y-4">
      <view :class="cardClass" class="rounded-2xl p-4 shadow-sm">
        <view class="flex items-start justify-between">
          <view class="flex-1 pr-3">
            <view :class="titleClass" class="text-base font-semibold leading-tight">
              {{ detail.title || `题目 #${detail.pid}` }}
            </view>
            <view :class="subTextClass" class="mt-1 text-xs">
              评测人：{{ detail.uname || '—' }}
            </view>
          </view>
          <view :class="`px-2 py-1 rounded-full text-xs ${getStatusStyle(detail.statusMsg)}`">
            {{ detail.statusMsg || '未知状态' }}
          </view>
        </view>

        <view :class="textClass" class="grid grid-cols-2 mt-3 gap-2 text-sm">
          <view class="flex items-center">
            <text :class="iconClass" class="i-carbon-time mr-2" />
            {{ formatStandardDateTime(detail.judgeAt) || '—' }}
          </view>
          <view class="flex items-center justify-end">
            <text :class="iconClass" class="i-carbon-ibm-watson-language mr-2" />
            <view :class="`px-2 py-0.5 rounded-full text-xs ${getLangMeta(detail.lang).cls}`">
              {{ getLangMeta(detail.lang).text }}
            </view>
          </view>
          <view class="flex items-center">
            <text :class="iconClass" class="i-carbon-timer mr-2" />
            {{ `${detail.time ?? 0} ms` }}
          </view>
          <view class="flex items-center justify-end">
            <text :class="iconClass" class="i-carbon-catalog mr-2" />
            {{ `${detail.memory ?? 0} KB` }}
          </view>
        </view>
      </view>

      <view :class="cardClass" class="rounded-2xl p-4 shadow-sm">
        <view :class="subTextClass" class="mb-2 text-sm">
          提交代码
        </view>
        <HtmlContent :class="textClass" :content="detail.code || ''" />
      </view>
    </view>

    <view v-else :class="subTextClass" class="p-4 text-center">
      暂无评测详情数据
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用 UnoCSS 原子类，无需自定义样式 */
</style>

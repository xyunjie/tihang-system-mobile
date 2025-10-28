<route lang="json">
{
  "style": {
    "navigationBarTitleText": "评测记录"
  }
}
</route>

<script setup lang="ts">
// 调整导入顺序：内部类型在前、外部在后（按项目lint）
import type { GetHydroOjRecordPageReqVO, HydroOjRecordRespVO } from '@/pages-sub/api/type/oj'
import { computed, ref } from 'vue'
import { getHydroOjRecordPage } from '@/pages-sub/api/oj'
import { formatStandardDateTime } from '@/utils'
import { useAppStore } from '@/store/app'

const appStore = useAppStore()

// 深色模式计算属性
const cardClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-800' : 'bg-white')
const titleClass = computed(() => appStore.theme === 'dark' ? 'text-gray-100' : 'text-gray-900')
const textClass = computed(() => appStore.theme === 'dark' ? 'text-gray-300' : 'text-gray-500')
const iconClass = computed(() => appStore.theme === 'dark' ? 'text-gray-400' : 'text-gray-400')

const records = ref<HydroOjRecordRespVO[]>([])
const pagingRef = ref()
const firstLoad = ref(true)

// 加载评测记录列表
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params: GetHydroOjRecordPageReqVO = { pageNo, pageSize }
    const response = await getHydroOjRecordPage(params)

    if (response.code === 0 && response.data) {
      const { list } = response.data
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
    console.error('加载评测记录失败:', error)
    pagingRef.value?.complete(false)
    uni.showToast({ title: '网络错误，请重试', icon: 'none' })
  }
}

function getStatusStyle(statusMsg: string) {
  const msg = (statusMsg || '').toLowerCase()
  if (appStore.theme === 'dark') {
    if (msg.includes('accept') || msg.includes('通过'))
      return 'text-green-300 bg-green-900/30'
    if (msg.includes('wrong') || msg.includes('错误'))
      return 'text-red-300 bg-red-900/30'
    if (msg.includes('time') || msg.includes('超时'))
      return 'text-yellow-300 bg-yellow-900/30'
    if (msg.includes('memory') || msg.includes('内存'))
      return 'text-orange-300 bg-orange-900/30'
    if (msg.includes('pending') || msg.includes('等待'))
      return 'text-blue-300 bg-blue-900/30'
    return 'text-gray-300 bg-gray-700'
  } else {
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
}

// 新增：语言Tag样式映射
function getLangMeta(lang: string | undefined) {
  const l = (lang || '').toLowerCase()
  if (!l) {
    return { 
      text: '未知', 
      cls: appStore.theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100' 
    }
  }
  
  if (appStore.theme === 'dark') {
    if (l.includes('cpp') || l === 'c++')
      return { text: 'C++', cls: 'text-blue-300 bg-blue-900/30' }
    if (l === 'c')
      return { text: 'C', cls: 'text-cyan-300 bg-cyan-900/30' }
    if (l.startsWith('py'))
      return { text: 'Python', cls: 'text-yellow-300 bg-yellow-900/30' }
    if (l.includes('java'))
      return { text: 'Java', cls: 'text-orange-300 bg-orange-900/30' }
    if (l.includes('js'))
      return { text: 'JavaScript', cls: 'text-emerald-300 bg-emerald-900/30' }
    if (l.includes('ts'))
      return { text: 'TypeScript', cls: 'text-teal-300 bg-teal-900/30' }
    if (l.includes('go'))
      return { text: 'Go', cls: 'text-sky-300 bg-sky-900/30' }
    if (l.includes('rust'))
      return { text: 'Rust', cls: 'text-amber-300 bg-amber-900/30' }
    if (l.includes('swift'))
      return { text: 'Swift', cls: 'text-red-300 bg-red-900/30' }
    return { text: lang!, cls: 'text-gray-300 bg-gray-700' }
  } else {
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
      return { text: 'Rust', cls: 'text-amber-800 bg-amber-100' }
    if (l.includes('swift'))
      return { text: 'Swift', cls: 'text-red-700 bg-red-100' }
    return { text: lang!, cls: 'text-gray-700 bg-gray-100' }
  }
}

function onTapRecord(item: HydroOjRecordRespVO) {
  const id = typeof item.id === 'string' ? item.id : ''
  if (!id) {
    uni.showToast({ title: '缺少评测ID，暂不可查看', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages-sub/oj/record/detail?id=${encodeURIComponent(id)}` })
}
</script>

<template>
  <view class="min-h-screen">
    <z-paging
      style="top: 0px"
      ref="pagingRef"
      v-model="records"
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
          v-for="item in records"
          :key="`${String(item.id)}-${item.pid}`"
          :class="cardClass"
          class="rounded-2xl p-4 shadow-sm transition-all active:scale-98"
          @click="onTapRecord(item)"
        >
          <!-- 顶部：标题 + 状态 -->
          <view class="flex items-start justify-between">
            <view class="flex-1 pr-3">
              <view :class="titleClass" class="text-base font-semibold leading-tight">
                {{ item.title || `题目 #${item.pid}` }}
              </view>
              <view :class="textClass" class="mt-1 text-xs">
                题目编号：#{{ item.pid }}
              </view>
            </view>
            <view :class="`px-2 py-1 rounded-full text-xs ${getStatusStyle(item.statusMsg)}`">
              {{ item.statusMsg || '未知状态' }}
            </view>
          </view>

          <!-- 次级信息：时间 / 语言 / 耗时 / 分数 -->
          <view :class="textClass" class="grid grid-cols-2 mt-3 gap-2 text-sm">
            <!-- 时间 -->
            <view class="flex items-center">
              <text :class="iconClass" class="i-carbon-time mr-2" />
              {{ formatStandardDateTime(item.judgeAt) || '—' }}
            </view>
            <!-- 语言（替换为Tag） -->
            <view class="flex items-center justify-end">
              <text :class="iconClass" class="i-carbon-ibm-watson-language mr-2" />
              <view :class="`px-2 py-0.5 rounded-full text-xs ${getLangMeta(item.lang).cls}`">
                {{ getLangMeta(item.lang).text }}
              </view>
            </view>
            <!-- 耗时 -->
            <view class="flex items-center">
              <text :class="iconClass" class="i-carbon-timer mr-2" />
              {{ `${item.time ?? 0} ms` }}
            </view>
            <!-- 分数 -->
            <view class="flex items-center justify-end">
              <text :class="iconClass" class="i-carbon-chart-line mr-2" />
              {{ `${item.score ?? 0} 分` }}
            </view>
          </view>

          <!-- 右下角箭头提示 -->
          <view :class="textClass" class="mt-3 flex items-center justify-end text-xs">
            <text>点击查看详情</text>
            <wd-icon name="arrow-right" size="12px" class="ml-1" />
          </view>
        </view>

        <!-- 首屏骨架占位 -->
        <view v-if="firstLoad && records.length === 0" class="space-y-3">
          <view v-for="n in 4" :key="n" :class="cardClass" class="rounded-2xl p-4 shadow-sm">
            <view :class="cardClass" class="h-4 w-2/3 rounded" />
            <view :class="cardClass" class="mt-2 h-3 w-1/3 rounded" />
            <view class="grid grid-cols-2 mt-4 gap-2">
              <view :class="cardClass" class="h-3 w-full rounded" />
              <view :class="cardClass" class="h-3 w-full rounded" />
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<style lang="scss" scoped>
/* 使用 UnoCSS 原子类，无需自定义样式 */
</style>

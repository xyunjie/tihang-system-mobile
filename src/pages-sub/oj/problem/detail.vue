<route lang="json" type="page">
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "题目详情"
  }
}
</route>

<script setup lang="ts">
import type { HydroProblemRespVO } from '@/pages-sub/api/type/oj'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import HtmlContent from '@/components/HtmlContent.vue'
import { getHydroOjProblemInfo } from '@/pages-sub/api/oj'
import { useAppStore } from '@/store/app'

defineOptions({
  name: 'ProblemDetail',
})

const appStore = useAppStore()

// 深色模式计算属性
const pageClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50')
const cardClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-800' : 'bg-white')
const titleClass = computed(() => appStore.theme === 'dark' ? 'text-gray-100' : 'text-gray-900')
const textClass = computed(() => appStore.theme === 'dark' ? 'text-gray-300' : 'text-gray-500')
const contentClass = computed(() => appStore.theme === 'dark' ? 'text-gray-200' : 'text-gray-700')

const loading = ref(true)
const problem = ref<HydroProblemRespVO | null>(null)
const errorMsg = ref('')

async function fetchProblem(params: { id: number, docId?: string }) {
  try {
    const res = await getHydroOjProblemInfo(params)
    if ((res as any).code === 0) {
      problem.value = (res as any).data
      uni.setNavigationBarTitle({ title: problem.value?.title || '题目详情' })
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
  const id = Number(options?.id)
  const docId = options?.docId ? String(options.docId) : undefined
  console.log('docId:', docId)
  if (!id) {
    loading.value = false
    errorMsg.value = '参数缺失：id 必填'
    uni.showToast({ title: errorMsg.value, icon: 'none' })
    return
  }

  fetchProblem({ id, docId })
})

function metaItem(label: string, value?: string | number) {
  if (value === undefined || value === null || value === '')
    return ''
  return `${label}：${value}`
}
</script>

<template>
  <view :class="pageClass" class="min-h-screen p-4">
    <!-- 首屏骨架加载 -->
    <view v-if="loading" class="p-2">
      <wd-skeleton theme="paragraph" />
    </view>

    <view v-else>
      <!-- 题目标题 -->
      <view :class="cardClass" class="mb-4 rounded-2xl p-4 shadow-sm">
        <view :class="titleClass" class="text-lg font-bold">
          {{ problem.title }}
        </view>
        <view :class="textClass" class="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
          <wd-tag v-if="problem.pid !== undefined" size="small" type="primary" plain>
            {{ metaItem('题目ID', problem.pid) }}
          </wd-tag>
          <wd-tag v-if="problem.time" size="small" type="success" plain>
            {{ metaItem('时间限制', problem.time) }}
          </wd-tag>
          <wd-tag v-if="problem.memory" size="small" type="warning" plain>
            {{ metaItem('空间限制', problem.memory) }}
          </wd-tag>
        </view>
      </view>

      <!-- 题目内容 -->
      <view :class="cardClass" class="rounded-2xl p-4 shadow-sm">
        <HtmlContent :content="problem.content" :class="contentClass" />
      </view>
    </view>
  </view>
</template>

<style scoped>
</style>

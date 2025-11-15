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
const cardClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-800' : 'bg-white')
const titleClass = computed(() => appStore.theme === 'dark' ? 'text-gray-100' : 'text-gray-900')
const textClass = computed(() => appStore.theme === 'dark' ? 'text-gray-300' : 'text-gray-500')
const contentClass = computed(() => appStore.theme === 'dark' ? 'text-gray-200' : 'text-gray-700')
const skeletonClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')
const errorIconClass = computed(() => appStore.theme === 'dark' ? 'text-amber-300' : 'text-amber-500')

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
    const code = (res as any)?.code
    // 业务约定：1002035002 表示比赛未开始，其余非 0 视为未找到题目或不可查看
    errorMsg.value = code === 1002035002 ? '比赛未开始' : '未找到题目'
  }
}
catch (err: any) {
  errorMsg.value = err?.message || '网络错误，请稍后重试'
}
finally {
  loading.value = false
}
}

onLoad((options: any) => {
  const id = Number(options?.id)
  const docId = options?.docId ? String(options.docId) : undefined
  if (!id) {
    loading.value = false
    errorMsg.value = '参数缺失：id 必填'
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
  <view class="min-h-screen">
    <!-- 首屏骨架加载（卡片风格） -->
    <view v-if="loading" class="p-4 space-y-4 animate-pulse">
      <view :class="cardClass" class="rounded-2xl p-4 shadow-sm">
        <view :class="skeletonClass" class="h-5 w-2/3 rounded" />
        <view :class="skeletonClass" class="mt-2 h-3 w-1/3 rounded" />
      </view>
      <view :class="cardClass" class="rounded-2xl p-4 shadow-sm">
        <view :class="skeletonClass" class="h-3 w-full rounded" />
        <view :class="skeletonClass" class="mt-2 h-3 w-5/6 rounded" />
        <view :class="skeletonClass" class="mt-2 h-3 w-4/6 rounded" />
      </view>
    </view>

    <view v-else-if="!problem" class="p-4">
      <view :class="cardClass" class="flex flex-col items-center rounded-2xl p-6 text-center shadow-sm">
        <wd-icon name="warning" size="32px" :class="errorIconClass" />
        <view :class="titleClass" class="mt-3 text-base font-semibold">
          {{ errorMsg || '未找到题目' }}
        </view>
        <view :class="textClass" class="mt-1 text-xs">
          {{ errorMsg === '比赛未开始' ? '请稍后再试，比赛开始后可查看题目' : '该题目可能被删除或隐藏，请联系管理员' }}
        </view>
      </view>
    </view>

    <view v-else class="p-4 space-y-4">
      <!-- 题目标题 -->
      <view :class="cardClass" class="rounded-2xl p-4 shadow-sm">
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

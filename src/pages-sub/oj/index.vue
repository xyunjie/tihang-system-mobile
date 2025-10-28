<!-- 在线评测系统信息页面（上下结构：统计 + 操作） -->
<route lang="jsonc" type="page">
{
  "layout": "default",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "在线评测系统信息"
  }
}
</route>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import { getHydroOjCount } from '@/pages-sub/api/oj'
import { useAppStore } from '@/store/app'

defineOptions({
  name: 'OJInfo',
})

const appStore = useAppStore()

// 深色模式计算属性
const cardClass = computed(() => appStore.theme === 'dark' ? 'bg-gray-800' : 'bg-white')
const titleClass = computed(() => appStore.theme === 'dark' ? 'text-gray-100' : 'text-gray-900')
const textClass = computed(() => appStore.theme === 'dark' ? 'text-gray-300' : 'text-gray-500')
const infoClass = computed(() => appStore.theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')
const infoIconClass = computed(() => appStore.theme === 'dark' ? 'text-blue-400' : 'text-blue-600')

// 加载状态（首屏骨架）
const loading = ref(true)

// 顶部四个统计：评测记录、训练、比赛、作业
const stats = reactive({
  accepted: 0,
  training: 0,
  contest: 0,
  homework: 0,
})

const statsList = computed(() => [
  { key: 'accepted', label: '评测记录', value: stats.accepted },
  { key: 'training', label: '训练', value: stats.training },
  { key: 'contest', label: '比赛', value: stats.contest },
  { key: 'homework', label: '作业', value: stats.homework },
])

// 操作按钮列表
const actions = [
  { key: 'accepted', title: '评测记录', description: '查看评测记录', icon: 'code', color: 'text-orange-600 bg-orange-50' },
  { key: 'training', title: '训练', description: '进入训练题集', icon: 'code', color: 'text-blue-600 bg-blue-50' },
  { key: 'contest', title: '比赛', description: '查看比赛列表', icon: 'calendar', color: 'text-purple-600 bg-purple-50' },
  { key: 'homework', title: '作业', description: '查看课程作业', icon: 'edit', color: 'text-green-600 bg-green-50' },
]

function handleAction(actionKey: string) {
  switch (actionKey) {
    case 'accepted':
      uni.navigateTo({ url: '/pages-sub/oj/record/list' })
      break
    case 'training':
      uni.navigateTo({ url: '/pages-sub/oj/training/list' })
      break
    case 'contest':
      uni.navigateTo({ url: '/pages-sub/oj/contest/list' })
      break
    case 'homework':
    default:
      uni.navigateTo({ url: '/pages-sub/oj/contest/homework' })
      break
  }
}

// 首次进入，初始化统计
onLoad(async () => {
  try {
    const res = await getHydroOjCount()
    const data = res.data
    stats.accepted = data?.accepted ?? 0
    stats.training = data?.train ?? 0
    stats.contest = data?.contest ?? 0
    stats.homework = data?.homework ?? 0
  }
  catch (error) {
    uni.showToast({ title: '统计加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <view class="min-h-screen p-4">
    <!-- 首屏骨架加载 -->
    <view v-if="loading" class="p-2">
      <wd-skeleton theme="paragraph" />
    </view>

    <view v-else>
      <!-- 顶部统计（4格） -->
      <view class="grid grid-cols-4 mb-4 gap-3">
        <view
          v-for="item in statsList"
          :key="item.key"
          :class="cardClass"
          class="rounded-2xl px-3 py-4 text-center shadow-sm"
        >
          <view :class="textClass" class="text-12px">
            {{ item.label }}
          </view>
          <view :class="titleClass" class="mt-1 text-lg font-semibold">
            {{ item.value || 0 }}
          </view>
        </view>
      </view>

      <!-- 数据同步提示 -->
      <view :class="infoClass" class="mb-4 flex items-center rounded-xl px-3 py-2 text-12px">
        <text :class="infoIconClass" class="i-carbon-information mr-1" />
        数据同步存在延迟
      </view>

      <!-- 操作模块 -->
      <view class="space-y-3">
        <view
          v-for="action in actions"
          :key="action.key"
          :class="cardClass"
          class="flex items-center justify-between rounded-2xl p-4 shadow-sm active:scale-98"
          @tap="handleAction(action.key)"
        >
          <view class="min-w-0 flex-1">
            <view :class="titleClass" class="truncate text-base font-semibold leading-tight">
              {{ action.title }}
            </view>
            <view :class="textClass" class="mt-1 text-12px">
              {{ action.description }}
            </view>
          </view>
          <view class="ml-3 h-9 w-9 inline-flex flex-shrink-0 items-center justify-center rounded-full" :class="[action.color]">
            <wd-icon :name="action.icon" size="16px" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用 UnoCSS 原子类，无需自定义样式 */
</style>

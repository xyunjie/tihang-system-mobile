<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "训练列表"
  }
}
</route>

<script setup lang="ts">
import type { GetHydroOjTrainingPageReqVO, HydroOjTrainingPageRespVO } from '@/pages-sub/api/type/oj'
import { ref } from 'vue'
import { getHydroOjTrainingPage } from '@/pages-sub/api/oj'

const trainings = ref<HydroOjTrainingPageRespVO[]>([])
const pagingRef = ref()
const firstLoad = ref(true)

// 统计题目总数：兼容 dag 为分阶段结构（每阶段含 pids）或普通数组
function totalProblems(dag: any): number {
  if (Array.isArray(dag)) {
    if (dag.every((s: any) => s && Array.isArray(s.pids))) {
      return dag.reduce((sum: number, s: any) => sum + (Array.isArray(s.pids) ? s.pids.length : 0), 0)
    }
    return dag.length
  }
  return 0
}

// 加载训练列表
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params: GetHydroOjTrainingPageReqVO = { pageNo, pageSize }
    const response = await getHydroOjTrainingPage(params)
    if (response.code === 0 && response.data) {
      const list = response.data.list
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
    console.error('加载训练列表失败:', error)
    pagingRef.value?.complete(false)
    uni.showToast({ title: '网络错误，请重试', icon: 'none' })
  }
}

function onTapTraining(item: HydroOjTrainingPageRespVO) {
  // 仅按 id 查询详情：docId 可能是字符串或 ObjectId 对象
  const idStr = typeof (item as any)?.docId === 'string'
    ? String((item as any).docId)
    : String((item as any)?.docId?.timestamp ?? '')
  const url = `/pages-sub/oj/training/detail?docId=${encodeURIComponent(idStr)}`
  // #ifdef APP-PLUS || H5 || MP
  uni.navigateTo({ url })
  // #endif
}
</script>

<template>
  <view class="min-h-screen bg-gray-50">
    <z-paging
      ref="pagingRef"
      v-model="trainings"
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
          v-for="(item, idx) in trainings"
          :key="idx"
          class="rounded-2xl bg-white p-4 shadow-sm transition-all active:scale-98"
          @click="onTapTraining(item)"
        >
          <view class="flex items-center justify-between">
            <view
              class="truncate text-base font-semibold leading-tight"
            >
              {{ item.title || '训练' }}
            </view>
            <!-- 参加状态：右侧标签（图标+文字） -->
            <view
              class="ml-3 inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-11px"
              :class="item?.join ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
            >
              <wd-icon
                :name="item?.join ? 'check-circle' : 'close'"
                size="14px"
                :color="item?.join ? '#10b981' : '#ef4444'"
                class="mr-1"
              />
              {{ item?.join ? '已参加' : '未参加' }}
            </view>
          </view>

          <!-- 描述：按 join 分流（未参加展示 content） -->
          <view class="mt-1 truncate text-xs text-gray-500">
            {{ item?.content || '暂无描述' }}
          </view>

          <!-- 元信息：章节数 / 题目数 / 完成度（尽可能多展示） -->
          <view class="mt-2 flex flex-wrap items-center gap-2 text-11px">
            <view class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
              <text class="i-carbon-flag mr-1 text-gray-500" />
              {{ item?.dagTotal ?? 0 }} 小节
            </view>
            <view class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
              <text class="i-carbon-task mr-1 text-gray-500" />
              {{ item?.total ?? 0 }} 道题
            </view>
            <view v-if="item?.join" class="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-green-700">
              <text class="i-carbon-checkmark-outline mr-1 text-green-500" />
              已完成 {{ item.progress ?? 0 }}%
            </view>
          </view>

          <!-- 进度条：仅已参加显示 -->
          <view v-if="item?.join" class="mt-2 h-1.5 rounded-full bg-gray-100">
            <view
              class="h-full rounded-full bg-green-500"
              :style="{ width: `${Math.min(item?.progress ?? 0, 100)}%` }"
            />
          </view>
        </view>

        <!-- 首屏骨架占位 -->
        <view v-if="firstLoad && trainings.length === 0" class="space-y-3">
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
/* 使用 UnoCSS 原子类，无需自定义样式 */
</style>

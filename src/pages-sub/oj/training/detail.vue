<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "训练详情"
  }
}
</route>

<script setup lang="ts">
import type { HydroOjTrainingDetailRespVO } from '@/pages-sub/api/type/oj'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import HtmlContent from '@/components/HtmlContent.vue'
import { getHydroOjTrainingDetail } from '@/pages-sub/api/oj'

// 训练标题与原始dag数据
const title = ref<string>('训练详情')
const dagRaw = ref<any>([])

// 详情数据
const detail = ref<HydroOjTrainingDetailRespVO | null>(null)

// 新增：适配“阶段+题目列表”的 DAG 结构
// 形如：[{ id, title, requireNids: [{id,title,isCompleted}], pids: [{pid,title,isCompleted}] }, ...]
interface Stage {
  id: string | number
  title: string
  requireNids: Array<{ id: string | number, title: string, isCompleted?: boolean }>
  pids: Array<{ pid: string | number, title: string, isCompleted?: boolean }>
  completed?: number
  total?: number
}

const isStageDag = computed(() => Array.isArray(dagRaw.value) && dagRaw.value.every((s: any) => s && Array.isArray(s.pids)))

const stages = computed<Stage[]>(() => {
  if (!isStageDag.value)
    return []
  return (dagRaw.value as any[]).map((s: any, i: number) => {
    const requireNids = Array.isArray(s?.requireNids)
      ? s.requireNids.map((r: any) => ({ id: r?.id ?? '', title: r?.title ?? String(r?.id ?? ''), isCompleted: !!r?.isCompleted }))
      : []
    const pids = Array.isArray(s?.pids)
      ? s.pids.map((p: any) => ({ pid: p?.pid ?? '', title: p?.title ?? String(p?.pid ?? ''), isCompleted: !!p?.isCompleted }))
      : []
    return {
      id: s?.id ?? i + 1,
      title: s?.title ?? `阶段${i + 1}`,
      requireNids,
      pids,
      completed: pids.filter((p: any) => !!p.isCompleted).length,
      total: pids.length,
    }
  })
})

// 折叠面板：默认全部折叠
const activeStages = ref<string[] | string>([])

// 兼容多种dag结构，归一化为分层数组：layers: Array<Array<{ id: string, label: string }>>
function normalizeDag(input: any): Array<Array<{ id: string | number, label: string }>> {
  const layers: Array<Array<{ id: string | number, label: string }>> = []
  if (!input)
    return layers
  if (Array.isArray(input)) {
    if (input.every((s: any) => s && Array.isArray(s.pids))) {
      input.forEach((s: any, i: number) => {
        const stageLayer = (s.pids || []).map((p: any) => ({ id: p?.pid ?? '', label: `${String(p?.pid ?? '')} ${String(p?.title ?? '')}` }))
        layers.push(stageLayer.length > 0 ? stageLayer : [{ id: `stage-${i + 1}-empty`, label: '该阶段暂无题目' }])
      })
      return layers
    }
    const single = input.map((node: any, i: number) => {
      const id = node?.id ?? i + 1
      const label = typeof node === 'string' || typeof node === 'number' ? String(node) : String(node?.title ?? node?.name ?? id)
      return { id, label }
    })
    layers.push(single)
    return layers
  }
  layers.push([{ id: 'raw', label: JSON.stringify(input) }])
  return layers
}

const layers = computed(() => normalizeDag(dagRaw.value))

onLoad(async (options) => {
  // 通过 docId 查询详情
  if (options?.docId) {
    try {
      const res = await getHydroOjTrainingDetail(String(options.docId))
      if (res.code === 0 && res.data) {
        detail.value = res.data
        title.value = String(res.data.title || '训练详情')
        uni.setNavigationBarTitle({ title: title.value })
        // 正确赋值后端返回的 DAG 数据
        dagRaw.value = (res.data as any)?.dag ?? []
      }
    }
    catch (e) {
      console.error('加载训练详情失败', e)
      uni.showToast({ title: '加载训练详情失败', icon: 'none' })
    }
    return
  }

  // 兼容历史逻辑：事件通道接收
  try {
    const eventChannel = (getCurrentPages()?.slice(-1)?.[0] as any)?.getOpenerEventChannel?.()
    eventChannel?.on?.('openTraining', (payload: any) => {
      if (payload?.title) {
        title.value = String(payload.title)
        uni.setNavigationBarTitle({ title: title.value })
      }
      dagRaw.value = payload?.dag ?? []
    })
  }
  catch (e) {
    // H5等平台若事件通道不可用，可考虑后续从缓存拉取
  }
})

function resolveDocId(): string | undefined {
  const d = detail.value?.docId as any
  if (!d)
    return undefined
  return typeof d === 'string' ? d : String(d?.timestamp ?? '')
}

function onTapProblem(pid: string | number, t?: string) {
  const idNum = Number(pid)
  if (!idNum) {
    uni.showToast({ title: '题目ID无效', icon: 'none' })
    return
  }
  const docId = resolveDocId()
  const url = `/pages-sub/oj/problem/detail?id=${idNum}${docId ? `&docId=${encodeURIComponent(docId)}` : ''}`
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-4">
    <view class="rounded-2xl bg-white p-4 shadow-sm">
      <view class="text-base font-semibold leading-tight">
        {{ title }}
      </view>
      <view v-if="detail?.content" class="mt-1 text-xs text-gray-500">
        {{ detail?.content }}
      </view>
      <HtmlContent v-if="detail?.description" class="mt-1 text-xs text-gray-500" :content="detail?.description" />
    </view>

    <!-- 新增：阶段+题目列表渲染（折叠） -->
    <view v-if="isStageDag" class="mt-4">
      <wd-collapse v-model="activeStages" class="overflow-hidden rounded-2 bg-transparent">
        <wd-collapse-item
          v-for="(s, si) in stages"
          :key="`stage-${s.id}-${si}`"
          :name="String(s.id)"
        >
          <!-- 自定义标题，默认折叠，点击展开 -->
          <template #title="{ expanded }">
            <view
              class="flex items-center justify-between border border-gray-100 rounded-2 bg-white px-4 py-3 shadow-sm transition-all duration-300"
              :class="{ 'rounded-b-0': expanded }"
            >
              <view class="min-w-0 flex-1">
                <view class="truncate text-base text-gray-800 font-semibold">
                  章节{{ si + 1 }}. {{ s.title }}
                </view>
                <view class="mt-1 text-11px text-gray-500">
                  已完成 {{ s.completed || 0 }} / {{ s.total || 0 }}
                </view>
              </view>
              <wd-icon
                :name="expanded ? 'arrow-up' : 'arrow-down'"
                class="ml-2 text-gray-400 transition-transform duration-300"
                :class="{ 'rotate-180 text-blue-500': expanded }"
                size="14px"
              />
            </view>
          </template>

          <!-- 折叠内容 -->
          <view class="bg白 border-x border-b border-gray-100 rounded-b-2 px-4 pb-4 pt-2">
            <view v-if="s.requireNids && s.requireNids.length" class="mb-2 flex flex-wrap items-center gap-2">
              <view class="text-12px text-gray-500">
                前置阶段：
              </view>
              <view
                v-for="req in s.requireNids"
                :key="`req-${req.id}`"
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-12px"
                :class="req.isCompleted ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'"
              >
                <wd-icon :name="req.isCompleted ? 'check-circle' : 'clock'" size="12px" :color="req.isCompleted ? '#10b981' : '#9ca3af'" />
                <text>{{ req.title }}</text>
              </view>
            </view>

            <view class="grid grid-cols-1 gap-2">
              <view
                v-for="p in s.pids"
                :key="`p-${p.pid}`"
                class="flex items-center justify-between border border-gray-100 rounded-xl bg-white p-3 active:bg-gray-50"
                @click="onTapProblem(p.pid, p.title)"
              >
                <view class="text-sm text-gray-800">
                  <text class="font-semibold">
                    {{ p.pid }}
                  </text>
                  <text>{{ ' ' }}</text>
                  <text> {{ p.title || '' }}</text>
                </view>
                <view
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-11px"
                  :class="p.isCompleted ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'"
                >
                  <wd-icon :name="p.isCompleted ? 'check-circle' : 'close'" size="14px" :color="p.isCompleted ? '#10b981' : '#9ca3af'" />
                  <text>{{ p.isCompleted ? '已完成' : '未完成' }}</text>
                </view>
              </view>
            </view>
          </view>
        </wd-collapse-item>
      </wd-collapse>
    </view>

    <view v-else class="mt-6 text-center text-gray-500">
      暂无数据
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用 UnoCSS 原子类，无需自定义样式 */
</style>

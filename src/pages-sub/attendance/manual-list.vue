<!-- 手动考勤列表页面 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "手动考勤"
  }
}
</route>

<script setup lang="ts">
import type { AttendanceManualRespVO } from '@/api/types/attendance'
import { addManualAttendance, getManualAttendanceList } from '@/api/attendance'

defineOptions({
  name: 'ManualAttendanceList',
})

// 数据状态
const manualList = ref<AttendanceManualRespVO[]>([])
const pagingRef = ref()
const firstLoad = ref(true)

// 按钮加载状态（用于防止重复点击）
const processingIds = ref<Set<number>>(new Set())

// 页面加载
onLoad(() => {
  // z-paging会自动触发首次加载
})

// 加载手动考勤列表
async function queryList(pageNo: number, pageSize: number) {
  try {
    const response = await getManualAttendanceList()

    console.log('手动考勤列表响应:', response)

    if (response.code === 0 && response.data) {
      if (firstLoad.value) {
        firstLoad.value = false
      }

      // 完成分页加载
      pagingRef.value?.complete(response.data)
    }
    else {
      pagingRef.value?.complete(false)
      uni.showToast({
        title: response.msg || '加载失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('❌ 加载手动考勤列表错误:', error)
    pagingRef.value?.complete(false)
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
}

// 处理考勤操作
async function handleAttendance(item: AttendanceManualRespVO, status: number) {
  // 防止重复点击（以 userId 为唯一标识）
  if (processingIds.value.has(item.userId)) {
    return
  }

  processingIds.value.add(item.userId)

  try {
    const statusText = status === 1 ? '正常' : '缺勤'

    const response = await addManualAttendance({
      id: item.id,
      userId: item.userId,
      status,
    })

    if (response.code === 0) {
      uni.showToast({
        title: `${item.nickname} 已标记为${statusText}`,
        icon: 'success',
        duration: 1500,
      })

      // 更新列表中的状态
      const i = manualList.value.findIndex(i => i.id === item.id)
      if (i !== -1) {
        manualList.value[i].status = status
      }
      item.id = response.data
    }
    else {
      uni.showToast({
        title: response.msg || '操作失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('考勤操作错误:', error)
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    processingIds.value.delete(item.userId)
  }
}

// 获取状态文本
function getStatusText(status: number | null): string {
  if (status === null || status === 0) {
    return '未考勤'
  }
  switch (status) {
    case 1: return '正常'
    case 2: return '迟到'
    case 3: return '早退'
    case 4: return '缺卡'
    case 5: return '请假'
    case 6: return '缺勤'
    default: return '未知状态'
  }
}

// 获取状态颜色
function getStatusColor(status: number | null): string {
  if (status === null || status === 0) {
    return 'text-gray-700 bg-gray-100'
  }
  switch (status) {
    case 1: return 'text-green-700 bg-green-100'
    case 2: return 'text-yellow-700 bg-yellow-100'
    case 3: return 'text-orange-700 bg-orange-100'
    case 4: return 'text-red-700 bg-red-100'
    case 5: return 'text-blue-700 bg-blue-100'
    case 6: return 'text-red-700 bg-red-100'
    default: return 'text-gray-700 bg-gray-100'
  }
}

// 判断按钮是否正在处理
function isProcessing(userId: number): boolean {
  return processingIds.value.has(userId)
}

// 判断是否显示正常按钮
function shouldShowNormalButton(status: number | null): boolean {
  return status === null || status !== 1
}

// 判断是否显示缺勤按钮
function shouldShowAbsentButton(status: number | null): boolean {
  return status === null || status !== 6
}
</script>

<template>
  <view class="min-h-screen bg-gray-50">
    <!-- 使用z-paging虚拟列表 -->
    <z-paging
      ref="pagingRef"
      v-model="manualList"
      :refresher-enabled="true"
      :loading-more-enabled="false"
      :auto-show-back-to-top="true"
      :auto-clean-list-when-reload="true"
      :refresher-threshold="80"
      refresher-default-text="下拉刷新"
      refresher-pulling-text="下拉刷新"
      refresher-refreshing-text="正在刷新..."
      refresher-complete-text="刷新完成"
      empty-view-text="暂无手动考勤记录"
      use-virtual-list
      cell-height-mode="dynamic"
      @query="queryList"
    >
      <!-- 骨架屏 -->
      <view v-if="firstLoad" class="p-4">
        <wd-skeleton theme="paragraph" />
      </view>

      <!-- 列表内容 -->
      <view v-else class="p-4">
        <view
          v-for="(item, index) in manualList"
          :key="index"
          class="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm"
        >
          <view class="p-4">
            <view class="flex items-center justify-between">
              <view class="flex flex-1 items-center gap-2">
                <view class="text-base text-gray-800 font-semibold">
                  {{ item.nickname }}
                </view>
                <view class="rounded-full px-2 py-1 text-xs font-medium" :class="getStatusColor(item.status)">
                  {{ getStatusText(item.status) }}
                </view>
              </view>

              <!-- 操作按钮区域 -->
              <view class="ml-3 flex flex-shrink-0 gap-2">
                <wd-button
                  v-if="shouldShowNormalButton(item.status)"
                  type="success"
                  size="small"
                  :disabled="isProcessing(item.userId)"
                  :loading="isProcessing(item.userId)"
                  @click="handleAttendance(item, 1)"
                >
                  正常
                </wd-button>
                <wd-button
                  v-if="shouldShowAbsentButton(item.status)"
                  type="error"
                  size="small"
                  :disabled="isProcessing(item.userId)"
                  :loading="isProcessing(item.userId)"
                  @click="handleAttendance(item, 6)"
                >
                  缺勤
                </wd-button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<style lang="scss" scoped>
/* 使用 UnoCSS 原子化类名，无需自定义 CSS */
</style>

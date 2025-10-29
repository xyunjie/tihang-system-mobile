<!-- 考勤管理功能选择页面 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "考勤管理"
  }
}
</route>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/store/app'

defineOptions({
  name: 'AttendanceManagement',
})

// 功能列表
const functionList = [
  {
    id: 1,
    title: '考勤照片上传',
    description: '上传考勤识别照片',
    icon: 'camera',
    color: 'text-blue-600 bg-blue-50',
    route: '/pages-sub/attendance/photo-upload',
  },
  {
    id: 2,
    title: '手动考勤',
    description: '手动记录考勤信息',
    icon: 'edit',
    color: 'text-green-600 bg-green-50',
    route: '/pages-sub/attendance/manual-list',
  },
  {
    id: 3,
    title: '课程表管理',
    description: '设置每周课程安排',
    icon: 'calendar',
    color: 'text-purple-600 bg-purple-50',
    route: '/pages-sub/attendance/timetable',
  },
]

// 跳转到指定功能
function navigateToFunction(route: string) {
  uni.navigateTo({
    url: route,
    fail: () => {
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none',
        duration: 2000,
      })
    },
  })
}

// 深色模式支持
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const cardClass = computed(() => (isDark.value ? 'bg-gray-800' : 'bg-white'))
const titleClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textClass = computed(() => (isDark.value ? 'text-gray-300' : 'text-gray-500'))
</script>

<template>
  <view class="min-h-screen p-4">
    <!-- 功能列表 -->
    <view class="space-y-4">
      <view
        v-for="item in functionList"
        :key="item.id"
        class="overflow-hidden rounded-2xl shadow-sm transition-all active:scale-98"
        :class="cardClass"
        @tap="navigateToFunction(item.route)"
      >
        <view class="p-4">
          <view class="flex items-center">
            <view class="mr-4 h-12 w-12 flex flex-shrink-0 items-center justify-center rounded-full" :class="item.color">
              <wd-icon :name="item.icon" />
            </view>
            <view class="min-w-0 flex-1">
              <view class="mb-1 text-base font-semibold" :class="titleClass">
                {{ item.title }}
              </view>
              <view class="text-sm" :class="textClass">
                {{ item.description }}
              </view>
            </view>
            <view class="ml-3 flex-shrink-0">
              <wd-icon name="arrow-right" size="16rpx" color="#999" />
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用 UnoCSS 原子化类名，无需自定义 CSS */
</style>

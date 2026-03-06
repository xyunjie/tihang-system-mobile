<!-- 纳新提交成功页面 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "申请状态"
  },
  "notLogin": true
}
</route>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'
import { getRecruitmentStatusText, RecruitmentStatus } from '@/api/types/recruitment'
import { useAppStore } from '@/store/app'

// 纳新群链接
const groupLink = ref('')
// 审核状态
const status = ref<number>(RecruitmentStatus.WAIT_AUDIT)

const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))

// 页面加载时获取参数
onLoad((options) => {
  if (options?.groupLink) {
    groupLink.value = decodeURIComponent(options.groupLink)
  }
  if (options?.status !== undefined) {
    status.value = Number(options.status)
  }
})

function setPageBackgroundColor() {
  const bgColor = isDark.value ? '#020617' : '#f5f7fa'
  const api = (uni as any).setBackgroundColor
  if (typeof api !== 'function')
    return
  api({
    backgroundColor: bgColor,
    backgroundColorTop: bgColor,
    backgroundColorBottom: bgColor,
  })
}

watch(() => isDark.value, () => {
  setPageBackgroundColor()
})

// 状态配置
const statusConfig = computed(() => {
  switch (status.value) {
    case RecruitmentStatus.WAIT_AUDIT:
      return {
        icon: 'time',
        iconColor: '#f59e0b',
        iconBg: 'bg-amber-50 dark:bg-amber-500/10',
        title: '等待审核',
        description: '您的纳新申请已成功提交！\n请耐心等待审核结果，我们会尽快处理。',
      }
    case RecruitmentStatus.PASS:
      return {
        icon: 'check',
        iconColor: '#10b981',
        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
        title: '审核通过',
        description: '恭喜您！您的纳新申请已通过审核！\n请关注后续通知，准备参加面试/笔试。',
      }
    case RecruitmentStatus.REFUSE:
      return {
        icon: 'close',
        iconColor: '#ef4444',
        iconBg: 'bg-red-50 dark:bg-red-500/10',
        title: '审核不通过',
        description: '很抱歉，您的申请未通过审核。\n您可以修改信息后重新提交申请。',
      }
    case RecruitmentStatus.WAIT_INTERVIEW:
      return {
        icon: 'calendar',
        iconColor: '#3b82f6',
        iconBg: 'bg-blue-50 dark:bg-blue-500/10',
        title: '待面试/待笔试',
        description: '您的申请已进入面试/笔试阶段！\n请关注群内通知，按时参加考核。',
      }
    case RecruitmentStatus.FIT_ADMIT:
      return {
        icon: 'star-on',
        iconColor: '#8b5cf6',
        iconBg: 'bg-violet-50 dark:bg-violet-500/10',
        title: '拟录取',
        description: '恭喜您！您已被拟录取！\n请关注后续通知。',
      }
    default:
      return {
        icon: 'info-circle',
        iconColor: '#6b7280',
        iconBg: 'bg-slate-100 dark:bg-white/10',
        title: getRecruitmentStatusText(status.value),
        description: '请关注后续通知。',
      }
  }
})

// 是否显示重新提交按钮
const showResubmitBtn = computed(() => status.value === RecruitmentStatus.REFUSE)

// 加入纳新群
function onJoinGroup() {
  if (!groupLink.value) {
    uni.showToast({
      title: '暂无纳新群链接',
      icon: 'none',
    })
    return
  }

  // #ifdef H5
  window.location.href = groupLink.value
  // #endif

  // #ifdef MP-WEIXIN
  uni.navigateTo({
    url: `/pages-sub/webview/index?url=${encodeURIComponent(groupLink.value)}`,
    fail: () => {
      uni.showToast({
        title: '打开链接失败',
        icon: 'none',
      })
    },
  })
  // #endif

  // #ifdef APP-PLUS
  plus.runtime.openURL(groupLink.value)
  // #endif
}

// 重新提交
function onResubmit() {
  uni.redirectTo({
    url: '/pages/recruitment/index',
  })
}
</script>

<template>
  <view class="success-page min-h-screen">
    <!-- 顶部 Header -->
    <view class="header-section relative overflow-hidden from-[#2563eb] to-[#1e40af] bg-gradient-to-br px-6 pb-20 pt-12">
      <!-- 装饰圆形 -->
      <view class="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-white/10" />
      <view class="absolute bottom-[-20px] left-[-20px] h-24 w-24 rounded-full bg-white/5" />
      <view class="absolute left-1/2 top-1/2 h-48 w-48 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
    </view>

    <!-- 主要内容区域 -->
    <view class="relative z-10 mt-[-80px] px-4 pb-8">
      <!-- 状态卡片 -->
      <view class="success-card rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm">
        <!-- 状态图标 -->
        <view class="mb-6 flex justify-center">
          <view class="h-20 w-20 flex items-center justify-center rounded-full" :class="statusConfig.iconBg">
            <wd-icon :name="statusConfig.icon" size="48px" :color="statusConfig.iconColor" />
          </view>
        </view>

        <!-- 状态标题 -->
        <view class="mb-3 text-center text-xl font-bold" :class="textPrimaryClass">
          {{ statusConfig.title }}
        </view>

        <!-- 状态描述 -->
        <view class="mb-6 whitespace-pre-line text-center text-sm leading-relaxed" :class="textMutedClass">
          {{ statusConfig.description }}
        </view>

        <!-- 提示信息卡片 -->
        <view class="mb-6 rounded-xl bg-blue-50 dark:bg-blue-500/10 p-4">
          <view class="mb-2 flex items-center">
            <wd-icon name="info-circle" size="18px" color="#2563eb" />
            <text class="ml-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              温馨提示
            </text>
          </view>
          <view class="text-xs leading-relaxed" :class="textSecondaryClass">
            <view class="mb-1">
              1. 请加入纳新群，以便及时获取审核进度和后续通知
            </view>
            <view class="mb-1">
              2. 如有疑问，请在群内联系管理员
            </view>
            <view>
              3. 请时刻关注微信服务号消息通知，避免错过重要信息
            </view>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="mb-6 h-px bg-gray-100 dark:bg-white/10" />

        <!-- 按钮区域 -->
        <view class="space-y-3">
          <!-- 加入纳新群按钮 -->
          <view
            v-if="groupLink"
            class="join-btn flex items-center justify-center rounded-xl from-[#2563eb] to-[#1e40af] bg-gradient-to-r py-3.5"
            hover-class="opacity-90"
            @click="onJoinGroup"
          >
            <wd-icon name="chat" size="20px" color="#ffffff" />
            <text class="ml-2 text-base text-white font-semibold">
              加入纳新群
            </text>
          </view>

          <!-- 重新提交按钮（仅审核不通过时显示） -->
          <view
            v-if="showResubmitBtn"
            class="resubmit-btn flex items-center justify-center border-2 border-[#2563eb] dark:border-blue-400 rounded-xl bg-white dark:bg-slate-800 py-3.5"
            hover-class="bg-[#f0f7ff]"
            @click="onResubmit"
          >
            <wd-icon name="edit" size="20px" color="#2563eb" />
            <text class="ml-2 text-base font-semibold text-blue-600 dark:text-blue-400">
              修改并重新提交
            </text>
          </view>
        </view>
      </view>

      <!-- 底部装饰文字 -->
      <view class="mt-8 text-center text-xs" :class="textMutedClass">
        感谢您的申请，期待与您的加入
      </view>
    </view>
  </view>
</template>

<style scoped>
.success-page {
  --primary-color: #2563eb;
}

.success-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.join-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}

.resubmit-btn:active {
  background-color: #f0f7ff;
}

.home-btn:active {
  background-color: #f9fafb;
}

.space-y-3 > view + view {
  margin-top: 12px;
}
</style>

<style>
page {
  background-color: #f5f7fa;
}
.dark page {
  background-color: #020617;
}
</style>

<!-- 纳新录取结果页面 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "录取结果"
  },
  "notLogin": true
}
</route>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useMessage } from 'wot-design-uni'
import { getSocialAuthRedirect, getWxUserInfoApi } from '@/api/login'
import { getRecruitmentArchivesByOpenid } from '@/api/recruitment'
import { RecruitmentStatus } from '@/api/types/recruitment'
import type { UserRecruitmentArchivesRespVO } from '@/api/types/recruitment'
import { useAppStore } from '@/store/app'
import { getSocialType, isWechatBrowser } from '@/utils/platform'

const message = useMessage()
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))

const loading = ref(true)
const error = ref('')
const data = ref<UserRecruitmentArchivesRespVO | null>(null)

const isAdmitted = computed(() => data.value?.status === RecruitmentStatus.FIT_ADMIT)

function checkWechatEnvironment(): boolean {
  // #ifdef MP-WEIXIN
  return true
  // #endif

  // #ifdef H5
  return isWechatBrowser()
  // #endif

  return false
}

function handleNonWechatEnvironment() {
  loading.value = false
  message.alert({
    msg: '录取结果查询仅在微信环境中可用，请在微信小程序或微信浏览器中访问。',
    title: '访问受限',
    confirmButtonText: '我知道了',
    showCancelButton: false,
    closeOnClickModal: false,
  }).then(() => {
    uni.navigateBack({
      fail: () => uni.reLaunch({ url: '/pages/index/index' }),
    })
  })
}

function getWxCode(): Promise<{ code: string }> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve({ code: res.code }),
      fail: err => reject(err),
    })
  })
}

async function getOpenidMp(): Promise<string | null> {
  try {
    const codeRes = await getWxCode()
    const res = await getWxUserInfoApi({ type: getSocialType(), code: codeRes.code })
    if (res.code === 0 && res.data?.openid)
      return res.data.openid
    return null
  }
  catch {
    return null
  }
}

async function initWxAuthH5() {
  try {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('code')
    currentUrl.searchParams.delete('state')
    const res = await getSocialAuthRedirect({ type: getSocialType(), redirectUri: currentUrl.toString() })
    if (res.code === 0 && res.data)
      window.location.href = res.data
  }
  catch (e) {
    console.error('初始化微信认证失败:', e)
  }
}

async function getOpenidH5(code: string, state?: string): Promise<string | null> {
  try {
    const res = await getWxUserInfoApi({ type: getSocialType(), code, state })
    if (res.code === 0 && res.data?.openid)
      return res.data.openid
    return null
  }
  catch {
    return null
  }
}

async function fetchResult(openid: string) {
  try {
    const res = await getRecruitmentArchivesByOpenid(openid)
    data.value = res.data
    if (!data.value)
      error.value = '未找到您的纳新记录'
  }
  catch (e: any) {
    error.value = e?.message || '查询失败，请稍后重试'
  }
  finally {
    loading.value = false
  }
}

onLoad(async (options) => {
  if (!checkWechatEnvironment()) {
    handleNonWechatEnvironment()
    return
  }

  // #ifdef H5
  if (isWechatBrowser()) {
    if (options?.code) {
      const openid = await getOpenidH5(options.code, options.state)
      if (!openid) {
        error.value = '获取微信用户信息失败，请重试'
        loading.value = false
        return
      }
      await fetchResult(openid)
    }
    else {
      await initWxAuthH5()
    }
    return
  }
  // #endif

  // #ifdef MP-WEIXIN
  const openid = await getOpenidMp()
  if (!openid) {
    error.value = '获取微信用户信息失败，请重试'
    loading.value = false
    return
  }
  await fetchResult(openid)
  // #endif
})


</script>

<template>
  <view class="result-page min-h-screen">
    <!-- 顶部 Header -->
    <view class="header-section relative overflow-hidden from-[#2563eb] to-[#1e40af] bg-gradient-to-br px-6 pb-20 pt-12">
      <view class="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-white/10" />
      <view class="absolute bottom-[-20px] left-[-20px] h-24 w-24 rounded-full bg-white/5" />
      <view class="absolute left-1/2 top-1/2 h-48 w-48 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
    </view>

    <!-- 主要内容区域 -->
    <view class="relative z-10 mt-[-80px] px-4 pb-8">
      <!-- 加载中 -->
      <view v-if="loading" class="result-card rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-sm flex flex-col items-center">
        <wd-loading size="48px" color="#2563eb" />
        <text class="mt-4 text-sm" :class="textMutedClass">查询中，请稍候...</text>
      </view>

      <!-- 主卡片 -->
      <view v-else class="result-card rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm">
        <!-- 状态图标 -->
        <view class="mb-6 flex justify-center">
          <view
            class="h-20 w-20 flex items-center justify-center rounded-full"
            :class="isAdmitted ? 'bg-emerald-50 dark:bg-emerald-500/10' : error ? 'bg-red-50 dark:bg-red-500/10' : 'bg-slate-100 dark:bg-white/10'"
          >
            <wd-icon
              :name="isAdmitted ? 'check' : error ? 'close' : 'info-circle'"
              size="48px"
              :color="isAdmitted ? '#10b981' : error ? '#ef4444' : '#6b7280'"
            />
          </view>
        </view>

        <!-- 标题 -->
        <view class="mb-3 text-center text-xl font-bold" :class="textPrimaryClass">
          {{ isAdmitted ? '恭喜您，已录取！' : error ? '查询失败' : '很遗憾，未能录取' }}
        </view>

        <!-- 描述 -->
        <view class="mb-6 whitespace-pre-line text-center text-sm leading-relaxed" :class="textMutedClass">
          <template v-if="error">{{ error }}</template>
          <template v-else-if="isAdmitted">{{ data!.name }}，欢迎加入我们大家庭！</template>
          <template v-else>感谢您参与本次纳新活动，\n您的热情与努力我们都看在眼里。</template>
        </view>

        <!-- 已录取：学号与密码 -->
        <template v-if="isAdmitted && data?.password">
          <view class="mb-6 rounded-xl bg-violet-50 dark:bg-violet-500/10 p-4">
            <view class="mb-2 flex items-center">
              <wd-icon name="user" size="18px" color="#8b5cf6" />
              <text class="ml-2 text-sm font-medium text-violet-600 dark:text-violet-400">
                账号信息
              </text>
            </view>
            <view class="text-xs leading-relaxed" :class="textSecondaryClass">
              <view class="mb-2">
                <text :class="textMutedClass">学号：</text>
                <text class="font-medium" :class="textPrimaryClass">{{ data!.studentId }}</text>
              </view>
              <view>
                <text :class="textMutedClass">密码：</text>
                <text class="font-medium" :class="textPrimaryClass">{{ data!.password }}</text>
              </view>
            </view>
          </view>
        </template>

        <template v-if="isAdmitted">
          <view class="mb-6 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-4">
            <view class="mb-2 flex items-center">
              <wd-icon name="location" size="18px" color="#10b981" />
              <text class="ml-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                报道信息
              </text>
            </view>
            <view class="text-xs leading-relaxed" :class="textSecondaryClass">
              <view class="mb-2">
                <text :class="textMutedClass">时间：</text>
                <text class="font-medium" :class="textPrimaryClass">{{ data!.time }}</text>
              </view>
              <view>
                <text :class="textMutedClass">地点：</text>
                <text class="font-medium" :class="textPrimaryClass">{{ data!.location }}</text>
              </view>
            </view>
          </view>
        </template>

        <!-- 未录取：寄语 -->
        <template v-if="!isAdmitted && !error && data">
          <view class="mb-6 rounded-xl bg-amber-50 dark:bg-amber-500/10 p-4">
            <view class="mb-2 flex items-center">
              <wd-icon name="star-on" size="18px" color="#f59e0b" />
              <text class="ml-2 text-sm font-medium text-amber-600 dark:text-amber-400">寄语</text>
            </view>
            <view class="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              山高路远，未来可期。希望你继续保持热爱，在各自的舞台上发光发热。期待与你在未来某个时刻再次相遇，共同创造更多精彩！
            </view>
          </view>
        </template>

        <!-- 分隔线 -->
        <view class="mb-6 h-px bg-gray-100 dark:bg-white/10" />

        <!-- 底部提示 -->
        <view class="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-4">
          <view class="mb-2 flex items-center">
            <wd-icon name="info-circle" size="18px" color="#2563eb" />
            <text class="ml-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              温馨提示
            </text>
          </view>
          <view class="text-xs leading-relaxed" v-if="!error" :class="textSecondaryClass">
            <view v-if="isAdmitted">
              <view class="mb-1">
                1. 如有疑问，请联系工作室管理员
              </view>
              <view>
                2. 请按时参加新生见面会。
              </view>
            </view>
            <view v-else>
              如有疑问，请联系工作室管理员
            </view>
          </view>
        </view>
      </view>

      <!-- 底部装饰文字 -->
      <view v-if="!loading" class="mt-8 text-center text-xs" :class="textMutedClass">
        梯航智能车创新工作室
      </view>
    </view>
  </view>
</template>

<style scoped>
.result-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.space-y-4 > view + view {
  margin-top: 16px;
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

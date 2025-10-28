<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page -->
<route lang="jsonc" type="page">{
  "layout": "default",
  "style": {
    // 'custom' 表示开启自定义导航栏，默认 'default'
    "navigationStyle": "default",
    "navigationBarTitleText": "登录中心",
    "enablePullDownRefresh": false,
    "disableScroll": true
  },
  "notLogin": true
}</route>

<script setup lang="ts">
import type { ILoginForm } from '@/api/types/login'
import { reactive, ref, computed, onMounted } from 'vue'
import { getSocialAuthRedirect } from '@/api/login'
import { useUserStore } from '@/store'
import { currRoute } from '@/utils'
import { useAppStore } from '@/store/app'
import ThemeCard from '@/components/ThemeCard.vue'

const userStore = useUserStore()
const redirectUrl = ref('')

// 防止返回和防止绕过登录的逻辑
let isLoggedIn = false // 标记是否已成功登录

// 登录表单数据
const loginForm = reactive<ILoginForm>({
  username: '',
  password: '',
  captchaVerification: '',
})

// 表单验证和UI状态
const isLoading = ref(false)
const wxLoading = ref(false)
let defaultMode: 'normal' | 'wechat' = 'normal'
// #ifdef MP-WEIXIN
defaultMode = 'wechat'
// #endif
const loginMode = ref<'normal' | 'wechat'>(defaultMode) // 登录模式

// 主题适配：浅色/深色
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const headerTitleClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const headerSubClass = computed(() => (isDark.value ? 'text-gray-300' : 'text-gray-600'))

// 顶部返回与主题切换
const canGoBack = ref(false)
onMounted(() => {
  try {
    // 小程序/APP 使用 getCurrentPages 判断是否可返回
    const pages = getCurrentPages?.()
    if (Array.isArray(pages)) {
      canGoBack.value = pages.length > 1
    }
  }
  catch (e) {
    // H5 场景不处理
  }
})

// 登录成功后的统一处理
function afterLoginSuccess(delay = 1500) {
  isLoggedIn = true
  uni.showToast({
    title: '登录成功',
    icon: 'success',
    duration: delay,
  })
  setTimeout(() => {
    redirectToTarget()
  }, delay)
}

// 路由参数解析与设置重定向地址
function setupRedirectFromQuery() {
  const query = currRoute().query
  redirectUrl.value = query.redirect || '/pages/index/index'
}

// 小程序微信环境的页面初始化
function initMpWeixinOnLoad() {
  if (wx.hideHomeButton) {
    wx.hideHomeButton()
  }
  setupRedirectFromQuery()
}

// H5 环境的页面初始化（包含微信浏览器自动登录处理）
async function initH5OnLoad() {
  setupRedirectFromQuery()
  const ua = navigator.userAgent || ''
  if (!/MicroMessenger/i.test(ua)) {
    return
  }

  // 构造通用回调地址，使用 callback 页面处理 type/code/state
  const base = `${location.origin}${location.pathname}${location.search || ''}#`
  const callbackPath = '/pages/login/callback'
  const queryParts = [`type=31`]
  if (redirectUrl.value) {
    queryParts.push(`redirect=${encodeURIComponent(redirectUrl.value)}`)
  }
  const callbackQuery = `?${queryParts.join('&')}`
  const redirectUri = `${base}${callbackPath}${callbackQuery}`
  console.log('redirectUri:', redirectUri)
  const res = await getSocialAuthRedirect({ type: 31, redirectUri })
  if (res.code !== 0) {
    uni.showToast({ icon: 'none', title: res.msg || '授权链接获取失败' })
    return
  }
  location.href = res.data
}

// 页面加载时仅保留条件编译和函数调用
onLoad(() => {
  // #ifdef MP-WEIXIN
  initMpWeixinOnLoad()
  // #endif

  // #ifdef H5
  initH5OnLoad()
  // #endif
})

// 使用 onBackPress 钩子拦截返回操作
onBackPress(() => {
  if (!isLoggedIn) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 2000,
    })
    return true // 阻止返回
  }
  return false // 允许返回
})

// 页面显示时检查登录状态
onShow(() => {
  // 如果已经登录，但不是通过正常流程登录的，直接跳转
  if (userStore.userInfo.accessToken && !isLoggedIn) {
    redirectToTarget()
  }
})

// 统一的跳转函数
function redirectToTarget() {
  // Tab页面配置映射
  const tabPages = {
    '/pages/index/index': 0,
    '/pages/workspace/index': 1,
    '/pages/contact/index': 2,
    '/pages/profile/index': 3,
  }

  // 检查是否为Tab页面
  const tabIndex = Object.keys(tabPages).find(path => redirectUrl.value.includes(path))

  if (tabIndex) {
    // Tab页面跳转
    uni.setStorageSync('app-tabbar-index', tabPages[tabIndex])
    uni.switchTab({
      url: tabIndex,
      success: () => {
      },
      fail: () => {
        // 失败时尝试普通跳转作为降级方案
        fallbackNavigation()
      },
    })
  }
  else {
    // 普通页面跳转
    uni.redirectTo({
      url: redirectUrl.value,
      success: () => {
      },
      fail: () => {
        fallbackNavigation()
      },
    })
  }
}

// 降级跳转方案
function fallbackNavigation() {
  uni.navigateTo({
    url: redirectUrl.value,
    fail: () => {
      uni.switchTab({
        url: '/pages/index/index',
      })
    },
  })
}

// 表单验证
function validateForm() {
  if (!loginForm.username.trim()) {
    uni.showToast({
      title: '请输入账号',
      icon: 'none',
    })
    return false
  }

  if (!/^[A-Z0-9]+$/i.test(loginForm.username)) {
    uni.showToast({
      title: '用户名只能包含字母和数字',
      icon: 'none',
    })
    return false
  }

  if (!loginForm.password.trim()) {
    uni.showToast({
      title: '请输入密码',
      icon: 'none',
    })
    return false
  }

  if (loginForm.password.length < 6) {
    uni.showToast({
      title: '密码长度不足',
      icon: 'none',
    })
    return false
  }

  return true
}

// 登录函数
async function handleLogin() {
  if (!validateForm()) {
    return
  }

  if (isLoading.value) {
    return
  }

  isLoading.value = true

  try {
    // 调用登录接口
    const result = await userStore.login(loginForm)

    if (result) {
      afterLoginSuccess()
    }
  }
  catch (error: any) {
    console.error('❌ 登录失败:', error)

    let errorMessage = '登录失败'
    if (error.message) {
      errorMessage = error.message
    }
    else if (typeof error === 'string') {
      errorMessage = error
    }

    uni.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    isLoading.value = false
  }
}

// 一键登录（获取用户信息 + 手机号 + 登录）
async function handleOneClickLogin() {
  if (wxLoading.value) {
    return
  }

  wxLoading.value = true

  try {
    // 2. 执行微信登录
    const result = await userStore.socialLogin()
    if (result) {
      afterLoginSuccess()
    }
  }
  catch (error: any) {
    let errorMessage = '登录失败'
    if (error.message) {
      errorMessage = error.message
    }
    else if (typeof error === 'string') {
      errorMessage = error
    }
    uni.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    wxLoading.value = false
  }
}

// 跳转到找回密码页（保留登录后的重定向目标）
function goForgot() {
  try {
    const url = `/pages/login/forgot?redirect=${encodeURIComponent(redirectUrl.value || '/pages/index/index')}`
    uni.navigateTo({ url })
  }
  catch (err) {
    uni.showToast({ icon: 'none', title: '无法进入找回密码页' })
  }
}
</script>

<template>
  <view class="min-h-screen flex items-center justify-center p-4 mt--10">
    <ThemeCard 
      :padding="false" 
      radius="rounded-3xl" 
      :shadow="true"
      card-class="w-full max-w-md mx-auto overflow-hidden"
    >
      <view class="p-8">
        <!-- 头部 -->
        <view class="text-center mb-8">
          <view :class="['text-3xl font-bold mb-2', headerTitleClass]">
            欢迎登录
          </view>
          <view :class="['text-sm', headerSubClass]">
            梯航小助手
          </view>
        </view>

        <!-- 登录模式切换（小程序端） -->
        <!-- #ifdef MP-WEIXIN -->
        <view v-if="!userStore.userInfo.username" class="mb-6">
          <view class="flex items-center justify-center gap-3">
            <view 
              :class="[
                'flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all',
                loginMode === 'wechat' 
                  ? (isDark ? 'bg-white/16 text-gray-100 shadow-lg' : 'bg-white text-gray-900 shadow-md')
                  : (isDark ? 'bg-white/8 text-gray-400' : 'bg-gray-100 text-gray-600')
              ]"
              @click="loginMode = 'wechat'"
            >
              <text>🔸</text>
              <text>微信登录</text>
            </view>
            <view 
              :class="[
                'flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all',
                loginMode === 'normal' 
                  ? (isDark ? 'bg-white/16 text-gray-100 shadow-lg' : 'bg-white text-gray-900 shadow-md')
                  : (isDark ? 'bg-white/8 text-gray-400' : 'bg-gray-100 text-gray-600')
              ]"
              @click="loginMode = 'normal'"
            >
              <text>🔐</text>
              <text>账号登录</text>
            </view>
          </view>
        </view>
        <!-- #endif -->

        <!-- 登录内容容器 -->
        <view class="relative overflow-hidden" style="height: 500rpx;">
          <!-- 账号登录表单 -->
          <view 
            class="absolute top-0 left-0 w-full transition-all duration-300 ease-in-out"
            :style="{
              transform: loginMode === 'normal' ? 'translateX(0)' : 'translateX(100%)',
              opacity: loginMode === 'normal' ? 1 : 0,
            }"
          >
            <!-- 用户名输入框 -->
            <view class="mb-6">
              <wd-input 
                v-model="loginForm.username" 
                label="账号" 
                label-width="40px" 
                placeholder="请输入账号" 
                required
                :maxlength="20" 
                :disabled="isLoading" 
                clearable 
              />
            </view>

            <!-- 密码输入框 -->
            <view class="mb-6">
              <wd-input 
                v-model="loginForm.password" 
                label="密码" 
                label-width="40px" 
                placeholder="请输入密码" 
                required
                :maxlength="50" 
                :disabled="isLoading" 
                type="text" 
                :show-password="true" 
                clearable 
              />
            </view>

            <!-- 登录按钮 -->
            <view class="mb-4">
              <wd-button 
                type="primary" 
                size="large" 
                block 
                :loading="isLoading" 
                :disabled="isLoading"
                custom-style="height: 48px; border-radius: 12px; font-size: 16px; font-weight: 600;" 
                @click="handleLogin"
              >
                {{ isLoading ? '登录中...' : '立即登录' }}
              </wd-button>
            </view>

            <!-- 找回密码按钮 -->
            <view class="mb-4">
              <wd-button 
                type="primary" 
                size="large" 
                block 
                plain
                custom-style="height: 48px; border-radius: 12px; font-size: 16px; font-weight: 600;" 
                @click="goForgot"
              >
                找回密码
              </wd-button>
            </view>
          </view>

          <!-- 微信登录 -->
          <!-- #ifdef MP-WEIXIN -->
          <view 
            class="absolute top-0 left-0 w-full text-center transition-all duration-300 ease-in-out"
            :style="{
              transform: loginMode === 'wechat' ? 'translateX(0)' : 'translateX(-100%)',
              opacity: loginMode === 'wechat' ? 1 : 0,
            }"
          >
            <view class="text-6xl mb-4">
              🔸
            </view>
            <view :class="['text-base mb-8', headerSubClass]">
              使用微信账号快速登录
            </view>

            <!-- 一键登录按钮 -->
            <view class="mb-4">
              <wd-button 
                type="success" 
                size="large" 
                block 
                :loading="wxLoading" 
                :disabled="wxLoading"
                custom-style="height: 48px; border-radius: 12px; font-size: 16px; font-weight: 600;" 
                @click="handleOneClickLogin"
              >
                {{ wxLoading ? '登录中...' : '微信一键登录' }}
              </wd-button>
            </view>
          </view>
          <!-- #endif -->
        </view>
      </view>
    </ThemeCard>
  </view>
</template>

<style lang='scss' scoped>
// 微信小程序特定优化
/* #ifdef MP-WEIXIN */
:deep(.theme-card) {
  max-height: 85vh;
}
/* #endif */
</style>

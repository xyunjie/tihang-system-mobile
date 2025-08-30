<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page -->
<route lang="jsonc" type="page">
{
    "layout": "default",
    "style": {
      // 'custom' 表示开启自定义导航栏，默认 'default'
      "navigationStyle": "default",
      "navigationBarTitleText": "登录中心",
      "enablePullDownRefresh": false,
      "disableScroll": true
    },
    "notLogin": true
}
</route>

<script setup lang="ts">
import type { ILoginForm } from '@/api/types/login'
import { reactive, ref } from 'vue'
import { useUserStore } from '@/store'
import { currRoute } from '@/utils'

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
const showPassword = ref(false)
const wxLoading = ref(false) // 微信登录加载状态
const loginMode = ref<'normal' | 'wechat'>('wechat') // 登录模式

// 在页面加载时设置防返回拦截
onLoad(() => {
  // #ifdef MP-WEIXIN
  if (wx.hideHomeButton) {
    wx.hideHomeButton()
  }
  // #endif
  console.log('🔒 登录页加载，设置防返回拦截')
  const query = currRoute().query
  redirectUrl.value = query.redirect || '/pages/index/index'
})

// 使用 onBackPress 钩子拦截返回操作
onBackPress(() => {
  if (!isLoggedIn) {
    console.log('🚫 拦截返回操作，未登录不允许返回')
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
  console.log('👁️ 登录页显示，检查登录状态')

  // 如果已经登录，但不是通过正常流程登录的，直接跳转
  if (userStore.userInfo.accessToken && !isLoggedIn) {
    console.log('🔄 检测到用户已登录，跳转到目标页面')
    redirectToTarget()
  }
})

// 统一的跳转函数
function redirectToTarget() {
  if (redirectUrl.value.includes('/pages/index/index')) {
    // 如果要跳转到首页，使用 switchTab
    uni.switchTab({
      url: '/pages/index/index',
      success: () => {
        console.log('✅ 跳转首页成功')
      },
      fail: (err) => {
        console.error('❌ 跳转首页失败:', err)
      },
    })
  }
  else {
    // 其他页面使用 redirectTo
    uni.redirectTo({
      url: redirectUrl.value,
      success: () => {
        console.log('✅ 跳转成功')
      },
      fail: (err) => {
        console.error('❌ 跳转失败:', err)
      },
    })
  }
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
    console.log('📝 开始登录...', loginForm)

    // 调用登录接口
    const result = await userStore.login(loginForm)

    if (result) {
      // 标记为已登录，允许返回和跳转
      isLoggedIn = true

      console.log('✅ 登录成功，准备跳转到:', redirectUrl)

      // 显示成功提示
      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
      })

      // 延迟一下跳转，让用户看到成功提示
      setTimeout(() => {
        redirectToTarget()
      }, 1500)
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

// 切换密码显示状态
function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

// 微信登录
async function handleWxLogin() {
  if (wxLoading.value) {
    return
  }

  wxLoading.value = true

  try {
    console.log('🔸 开始微信登录...')

    // 调用微信登录
    const result = await userStore.socialLogin()

    if (result) {
      // 标记为已登录
      isLoggedIn = true

      console.log('✅ 微信登录成功，准备跳转到:', redirectUrl)

      // 显示成功提示
      uni.showToast({
        title: '微信登录成功',
        icon: 'success',
        duration: 1500,
      })

      // 延迟跳转
      setTimeout(() => {
        redirectToTarget()
      }, 1500)
    }
    else {
      // result 为 null 表示需要绑定账号，已经跳转到绑定页面
      console.log('🔗 需要绑定账号，已跳转到绑定页面')
    }
  }
  catch (error: any) {
    console.error('❌ 微信登录失败:', error)

    let errorMessage = '微信登录失败'
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

// 一键登录（获取用户信息 + 手机号 + 登录）
async function handleOneClickLogin() {
  if (wxLoading.value) {
    return
  }

  wxLoading.value = true

  try {
    console.log('🚀 开始一键登录流程...')

    // 2. 执行微信登录
    const result = await userStore.socialLogin()

    if (result) {
      // 标记为已登录
      isLoggedIn = true

      console.log('✅ 一键登录成功，准备跳转到:', redirectUrl)

      // 显示成功提示
      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
      })

      // 延迟跳转
      setTimeout(() => {
        redirectToTarget()
      }, 1500)
    }
    else {
      // result 为 null 表示需要绑定账号，已经跳转到绑定页面
      console.log('🔗 需要绑定账号，已跳转到绑定页面')
    }
  }
  catch (error: any) {
    console.error('❌ 一键登录失败:', error)

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

// 切换登录模式（优化版，防止频闪）
function switchLoginMode(mode: 'normal' | 'wechat') {
  if (loginMode.value === mode) {
    return // 避免重复切换
  }

  loginMode.value = mode

  // 清空表单数据，但不影响DOM渲染
  if (mode === 'wechat') {
    loginForm.username = ''
    loginForm.password = ''
    showPassword.value = false
  }
}

// 跳转到纳新登记页面
function goToRecruitment() {
  uni.navigateTo({
    url: '/pages-sub/recruitment/index',
    success: () => {
      console.log('✅ 跳转到纳新登记页面成功')
    },
    fail: (err) => {
      console.error('❌ 跳转到纳新登记页面失败:', err)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none',
      })
    },
  })
}
</script>

<template>
  <view class="fixed left-0 top-0 h-full w-full flex items-center justify-center" style="background: linear-gradient(135deg, #4A90E2 0%, #2E5BBA 50%, #1E3A8A 100%); touch-action: none; overflow: hidden;">
    <view class="login-card w-full bg-white" style="border-radius: 20rpx; padding: 50rpx 40rpx; box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1); max-width: 600rpx; max-height: calc(100vh - 80rpx); overflow-y: auto; -webkit-overflow-scrolling: touch; box-sizing: border-box;">
      <!-- 头部 -->
      <view class="text-center" style="margin-bottom: 50rpx;">
        <view class="text-gray-800 font-bold" style="font-size: 46rpx; margin-bottom: 10rpx; line-height: 1.2;">
          🔑 欢迎登录
        </view>
        <view class="text-gray-600" style="font-size: 24rpx; line-height: 1.3;">
          梯航小助手
        </view>
      </view>

      <!-- 登录模式切换 -->
      <view v-if="!userStore.userInfo.username" style="margin-bottom: 30rpx;">
        <wd-tabs
          v-model="loginMode"
          :line-width="60"
          :line-height="3"
          line-color="#4A90E2"
          inactive-color="#666"
          active-color="#4A90E2"
          custom-style="background: #f5f5f5; border-radius: 12rpx; padding: 4rpx;"
        >
          <wd-tab name="wechat" title="🔸 微信登录" />
          <wd-tab name="normal" title="🔐 账号登录" />
        </wd-tabs>
      </view>

      <!-- 统一登录内容容器（使用绝对定位避免频闪） -->
      <view class="login-content" style="position: relative; height: 450rpx; margin-bottom: 40rpx; overflow: hidden;">
        <!-- 账号登录表单 -->
        <view
          class="login-form"
          style="position: absolute; top: 0; left: 0; width: 100%; transition: transform 0.3s ease, opacity 0.3s ease;"
          :style="{
            transform: loginMode === 'normal' ? 'translateX(0)' : 'translateX(100%)',
            opacity: loginMode === 'normal' ? 1 : 0,
          }"
        >
          <!-- 用户名输入框 -->
          <view style="margin-bottom: 30rpx;">
            <wd-input
              v-model="loginForm.username"
              label="账号"
              placeholder="请输入账号"
              required
              :maxlength="20"
              :disabled="isLoading"
              clearable
              custom-style="margin-bottom: 0;"
              custom-label-style="font-size: 28rpx; color: #374151; font-weight: 500;"
              custom-input-style="font-size: 28rpx; height: 88rpx;"
            />
          </view>

          <!-- 密码输入框 -->
          <view style="margin-bottom: 30rpx;">
            <wd-input
              v-model="loginForm.password"
              label="密码"
              placeholder="请输入密码"
              required
              :maxlength="50"
              :disabled="isLoading"
              type="text"
              :show-password="true"
              clearable
              custom-style="margin-bottom: 0;"
              custom-label-style="font-size: 28rpx; color: #374151; font-weight: 500;"
              custom-input-style="font-size: 28rpx; height: 88rpx;"
            />
          </view>

          <!-- 登录按钮 -->
          <view style="margin-bottom: 35rpx;">
            <wd-button
              type="primary"
              size="large"
              block
              :loading="isLoading"
              :disabled="isLoading"
              custom-style="height: 88rpx; border-radius: 12rpx; font-size: 32rpx;"
              @click="handleLogin"
            >
              {{ isLoading ? '登录中...' : '🚀 立即登录' }}
            </wd-button>
          </view>
        </view>

        <!-- 微信登录 -->
        <view
          class="wechat-login text-center"
          style="position: absolute; top: 0; left: 0; width: 100%; transition: transform 0.3s ease, opacity 0.3s ease;"
          :style="{
            transform: loginMode === 'wechat' ? 'translateX(0)' : 'translateX(-100%)',
            opacity: loginMode === 'wechat' ? 1 : 0,
          }"
        >
          <view style="font-size: 80rpx; margin-bottom: 16rpx;">
            🔸
          </view>
          <view class="text-gray-600" style="font-size: 32rpx; margin-bottom: 32rpx;">
            使用微信账号快速登录
          </view>

          <!-- 一键登录按钮（推荐） -->
          <view style="margin-bottom: 20rpx;">
            <wd-button
              type="success"
              size="large"
              block
              :loading="wxLoading"
              :disabled="wxLoading"
              custom-style="height: 88rpx; border-radius: 12rpx; font-size: 32rpx;"
              @click="handleOneClickLogin"
            >
              {{ wxLoading ? '登录中...' : '🚀 微信一键登录' }}
            </wd-button>
          </view>
        </view>
      </view>

      <!-- 纳新登记入口 -->
      <view class="recruitment-entry" style="margin-top: 30rpx; padding-top: 30rpx; border-top: 1rpx solid #e5e5e5; text-align: center;">
        <view class="text-gray-600" style="font-size: 24rpx; margin-bottom: 20rpx;">
          ✨ 纳新登记无需登录
        </view>
        <wd-button
          type="warning"
          size="medium"
          plain
          custom-style="height: 80rpx; border-radius: 12rpx; font-size: 28rpx; width: 60%;"
          @click="goToRecruitment"
        >
          🎓 去纳新登记
        </wd-button>
      </view>
    </view>
  </view>
</template>

<style lang='scss' scoped>
// 只保留UnoCSS无法处理的特殊样式
.login-card {
  // 修复滚动条样式
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
}

// 微信小程序特定优化
/* #ifdef MP-WEIXIN */
.login-card {
  // 小程序中的高度调整
  max-height: 85vh;
}
/* #endif */
</style>

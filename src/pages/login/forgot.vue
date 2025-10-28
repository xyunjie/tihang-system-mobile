<route lang="json">
{
  "layout": "default",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "找回密码",
    "enablePullDownRefresh": false,
    "disableScroll": true
  },
  "notLogin": true
}
</route>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { resetPasswordByEmail, sendEmailCode } from '@/api/login'
import { toast } from '@/utils/toast'
import { currRoute } from '@/utils'
import { useAppStore } from '@/store/app'
import ThemeCard from '@/components/ThemeCard.vue'

const form = reactive({
  username: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
})

const formRef = ref()
const sending = ref(false)
const countdown = ref(0)
let timer: any = null
// 登录后需要跳转的目标地址（从当前路由的 redirect 透传）
const redirectUrl = ref('/pages/index/index')

// 主题适配：浅色/深色
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const headerTitleClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const headerSubClass = computed(() => (isDark.value ? 'text-gray-300' : 'text-gray-600'))

onLoad(() => {
  try {
    const query = currRoute().query as any
    redirectUrl.value = query?.redirect || '/pages/index/index'
  }
  catch (_) {
    redirectUrl.value = '/pages/index/index'
  }
})

function startCountdown(seconds = 60) {
  countdown.value = seconds
  clearInterval(timer)
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

function handleSendCode() {
  if (!form.username || !form.email) {
    toast.info('请先填写用户名和邮箱')
    return
  }
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailReg.test(form.email)) {
    toast.info('邮箱格式不正确')
    return
  }
  sending.value = true
  sendEmailCode({ username: form.username, email: form.email })
    .then((res: any) => {
      if (res?.code === 0 && res?.data) {
        toast.success('验证码已发送')
        startCountdown(60)
      }
      else {
        toast.info(res?.msg || '发送失败')
      }
    })
    .catch(() => {
      toast.info('发送失败')
    })
    .finally(() => {
      sending.value = false
    })
}

function handleSubmit() {
  if (!form.username || !form.email || !form.code || !form.password || !form.confirmPassword) {
    toast.info('请完整填写表单')
    return
  }
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailReg.test(form.email)) {
    toast.info('邮箱格式不正确')
    return
  }
  if (form.password !== form.confirmPassword) {
    toast.info('两次输入的密码不一致')
    return
  }
  if (form.password.length < 6) {
    toast.info('密码至少6位')
    return
  }
  resetPasswordByEmail({
    username: form.username,
    email: form.email,
    code: form.code,
    password: form.password,
  })
    .then((res: any) => {
      if (res?.code === 0 && res?.data) {
        toast.success('密码已重置，请使用新密码登录')
        setTimeout(() => {
          const pages = getCurrentPages()
          if (pages && pages.length > 1) {
            // 有上一页，返回上一页（保留登录页原有 redirect 参数）
            uni.navigateBack()
          }
          else {
            // 无上一页，跳转到登录并带上 redirect，保留登录后的跳转内容
            const url = `/pages/login/index?redirect=${encodeURIComponent(redirectUrl.value)}`
            uni.redirectTo({ url })
          }
        }, 600)
      }
      else {
        toast.info(res?.msg || '重置失败，请检查验证码')
      }
    })
    .catch((err: any) => {
      toast.error(err?.message || '重置失败，请稍后再试')
    })
}
</script>

<template>
  <view class="min-h-screen flex items-center justify-center p-4">
    <ThemeCard
      :padding="false"
      radius="rounded-3xl"
      :shadow="true"
      card-class="w-full max-w-md mx-auto overflow-hidden"
      style="max-height: calc(100vh - 80rpx);"
    >
      <view class="p-8">
        <!-- 头部 -->
        <view class="text-center mb-8">
          <view :class="['text-3xl font-bold mb-2', headerTitleClass]">
            找回密码
          </view>
          <view :class="['text-sm', headerSubClass]">
            梯航小助手
          </view>
        </view>

        <!-- 表单内容 -->
        <view class="login-content">
          <!-- 账号 -->
          <view>
            <wd-input
              v-model="form.username"
              label="账号"
              label-width="40px"
              placeholder="请输入账号"
              required
              :maxlength="30"
              clearable
            />
          </view>

          <!-- 邮箱 -->
          <view>
            <wd-input
              v-model="form.email"
              label="邮箱"
              label-width="40px"
              placeholder="请输入邮箱"
              required
              :maxlength="50"
              clearable
            />
          </view>

          <!-- 验证码 + 发送按钮 -->
          <view class="flex items-center gap-3">
            <wd-input
              v-model="form.code"
              label="验证码"
              label-width="55px"
              placeholder="请输入验证码"
              required
              :maxlength="10"
              clearable
              custom-style="flex:1"
            />
            <wd-button type="primary" size="small" :disabled="sending || countdown > 0" @click="handleSendCode">
              {{ countdown > 0 ? `${countdown}s后重试` : '发送验证码' }}
            </wd-button>
          </view>

          <!-- 新密码 -->
          <view>
            <wd-input
              v-model="form.password"
              label="密码"
              label-width="40px"  
              type="text"
              :show-password="true"
              placeholder="请输入新密码"
              required
              :maxlength="50"
              clearable
            />
          </view>

          <!-- 确认密码 -->
          <view>
            <wd-input
              v-model="form.confirmPassword"
              label="确认"
              label-width="40px"  
              type="text"
              :show-password="true"
              placeholder="请再次输入密码"
              required
              :maxlength="50"
              clearable
            />
          </view>

          <!-- 提交按钮 -->
          <view class="actions mt-4">
            <wd-button
              type="primary"
              size="large"
              block
              custom-style="height: 48px; border-radius: 12px; font-size: 16px; font-weight: 600;"
              @click="handleSubmit"
            >
              提交重置
            </wd-button>
          </view>
        </view>
      </view>
    </ThemeCard>
  </view>
</template>


<style lang='scss' scoped>
/* #ifdef MP-WEIXIN */
:deep(.rounded-3xl) {
  max-height: 85vh;
}
/* #endif */
</style>
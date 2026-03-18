<route lang="jsonc" type="page">
{
  "layout": "default",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "首次登录修改密码",
    "enablePullDownRefresh": false,
    "disableScroll": true
  }
}
</route>

<script setup lang="ts">
import type { IUserProfileUpdatePasswordReqVO } from '@/api/types/user'
import { computed, reactive, ref } from 'vue'
import { updateUserPassword } from '@/api/user'
import ThemeCard from '@/components/ThemeCard.vue'
import { useUserStore } from '@/store'
import { useAppStore } from '@/store/app'

const userStore = useUserStore()
const appStore = useAppStore()
const loginRoute = '/pages/login/index'
const homeRoute = '/pages/index/index'
const skipWxAutoAuthOnceKey = 'skipWxAutoAuthOnce'

const isDark = computed(() => appStore.theme === 'dark')
const headerTitleClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const headerSubClass = computed(() => (isDark.value ? 'text-gray-300' : 'text-gray-600'))

const form = reactive<IUserProfileUpdatePasswordReqVO>({
  oldPassword: '',
  newPassword: '',
})
const confirmPassword = ref('')
const isSubmitting = ref(false)

function getFirstLoginState() {
  const accessToken = userStore.userInfo.accessToken || uni.getStorageSync('accessToken')
  const storedFirstLogin = uni.getStorageSync('firstLogin')
  const firstLogin = userStore.userInfo.firstLogin === true || storedFirstLogin === true || storedFirstLogin === 'true'
  return { accessToken, firstLogin }
}

function guardPageAccess() {
  const { accessToken, firstLogin } = getFirstLoginState()

  if (!accessToken) {
    uni.reLaunch({
      url: loginRoute,
    })
    return false
  }

  if (!firstLogin) {
    uni.reLaunch({
      url: homeRoute,
    })
    return false
  }

  return true
}

onLoad(() => {
  guardPageAccess()
})

onShow(() => {
  guardPageAccess()
})

function validateForm() {
  if (!form.oldPassword) {
    uni.showToast({ title: '请输入原密码', icon: 'none' })
    return false
  }

  if (!form.newPassword) {
    uni.showToast({ title: '请输入新密码', icon: 'none' })
    return false
  }

  if (form.newPassword.length < 6) {
    uni.showToast({ title: '新密码长度不能少于6位', icon: 'none' })
    return false
  }

  if (form.oldPassword === form.newPassword) {
    uni.showToast({ title: '新密码不能与原密码相同', icon: 'none' })
    return false
  }

  if (form.newPassword !== confirmPassword.value) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validateForm() || isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  try {
    const res = await updateUserPassword(form)
    if (res.code !== 0) {
      uni.showToast({
        title: res.msg || '密码修改失败',
        icon: 'none',
      })
      return
    }

    userStore.setFirstLogin(false)
    uni.showToast({
      title: '修改成功',
      icon: 'success',
      duration: 2000,
    })

    form.oldPassword = ''
    form.newPassword = ''
    confirmPassword.value = ''

    setTimeout(() => {
      uni.setStorageSync(skipWxAutoAuthOnceKey, true)
      userStore.clearUserInfo()
      uni.reLaunch({
        url: loginRoute,
      })
    }, 2000)
  }
  catch (error: any) {
    uni.showToast({
      title: error?.message || '密码修改失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <view class="min-h-screen flex items-center justify-center p-4">
    <ThemeCard
      :padding="false"
      radius="rounded-3xl"
      :shadow="true"
      card-class="w-full max-w-md mx-auto overflow-hidden"
    >
      <view class="p-8">
        <view class="mb-8 text-center">
          <view class="mb-2 text-3xl font-bold" :class="[headerTitleClass]">
            修改密码
          </view>
          <view class="text-sm" :class="[headerSubClass]">
            请先修改密码后再重新登录系统
          </view>
        </view>

        <view class="space-y-4">
          <wd-input
            v-model="form.oldPassword"
            label="原密码"
            label-width="80px"
            type="text"
            :show-password="true"
            placeholder="请输入原密码"
            required
            :maxlength="50"
            :disabled="isSubmitting"
            clearable
          />

          <wd-input
            v-model="form.newPassword"
            label="新密码"
            label-width="80px"
            type="text"
            :show-password="true"
            placeholder="请输入新密码"
            required
            :maxlength="50"
            :disabled="isSubmitting"
            clearable
          />

          <wd-input
            v-model="confirmPassword"
            label="确认密码"
            label-width="80px"
            type="text"
            :show-password="true"
            placeholder="请再次输入新密码"
            required
            :maxlength="50"
            :disabled="isSubmitting"
            clearable
          />

          <wd-button
            type="primary"
            size="large"
            block
            :loading="isSubmitting"
            custom-style="height: 48px; border-radius: 12px; font-size: 16px; font-weight: 600;"
            @click="handleSubmit"
          >
            确认修改
          </wd-button>
        </view>
      </view>
    </ThemeCard>
  </view>
</template>

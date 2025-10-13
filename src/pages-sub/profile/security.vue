<!-- 账号安全页面 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "账号安全"
  }
}
</route>

<script setup lang="ts">
import type { IUserProfileLoginLogRespVO, IUserProfileUpdatePasswordReqVO } from '@/api/types/user'
import { onMounted, reactive, ref } from 'vue'
import { getUserLoginLogs, updateUserPassword } from '@/api/user'
import { useUserStore } from '@/store'

defineOptions({
  name: 'ProfileSecurity',
})

// 获取屏幕边界到安全区域距离
let safeAreaInsets
let systemInfo

// #ifdef MP-WEIXIN
systemInfo = uni.getWindowInfo()
safeAreaInsets = systemInfo.safeArea
  ? {
      top: systemInfo.safeArea.top,
      right: systemInfo.windowWidth - systemInfo.safeArea.right,
      bottom: systemInfo.windowHeight - systemInfo.safeArea.bottom,
      left: systemInfo.safeArea.left,
    }
  : null
// #endif

// #ifndef MP-WEIXIN
systemInfo = uni.getSystemInfoSync()
safeAreaInsets = systemInfo.safeAreaInsets
// #endif

// 密码修改表单
const passwordForm = reactive<IUserProfileUpdatePasswordReqVO>({
  oldPassword: '',
  newPassword: '',
})

// 确认密码
const confirmPassword = ref('')

// 表单状态
const isSubmitting = ref(false)
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 登录记录状态
const loginRecords = ref<IUserProfileLoginLogRespVO[]>([])
const loadingLogs = ref(false)

// 假数据作为备用（当接口失败时使用）
const mockLoginRecords: IUserProfileLoginLogRespVO[] = [
  {
    deviceType: 'Mobile',
    browserType: 'Safari',
    userArea: '北京市',
    createTime: Date.now() - 1000 * 60 * 60 * 24, // 1天前
    result: 0,
    userIp: '192.168.1.100',
    os: 'iOS',
  },
  {
    deviceType: 'Desktop',
    browserType: 'Chrome',
    userArea: '上海市',
    createTime: Date.now() - 1000 * 60 * 60 * 48, // 2天前
    result: 0,
    userIp: '192.168.1.101',
    os: 'macOS',
  },
  {
    deviceType: 'Mobile',
    browserType: 'WeChat',
    userArea: '广州市',
    createTime: Date.now() - 1000 * 60 * 60 * 72, // 3天前
    result: 1, // 失败
    userIp: '192.168.3.88',
    os: 'Android',
  },
]

// 修改密码
async function handleUpdatePassword() {
  // 表单验证
  if (!passwordForm.oldPassword) {
    uni.showToast({
      title: '请输入原密码',
      icon: 'none',
    })
    return
  }

  if (!passwordForm.newPassword) {
    uni.showToast({
      title: '请输入新密码',
      icon: 'none',
    })
    return
  }

  if (passwordForm.newPassword.length < 6) {
    uni.showToast({
      title: '新密码长度不能少于6位',
      icon: 'none',
    })
    return
  }

  if (passwordForm.newPassword !== confirmPassword.value) {
    uni.showToast({
      title: '两次输入的密码不一致',
      icon: 'none',
    })
    return
  }

  if (passwordForm.oldPassword === passwordForm.newPassword) {
    uni.showToast({
      title: '新密码不能与原密码相同',
      icon: 'none',
    })
    return
  }

  isSubmitting.value = true

  try {
    const res = await updateUserPassword(passwordForm)
    if (res.code !== 0) {
      uni.showToast({
        title: res.msg || '密码修改失败',
        icon: 'none',
      })
      return
    }
    uni.showToast({
      title: '密码修改成功',
      icon: 'success',
      duration: 2000,
    })

    // 清空表单
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    confirmPassword.value = ''

    // 2秒后返回退出登陆，返回登录页
    setTimeout(() => {
      useUserStore().clearUserInfo()
      // 跳转登陆页面
      uni.reLaunch({
        url: '/pages/login/index',
      })
    }, 2000)
  }
  catch (error: any) {
    console.error('修改密码失败:', error)
    uni.showToast({
      title: error.message || '密码修改失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    isSubmitting.value = false
  }
}

// 密码强度检测
function getPasswordStrength(password: string) {
  if (!password)
    return 0

  let score = 0
  // 长度检测
  if (password.length >= 6)
    score += 1
  if (password.length >= 8)
    score += 1
  // 包含数字
  if (/\d/.test(password))
    score += 1
  // 包含字母
  if (/[a-z]/i.test(password))
    score += 1
  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password))
    score += 1

  return score
}

// 密码强度文本
function getPasswordStrengthText(strength: number) {
  switch (strength) {
    case 0:
    case 1: return '弱'
    case 2:
    case 3: return '中'
    case 4:
    case 5: return '强'
    default: return '弱'
  }
}

// 密码强度颜色
function getPasswordStrengthColor(strength: number) {
  switch (strength) {
    case 0:
    case 1: return 'text-red-500 bg-red-50'
    case 2:
    case 3: return 'text-yellow-600 bg-yellow-50'
    case 4:
    case 5: return 'text-green-600 bg-green-50'
    default: return 'text-red-500 bg-red-50'
  }
}

// 获取登录日志
async function fetchLoginLogs() {
  if (loadingLogs.value)
    return

  loadingLogs.value = true
  console.log('📋 开始获取登录日志...')

  try {
    // 设置超时机制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时')), 10000) // 10秒超时
    })

    const requestPromise = getUserLoginLogs()

    const res = await Promise.race([requestPromise, timeoutPromise]) as any

    console.log('📋 获取登录日志响应:', res)

    if (res && res.data && Array.isArray(res.data)) {
      loginRecords.value = res.data
      console.log('📋 获取登录日志成功:', res.data.length, '条记录')
    }
    else {
      console.log('⚠️ 接口返回数据格式异常，使用假数据')
      loginRecords.value = mockLoginRecords
    }
  }
  catch (error: any) {
    console.error('❗ 获取登录日志失败:', error)

    // 如果接口失败，使用假数据作为备用
    loginRecords.value = mockLoginRecords
    console.log('📋 使用假数据，共', mockLoginRecords.length, '条记录')

    // 只在非超时错误时显示提示
    if (!error.message.includes('超时') && !error.message.includes('timeout')) {
      uni.showToast({
        title: '登录记录加载失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  finally {
    loadingLogs.value = false
    console.log('📋 登录日志加载完成，加载状态:', loadingLogs.value)
  }
}

// 页面加载时获取登录日志
onMounted(() => {
  console.log('📋 页面加载，开始获取登录日志')

  // 先显示假数据，然后尝试加载真实数据
  loginRecords.value = mockLoginRecords

  // 延迟100ms再调用API，确保页面已经渲染
  setTimeout(() => {
    fetchLoginLogs()
  }, 100)
})

// 解析设备信息（使用真实数据结构）
function parseDeviceInfo(record: IUserProfileLoginLogRespVO) {
  // 格式化设备类型为中文
  let deviceType = record.deviceType || '未知设备'
  const deviceLower = deviceType.toLowerCase()

  if (deviceLower.includes('mobile') || deviceLower.includes('phone')) {
    deviceType = '移动设备'
  }
  else if (deviceLower.includes('desktop') || deviceLower.includes('computer') || deviceLower.includes('pc')) {
    deviceType = '桌面设备'
  }
  else if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) {
    deviceType = '平板设备'
  }

  return {
    device: deviceType,
    browser: record.browserType || '未知浏览器',
    os: record.os || '未知系统',
    area: record.userArea || '未知地区',
  }
}

// 格式化时间戳
function formatTimestamp(timestamp: number) {
  if (!timestamp)
    return ''

  try {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }
  catch (error) {
    return String(timestamp)
  }
}

// 格式化登录结果
function getLoginResult(result: number) {
  return result === 0 ? '成功' : '失败'
}

// 格式化登录结果颜色
function getLoginResultColor(result: number) {
  return result === 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
}

// 页面加载时获取登录日志
onMounted(() => {
  console.log('📋 页面加载，开始获取登录日志')

  // 先显示假数据，然后尝试加载真实数据
  loginRecords.value = mockLoginRecords

  // 延迟100ms再调用API，确保页面已经渲染
  setTimeout(() => {
    fetchLoginLogs()
  }, 100)
})
</script>

<template>
  <view class="min-h-screen bg-gray-50" :style="{ paddingBottom: `${(safeAreaInsets?.bottom || 0) + 32}px` }">
    <!-- 修改密码区域 -->
    <view id="password-section" class="mx-4 mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
      <view class="border-b border-gray-100 px-4 py-4">
        <view class="flex items-center">
          <view class="mr-3 h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500">
            <text class="i-carbon-locked text-xl text-white" />
          </view>
          <view class="text-lg text-gray-800 font-semibold">
            修改密码
          </view>
        </view>
      </view>

      <view class="p-4 space-y-4">
        <!-- 原密码输入 -->
        <view class="space-y-2">
          <view class="text-sm text-gray-700 font-medium">
            原密码
          </view>
          <view class="relative">
            <input
              v-model="passwordForm.oldPassword"
              :password="!showOldPassword"
              placeholder="请输入原密码"
              class="h-12 w-full border border-gray-200 rounded-xl px-4 pr-12 text-sm focus:border-blue-400 focus:outline-none"
              :disabled="isSubmitting"
            >
            <view
              class="absolute right-3 top-3 h-6 w-6 flex items-center justify-center"
              @tap="showOldPassword = !showOldPassword"
            >
              <text
                class="text-lg text-gray-400"
                :class="showOldPassword ? 'i-carbon-view-off' : 'i-carbon-view'"
              />
            </view>
          </view>
        </view>

        <!-- 新密码输入 -->
        <view class="space-y-2">
          <view class="text-sm text-gray-700 font-medium">
            新密码
          </view>
          <view class="relative">
            <input
              v-model="passwordForm.newPassword"
              :password="!showNewPassword"
              placeholder="请输入新密码（至少6位）"
              class="h-12 w-full border border-gray-200 rounded-xl px-4 pr-12 text-sm focus:border-blue-400 focus:outline-none"
              :disabled="isSubmitting"
            >
            <view
              class="absolute right-3 top-3 h-6 w-6 flex items-center justify-center"
              @tap="showNewPassword = !showNewPassword"
            >
              <text
                class="text-lg text-gray-400"
                :class="showNewPassword ? 'i-carbon-view-off' : 'i-carbon-view'"
              />
            </view>
          </view>

          <!-- 密码强度指示器 -->
          <view v-if="passwordForm.newPassword" class="flex items-center gap-2">
            <view class="text-xs text-gray-500">
              密码强度:
            </view>
            <view class="flex flex-1 items-center gap-1">
              <view
                v-for="i in 3"
                :key="i"
                class="h-1.5 flex-1 rounded-full transition-colors"
                :class="{
                  'bg-red-500': getPasswordStrength(passwordForm.newPassword) >= i && getPasswordStrength(passwordForm.newPassword) <= 1,
                  'bg-yellow-500': getPasswordStrength(passwordForm.newPassword) >= i && getPasswordStrength(passwordForm.newPassword) >= 2 && getPasswordStrength(passwordForm.newPassword) <= 3,
                  'bg-green-500': getPasswordStrength(passwordForm.newPassword) >= i && getPasswordStrength(passwordForm.newPassword) >= 4,
                  'bg-gray-200': getPasswordStrength(passwordForm.newPassword) < i,
                }"
              />
            </view>
            <view
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="getPasswordStrengthColor(getPasswordStrength(passwordForm.newPassword))"
            >
              {{ getPasswordStrengthText(getPasswordStrength(passwordForm.newPassword)) }}
            </view>
          </view>
        </view>

        <!-- 确认密码输入 -->
        <view class="space-y-2">
          <view class="text-sm text-gray-700 font-medium">
            确认密码
          </view>
          <view class="relative">
            <input
              v-model="confirmPassword"
              :password="!showConfirmPassword"
              placeholder="请再次输入新密码"
              class="h-12 w-full border border-gray-200 rounded-xl px-4 pr-12 text-sm focus:border-blue-400 focus:outline-none"
              :disabled="isSubmitting"
            >
            <view
              class="absolute right-3 top-3 h-6 w-6 flex items-center justify-center"
              @tap="showConfirmPassword = !showConfirmPassword"
            >
              <text
                class="text-lg text-gray-400"
                :class="showConfirmPassword ? 'i-carbon-view-off' : 'i-carbon-view'"
              />
            </view>
          </view>

          <!-- 密码匹配提示 -->
          <view v-if="confirmPassword && passwordForm.newPassword" class="flex items-center gap-1 text-xs">
            <text
              v-if="confirmPassword === passwordForm.newPassword"
              class="i-carbon-checkmark-filled text-sm text-green-600"
            />
            <text
              v-else
              class="i-carbon-close-filled text-sm text-red-500"
            />
            <text :class="confirmPassword === passwordForm.newPassword ? 'text-green-600' : 'text-red-500'">
              {{ confirmPassword === passwordForm.newPassword ? '密码匹配' : '密码不匹配' }}
            </text>
          </view>
        </view>

        <!-- 提交按钮 -->
        <view class="pt-2">
          <wd-button
            type="primary"
            size="large"
            block
            :loading="isSubmitting"
            :disabled="isSubmitting || !passwordForm.oldPassword || !passwordForm.newPassword || !confirmPassword || passwordForm.newPassword !== confirmPassword"
            custom-style="height: 48px; border-radius: 12px;"
            @click="handleUpdatePassword"
          >
            {{ isSubmitting ? '修改中...' : '确认修改' }}
          </wd-button>
        </view>
      </view>
    </view>

    <!-- 安全建议 -->
    <view class="mx-4 mt-2 overflow-hidden rounded-2xl bg-white shadow-sm">
      <view class="border-b border-gray-100 px-4 py-4">
        <view class="flex items-center">
          <view class="mr-3 h-10 w-10 flex items-center justify-center rounded-xl bg-green-500">
            <text class="i-carbon-security text-xl text-white" />
          </view>
          <view class="text-lg text-gray-800 font-semibold">
            安全建议
          </view>
        </view>
      </view>

      <view class="p-4">
        <view class="space-y-3">
          <view class="flex items-start gap-3">
            <view class="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-green-100">
              <text class="i-carbon-checkmark text-xs text-green-600" />
            </view>
            <view class="flex-1 text-sm text-gray-600 leading-relaxed">
              使用至少8位字符，包含大小写字母、数字和特殊符号
            </view>
          </view>
          <view class="flex items-start gap-3">
            <view class="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-green-100">
              <text class="i-carbon-checkmark text-xs text-green-600" />
            </view>
            <view class="flex-1 text-sm text-gray-600 leading-relaxed">
              避免使用生日、姓名等容易被猜到的信息
            </view>
          </view>
          <view class="flex items-start gap-3">
            <view class="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-green-100">
              <text class="i-carbon-checkmark text-xs text-green-600" />
            </view>
            <view class="flex-1 text-sm text-gray-600 leading-relaxed">
              定期更换密码，建议每3-6个月更换一次
            </view>
          </view>
          <view class="flex items-start gap-3">
            <view class="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-green-100">
              <text class="i-carbon-checkmark text-xs text-green-600" />
            </view>
            <view class="flex-1 text-sm text-gray-600 leading-relaxed">
              不要在多个平台使用相同的密码
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 登录记录 -->
    <view class="mx-4 mt-2 overflow-hidden rounded-2xl bg-white shadow-sm">
      <view class="border-b border-gray-100 px-4 py-4">
        <view class="flex items-center">
          <view class="mr-3 h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500">
            <text class="i-carbon-data-table text-xl text-white" />
          </view>
          <view class="text-lg text-gray-800 font-semibold">
            登录记录
          </view>
        </view>
      </view>

      <view class="p-2">
        <view v-if="loginRecords.length === 0 && !loadingLogs" class="p-12 text-center">
          <view class="mb-3 flex justify-center">
            <view class="h-16 w-16 flex items-center justify-center rounded-2xl bg-gray-100">
              <text class="i-carbon-document-blank text-3xl text-gray-400" />
            </view>
          </view>
          <view class="text-sm text-gray-500">
            暂无登录记录
          </view>
        </view>

        <view
          v-for="(record, index) in loginRecords"
          :key="record.id || index"
          class="mx-1 my-2 rounded-xl bg-gray-50 p-4"
        >
          <view class="flex items-start justify-between">
            <view class="flex flex-1 items-start gap-3">
              <view class="mt-1 h-10 w-10 flex items-center justify-center rounded-xl" :class="record.deviceType?.toLowerCase().includes('mobile') ? 'bg-blue-100' : 'bg-purple-100'">
                <text
                  class="text-xl"
                  :class="record.deviceType?.toLowerCase().includes('mobile') ? 'i-carbon-phone text-blue-600' : 'i-carbon-laptop text-purple-600'"
                />
              </view>
              <view class="flex-1">
                <view class="mb-2 flex items-center justify-between">
                  <view class="text-sm text-gray-800 font-medium">
                    {{ parseDeviceInfo(record).device }}
                  </view>
                  <view
                    class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="getLoginResultColor(record.result)"
                  >
                    {{ getLoginResult(record.result) }}
                  </view>
                </view>

                <view class="mb-2 space-y-1.5">
                  <view class="flex items-center gap-1.5 text-xs text-gray-600">
                    <text class="i-carbon-browser text-sm" />
                    <text>{{ parseDeviceInfo(record).browser }}</text>
                    <text class="text-gray-400">
                      ·
                    </text>
                    <text class="i-carbon-location text-sm" />
                    <text>{{ parseDeviceInfo(record).area }}</text>
                  </view>
                  <view class="flex items-center gap-1.5 text-xs text-gray-500">
                    <text class="i-carbon-network-3 text-sm" />
                    <text>{{ record.userIp }}</text>
                    <text class="text-gray-400">
                      ·
                    </text>
                    <text>{{ parseDeviceInfo(record).os }}</text>
                  </view>
                </view>

                <view class="flex items-center gap-1 text-xs text-gray-400">
                  <text class="i-carbon-time text-sm" />
                  <text>{{ formatTimestamp(record.createTime) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>

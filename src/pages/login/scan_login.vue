<!-- 微信小程序扫码登录授权页面 -->
<route lang="jsonc" type="page">
{
    "layout": "default",
    "style": {
      "navigationStyle": "default",
      "navigationBarTitleText": "扫码登录授权",
      "enablePullDownRefresh": false,
      "disableScroll": true
    }
}
</route>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { sendScanMessage } from '@/api/login'
import { useUserStore } from '@/store'
import { useAppStore } from '@/store/app'
import ThemeCard from '@/components/ThemeCard.vue'
import { formatStandardDateTime } from '@/utils'

const userStore = useUserStore()
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const pageBgClass = computed(() => (isDark.value ? 'bg-[#0b0d10]' : 'bg-[#f6f7f9]'))
// 采用 login 页面相同的深色适配方式
const headerTitleClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const headerSubClass = computed(() => (isDark.value ? 'text-gray-300' : 'text-gray-600'))
const isLoading = ref(false)
const deviceInfo = ref('')
const loginTime = ref('')
const nonce = ref('')

// 获取页面参数
onLoad((options) => {
  // 获取设备信息和时间
  const systemInfo = uni.getSystemInfoSync()
  deviceInfo.value = `${systemInfo.deviceModel} ${systemInfo.system}`.replace(/<[^>]*>/g, '')
  loginTime.value = formatStandardDateTime(new Date().toLocaleString())
  nonce.value = options.scene
})

onShow(() => {
  // 发送扫码登录消息
  sendScanMessage({
    nonce: nonce.value,
    userId: userStore.userInfo.userId,
    status: 'SCANNED',
  })
})

// 确认授权登录
async function confirmLogin() {
  if (isLoading.value) {
    return
  }

  if (!nonce.value) {
    uni.showToast({
      title: '授权参数错误',
      icon: 'none',
      duration: 2000,
    })
    return
  }

  isLoading.value = true

  // 调用发送扫码登录消息接口
  await sendScanMessage({
    nonce: nonce.value,
    userId: userStore.userInfo.userId,
    status: 'COMPLETED',
  })

  try {
    uni.showToast({
      title: '授权成功',
      icon: 'success',
      duration: 1000,
    })

    // 跳转至首页
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/index/index',
      })
    }, 1000)
  }
  catch (error: any) {
    console.error('❌ 授权登录失败:', error)

    let errorMessage = '授权失败'
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

// 取消授权
function cancelLogin() {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消授权登录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          if (nonce.value) {
            // 通知服务器取消授权
            await sendScanMessage({
              nonce: nonce.value,
              userId: userStore.userInfo.userId,
              status: 'CANCELED',
            })
          }
        }
        catch (error) {
          console.error('取消授权失败:', error)
        }
        finally {
          // 无论成功失败都返回首页
          uni.reLaunch({
            url: '/pages/index/index',
          })
        }
      }
    },
  })
}
</script>

<template>
  <view class="fixed left-0 top-0 h-full w-full flex items-center justify-center" style="touch-action: none;">
    <ThemeCard
      :padding="false"
      radius="rounded-2xl"
      shadow
      cardClass="w-full max-w-[600rpx] max-h-[calc(100vh-80rpx)] overflow-y-auto box-border p-[50rpx] px-[40rpx]"
    >
      <!-- 头部 -->
      <view class="text-center mb-[50rpx]">
        <view :class="['font-bold text-[46rpx] mb-[10rpx] leading-[1.2]', headerTitleClass]">
          扫码登录授权
        </view>
        <view :class="['text-[24rpx] leading-[1.3]', headerSubClass]">
          梯航小助手
        </view>
      </view>

      <!-- 授权信息 -->
      <view class="mb-[40rpx] p-[30rpx] rounded-[12rpx] bg-[#f8f9fa] dark:bg-white/6">
        <view class="text-[28rpx] font-500 mb-[20rpx] text-center text-gray-700 dark:text-gray-200">
          PC端请求登录授权
        </view>

        <view class="mb-[15rpx]">
          <view class="text-[24rpx] text-gray-600 dark:text-gray-400">
            <text class="text-gray-500 dark:text-gray-400">设备信息：</text>
            <text class="text-gray-800 dark:text-gray-200">{{ deviceInfo }}</text>
          </view>
        </view>

        <view class="mb-[15rpx]">
          <view class="text-[24rpx] text-gray-600 dark:text-gray-400">
            <text class="text-gray-500 dark:text-gray-400">请求时间：</text>
            <text class="text-gray-800 dark:text-gray-200">{{ loginTime }}</text>
          </view>
        </view>

        <view v-if="userStore.userInfo.username">
          <view class="text-[24rpx] text-gray-600 dark:text-gray-400">
            <text class="text-gray-500 dark:text-gray-400">登录账号：</text>
            <text class="text-gray-800 dark:text-gray-200">{{ userStore.userInfo.username }}</text>
          </view>
        </view>
      </view>

      <!-- 授权提示 -->
      <view class="mb-[40rpx] p-[20rpx] rounded-[12rpx] border-l-[4rpx] border-[#ffc107] bg-amber-50/80 dark:bg-amber-500/10">
        <view class="text-[26rpx] leading-[1.5] text-amber-800 dark:text-amber-300">
          确认授权后，PC端将使用您的账号登录系统
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="mb-[30rpx]">
        <!-- 确认授权按钮 -->
        <view class="mb-[20rpx]">
          <wd-button
            type="primary"
            size="large"
            block
            :loading="isLoading"
            :disabled="isLoading"
            custom-style="height: 88rpx; border-radius: 12rpx; font-size: 32rpx;"
            @click="confirmLogin"
          >
            {{ isLoading ? '授权中...' : '确认授权' }}
          </wd-button>
        </view>

        <!-- 取消授权按钮 -->
        <view>
          <wd-button
            type="info"
            size="large"
            plain
            block
            :disabled="isLoading"
            custom-style="height: 88rpx; border-radius: 12rpx; font-size: 32rpx;"
            @click="cancelLogin"
          >
            取消授权
          </wd-button>
        </view>
      </view>

      <!-- 安全提示 -->
      <view class="p-[20rpx] rounded-[12rpx] text-center bg-[#e8f4fd] dark:bg-blue-500/10">
        <view class="text-[24rpx] leading-[1.5] text-blue-700 dark:text-blue-300">
          为了您的账号安全，请确认是否为本人操作
        </view>
      </view>
    </ThemeCard>
  </view>
</template>

<style lang='scss' scoped>
// 微信小程序特定优化
/* #ifdef MP-WEIXIN */
.scan-card {
  // 小程序中的高度调整
  max-height: 85vh;
}
/* #endif */
</style>

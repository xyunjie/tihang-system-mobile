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
import { ref } from 'vue'
import { sendScanMessage } from '@/api/login'
import { useUserStore } from '@/store'
import { formatStandardDateTime } from '@/utils'

const userStore = useUserStore()
const isLoading = ref(false)
const deviceInfo = ref('')
const loginTime = ref('')
const nonce = ref('')

// 获取页面参数
onLoad((options) => {
  // 获取设备信息和时间
  const systemInfo = uni.getSystemInfoSync()
  deviceInfo.value = `${systemInfo.deviceModel} ${systemInfo.system}`.replace(/<[^>]*>/g, '')
  loginTime.value = formatStandardDateTime(new Date().toISOString())
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
  <view class="fixed left-0 top-0 h-full w-full flex items-center justify-center" style="background: linear-gradient(135deg, #4A90E2 0%, #2E5BBA 50%, #1E3A8A 100%); touch-action: none; overflow: hidden;">
    <view class="login-card w-full bg-white" style="border-radius: 20rpx; padding: 50rpx 40rpx; box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1); max-width: 600rpx; max-height: calc(100vh - 80rpx); overflow-y: auto; -webkit-overflow-scrolling: touch; box-sizing: border-box;">
      <!-- 头部 -->
      <view class="text-center" style="margin-bottom: 50rpx;">
        <view class="text-gray-800 font-bold" style="font-size: 46rpx; margin-bottom: 10rpx; line-height: 1.2;">
          🔐 扫码登录授权
        </view>
        <view class="text-gray-600" style="font-size: 24rpx; line-height: 1.3;">
          梯航小助手
        </view>
      </view>

      <!-- 授权信息 -->
      <view class="auth-info" style="margin-bottom: 40rpx; padding: 30rpx; background: #f8f9fa; border-radius: 12rpx;">
        <view class="text-gray-700" style="font-size: 28rpx; font-weight: 500; margin-bottom: 20rpx; text-align: center;">
          📱 PC端请求登录授权
        </view>

        <view class="info-item" style="margin-bottom: 15rpx;">
          <view class="text-gray-600" style="font-size: 24rpx;">
            <text style="color: #666;">
              设备信息：
            </text>
            <text style="color: #333;">
              {{ deviceInfo }}
            </text>
          </view>
        </view>

        <view class="info-item" style="margin-bottom: 15rpx;">
          <view class="text-gray-600" style="font-size: 24rpx;">
            <text style="color: #666;">
              请求时间：
            </text>
            <text style="color: #333;">
              {{ loginTime }}
            </text>
          </view>
        </view>

        <view v-if="userStore.userInfo.username" class="info-item">
          <view class="text-gray-600" style="font-size: 24rpx;">
            <text style="color: #666;">
              登录账号：
            </text>
            <text style="color: #333;">
              {{ userStore.userInfo.username }}
            </text>
          </view>
        </view>
      </view>

      <!-- 授权提示 -->
      <view class="auth-notice" style="margin-bottom: 40rpx; padding: 20rpx; background: #fff3cd; border-radius: 12rpx; border-left: 4rpx solid #ffc107;">
        <view class="text-orange-800" style="font-size: 26rpx; line-height: 1.5;">
          ⚠️ 确认授权后，PC端将使用您的账号登录系统
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons" style="margin-bottom: 30rpx;">
        <!-- 确认授权按钮 -->
        <view style="margin-bottom: 20rpx;">
          <wd-button
            type="primary"
            size="large"
            block
            :loading="isLoading"
            :disabled="isLoading"
            custom-style="height: 88rpx; border-radius: 12rpx; font-size: 32rpx;"
            @click="confirmLogin"
          >
            {{ isLoading ? '授权中...' : '✅ 确认授权' }}
          </wd-button>
        </view>

        <!-- 取消授权按钮 -->
        <view>
          <wd-button
            type="info"
            size="large"

            plain block
            :disabled="isLoading"
            custom-style="height: 88rpx; border-radius: 12rpx; font-size: 32rpx;"
            @click="cancelLogin"
          >
            ❌ 取消授权
          </wd-button>
        </view>
      </view>

      <!-- 安全提示 -->
      <view class="security-tips" style="padding: 20rpx; background: #e8f4fd; border-radius: 12rpx; text-align: center;">
        <view class="text-blue-700" style="font-size: 24rpx; line-height: 1.5;">
          🔒 为了您的账号安全，请确认是否为本人操作
        </view>
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

// 扫码区域样式
.scan-area {
  .scan-icon {
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>

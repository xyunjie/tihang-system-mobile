<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page -->
<route lang="jsonc" type="home">
{
  "layout": "tabbar",
  "style": {
    // 'custom' 表示开启自定义导航栏，默认 'default'
    "navigationStyle": "custom",
    "navigationBarTitleText": "首页"
  }
}
</route>

<script lang="ts" setup>
import { useUserStore } from '@/store'
import PLATFORM from '@/utils/platform'
const userStore = useUserStore()
defineOptions({
  name: 'Home',
})

// 获取屏幕边界到安全区域距离
let safeAreaInsets
let systemInfo

// #ifdef MP-WEIXIN
// 微信小程序使用新的API
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
// 其他平台继续使用uni API
systemInfo = uni.getSystemInfoSync()
safeAreaInsets = systemInfo.safeAreaInsets
// #endif

const author = ref('菲鸽')
const description = ref(
  'unibest 是一个集成了多种工具和技术的 uniapp 开发模板，由 uniapp + Vue3 + Ts + Vite5 + UnoCss + VSCode 构建，模板具有代码提示、自动格式化、统一配置、代码片段等功能，并内置了许多常用的基本组件和基本功能，让你编写 uniapp 拥有 best 体验。',
)

// 测试 uni API 自动引入
onLoad(() => {
  console.log("userInfo", userStore.userInfo)
  if (!userStore.userInfo.accessToken) {
    gotoLogin()
  }
})

// 跳转到登录页
function gotoLogin() {
  uni.redirectTo({
    url: '/pages/login/index',
  })
}

// 退出登录功能
function logout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        console.log('🚪 用户确认退出登录')
        
        // 清除用户信息
        userStore.clearUserInfo()
        
        // 显示退出成功提示
        uni.showToast({
          title: '已退出登录',
          icon: 'success',
          duration: 1500
        })
        
        // 延迟跳转到登录页
        setTimeout(() => {
          uni.redirectTo({
            url: '/pages/login/index'
          })
        }, 1500)
      } else {
        console.log('🚫 用户取消退出登录')
      }
    }
  })
}
</script>

<template>
  <view class="bg-white px-4 pt-2" :style="{ marginTop: `${safeAreaInsets?.top}px` }">
    <!-- 用户信息区域 -->
    <view v-if="userStore.userInfo.username" class="user-info mb-6">
      <view class="user-welcome">
        <text class="welcome-text">👤 欢迎，{{ userStore.userInfo.username }}!</text>
        <view class="logout-btn" @click="logout">
          <text class="logout-text">🚪 退出登录</text>
        </view>
      </view>
    </view>
    
    <view class="mt-10">
      <image src="/static/logo.svg" alt="" class="mx-auto block h-28 w-28" />
    </view>
    <view class="mt-4 text-center text-4xl text-[#d14328]">
      unibest
    </view>
    <view class="mb-8 mt-2 text-center text-2xl">
      最好用的 uniapp 开发模板
    </view>

    <view class="m-auto mb-2 max-w-100 text-justify indent text-4">
      {{ description }}
    </view>
    <view class="mt-4 text-center">
      作者：
      <text class="text-green-500">
        菲鸽
      </text>
    </view>
    <view class="mt-4 text-center">
      官网地址：
      <text class="text-green-500">
        https://unibest.tech
      </text>
    </view>
    <view class="mt-6 h-1px bg-#eee" />
    <view class="mt-8 text-center">
      当前平台是：
      <text class="text-green-500">
        {{ PLATFORM.platform }}
      </text>
    </view>
    
    <!-- 登录状态显示 -->
    <view class="login-status mt-4">
      <view v-if="userStore.userInfo.username" class="text-center">
        <text class="text-blue-500">✅ 已登录</text>
      </view>
      <view v-else class="text-center">
        <text class="text-red-500">❌ 未登录</text>
        <button class="w-200px text-green mt-2" @click="gotoLogin">
          前往 登录 页面
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.user-info {
  background: linear-gradient(135deg, #4A90E2 0%, #2E5BBA 100%);
  border-radius: 12rpx;
  padding: 30rpx;
  margin-top: 20rpx;
  
  .user-welcome {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .welcome-text {
      color: white;
      font-size: 32rpx;
      font-weight: bold;
    }
    
    .logout-btn {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20rpx;
      padding: 12rpx 24rpx;
      border: 1rpx solid rgba(255, 255, 255, 0.3);
      
      .logout-text {
        color: white;
        font-size: 24rpx;
      }
    }
    
    .logout-btn:active {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.login-status {
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}
</style>

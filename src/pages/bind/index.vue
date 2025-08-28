<!-- 账号绑定页面 -->
<route lang="jsonc" type="page">
{
    "layout": "default",
    "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "绑定账号"
    },
    "notLogin": true
}
</route>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '@/store'
import { currRoute } from '@/utils'
import type { IBindAccountForm } from '@/api/types/login'
// 获取当前完整路径

const userStore = useUserStore()
const query = ref("") as any

// 绑定表单数据
const bindForm = reactive<IBindAccountForm & {
    username: string,
    password: string
}>({
  type: 34, // 默认微信小程序登录类型
  code: '',
  state: '',
  username: '',
  password: ''
})

// 表单验证和UI状态
const isLoading = ref(false)
const showPassword = ref(false)

// 表单验证
const validateForm = () => {
  if (!bindForm.username.trim()) {
    uni.showToast({
      title: '请输入学号/工号',
      icon: 'none'
    })
    return false
  }
  
  if (!/^[A-Za-z0-9]+$/.test(bindForm.username)) {
    uni.showToast({
      title: '学号/工号只能包含字母和数字',
      icon: 'none'
    })
    return false
  }
  
  if (!bindForm.password.trim()) {
    uni.showToast({
      title: '请输入密码',
      icon: 'none'
    })
    return false
  }
  
  if (bindForm.password.length < 6) {
    uni.showToast({
      title: '密码至少6位',
      icon: 'none'
    })
    return false
  }
  
  return true
}

// 绑定账号函数
const handleBind = async () => {
  if (!validateForm()) {
    return
  }
  
  if (isLoading.value) {
    return
  }
  
  isLoading.value = true
  
  try {
    console.log('📝 开始绑定账号...', bindForm)
    
    // 先调用登录接口，进行账号登录
    const loginResult = await userStore.login({
        username: bindForm.username,
        password: bindForm.password
    }, false)
    console.log('loginResult', loginResult)
    if (!loginResult) {
        return
    }
    console.log('✅ 登录成功，准备绑定账号')
    // 调用绑定接口
    const result = await userStore.bindAccount(bindForm)
    
    if (result) {
      console.log('✅ 绑定成功，准备跳转')
      
      // 显示成功提示
      uni.showToast({
        title: '绑定成功',
        icon: 'success',
        duration: 1500
      })
      
      // 延迟跳转到首页
      setTimeout(() => {
        uni.switchTab({ 
          url: '/pages/index/index',
          success: () => {
            console.log('✅ 跳转首页成功')
          },
          fail: (err) => {
            console.error('❌ 跳转首页失败:', err)
          }
        })
      }, 1500)
    }
  } catch (error: any) {
    console.error('❌ 绑定失败:', error)
    
    let errorMessage = '绑定失败'
    if (error.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    uni.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 2000
    })
  } finally {
    isLoading.value = false
  }
}

// 切换密码显示状态
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// 返回登录页
const goBack = () => {
  uni.navigateBack({
    delta: 1
  })
}

// 在页面加载时设置防返回拦截
onLoad(() => {
  query.value = currRoute().query
  bindForm.type = query.value.socialType as number
  bindForm.code = query.value.socialCode as string
  bindForm.state = query.value.socialState as string
})


</script>

<template>
  <view class="fixed top-0 left-0 w-full h-full flex items-center justify-center" style="background: linear-gradient(135deg, #4A90E2 0%, #2E5BBA 50%, #1E3A8A 100%); touch-action: none; overflow: hidden;">
    <view class="bg-white w-full bind-card" style="border-radius: 20rpx; padding: 50rpx 40rpx; box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1); max-width: 600rpx; max-height: calc(100vh - 80rpx); overflow-y: auto; -webkit-overflow-scrolling: touch; box-sizing: border-box;">
      <!-- 头部 -->
      <view class="text-center" style="margin-bottom: 50rpx;">
        <view class="font-bold text-gray-800" style="font-size: 46rpx; margin-bottom: 10rpx; line-height: 1.2;">🔗 绑定账号</view>
        <view class="text-gray-600" style="font-size: 24rpx; line-height: 1.3;">请输入您的学号/工号和密码完成绑定</view>
      </view>
      
      <!-- 绑定表单 -->
      <view style="margin-bottom: 40rpx;">
        <!-- 学号/工号输入框 -->
        <view style="margin-bottom: 30rpx;">
          <view class="flex items-center" style="margin-bottom: 12rpx;">
            <text class="text-gray-800 font-medium" style="font-size: 28rpx;">学号/工号</text>
            <text class="text-red-500" style="margin-left: 4rpx; font-size: 28rpx;">*</text>
          </view>
          <view class="flex items-center bg-gray-50 border-2 border-gray-200 transition-all focus-within:border-blue-500 focus-within:bg-white" style="border-radius: 12rpx; padding: 0 20rpx;">
            <text class="text-gray-400" style="font-size: 32rpx; margin-right: 15rpx;">🆔</text>
            <input 
              class="flex-1 text-gray-800 bg-transparent border-none outline-none"
              style="height: 88rpx; font-size: 28rpx;"
              type="text"
              v-model="bindForm.username"
              placeholder="请输入学号/工号"
              :maxlength="20"
              :disabled="isLoading"
            />
          </view>
        </view>
        
        <!-- 密码输入框 -->
        <view style="margin-bottom: 30rpx;">
          <view class="flex items-center" style="margin-bottom: 12rpx;">
            <text class="text-gray-800 font-medium" style="font-size: 28rpx;">密码</text>
            <text class="text-red-500" style="margin-left: 4rpx; font-size: 28rpx;">*</text>
          </view>
          <view class="flex items-center bg-gray-50 border-2 border-gray-200 transition-all focus-within:border-blue-500 focus-within:bg-white" style="border-radius: 12rpx; padding: 0 20rpx;">
            <text class="text-gray-400" style="font-size: 32rpx; margin-right: 15rpx;">🔒</text>
            <input 
              class="flex-1 text-gray-800 bg-transparent border-none outline-none"
              style="height: 88rpx; font-size: 28rpx;"
              type="text"
              v-model="bindForm.password"
              placeholder="请输入密码"
              :maxlength="50"
              :disabled="isLoading"
              :password="!showPassword"
            />
            <text 
              class="text-gray-400 cursor-pointer transition-colors hover:text-blue-500"
              style="font-size: 32rpx; padding: 10rpx;"
              @click="togglePasswordVisibility"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </text>
          </view>
        </view>
        
        <!-- 绑定按钮 -->
        <view style="margin-bottom: 20rpx;">
          <wd-button 
            type="primary" 
            size="large" 
            block
            :loading="isLoading"
            :disabled="isLoading"
            @click="handleBind"
          >
            {{ isLoading ? '绑定中...' : '🔗 立即绑定' }}
          </wd-button>
        </view>
        
        <!-- 返回按钮 -->
        <view>
          <wd-button 
            type="default" 
            size="large" 
            block
            :disabled="isLoading"
            @click="goBack"
          >
            🔙 返回登录
          </wd-button>
        </view>
      </view>
      
      <!-- 说明信息 -->
      <view class="text-center" style="margin-top: 30rpx;">
        <view class="text-gray-500" style="font-size: 22rpx; line-height: 1.4;">
          绑定后您可以使用微信一键登录<br/>
          也可以使用学号/工号和密码登录
        </view>
      </view>
    </view>
  </view>
</template>

<style lang='scss' scoped>
// 滚动条样式优化
.bind-card {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
}

// 微信小程序特定优化
/* #ifdef MP-WEIXIN */
.bind-card {
  max-height: 85vh;
}
/* #endif */
</style>
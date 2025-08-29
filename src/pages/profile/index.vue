<!-- 我的标签页 -->
<route lang="jsonc" type="page">
{
  "layout": "tabbar",
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "我的"
  }
}
</route>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/store'
import { getUserInfo as _getUserInfo } from '@/api/login'
import type { ISystemUserInfoVo } from '@/api/types/login'

const userStore = useUserStore()

defineOptions({
  name: 'Profile',
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

// 系统用户信息
const systemUserInfo = ref<ISystemUserInfoVo | null>(null)
const loading = ref(false)

// 扩展用户信息
const extendedUserInfo = computed(() => {
  const extended = uni.getStorageSync('extendedUserInfo')
  return extended || null
})

// 格式化性别
const formatSex = (sex: number) => {
  switch (sex) {
    case 1: return '男'
    case 2: return '女'
    default: return '未知'
  }
}

// 格式化状态
const formatStatus = (status: number) => {
  switch (status) {
    case 0: return '正常'
    case 1: return '禁用'
    default: return '未知'
  }
}

// 获取详细用户信息
const fetchUserInfo = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    const res = await _getUserInfo()
    systemUserInfo.value = res.data
    console.log('📋 获取系统用户信息成功:', res.data)
  } catch (error: any) {
    console.error('❌ 获取用户信息失败:', error)
    uni.showToast({
      title: '获取用户信息失败',
      icon: 'none',
      duration: 2000
    })
  } finally {
    loading.value = false
  }
}

// 页面加载时获取用户信息
onLoad(() => {
  console.log('📱 我的页面加载')
  if (userStore.userInfo.accessToken) {
    fetchUserInfo()
  } else {
    gotoLogin()
  }
})

// 跳转到登录页
function gotoLogin() {
  uni.redirectTo({
    url: '/pages/login/index',
  })
}

// 退出登录
function handleLogout() {
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
      }
    }
  })
}

// 编辑个人信息
function editProfile() {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 查看微信扩展信息
function showWxInfo() {
  const wxInfo = extendedUserInfo.value
  if (wxInfo) {
    let content = '微信扩展信息：\n'
    
    if (wxInfo.wxNickName) {
      content += `微信昵称：${wxInfo.wxNickName}\n`
    }
    if (wxInfo.wxGender !== undefined) {
      const gender = wxInfo.wxGender === 1 ? '男' : wxInfo.wxGender === 2 ? '女' : '未知'
      content += `性别：${gender}\n`
    }
    if (wxInfo.wxCountry) {
      content += `地区：${wxInfo.wxCountry} ${wxInfo.wxProvince} ${wxInfo.wxCity}\n`
    }
    if (wxInfo.phoneAuthData) {
      content += `手机号：已授权获取\n`
    }
    
    uni.showModal({
      title: '微信信息',
      content: content,
      showCancel: false
    })
  } else {
    uni.showToast({
      title: '暂无微信扩展信息',
      icon: 'none'
    })
  }
}

// 设置项列表
const settingItems = [
  { icon: '📝', name: '编辑个人信息', action: editProfile, show: true },
  { icon: '🚪', name: '退出登录', action: handleLogout, danger: true, show: true }
]
</script>

<template>
  <view class="bg-gray-50 min-h-screen" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 头部用户信息卡片 -->
    <view class="mx-4 mt-5 mb-6 p-8 rounded-4 text-white overflow-hidden relative" style="background: linear-gradient(135deg, #4A90E2 0%, #2E5BBA 100%); box-shadow: 0 10rpx 30rpx rgba(74, 144, 226, 0.3);">
      <view class="flex items-center">
        <!-- 用户头像 -->
        <image 
          :src="systemUserInfo?.avatar || '/static/images/default-avatar.png'" 
          class="w-20 h-20 rounded-full mr-1 border-2 border-white border-opacity-30"
          mode="aspectFit"
        />
        
        <!-- 用户基本信息 -->
        <view class="flex-1">
          <view class="text-lg font-bold mb-1">{{ systemUserInfo.username || '未登录' }}</view>
          <view v-if="systemUserInfo" class="text-sm text-white text-opacity-80 mb-2">
            {{ systemUserInfo.nickname  }}
          </view>
        </view>
        
        <!-- 刷新按钮 -->
        <view class="p-3 cursor-pointer" @click="fetchUserInfo">
          <text class="text-lg text-white text-opacity-80 transition-transform" :class="{ 'animate-spin': loading }">🔄</text>
        </view>
      </view>
    </view>

    <!-- 详细信息区域 -->
    <view v-if="systemUserInfo" class="mx-4 mb-6 bg-white rounded-4 overflow-hidden">
      <view class="bg-gray-50 px-6 py-4 text-base font-bold text-gray-800 border-b border-gray-100">📋 详细信息</view>
      
      <view class="p-4">
        <view class="flex justify-between items-center py-3 border-b border-gray-50">
          <view class="text-gray-600 text-sm min-w-24">用户账号</view>
          <view class="text-gray-800 text-sm text-right flex-1">{{ systemUserInfo.username }}</view>
        </view>
        
        <view class="flex justify-between items-center py-3 border-b border-gray-50">
          <view class="text-gray-600 text-sm min-w-24">用户昵称</view>
          <view class="text-gray-800 text-sm text-right flex-1">{{ systemUserInfo.nickname || '未设置' }}</view>
        </view>
        
        <view class="flex justify-between items-center py-3 border-b border-gray-50">
          <view class="text-gray-600 text-sm min-w-24">性别</view>
          <view class="text-gray-800 text-sm text-right flex-1">{{ formatSex(systemUserInfo.sex) }}</view>
        </view>
        
        <view class="flex justify-between items-center py-3 border-b border-gray-50">
          <view class="text-gray-600 text-sm min-w-24">手机号</view>
          <view class="text-gray-800 text-sm text-right flex-1">{{ systemUserInfo.mobile || '未设置' }}</view>
        </view>
        
        <view class="flex justify-between items-center py-3 border-b border-gray-50">
          <view class="text-gray-600 text-sm min-w-24">邮箱</view>
          <view class="text-gray-800 text-sm text-right flex-1 break-all">{{ systemUserInfo.email || '未设置' }}</view>
        </view>
        
        <view class="flex justify-between items-center py-3 border-b border-gray-50">
          <view class="text-gray-600 text-sm min-w-24">部门</view>
          <view class="text-gray-800 text-sm text-right flex-1">{{ systemUserInfo.deptName || '未分配' }}</view>
        </view>
        
        <view class="flex justify-between items-center py-3 border-b border-gray-50">
          <view class="text-gray-600 text-sm min-w-24">状态</view>
          <view class="text-sm text-right flex-1" :class="systemUserInfo.status === 0 ? 'text-green-500' : 'text-red-500'">
            {{ formatStatus(systemUserInfo.status) }}
          </view>
        </view>
        
        <view class="flex justify-between items-center py-3" v-if="systemUserInfo.loginIp">
          <view class="text-gray-600 text-sm min-w-24">最后登录IP</view>
          <view class="text-gray-800 text-sm text-right flex-1">{{ systemUserInfo.loginIp }}</view>
        </view>
      </view>
    </view>

    <!-- 功能设置区域 -->
    <view class="mx-4 mb-6 bg-white rounded-4 overflow-hidden">
      <view class="bg-gray-50 px-6 py-4 text-base font-bold text-gray-800 border-b border-gray-100">⚙️ 功能设置</view>
      
      <view>
        <view 
          v-for="(item, index) in settingItems" 
          :key="index"
          v-show="item.show !== false"
          class="flex items-center px-6 py-4 bg-white border-b border-gray-50 transition-colors active:bg-gray-50" 
          :class="{ 'text-red-500': item.danger }"
          @click="item.action"
        >
          <view class="text-lg mr-4 w-8 text-center">{{ item.icon }}</view>
          <view class="flex-1 text-base" :class="item.danger ? 'text-red-500' : 'text-gray-800'">{{ item.name }}</view>
          <view class="text-gray-400 text-sm">></view>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading && !systemUserInfo" class="flex justify-center items-center py-20">
      <view class="text-gray-600 text-base">📋 正在获取用户信息...</view>
    </view>

    <!-- 未登录状态 -->
    <view v-if="!userStore.userInfo.accessToken" class="flex flex-col items-center justify-center py-20">
      <view class="text-5xl mb-4">🔐</view>
      <view class="text-gray-600 text-base mb-8">请先登录</view>
      <button class="bg-blue-500 text-white border-none rounded-3xl px-8 py-3 text-base active:opacity-80" @click="gotoLogin">前往登录</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>
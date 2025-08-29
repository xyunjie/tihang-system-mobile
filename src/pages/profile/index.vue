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
import { ref } from 'vue'
import { useUserStore } from '@/store'
import { getUserInfo as _getUserInfo } from '@/api/user'
import type { ISystemUserInfoVo } from '@/api/types/user'

const userStore = useUserStore()

defineOptions({
  name: 'Profile',
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

// 系统用户信息
const systemUserInfo = ref<ISystemUserInfoVo | null>(null)
const loading = ref(false)

// 扩展用户信息 - 不再使用
// const extendedUserInfo = computed(() => {
//   const extended = uni.getStorageSync('extendedUserInfo')
//   return extended || null
// })

// 快捷操作列表
const quickActions = [
  { icon: '👤', label: '编辑资料', color: 'bg-blue-500', handler: editProfile },
  { icon: '🔐', label: '账号安全', color: 'bg-green-500', handler: () => showToast('账号安全') },
  { icon: '📋', label: '使用记录', color: 'bg-purple-500', handler: () => showToast('使用记录') },
  { icon: '🎯', label: '帮助反馈', color: 'bg-orange-500', handler: () => showToast('帮助反馈') }
]

// 通用提示函数
const showToast = (title: string) => {
  uni.showToast({
    title: `${title}功能开发中`,
    icon: 'none'
  })
}

// 格式化性别
const formatSex = (sex: number) => {
  switch (sex) {
    case 1: return '男'
    case 2: return '女'
    default: return '未知'
  }
}

// 格式化角色列表
const formatRoles = (roles: { id: number; name: string }[]) => {
  if (!roles || roles.length === 0) return '暂无角色'
  return roles.map(role => role.name).join('、')
}

// 格式化部门信息（支持层级显示）
const formatDept = (dept: { id: number; name: string; parentId: number }) => {
  if (!dept) return '暂无部门'
  // 如果有父部门ID且不为0，表示是子部门
  if (dept.parentId && dept.parentId !== 0) {
    return `${dept.name} (子部门)`
  }
  return dept.name
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
  uni.navigateTo({
    url: '/pages/profile/edit'
  })
}

// 数据管理功能
function gotoDataManagement() {
  uni.showActionSheet({
    itemList: ['清理缓存数据', '查看存储信息'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          // 清理缓存
          clearCacheData()
          break
        case 1:
          // 查看存储信息
          showStorageInfo()
          break
      }
    }
  })
}

// 清理缓存数据
function clearCacheData() {
  uni.showModal({
    title: '清理缓存',
    content: '确定要清理所有本地缓存数据吗？清理后需要重新登录。',
    showCancel: true,
    confirmText: '确定清理',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        try {
          const keysToKeep = ['theme_id'] // 保留主题设置
          const storage = uni.getStorageInfoSync()
          
          storage.keys.forEach(key => {
            if (!keysToKeep.includes(key)) {
              uni.removeStorageSync(key)
            }
          })
          
          uni.showToast({
            title: '缓存清理成功',
            icon: 'success',
            duration: 1500
          })
          
          setTimeout(() => {
            uni.redirectTo({
              url: '/pages/login/index'
            })
          }, 1500)
        } catch (error) {
          console.error('清理缓存失败:', error)
          uni.showToast({
            title: '清理失败',
            icon: 'error'
          })
        }
      }
    }
  })
}

// 查看存储信息
function showStorageInfo() {
  try {
    const storageInfo = uni.getStorageInfoSync()
    const sizeKB = (storageInfo.currentSize || 0)
    const limitKB = (storageInfo.limitSize || 0)
    
    let content = `存储空间：${sizeKB}KB`
    if (limitKB > 0) {
      content += ` / ${limitKB}KB`
    }
    content += `\n存储项数：${storageInfo.keys.length}个`
    
    uni.showModal({
      title: '存储信息',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    })
  } catch (error) {
    console.error('获取存储信息失败:', error)
    uni.showToast({
      title: '获取失败',
      icon: 'error'
    })
  }
}

// 跳转到关于我们页面
function gotoAboutStudio() {
  uni.navigateTo({
    url: '/pages/about/studio'
  })
}

// 功能菜单列表
const menuItems = [
  {
    category: '个人管理',
    items: [
      { icon: '👤', name: '个人资料', desc: '管理个人信息', action: editProfile },
      { icon: '🔐', name: '账号安全', desc: '密码、登录记录', action: () => showToast('账号安全') },
      { icon: '🔔', name: '消息通知', desc: '通知设置', action: () => showToast('消息通知') }
    ]
  },
  {
    category: '应用设置',
    items: [
      { icon: '🔔', name: '消息推送', desc: '推送通知设置管理', action: () => showToast('消息推送') },
      { icon: '💾', name: '数据管理', desc: '缓存清理与数据备份', action: gotoDataManagement }
    ]
  },
  {
    category: '其他',
    items: [
      { icon: '❓', name: '帮助中心', desc: '使用帮助与FAQ', action: () => showToast('帮助中心') },
      { icon: '📝', name: '意见反馈', desc: '问题反馈与建议', action: () => showToast('意见反馈') },
      { icon: 'ℹ️', name: '关于我们', desc: '工作室介绍与版本信息', action: gotoAboutStudio },
      { icon: '🚪', name: '退出登录', desc: '安全退出账号', action: handleLogout, danger: true }
    ]
  }
]
</script>

<template>
  <view class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 用户信息卡片 -->
    <view class="relative mx-4 pt-6 pb-8">
      <view class="bg-white rounded-3xl shadow-lg p-6 relative overflow-hidden">
        <!-- 装饰性背景 -->
        <view class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-full opacity-60 -translate-y-8 translate-x-8"></view>
        <view class="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-100 to-transparent rounded-full opacity-40 -translate-x-4 translate-y-4"></view>
        
        <view class="relative z-10">
          <!-- 用户头像和基本信息 -->
          <view class="flex items-center mb-6">
            <view class="relative">
              <image 
                :src="systemUserInfo.avatar || '/static/images/default-avatar.png'" 
                class="w-16 h-16 rounded-2xl border-2 border-white shadow-md"
                mode="aspectFill"
              />
              <view class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></view>
            </view>
            
            <view class="flex-1 ml-4">
              <view class="text-gray-800 text-lg font-bold mb-1">{{ systemUserInfo.username || '未登录' }}</view>
              <view v-if="systemUserInfo" class="text-gray-500 text-sm">
                {{ systemUserInfo.nickname || '暂无昵称' }}
              </view>
              <view v-if="systemUserInfo" class="text-xs text-gray-400 mt-1">
                {{ formatDept(systemUserInfo.dept) }}
              </view>
            </view>
            
            <!-- 刷新按钮 -->
            <view 
              class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center active:bg-gray-200 transition-colors" 
              @click="fetchUserInfo"
            >
              <text class="text-gray-600 text-base" :class="{ 'animate-spin': loading }">🔄</text>
            </view>
          </view>
          
          <!-- 账号状态标签 -->
          <view class="flex gap-2">
            <view class="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              正常状态
            </view>
            <view v-if="systemUserInfo?.roles && systemUserInfo.roles.length > 0" class="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              {{ systemUserInfo.roles.length }}个角色
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="mx-4 mb-6">
      <view class="grid grid-cols-4 gap-3">
        <view 
          v-for="(action, index) in quickActions" 
          :key="index"
          class="bg-white rounded-2xl p-4 text-center shadow-sm active:scale-95 transition-all"
          @click="action.handler"
        >
          <view class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center text-white" :class="action.color">
            <text class="text-lg">{{ action.icon }}</text>
          </view>
          <view class="text-gray-700 text-xs font-medium">{{ action.label }}</view>
        </view>
      </view>
    </view>

    <!-- 个人信息详情 -->
    <view class="mx-4 mb-6 bg-white rounded-2xl shadow-sm overflow-hidden" v-if="systemUserInfo">
      <view class="px-4 py-3 border-b border-gray-100">
        <view class="text-gray-800 text-base font-semibold">📋 个人信息</view>
      </view>
      
      <view class="p-4">
        <view class="space-y-3">
          <view class="flex items-center justify-between py-2">
            <view class="text-gray-600 text-sm">用户编号</view>
            <view class="text-gray-800 text-sm font-medium">{{ systemUserInfo.id }}</view>
          </view>
          
          <view class="flex items-center justify-between py-2">
            <view class="text-gray-600 text-sm">用户账号</view>
            <view class="text-gray-800 text-sm font-medium">{{ systemUserInfo.username }}</view>
          </view>
          
          <view class="flex items-center justify-between py-2">
            <view class="text-gray-600 text-sm">用户昵称</view>
            <view class="text-gray-800 text-sm font-medium">{{ systemUserInfo.nickname || '未设置' }}</view>
          </view>
          
          <view class="flex items-center justify-between py-2">
            <view class="text-gray-600 text-sm">性别</view>
            <view class="text-gray-800 text-sm font-medium">{{ formatSex(systemUserInfo.sex) }}</view>
          </view>
          
          <view class="flex items-center justify-between py-2" v-if="systemUserInfo.mobile">
            <view class="text-gray-600 text-sm">手机号</view>
            <view class="text-gray-800 text-sm font-medium">{{ systemUserInfo.mobile }}</view>
          </view>
          
          <view class="flex items-center justify-between py-2" v-if="systemUserInfo.email">
            <view class="text-gray-600 text-sm">邮箱</view>
            <view class="text-gray-800 text-sm font-medium break-all">{{ systemUserInfo.email }}</view>
          </view>
          
          <view class="flex items-center justify-between py-2">
            <view class="text-gray-600 text-sm">所属部门</view>
            <view class="text-gray-800 text-sm font-medium">{{ formatDept(systemUserInfo.dept) }}</view>
          </view>
          
          <view class="flex items-start justify-between py-2" v-if="systemUserInfo.roles && systemUserInfo.roles.length > 0">
            <view class="text-gray-600 text-sm pt-1">用户角色</view>
            <view class="text-gray-800 text-sm font-medium text-right flex-1 ml-4">
              <view v-if="systemUserInfo.roles.length === 1" class="inline-block">
                {{ systemUserInfo.roles[0].name }}
              </view>
              <view v-else class="space-y-1">
                <view 
                  v-for="(role, index) in systemUserInfo.roles" 
                  :key="role.id" 
                  class="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md mr-1 mb-1"
                >
                  {{ role.name }}
                </view>
              </view>
            </view>
          </view>
          
          <view class="flex items-center justify-between py-2" v-if="systemUserInfo.loginIp">
            <view class="text-gray-600 text-sm">最后登录IP</view>
            <view class="text-gray-800 text-sm font-medium">{{ systemUserInfo.loginIp }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view v-for="(category, categoryIndex) in menuItems" :key="categoryIndex" class="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
      <view class="px-4 py-3 border-b border-gray-100">
        <view class="text-gray-800 text-base font-semibold">{{ category.category }}</view>
      </view>
      
      <view class="p-2">
        <view 
          v-for="(item, index) in category.items" 
          :key="index"
          class="flex items-center px-3 py-3 mx-1 my-1 rounded-xl transition-colors active:bg-gray-50" 
          @click="item.action"
        >
          <view class="text-lg mr-3">{{ item.icon }}</view>
          <view class="flex-1">
            <view class="text-gray-800 text-sm font-medium" :class="{ 'text-red-500': item.danger }">{{ item.name }}</view>
            <view class="text-gray-500 text-xs mt-1" v-if="item.desc">{{ item.desc }}</view>
          </view>
          <view class="text-gray-400 text-sm">›</view>
        </view>
      </view>
    </view>

    <!-- 未登录状态 -->
    <view v-if="!userStore.userInfo.accessToken" class="flex flex-col items-center justify-center py-20">
      <view class="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mb-6">
        <text class="text-3xl">🔐</text>
      </view>
      <view class="text-gray-600 text-lg font-medium mb-2">请先登录</view>
      <view class="text-gray-400 text-sm mb-8">登录后即可查看个人信息</view>
      <button 
        class="bg-blue-500 text-white border-none rounded-2xl px-8 py-3 text-base font-medium active:bg-blue-600 transition-colors" 
        @click="gotoLogin"
      >
        立即登录
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>
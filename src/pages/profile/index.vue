<!-- 我的标签页 -->
<route lang="jsonc" type="page">
{
  "layout": "tabbar",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "个人中心",
    "enablePullDownRefresh": true
  }
}
</route>

<script setup lang="ts">
import type { ISystemUserInfoVo } from '@/api/types/user'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { logout } from '@/api/login'
import { getUserInfo as _getUserInfo } from '@/api/user'
import ThemeCard from '@/components/ThemeCard.vue'
import { WECHAT_SHARE_IMAGE_URL } from '@/config/share'
import { useUserStore } from '@/store'
import { useAppStore } from '@/store/app'

defineOptions({
  name: 'Profile',
})

const userStore = useUserStore()

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

// 下拉刷新状态
const isRefreshing = ref(false)

// 通用提示函数
function showToast(title: string) {
  uni.showToast({
    title: `${title}功能开发中`,
    icon: 'none',
  })
}

// 跳转到账号安全页面
function gotoSecurity() {
  uni.navigateTo({
    url: '/pages-sub/profile/security',
  })
}

// 跳转到考勤管理页面
function gotoAttendance() {
  uni.navigateTo({
    url: '/pages-sub/attendance/index',
  })
}

// 新增：跳转到 OJ 信息页面
function gotoOJInfo() {
  uni.navigateTo({
    url: '/pages-sub/oj/index',
  })
}

// 跳转到系统设置页面
function gotoSettings() {
  uni.navigateTo({
    url: '/pages-sub/profile/settings',
  })
}

// 快捷操作列表
const quickActions = [
  { icon: 'user', label: '编辑资料', color: 'bg-blue-500', handler: editProfile },
  { icon: 'lock-on', label: '账号安全', color: 'bg-green-500', handler: gotoSecurity },
  { icon: 'time', label: '考勤管理', color: 'bg-purple-500', handler: gotoAttendance },
  { icon: 'code', label: 'OJ信息', color: 'bg-orange-500', handler: gotoOJInfo },
]

// 格式化性别
function formatSex(sex: number) {
  switch (sex) {
    case 1: return '男'
    case 2: return '女'
    default: return '未知'
  }
}

// 格式化部门信息（支持层级显示）
function formatDept(dept: { id: number, name: string, parentId: number }) {
  if (!dept)
    return '暂无部门'
  // 如果有父部门ID且不为0，表示是子部门
  if (dept.parentId && dept.parentId !== 0) {
    return `${dept.name}`
  }
  return dept.name
}

// 获取详细用户信息
async function fetchUserInfo() {
  if (loading.value)
    return

  loading.value = true
  try {
    const res = await _getUserInfo()
    systemUserInfo.value = res.data
  }
  catch (error: any) {
    uni.showToast({
      title: '获取用户信息失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    loading.value = false
  }
}

// 下拉刷新处理
async function handlePullDownRefresh() {
  if (isRefreshing.value) {
    uni.stopPullDownRefresh()
    return
  }

  isRefreshing.value = true

  try {
    // 重新获取用户信息
    await fetchUserInfo()

    uni.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1000,
    })
  }
  catch (error) {
    uni.showToast({
      title: '刷新失败，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    // 停止下拉刷新
    uni.stopPullDownRefresh()

    // 延迟1秒重置防护状态，避免频繁误触
    setTimeout(() => {
      isRefreshing.value = false
    }, 1000)
  }
}

// 页面加载时获取用户信息
onLoad(async () => {
  await fetchUserInfo()
})

// 页面下拉刷新
onPullDownRefresh(() => {
  handlePullDownRefresh()
})

// 退出登录
function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        // 调用退出登录接口
        await logout()
        // 清除用户信息
        userStore.clearUserInfo()
        // 显示退出成功提示
        uni.showToast({
          title: '已退出登录',
          icon: 'success',
          duration: 1500,
        })
        // 延迟跳转到登录页
        setTimeout(() => {
          uni.redirectTo({
            url: '/pages/login/index',
          })
        }, 1500)
      }
    },
  })
}

// 编辑个人信息
function editProfile() {
  uni.navigateTo({
    url: '/pages-sub/profile/edit',
  })
}

// 跳转到关于我们页面
function gotoAboutStudio() {
  uni.navigateTo({
    url: '/pages-sub/about/studio',
  })
}

// 功能菜单列表
const menuItems = [
  {
    category: '个人管理',
    items: [
      { icon: '●', name: '个人资料', desc: '管理个人信息', action: editProfile, iconColor: 'text-blue-500' },
      { icon: '◆', name: '账号安全', desc: '密码、登录记录', action: gotoSecurity, iconColor: 'text-green-500' },
      { icon: '▲', name: '消息通知', desc: '通知设置', action: () => showToast('消息通知'), iconColor: 'text-orange-500' },
    ],
  },
  {
    category: '其他',
    items: [
      // #ifndef MP-WEIXIN
      { icon: '⚙', name: '系统设置', desc: '主题与通用设置', action: gotoSettings, iconColor: 'text-gray-500' },
      // #endif
      { icon: '■', name: '关于我们', desc: '工作室介绍与版本信息', action: gotoAboutStudio, iconColor: 'text-purple-500' },
      { icon: '▼', name: '退出登录', desc: '安全退出账号', action: handleLogout, danger: true, iconColor: 'text-red-500' },
    ],
  },
]

// 主题感知：深色模式与通用样式
const appStore = useAppStore()
// 修正：使用 theme 字段判断深色模式
const isDark = computed(() => appStore.theme === 'dark')

const textPrimaryClass = computed(() => isDark.value ? 'text-white/95' : 'text-gray-800')
const textSecondaryClass = computed(() => isDark.value ? 'text-white/70' : 'text-gray-600')
const textMutedClass = computed(() => isDark.value ? 'text-white/50' : 'text-gray-400')
const borderMutedClass = computed(() => isDark.value ? 'border-white/10' : 'border-gray-100')
const activeRowBgClass = computed(() => isDark.value ? 'active:bg-white/6' : 'active:bg-gray-50')

// #ifdef MP-WEIXIN

// 分享标题与图片
const shareTitle = computed(() => {
  return `个人中心`
})
const shareImageUrl = computed(() => {
  return systemUserInfo.value?.avatar || WECHAT_SHARE_IMAGE_URL
})

// 分享到好友消息
onShareAppMessage(() => ({
  title: shareTitle.value,
  path: '/pages/profile/index',
  imageUrl: shareImageUrl.value,
}))

// 分享到朋友圈
onShareTimeline(() => ({
  title: shareTitle.value,
  query: '',
  imageUrl: shareImageUrl.value,
}))
// #endif
</script>

<template>
  <view class="min-h-screen">
    <!-- 用户信息卡片 -->
    <view class="relative mx-4 pb-8 pt-6">
      <ThemeCard class="relative" radius="rounded-3xl" padding="p-6">
        <view class="relative z-10">
          <!-- 用户头像和基本信息 -->
          <view class="mb-6 flex items-center">
            <view class="relative">
              <image
                :src="systemUserInfo?.avatar || '/static/images/default-avatar.png'"
                class="h-16 w-16 border-2 border-white rounded-2xl shadow-md" mode="aspectFill"
              />
              <view class="absolute h-5 w-5 border-2 border-white rounded-full bg-green-400 -bottom-1 -right-1" />
            </view>

            <view class="ml-4 flex-1">
              <view class="mb-1 text-lg font-bold" :class="textPrimaryClass">
                {{ systemUserInfo?.username || '未登录' }}
              </view>
              <view v-if="systemUserInfo" class="text-sm" :class="textSecondaryClass">
                {{ systemUserInfo?.nickname || '暂无昵称' }}
              </view>
              <view v-if="systemUserInfo" class="mt-1 text-xs" :class="textMutedClass">
                {{ formatDept(systemUserInfo?.dept) }}
              </view>
            </view>
          </view>

          <!-- 账号状态标签 -->
          <view class="flex gap-2">
            <view class="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
              正常状态
            </view>
            <view
              v-if="systemUserInfo?.roles && systemUserInfo.roles.length > 0"
              class="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 font-medium"
            >
              {{ systemUserInfo.roles.length }}个角色
            </view>
          </view>
        </view>
      </ThemeCard>
    </view>

    <!-- 快捷操作 -->
    <view class="mx-4 mb-6">
      <view class="grid grid-cols-4 gap-3">
        <ThemeCard
          v-for="(action, index) in quickActions" :key="index"
          card-class="text-center transition-all active:scale-95" radius="rounded-2xl" padding="p-4"
        >
          <view @click="action.handler">
            <view
              class="mx-auto mb-2 h-10 w-10 flex items-center justify-center rounded-xl text-white"
              :class="action.color"
            >
              <wd-icon :name="action.icon" size="20px" color="white" />
            </view>
            <!-- #ifdef H5 -->
            <view class="whitespace-nowrap text-[11px] font-medium" :class="textPrimaryClass">
              {{ action.label }}
            </view>
            <!-- #endif -->
            <!-- #ifndef H5 -->
            <view class="whitespace-nowrap text-xs font-medium" :class="textPrimaryClass">
              {{ action.label }}
            </view>
            <!-- #endif -->
          </view>
        </ThemeCard>
      </view>
    </view>

    <!-- 个人信息详情 -->
    <ThemeCard v-if="systemUserInfo" card-class="mx-4 mb-6" :padding="false" radius="rounded-2xl">
      <view class="border-b px-4 py-3" :class="[borderMutedClass]">
        <view class="text-base font-semibold" :class="[textPrimaryClass]">
          <text class="mr-2 text-blue-500">
            ●
          </text>个人信息
        </view>
      </view>

      <view class="p-4">
        <view class="space-y-3">
          <view class="flex items-center justify-between py-2">
            <view class="text-sm" :class="textSecondaryClass">
              学号/工号
            </view>
            <view class="text-sm font-medium" :class="[textPrimaryClass]">
              {{ systemUserInfo.username }}
            </view>
          </view>

          <view class="flex items-center justify-between py-2">
            <view class="text-sm" :class="textSecondaryClass">
              姓名
            </view>
            <view class="text-sm font-medium" :class="[textPrimaryClass]">
              {{ systemUserInfo.nickname || '未设置' }}
            </view>
          </view>

          <view class="flex items-center justify-between py-2">
            <view class="text-sm" :class="textSecondaryClass">
              性别
            </view>
            <view class="text-sm font-medium" :class="[textPrimaryClass]">
              {{ formatSex(systemUserInfo.sex) }}
            </view>
          </view>

          <view v-if="systemUserInfo.mobile" class="flex items-center justify-between py-2">
            <view class="text-sm" :class="textSecondaryClass">
              手机号
            </view>
            <view class="text-sm font-medium" :class="[textPrimaryClass]">
              {{ systemUserInfo.mobile }}
            </view>
          </view>

          <view v-if="systemUserInfo.email" class="flex items-center justify-between py-2">
            <view class="text-sm" :class="textSecondaryClass">
              邮箱
            </view>
            <view class="break-all text-sm font-medium" :class="[textPrimaryClass]">
              {{ systemUserInfo.email }}
            </view>
          </view>

          <view class="flex items-center justify-between py-2">
            <view class="text-sm" :class="textSecondaryClass">
              所属部门
            </view>
            <view class="text-sm font-medium" :class="[textPrimaryClass]">
              {{ formatDept(systemUserInfo.dept) }}
            </view>
          </view>

          <view
            v-if="systemUserInfo.roles && systemUserInfo.roles.length > 0"
            class="flex items-start justify-between py-2"
          >
            <view class="pt-1 text-sm" :class="textSecondaryClass">
              用户角色
            </view>
            <view class="ml-4 flex-1 text-right text-sm font-medium" :class="[textPrimaryClass]">
              <view v-if="systemUserInfo.roles.length === 1" class="inline-block">
                {{ systemUserInfo.roles[0].name }}
              </view>
              <view v-else class="space-y-1">
                <view
                  v-for="role in systemUserInfo.roles" :key="role.id"
                  class="mb-1 mr-1 inline-block rounded-md bg-purple-50 px-2 py-1 text-xs text-purple-700"
                >
                  {{ role.name }}
                </view>
              </view>
            </view>
          </view>

          <view v-if="systemUserInfo.loginIp" class="flex items-center justify-between py-2">
            <view class="text-sm" :class="textSecondaryClass">
              最后登录IP
            </view>
            <view class="text-sm font-medium" :class="[textPrimaryClass]">
              {{ systemUserInfo.loginIp }}
            </view>
          </view>
        </view>
      </view>
    </ThemeCard>

    <!-- 功能菜单 -->
    <ThemeCard
      v-for="(category, categoryIndex) in menuItems" :key="categoryIndex" card-class="mx-4 mb-4"
      :padding="false" radius="rounded-2xl"
    >
      <view class="border-b px-4 py-3" :class="[borderMutedClass]">
        <view class="text-base font-semibold" :class="[textPrimaryClass]">
          {{ category.category }}
        </view>
      </view>

      <view class="p-2">
        <view
          v-for="(item, index) in category.items" :key="index"
          class="mx-1 my-1 flex items-center rounded-xl px-3 py-3 transition-colors" :class="[activeRowBgClass]"
          @click="item.action"
        >
          <view class="mr-3 text-lg" :class="item.iconColor || 'text-gray-500'">
            {{ item.icon }}
          </view>
          <view class="flex-1">
            <view class="text-sm font-medium" :class="[textPrimaryClass, { 'text-red-500': item.danger }]">
              {{ item.name }}
            </view>
            <view v-if="item.desc" class="mt-1 text-xs" :class="[textSecondaryClass]">
              {{ item.desc }}
            </view>
          </view>
          <view class="text-sm" :class="[textMutedClass]">
            ›
          </view>
        </view>
      </view>
    </ThemeCard>
  </view>
</template>

<style lang="scss">
/* 页面背景与底部覆盖层（非 scoped） */
</style>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>

<!-- 我的标签页 -->
<route lang="jsonc" type="page">
{
  "layout": "tabbar",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "个人中心",
    "enablePullDownRefresh": true,
    "navigationBarBackgroundColor": "#2563eb",
    "navigationBarTextStyle": "white"
  }
}
</route>

<script setup lang="ts">
import type { ISystemUserInfoVo } from '@/api/types/user'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'
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
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

// 系统用户信息
const systemUserInfo = ref<ISystemUserInfoVo | null>(null)
const loading = ref(false)
const isRefreshing = ref(false)

function showToast(title: string) {
  uni.showToast({
    title: `${title}功能开发中`,
    icon: 'none',
  })
}

function gotoSecurity() {
  uni.navigateTo({ url: '/pages-sub/profile/security' })
}

function gotoAttendance() {
  uni.navigateTo({ url: '/pages-sub/attendance/index' })
}

function gotoOJInfo() {
  uni.navigateTo({ url: '/pages-sub/oj/index' })
}

function gotoSummary() {
  uni.navigateTo({ url: '/pages-sub/summary/index' })
}

function gotoSettings() {
  uni.navigateTo({ url: '/pages-sub/profile/settings' })
}

function editProfile() {
  uni.navigateTo({ url: '/pages-sub/profile/edit' })
}

function gotoAboutStudio() {
  uni.navigateTo({ url: '/pages-sub/about/studio' })
}

function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        await logout()
        userStore.clearUserInfo()
        uni.showToast({ title: '已退出登录', icon: 'success', duration: 1500 })
        setTimeout(() => {
          uni.redirectTo({ url: '/pages/login/index' })
        }, 1500)
      }
    },
  })
}

// 快捷操作列表
const quickActions = [
  { icon: 'user', label: '编辑资料', color: 'bg-blue-500', handler: editProfile },
  { icon: 'lock-on', label: '账号安全', color: 'bg-green-500', handler: gotoSecurity },
  { icon: 'time', label: '考勤管理', color: 'bg-purple-500', handler: gotoAttendance },
  { icon: 'code', label: 'OJ信息', color: 'bg-orange-500', handler: gotoOJInfo },
]

// 功能菜单列表 (替换emoji为wd-icon)
const menuItems = [
  {
    category: '个人管理',
    items: [
      { icon: 'star', name: '年度总结', desc: '查看您的年度报告', action: gotoSummary, iconColor: 'text-yellow-500' },
      { icon: 'user', name: '个人资料', desc: '管理个人信息', action: editProfile, iconColor: 'text-blue-500' },
      { icon: 'lock-on', name: '账号安全', desc: '密码、登录记录', action: gotoSecurity, iconColor: 'text-green-500' },
      { icon: 'notification', name: '消息通知', desc: '通知设置', action: () => showToast('消息通知'), iconColor: 'text-orange-500' },
    ],
  },
  {
    category: '其他',
    items: [
      // #ifndef MP-WEIXIN
      { icon: 'setting', name: '系统设置', desc: '主题与通用设置', action: gotoSettings, iconColor: 'text-gray-500' },
      // #endif
      { icon: 'info-circle', name: '关于我们', desc: '工作室介绍与版本信息', action: gotoAboutStudio, iconColor: 'text-purple-500' },
      { icon: 'logout', name: '退出登录', desc: '安全退出账号', action: handleLogout, danger: true, iconColor: 'text-red-500' },
    ],
  },
]

function formatSex(sex: number) {
  switch (sex) {
    case 1: return '男'
    case 2: return '女'
    default: return '未知'
  }
}

function formatDept(dept: { id: number, name: string, parentId: number }) {
  if (!dept) return '暂无部门'
  if (dept.parentId && dept.parentId !== 0) {
    return `${dept.name}`
  }
  return dept.name
}

async function fetchUserInfo() {
  if (loading.value) return
  loading.value = true
  try {
    const res = await _getUserInfo()
    systemUserInfo.value = res.data
  }
  catch (error: any) {
    uni.showToast({ title: '获取用户信息失败', icon: 'none', duration: 2000 })
  }
  finally {
    loading.value = false
  }
}

async function handlePullDownRefresh() {
  if (isRefreshing.value) {
    uni.stopPullDownRefresh()
    return
  }
  isRefreshing.value = true
  try {
    await fetchUserInfo()
    uni.showToast({ title: '刷新成功', icon: 'success', duration: 1000 })
  }
  catch (error) {
    uni.showToast({ title: '刷新失败', icon: 'none', duration: 2000 })
  }
  finally {
    uni.stopPullDownRefresh()
    setTimeout(() => { isRefreshing.value = false }, 1000)
  }
}

onLoad(async () => {
  await fetchUserInfo()
})

onPullDownRefresh(() => {
  handlePullDownRefresh()
})

// 样式类
const textPrimaryClass = computed(() => isDark.value ? 'text-gray-100' : 'text-slate-800')
const textSecondaryClass = computed(() => isDark.value ? 'text-gray-400' : 'text-slate-500')
const textMutedClass = computed(() => isDark.value ? 'text-gray-500' : 'text-slate-400')
const borderMutedClass = computed(() => isDark.value ? 'border-white/10' : 'border-slate-100')
const activeRowBgClass = computed(() => isDark.value ? 'active:bg-white/5' : 'active:bg-slate-50')

// 动态设置背景色
function setPageBackgroundColor() {
  const bgColor = isDark.value ? '#020617' : '#f5f7fa'
  uni.setBackgroundColor({
    backgroundColor: bgColor,
    backgroundColorTop: bgColor,
    backgroundColorBottom: bgColor,
  })
}

watch(() => isDark.value, () => {
  setPageBackgroundColor()
})

// #ifdef MP-WEIXIN
const shareTitle = computed(() => `个人中心`)
const shareImageUrl = computed(() => systemUserInfo.value?.avatar || WECHAT_SHARE_IMAGE_URL)
onShareAppMessage(() => ({
  title: shareTitle.value,
  path: '/pages/profile/index',
  imageUrl: shareImageUrl.value,
}))
onShareTimeline(() => ({
  title: shareTitle.value,
  query: '',
  imageUrl: shareImageUrl.value,
}))
// #endif
</script>

<template>
  <view class="relative min-h-screen bg-[#f5f7fa] dark:bg-slate-950">
    <!-- 顶部背景 -->
    <view class="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#2563eb] to-[#3b82f6] rounded-b-[1.5rem] shadow-sm z-0" />

    <!-- 头部区域 -->
    <view class="relative z-10 pt-14 px-5 pb-3 text-white">
      <view class="flex justify-between items-center mb-1">
         <view class="text-xl font-bold opacity-95 tracking-wide text-shadow-sm">个人中心</view>
      </view>
    </view>

    <!-- 用户信息卡片 -->
    <view class="relative z-10 px-4 mt-2">
      <ThemeCard card-class="mb-6 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] dark:shadow-blue-900/20 overflow-hidden border-0" :padding="false">
        <view class="p-5 bg-white dark:bg-slate-800">
           <view class="flex items-center gap-4">
             <view class="relative">
               <image
                  :src="systemUserInfo?.avatar || '/static/images/default-avatar.png'"
                  class="h-16 w-16 rounded-full border-2 border-slate-100 dark:border-slate-700 shadow-sm"
                  mode="aspectFill"
               />
               <view class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" />
             </view>
             <view class="flex-1 min-w-0">
               <view class="text-lg font-bold mb-1 truncate" :class="textPrimaryClass">
                 {{ systemUserInfo?.nickname || systemUserInfo?.username || '未登录' }}
               </view>
               <view class="text-xs opacity-80 mb-2 truncate" :class="textSecondaryClass">
                 {{ formatDept(systemUserInfo?.dept) }}
               </view>
               <view class="flex gap-2">
                 <view class="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-100 dark:border-blue-500/20">
                   正常状态
                 </view>
                 <view v-if="systemUserInfo?.roles?.length" class="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-medium border border-purple-100 dark:border-purple-500/20">
                   {{ systemUserInfo.roles[0].name }}
                 </view>
               </view>
             </view>
           </view>
        </view>
      </ThemeCard>
    </view>

    <!-- 主要内容区 -->
    <view class="px-4 pb-24 space-y-4">
       <!-- 快捷操作 -->
       <ThemeCard :padding="false">
         <view class="grid grid-cols-4 py-4">
           <view
              v-for="(action, index) in quickActions"
              :key="index"
              class="flex flex-col items-center gap-2 active:opacity-70 transition-opacity"
              @click="action.handler"
           >
              <view class="h-10 w-10 flex items-center justify-center rounded-xl text-white shadow-sm" :class="action.color">
                <wd-icon :name="action.icon" size="20px" />
              </view>
              <view class="text-xs font-medium" :class="textPrimaryClass">{{ action.label }}</view>
           </view>
         </view>
       </ThemeCard>

       <!-- 菜单列表 -->
       <view v-for="(category, index) in menuItems" :key="index">
         <view class="mb-2 px-1 text-xs font-bold opacity-60" :class="textSecondaryClass">
           {{ category.category }}
         </view>
         <ThemeCard :padding="false" card-class="overflow-hidden">
           <view class="divide-y" :class="borderMutedClass">
             <view
               v-for="(item, idx) in category.items"
               :key="idx"
               class="flex items-center gap-3 px-4 py-4 transition-colors cursor-pointer"
               :class="activeRowBgClass"
               @click="item.action"
             >
               <view class="text-lg flex-shrink-0" :class="item.iconColor">
                 <wd-icon :name="item.icon" size="18px" />
               </view>
               <view class="flex-1 min-w-0">
                 <view class="flex items-center justify-between">
                   <view class="text-sm font-medium" :class="[textPrimaryClass, item.danger ? 'text-red-500' : '']">
                     {{ item.name }}
                   </view>
                   <view class="text-[10px] opacity-60" :class="textSecondaryClass">
                     {{ item.desc }}
                   </view>
                 </view>
               </view>
               <wd-icon name="arrow-right" size="14px" class="text-slate-300" />
             </view>
           </view>
         </ThemeCard>
       </view>

    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
  -webkit-appearance: none;
  background: transparent;
}
</style>

<style>
/* 强制覆盖 page 背景色 */
page {
  background-color: #f5f7fa;
}
.dark page {
  background-color: #020617;
}
</style>

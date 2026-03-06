<!-- 通讯录标签页 -->
<route lang="jsonc" type="page">
{
  "layout": "tabbar",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "通讯录",
    "enablePullDownRefresh": true,
    "navigationBarBackgroundColor": "#2563eb",
    "navigationBarTextStyle": "white"
  }
}
</route>

<script setup lang="ts">
import { onHide, onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'
import { getDeptTreeUsers } from '@/api/user'
import { useAppStore } from '@/store/app'
import ThemeCard from '@/components/ThemeCard.vue'

defineOptions({ name: 'Contact' })

// 页面状态
const loading = ref(false)
const isRefreshing = ref(false)

// 部门层级导航
const currentDept = ref<{ id: number, name: string }>({ id: 0, name: '组织架构' })
const breadcrumbs = ref<Array<{ id: number, name: string }>>([{ id: 0, name: '组织架构' }])

// 数据
const deptChildren = ref([])
const users = ref([])

// 加载部门与成员
async function loadDept(deptId: number) {
  loading.value = true
  try {
    const res = await getDeptTreeUsers(deptId)
    const name = res.data.dept?.name || (deptId === 0 ? '组织架构' : '部门')
    currentDept.value = { id: deptId, name }
    
    const idx = breadcrumbs.value.findIndex(b => b.id === deptId)
    if (idx === -1) {
      breadcrumbs.value.push({ id: deptId, name })
    }
    else {
      breadcrumbs.value = breadcrumbs.value.slice(0, idx + 1)
    }

    deptChildren.value = res.data.children || []
    users.value = res.data.users || []
  }
  catch (error) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
    isRefreshing.value = false
  }
}

function navigateToDept(dept: { id: number, name: string }) {
  loadDept(dept.id)
}

function getAvatarText(name: string) {
  if (!name) return '用户'
  const s = String(name).trim()
  if (s.length <= 2) return s
  return s.slice(s.length - 2)
}

function goToCrumb(index: number) {
  const target = breadcrumbs.value[index]
  if (target) {
    breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
    loadDept(target.id)
  }
}

onPullDownRefresh(async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  await loadDept(currentDept.value.id)
  uni.stopPullDownRefresh()
})

onShow(async () => {
  const jumpDeptId = uni.getStorageSync('contactJumpDeptId')
  if (jumpDeptId) {
    uni.removeStorageSync('contactJumpDeptId')
    await loadDept(Number(jumpDeptId))
    return
  }

  const cache = uni.getStorageSync('contactPageCache')
  if (cache && cache.currentDept && Array.isArray(cache.users) && Array.isArray(cache.deptChildren)) {
    currentDept.value = cache.currentDept
    breadcrumbs.value = cache.breadcrumbs || [{ id: 0, name: '组织架构' }]
    deptChildren.value = cache.deptChildren || []
    users.value = cache.users || []
    loading.value = false
    isRefreshing.value = false
  }
})

function goToUserProfile(userId: string) {
  uni.navigateTo({ url: `/pages-sub/contact/profile?id=${userId}` })
}

function saveContactCache() {
  try {
    uni.setStorageSync('contactPageCache', {
      currentDept: currentDept.value,
      breadcrumbs: breadcrumbs.value,
      deptChildren: deptChildren.value,
      users: users.value,
      timestamp: Date.now(),
    })
  }
  catch (e) {}
}

onHide(() => {
  saveContactCache()
})

onLoad(async () => {
  uni.removeStorageSync('contactPageCache')
  await loadDept(0)
})

// 主题适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const borderMutedClass = computed(() => (isDark.value ? 'divide-white/10' : 'divide-slate-100'))
const iconMutedBgClass = computed(() => (isDark.value ? 'bg-white/10' : 'bg-slate-100'))

// 动态设置背景色
function setPageBackgroundColor() {
  const bgColor = isDark.value ? '#020617' : '#f5f7fa'
  const api = (uni as any).setBackgroundColor
  if (typeof api !== 'function')
    return
  api({
    backgroundColor: bgColor,
    backgroundColorTop: bgColor,
    backgroundColorBottom: bgColor,
  })
}

watch(() => isDark.value, () => {
  setPageBackgroundColor()
})
</script>

<template>
  <view class="relative min-h-screen bg-[#f5f7fa] dark:bg-slate-950">
    <!-- 顶部背景 -->
    <view class="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#2563eb] to-[#3b82f6] rounded-b-[1.5rem] shadow-sm z-0" />

    <!-- 头部区域 -->
    <view class="relative z-10 pt-14 px-5 pb-3 text-white">
      <view class="flex justify-between items-center mb-1">
         <view class="text-xl font-bold opacity-95 tracking-wide text-shadow-sm">通讯录</view>
      </view>
    </view>

    <!-- 面包屑卡片 -->
    <view class="relative z-10 px-4 mt-2">
      <ThemeCard card-class="mb-4 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] dark:shadow-blue-900/20 border-0" :padding="false">
        <view class="p-4 bg-white dark:bg-slate-800 rounded-2xl">
           <!-- 面包屑 -->
           <view class="flex flex-wrap items-center text-xs">
              <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
                <view
                  class="mr-1 cursor-pointer font-medium leading-6 transition-colors"
                  :class="index === breadcrumbs.length - 1 ? textSecondaryClass : 'text-blue-600 dark:text-blue-400'"
                  @tap="goToCrumb(index)"
                >
                  {{ crumb.name }}
                </view>
                <wd-icon v-if="index < breadcrumbs.length - 1" name="arrow-right" size="10px" class="mx-1 text-slate-300" />
              </template>
           </view>
        </view>
      </ThemeCard>
    </view>

    <!-- 列表内容区 -->
    <view class="px-4 pb-24">
       <ThemeCard :padding="false" card-class="overflow-hidden">
         <view class="divide-y" :class="borderMutedClass">
           <!-- 部门列表 -->
           <view
              v-for="dept in deptChildren"
              :key="`dept-${dept.id}`"
              class="flex items-center justify-between px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
              @click="navigateToDept(dept)"
            >
              <view class="flex items-center gap-3">
                 <view class="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <wd-icon name="folder" size="20px" />
                 </view>
                 <view class="text-sm font-medium" :class="textPrimaryClass">{{ dept.name }}</view>
              </view>
              <wd-icon name="arrow-right" size="14px" class="text-slate-300" />
           </view>

           <!-- 成员列表 -->
           <view
              v-for="user in users"
              :key="`user-${user.id}`"
              class="flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
              @tap="goToUserProfile(user.id)"
            >
              <view class="h-10 w-10 flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 dark:border-slate-700" :class="iconMutedBgClass">
                <image v-if="user.avatar" :src="user.avatar" mode="aspectFill" class="h-full w-full" />
                <view v-else class="text-xs font-bold" :class="textSecondaryClass">
                  {{ getAvatarText(user.nickname) }}
                </view>
              </view>
              <view class="min-w-0 flex-1">
                <view class="flex items-center gap-2 mb-0.5">
                  <view class="truncate text-sm font-medium" :class="textPrimaryClass">
                    {{ user.nickname }}
                  </view>
                  <view class="flex flex-wrap items-center gap-1">
                    <view
                      v-for="(role, idx) in user.roles.slice(0, 3)"
                      :key="idx"
                      class="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    >
                      {{ role }}
                    </view>
                  </view>
                </view>
              </view>
            </view>
         </view>
         
         <!-- 空状态 -->
         <view v-if="!loading && deptChildren.length === 0 && users.length === 0" class="py-12 flex flex-col items-center justify-center opacity-40">
            <wd-icon name="user-circle" size="32px" color="#94a3b8" class="mb-2" />
            <view class="text-sm text-slate-400">暂无数据</view>
         </view>
       </ThemeCard>
       
       <!-- 加载中 -->
       <view v-if="loading" class="mt-4">
          <wd-skeleton theme="paragraph" />
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

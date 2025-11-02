<!-- 通讯录标签页（钉钉风格） -->
<route lang="jsonc" type="page">
{
  "layout": "tabbar",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "通讯录",
    "enablePullDownRefresh": true
  }
}
</route>

<script setup lang="ts">
import { onHide, onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getDeptTreeUsers } from '@/api/user'
import { useAppStore } from '@/store/app'

defineOptions({ name: 'Contact' })

// 页面状态
const loading = ref(false)
const isRefreshing = ref(false)
const searchKeyword = ref('')

// 部门层级导航
const currentDept = ref<{ id: number, name: string }>({ id: 0, name: '组织架构' })
const breadcrumbs = ref<Array<{ id: number, name: string }>>([{ id: 0, name: '组织架构' }])

// 数据
const deptChildren = ref([])
const users = ref([])

// 过滤后的数据（仿钉钉：顶部搜索框关键字过滤）
const filteredChildren = computed(() => {
  const kw = searchKeyword.value.trim()
  if (!kw)
    return deptChildren.value
  return deptChildren.value.filter(d => d.name.includes(kw))
})

const filteredUsers = computed(() => {
  return users.value
})

// 加载部门与成员（默认 id=0 加载顶层）
async function loadDept(deptId: number) {
  loading.value = true
  try {
    const res = await getDeptTreeUsers(deptId, searchKeyword.value ? { keyword: searchKeyword.value } : undefined)
    // 接口返回结构：res.data = { dept, children, users, transMap }
    const name = res.data.dept?.name || (deptId === 0 ? '组织架构' : '部门')
    currentDept.value = { id: deptId, name }
    // 顶层或子层：刷新面包屑
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

// 进入子部门
function navigateToDept(dept: { id: number, name: string }) {
  loadDept(dept.id)
}

// 头像文字（保留两个字；三字名去掉姓，取后两字）
function getAvatarText(name: string) {
  if (!name)
    return '用户'
  const s = String(name).trim()
  if (s.length <= 2)
    return s
  return s.slice(s.length - 2)
}

// 面包屑返回到指定层级
function goToCrumb(index: number) {
  const target = breadcrumbs.value[index]
  if (target) {
    breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
    loadDept(target.id)
  }
}

// 搜索模式：同页展示用户搜索结果
const isSearching = ref(false)
const searchLoading = ref(false)
const searchResults = ref([])

// 下拉刷新
onPullDownRefresh(async () => {
  if (isRefreshing.value)
    return
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

  // 读取缓存，避免返回后重置到顶层
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
  console.log(userId)
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
  catch (e) {
    // ignore
  }
}

onHide(() => {
  saveContactCache()
})

onLoad(async () => {
  // 首次进入从顶层加载（并清理旧缓存）
  uni.removeStorageSync('contactPageCache')
  await loadDept(0)
})

// 主题适配：浅色/深色
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const cardBgClass = computed(() =>
  isDark.value
    ? 'bg-[#0b1220] border border-white/15 shadow-lg'
    : 'bg-white border border-gray-100 shadow-sm',
)
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-900'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-600'))
const borderMutedClass = computed(() => (isDark.value ? 'divide-white/10' : 'divide-gray-100'))
const iconMutedBgClass = computed(() => (isDark.value ? 'bg-white/20' : 'bg-gray-100'))
const contactBottomStyle = computed(() => ({
  background: isDark.value
    ? 'linear-gradient(180deg, #0b1220 0%, #0f172a 35%, #0f172a 100%)'
    : 'linear-gradient(180deg, #f6f8fc 0%, #eef2f7 35%, #eef2f7 100%)',
}))
</script>

<template>
  <view class="min-h-screen">
    <!-- 搜索模式：同页搜索结果视图 -->
    <view v-if="isSearching" class="px-4 pt-2">
      <view v-if="searchLoading" class="p-2">
        <wd-skeleton theme="paragraph" />
      </view>
      <view v-else-if="!searchKeyword.trim()" class="py-8 text-center text-gray-500">
        请输入关键词进行搜索
      </view>
      <view v-else-if="searchResults.length > 0" class="pt-2">
        <view class="overflow-hidden rounded-lg" :class="[cardBgClass]">
          <view class="divide-y" :class="[borderMutedClass]">
            <view
              v-for="user in searchResults"
              :key="`user-${user.id}`"
              class="flex items-center gap-3 px-4 py-3"
              @tap="goToUserProfile(user.id)"
            >
              <view class="h-8 w-8 flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full" :class="iconMutedBgClass">
                <image v-if="user.avatar" :src="user.avatar" mode="aspectFill" class="h-full w-full" />
                <view v-else class="h-full w-full flex items-center justify-center text-xs" :class="textSecondaryClass">
                  {{ getAvatarText(user.nickname) }}
                </view>
              </view>
              <view class="min-w-0 flex-1">
                <view class="flex items-center gap-2">
                  <view class="truncate text-sm" :class="textPrimaryClass">
                    {{ user.nickname }}
                  </view>
                  <view class="flex flex-wrap items-center gap-1">
                    <wd-tag
                      v-for="(role, idx) in user.roles.slice(0, 3)"
                      :key="idx"
                      size="small"
                      type="primary"
                      plain
                    >
                      {{ role }}
                    </wd-tag>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="py-8 text-center" :class="textSecondaryClass">
        未找到相关内容
      </view>
    </view>

    <!-- 面包屑导航（仿钉钉） -->
    <view v-if="!isSearching" class="px-4 py-2">
      <view class="flex flex-wrap items-center text-xs" :class="textSecondaryClass">
        <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
          <view
            class="mr-1 cursor-pointer text-blue-600 leading-6"
            @tap="goToCrumb(index)"
          >
            {{ crumb.name }}
          </view>
          <wd-icon v-if="index < breadcrumbs.length - 1" name="arrow-right" size="12px" color="#bbb" custom-class="mx-1" />
        </template>
      </view>
    </view>

    <!-- 合并列表（部门 + 联系人，钉钉风格） -->
    <view v-if="!isSearching && !loading && (filteredChildren.length > 0 || filteredUsers.length > 0)" class="px-4 pt-2">
      <view class="overflow-hidden rounded-lg" :class="[cardBgClass]">
        <wd-cell-group>
          <!-- 部门项 -->
          <wd-cell
            v-for="dept in filteredChildren"
            :key="`dept-${dept.id}`"
            :use-title-slot="true"
            label="进入查看成员与下级部门"
            is-link
            clickable
            center
            @click="navigateToDept(dept)"
          >
            <template #title>
              <view class="flex items-center">
                <text class="text-sm" :class="textPrimaryClass">
                  {{ dept.name }}
                </text>
              </view>
            </template>
          </wd-cell>
        </wd-cell-group>

        <view class="divide-y" :class="[borderMutedClass]">
          <view
            v-for="user in filteredUsers"
            :key="`user-${user.id}`"
            class="flex items-center gap-3 px-4 py-3"
            @tap="goToUserProfile(user.id)"
          >
            <view class="h-8 w-8 flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full" :class="iconMutedBgClass">
              <image v-if="user.avatar" :src="user.avatar" mode="aspectFill" class="h-full w-full" />
              <view v-else class="h-full w-full flex items-center justify-center text-xs" :class="textSecondaryClass">
                {{ getAvatarText(user.nickname) }}
              </view>
            </view>
            <view class="min-w-0 flex-1">
              <view class="flex items-center gap-2">
                <view class="truncate text-sm" :class="textPrimaryClass">
                  {{ user.nickname }}
                </view>
                <view class="flex flex-wrap items-center gap-1">
                  <wd-tag
                    v-for="(role, idx) in user.roles.slice(0, 3)"
                    :key="idx"
                    type="primary"
                    plain
                  >
                    {{ role }}
                  </wd-tag>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="!isSearching && loading" class="px-4">
      <view class="p-2">
        <wd-skeleton theme="paragraph" />
      </view>
    </view>

    <!-- 空状态提示 -->
    <view v-if="!isSearching && !loading && filteredChildren.length === 0 && filteredUsers.length === 0" class="px-4 py-8">
      <view class="text-center" :class="textSecondaryClass">
        <view v-if="searchKeyword.trim()">
          未找到相关内容
        </view>
        <view v-else>
          暂无数据
        </view>
      </view>
    </view>

    <wd-button
      v-if="isRefreshing"
      class="fixed bottom-4 right-4"
      type="primary"
      size="small"
    >
      刷新中...
    </wd-button>
  </view>
  <!-- 底部覆盖层：避免 H5 TabBar 占位符白底影响整体背景 -->
  <view
    class="contact-bottom-bg fixed bottom-0 left-0 right-0 z-0"
    :style="contactBottomStyle"
    style="height: calc(env(safe-area-inset-bottom) + 100rpx);"
  />
</template>

<style lang="scss">
</style>

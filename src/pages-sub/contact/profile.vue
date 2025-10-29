<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "个人主页",
    "navigationStyle": "default",
    "enablePullDownRefresh": true,
    "backgroundTextStyle": "dark"
  }
}
</route>

<script setup lang="ts">
import type { ISystemUserInfoVo } from '@/api/types/user'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getUserProfile } from '@/api/user'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'

defineOptions({ name: 'ContactUserProfile' })

const loading = ref(false)
const userId = ref<number | null>(null)
const profile = ref<ISystemUserInfoVo | null>(null)

// 深色模式适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const pageClass = computed(() => (isDark.value ? 'bg-gray-900' : 'bg-gray-50'))
const titleClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-900'))
const subTextClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-500'))
const avatarBgClass = computed(() => (isDark.value ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'))

function sexLabel(v?: number) {
  if (v === 1)
    return '男'
  if (v === 2)
    return '女'
  return '未知'
}

async function fetchProfile(id?: number) {
  const targetId = typeof id === 'number' ? id : userId.value ?? undefined
  if (!targetId)
    return
  loading.value = true
  try {
    const res = await getUserProfile(targetId)
    profile.value = res.data ?? null
  }
  catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

onLoad((query) => {
  const id = query?.id
  if (!id)
    return
  userId.value = id
  fetchProfile(id)
})

onPullDownRefresh(async () => {
  await fetchProfile()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="min-h-screen" :class="pageClass">
    <view v-if="loading" class="px-4 py-4">
      <wd-skeleton theme="paragraph" />
    </view>

    <view v-else-if="profile" class="px-4 pb-20 pt-4">
      <!-- 顶部信息卡：采用全局 ThemeCard -->
      <ThemeCard padding="p-4">
        <view class="flex items-center gap-3">
          <view class="h-14 w-14 flex items-center justify-center overflow-hidden rounded-full" :class="avatarBgClass">
            <image v-if="profile.avatar" :src="profile.avatar" mode="aspectFill" class="h-full w-full" />
            <view v-else class="h-full w-full flex items-center justify-center text-base">
              {{ (profile.nickname || profile.username || '用户').slice(-2) }}
            </view>
          </view>
          <view class="min-w-0 flex-1">
            <view class="flex items-center gap-2">
              <text class="truncate text-base" :class="titleClass">
                {{ profile.nickname || profile.username }}
              </text>
            </view>
            <view class="mt-1 text-xs" :class="subTextClass">
              {{ profile.schoolDeptName || '' }}
            </view>
          </view>
        </view>
      </ThemeCard>

      <!-- 详细信息：采用全局 ThemeCard -->
      <ThemeCard card-class="mt-4" padding="p-2">
        <wd-cell-group>
          <wd-cell title="账号" :value="profile.username" center />
          <wd-cell title="姓名" :value="profile.nickname" center />
          <wd-cell title="性别" :value="sexLabel(profile.sex)" center />
          <wd-cell title="手机号" :value="profile.mobile || '—'" center />
          <wd-cell title="邮箱" :value="profile.email || '—'" center />
          <wd-cell title="所属部门" :value="profile.dept?.name || '—'" center />
          <wd-cell
            :use-title-slot="true"
            :use-value-slot="true"
            center
          >
            <template #title>
              角色
            </template>
            <template #default>
              <view class="flex flex-wrap justify-end gap-2">
                <wd-tag
                  v-for="(role, idx) in (profile.roles || []).slice(0, 3)"
                  :key="idx"
                  type="primary"
                  plain
                  size="small"
                >
                  {{ role?.name }}
                </wd-tag>
                <text v-if="!profile.roles || profile.roles.length === 0" :class="subTextClass">
                  —
                </text>
              </view>
            </template>
          </wd-cell>
        </wd-cell-group>
      </ThemeCard>
    </view>

    <view v-else class="px-4 py-8 text-center" :class="subTextClass">
      暂无数据
    </view>
  </view>
</template>

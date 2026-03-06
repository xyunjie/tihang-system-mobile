<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "成员详情",
    "navigationStyle": "default",
    "enablePullDownRefresh": true
  }
}
</route>

<script setup lang="ts">
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getTeamMemberList } from '@/api/project'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'

defineOptions({ name: 'ProjectMemberDetail' })

const loading = ref(false)
const lastOptions = ref<Record<string, any>>({})

const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const titleClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-900'))
const subTextClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-500'))
const avatarBgClass = computed(() => (isDark.value ? 'bg-white/10 text-gray-200' : 'bg-slate-100 text-slate-700'))

const profile = ref({
  teamId: '',
  userId: '',
  nickname: '',
  className: '',
  role: '',
  studentNo: '',
  phone: '',
  intro: '',
  joinTime: '',
})

function tryDecode(raw: any): string {
  if (raw === undefined || raw === null)
    return ''
  const str = String(raw)
  try {
    return decodeURIComponent(str)
  }
  catch {
    return str
  }
}

function getAvatarText(name: string) {
  if (!name)
    return '用户'
  const s = String(name).trim()
  if (s.length <= 2)
    return s
  return s.slice(s.length - 2)
}

function getRoleText(roleRaw: string): string {
  const role = String(roleRaw || '').toLowerCase()
  if (['captain', 'leader', 'owner', 'manager', '队长'].includes(role))
    return '队长'
  if (role === 'member' || role === '成员')
    return '成员'
  return roleRaw || '成员'
}

function mergeFromOptions(options?: Record<string, any>) {
  const o = options || {}
  profile.value.teamId = tryDecode(o.teamId || profile.value.teamId)
  profile.value.userId = tryDecode(o.userId || profile.value.userId)
  profile.value.nickname = tryDecode(o.name || profile.value.nickname)
  profile.value.className = tryDecode(o.className || profile.value.className)
  profile.value.role = getRoleText(tryDecode(o.role || profile.value.role))
  profile.value.studentNo = tryDecode(o.studentNo || profile.value.studentNo)
  profile.value.phone = tryDecode(o.phone || profile.value.phone)
  profile.value.intro = tryDecode(o.intro || profile.value.intro)
  profile.value.joinTime = tryDecode(o.joinTime || profile.value.joinTime)
}

async function fetchProfile(options?: Record<string, any>) {
  mergeFromOptions(options)

  const teamId = Number(profile.value.teamId || 0)
  const userId = Number(profile.value.userId || 0)

  if (teamId > 0 && userId > 0) {
    try {
      const res = await getTeamMemberList(teamId, 1, 200)
      if (res.code === 0 && res.data?.length) {
        const target = res.data.find((m: any) => Number(m.userId) === userId)
        if (target) {
          profile.value.nickname = target.userName || target.nickname || profile.value.nickname
          profile.value.className = target.className || target.class || profile.value.className
          profile.value.role = getRoleText(target.role || (target.isCaptain ? 'captain' : profile.value.role))
          profile.value.studentNo = target.studentNo || profile.value.studentNo
          profile.value.phone = target.phone || profile.value.phone
          profile.value.intro = target.intro || target.remark || profile.value.intro
          profile.value.joinTime = target.joinTime || profile.value.joinTime
        }
      }
    }
    catch (error) {
      console.error('获取成员详情失败:', error)
    }
  }

  uni.setNavigationBarTitle({ title: `${profile.value.nickname || '成员'}的详情` })
}

onLoad(async (options) => {
  loading.value = true
  lastOptions.value = { ...(options || {}) }
  try {
    await fetchProfile(lastOptions.value)
  }
  finally {
    loading.value = false
  }
})

onPullDownRefresh(async () => {
  await fetchProfile(lastOptions.value)
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="min-h-screen">
    <view v-if="loading" class="px-4 py-4">
      <wd-skeleton theme="paragraph" />
    </view>

    <view v-else class="px-4 pb-20 pt-4">
      <ThemeCard padding="p-4">
        <view class="flex items-center gap-3">
          <view class="h-14 w-14 flex items-center justify-center overflow-hidden rounded-full" :class="avatarBgClass">
            <view class="h-full w-full flex items-center justify-center text-base font-semibold">
              {{ getAvatarText(profile.nickname) }}
            </view>
          </view>
          <view class="min-w-0 flex-1">
            <view class="flex items-center gap-2">
              <text class="truncate text-base" :class="titleClass">
                {{ profile.nickname || '-' }}
              </text>
            </view>
            <view class="mt-1 text-xs" :class="subTextClass">
              {{ profile.className || '' }}
            </view>
          </view>
        </view>
      </ThemeCard>

      <ThemeCard card-class="mt-4" padding="p-2">
        <wd-cell-group>
          <wd-cell title="角色" :value="profile.role || '—'" center />
          <wd-cell title="班级" :value="profile.className || '—'" center />
          <wd-cell title="学号" :value="profile.studentNo || '—'" center />
          <wd-cell title="手机号" :value="profile.phone || '—'" center />
          <wd-cell title="加入时间" :value="profile.joinTime ? profile.joinTime.split(' ')[0] : '—'" center />
          <wd-cell title="简介" :value="profile.intro || '—'" center />
        </wd-cell-group>
      </ThemeCard>
    </view>
  </view>
</template>

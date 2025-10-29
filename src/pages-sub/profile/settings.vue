<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "系统设置"
  }
}
</route>

<script setup lang="ts">
import { computed } from 'vue'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'

defineOptions({ name: 'SystemSettings' })

const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

const pageClass = computed(() => isDark.value ? 'bg-[#0b1220]' : 'bg-gray-50')
const titleClass = computed(() => isDark.value ? 'text-white/95' : 'text-gray-900')
const textClass = computed(() => isDark.value ? 'text-white/70' : 'text-gray-600')

type Pref = 'light' | 'dark' | 'system'
const prefList: { key: Pref, label: string }[] = [
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '深色' },
  { key: 'system', label: '跟随系统' },
]

// 与 store 双向联动：读取当前偏好并在变更时写回
const currentPref = computed<Pref>({
  get: () => appStore.themePreference as Pref,
  set: (p: Pref) => setPref(p),
})
function setPref(p: Pref) {
  appStore.setThemePreference(p)
  if (p === 'system') {
    try {
      appStore.initThemeFromSystem()
    }
    catch (e) {
      // ignore
    }
  }
  const label = prefList.find(i => i.key === p)?.label || ''
  uni.showToast({ title: `已切换为${label}`, icon: 'none' })
}

function handlePrefChange(val: Pref) {
  setPref(val)
}
</script>

<template>
  <view :class="pageClass" class="min-h-screen">
    <view class="p-4 space-y-4">
      <!-- 显示与主题 -->
      <ThemeCard radius="rounded-2xl" padding="p-4">
        <view class="flex items-center justify-between">
          <view :class="titleClass" class="text-base font-semibold">
            显示与主题
          </view>
          <view :class="textClass" class="text-xs">
            当前：{{ prefList.find(i => i.key === currentPref)?.label }}
          </view>
        </view>
        <view class="mt-3">
          <wd-radio-group :model-value="currentPref" shape="button" @change="handlePrefChange">
            <wd-radio v-for="opt in prefList" :key="opt.key" :value="opt.key">
              {{ opt.label }}
            </wd-radio>
          </wd-radio-group>
        </view>
      </ThemeCard>
    </view>
  </view>
</template>

<style scoped>
</style>

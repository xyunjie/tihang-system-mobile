<script lang="ts" setup>
import { computed } from 'vue'
import type { ConfigProviderThemeVars } from 'wot-design-uni'
import { useAppStore, themeColorMap } from '@/store/app'

const appStore = useAppStore()

const themeVars = computed<ConfigProviderThemeVars>(() => {
  const color = themeColorMap[appStore.themeColor]
  return {
    colorTheme: color,
  }
})

const rootStyle = computed(() => {
  const color = themeColorMap[appStore.themeColor]
  return {
    '--color-primary': color,
    '--wot-color-theme': color,
  }
})
</script>

<template>
  <wd-config-provider :theme-vars="themeVars" :theme="appStore.theme" :style="rootStyle">
    <!-- #ifndef MP-WEIXIN -->
    <view class="h-5" />
    <!-- #endif -->
    <slot />
    <!-- #ifndef MP-WEIXIN -->
    <view class="h-5" />
    <!-- #endif -->
    <wd-toast />
    <wd-message-box />
  </wd-config-provider>
</template>

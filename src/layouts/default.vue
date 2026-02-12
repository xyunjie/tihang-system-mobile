<script lang="ts" setup>
import type { ConfigProviderThemeVars } from 'wot-design-uni'
import { computed } from 'vue'
import { themeColorMap, useAppStore } from '@/store/app'

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
    <slot />
    <wd-toast />
    <wd-message-box />
  </wd-config-provider>
</template>

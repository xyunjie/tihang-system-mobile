<script lang="ts" setup>
import type { ConfigProviderThemeVars } from 'wot-design-uni'
import { useAppStore } from '@/store/app'

const themeVars: ConfigProviderThemeVars = {
  // colorTheme: 'red',
  // buttonPrimaryBgColor: '#07c160',
  // buttonPrimaryColor: '#07c160',
}

const appStore = useAppStore()
</script>

<template>
  <wd-config-provider :theme-vars="themeVars" :theme="appStore.theme">
    <slot />
    <wd-toast />
    <wd-message-box />
  </wd-config-provider>
</template>

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

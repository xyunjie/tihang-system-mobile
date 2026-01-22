<!-- 通用 WebView 页面 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "网页"
  },
  "notLogin": true
}
</route>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'

const webViewUrl = ref('')

onLoad((options: any) => {
  if (options?.url) {
    webViewUrl.value = decodeURIComponent(options.url)
  }
})
</script>

<template>
  <view class="webview-container">
    <!-- #ifdef H5 -->
    <!-- H5 使用 iframe -->
    <iframe
      v-if="webViewUrl"
      :src="webViewUrl"
      class="webview-frame"
      frameborder="0"
    />
    <!-- #endif -->

    <!-- #ifdef MP-WEIXIN || MP-ALIPAY || MP-TOUTIAO || MP-BAIDU || MP-QQ -->
    <!-- 小程序使用 web-view 组件 -->
    <web-view v-if="webViewUrl" :src="webViewUrl" />
    <!-- #endif -->

    <!-- #ifdef APP -->
    <!-- App 使用 web-view 组件 -->
    <web-view v-if="webViewUrl" :src="webViewUrl" />
    <!-- #endif -->
  </view>
</template>

<style scoped>
.webview-container {
  width: 100%;
  height: 100vh;
}

.webview-frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>

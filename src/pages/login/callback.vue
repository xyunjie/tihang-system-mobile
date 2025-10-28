<route lang="jsonc" type="page">
{
  "layout": "default",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "正在登录",
    "enablePullDownRefresh": false,
    "disableScroll": true
  },
  "notLogin": true
}
</route>

<script setup lang="ts">
import { useUserStore } from '@/store'
import { currRoute } from '@/utils'

const userStore = useUserStore()
const loginRoute = import.meta.env.VITE_LOGIN_URL

function redirectToTarget(target?: string) {
  const dest = target || '/pages/index/index'
  const tabPages: Record<string, number> = {
    '/pages/index/index': 0,
    '/pages/workspace/index': 1,
    '/pages/contact/index': 2,
    '/pages/profile/index': 3,
  }
  const tabPath = Object.keys(tabPages).find(path => dest.includes(path))
  if (tabPath) {
    uni.setStorageSync('app-tabbar-index', tabPages[tabPath])
    uni.switchTab({ url: tabPath })
    return
  }
  uni.redirectTo({
    url: dest,
    fail: () => {
      uni.navigateTo({
        url: dest,
        fail: () => {
          uni.switchTab({ url: '/pages/index/index' })
        },
      })
    },
  })
}

onLoad(async (options) => {
  const query = currRoute().query as any
  console.log('query:', query)
  console.log('options:', options)

  // 兼容 hash 路由：微信把 code/state 放在搜索参数（# 之前）
  let code = query?.code as string
  let state = query?.state as string
  if (!code || !state) {
    try {
      const search = typeof window !== 'undefined' ? window.location.search : ''
      const sp = new URLSearchParams(search)
      code = code || (sp.get('code') || '')
      state = state || (sp.get('state') || '')
    }
    catch {}
  }
  const typeParam = Number(query?.type)
  const type = Number.isFinite(typeParam) ? typeParam : 31 // 默认微信H5
  const redirect = query?.redirect as string | undefined

  if (!code) {
    uni.showToast({ icon: 'none', title: '缺少授权 code，请重试' })
    return
  }

  uni.showLoading({ title: '登录处理中...', mask: true })
  try {
    const res = await userStore.socialLoginByCode(type, code, state)
    if (res) {
      // 清理 URL search，移除微信附加的 code/state，避免刷新重复登录
      try {
        const url = new URL(window.location.href)
        url.search = ''
        window.history.replaceState(null, '', url.toString())
      }
      catch {}
      uni.hideLoading()
      uni.showToast({ icon: 'success', title: '登录成功', duration: 1200 })
      setTimeout(() => {
        redirectToTarget(redirect)
      }, 1200)
    }
  }
  catch (error: any) {
    uni.hideLoading()
    const msg = error?.message || '社交登录失败'
    uni.showToast({ icon: 'none', title: msg })
  }
  finally {
    uni.hideLoading()
  }
})
</script>

<template>
  <view
    class="h-full w-full flex items-center justify-center"
  >
  </view>
</template>

<style scoped>
.text-gray-600 {
  color: #4b5563;
}
</style>

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
const firstPasswordRoute = '/pages/login/first-password'

function redirectToFirstPassword() {
  uni.redirectTo({
    url: firstPasswordRoute,
    fail: () => {
      uni.reLaunch({
        url: firstPasswordRoute,
      })
    },
  })
}

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
  console.log('options:', options)
  const query = currRoute().query as any
  console.log('query:', query)
  console.log('options:', options)

  // 仅支持 history 模式，直接从 query 中取值
  const code = query?.code as string
  const state = query?.state as string
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

      if (res.data.firstLogin) {
        redirectToFirstPassword()
        return
      }

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
  />
</template>

<style scoped>
.text-gray-600 {
  color: #4b5563;
}
</style>

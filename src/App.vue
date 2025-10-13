<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { usePageAuth } from '@/hooks/usePageAuth'
import { useUserStore } from '@/store'
import { notLoginPages as _notLoginPages, getNotLoginPages } from '@/utils'
import { tabbarList as _tabBarList } from './layouts/fg-tabbar/tabbarList'
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only'

const isDev = import.meta.env.DEV
const loginRoute = import.meta.env.VITE_LOGIN_URL

// 检查是否已登录
function isLogined() {
  const userStore = useUserStore()
  return !!userStore.userInfo.accessToken
}

// 首次启动登录校验
function checkInitialAuth() {
  // 等待一个短暂的延迟，确保页面初始化完成
  setTimeout(() => {
    try {
      const pages = getCurrentPages()

      if (!pages || pages.length === 0) {
        return
      }

      const currentPage = pages[pages.length - 1]
      const currentPath = `/${currentPage.route}`

      // 获取白名单页面
      let notLoginPages: string[] = []
      if (isDev) {
        notLoginPages = getNotLoginPages()
      }
      else {
        notLoginPages = _notLoginPages
      }

      // 检查是否在白名单中
      const isNotNeedLogin = notLoginPages.includes(currentPath)

      if (isNotNeedLogin) {
        return
      }

      // 检查登录状态
      const hasLogin = isLogined()

      if (hasLogin) {
        return
      }

      // 需要跳转到登录页
      const redirectRoute = `${loginRoute}?redirect=${encodeURIComponent(currentPath)}`

      uni.redirectTo({
        url: redirectRoute,
        success: () => {
        },
        fail: () => {
          // 尝试备用方案
          uni.navigateTo({
            url: redirectRoute,
            success: () => {
            },
            fail: () => {
            },
          })
        },
      })
    }
    catch (error) {
      console.error('❌ App启动登录校验异常:', error)
    }
  }, 100) // 100ms延迟，确保页面初始化完成
}

usePageAuth()

onLaunch(() => {
  checkInitialAuth()
  // 从缓存中获取app-tabbar-index，进行跳转
  const tabIndex = uni.getStorageSync('app-tabbar-index')
  console.log('APP TABBAR INDEX:', tabIndex)
  if (!tabIndex) {
    return
  }
  console.log('APP TABBAR INDEX:', tabIndex)
  // 存在
  const tabbarList = _tabBarList.map(item => ({ ...item, path: `/${item.pagePath}` }))
  const url = tabbarList[tabIndex].path
  uni.switchTab({ url })
})
onShow(() => {
  checkInitialAuth()
})
onHide(() => {
})
</script>

<style lang="scss">
swiper,
scroll-view {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

image {
  width: 100%;
  height: 100%;
  vertical-align: middle;
}
</style>

<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { watch } from 'vue'
import { usePageAuth } from '@/hooks/usePageAuth'
import { useUserStore } from '@/store'
import { useAppStore } from '@/store/app'
import { notLoginPages as _notLoginPages, getNotLoginPages } from '@/utils'
import { tabbarList as _tabBarList } from './layouts/fg-tabbar/tabbarList'
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only'

const appStore = useAppStore()

const isDev = import.meta.env.DEV
const loginRoute = import.meta.env.VITE_LOGIN_URL

function getTokens() {
  const userStore = useUserStore()
  const accessToken = userStore.userInfo.accessToken || uni.getStorageSync('accessToken')
  const refreshToken = userStore.userInfo.refreshToken || uni.getStorageSync('refreshToken')
  return { accessToken, refreshToken }
}

function tryAutoLogin() {
  return false
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

      const { accessToken, refreshToken } = getTokens()

      if (accessToken) {
        return
      }

      if (refreshToken) {
        const ok = tryAutoLogin()
        if (ok) {
          return
        }
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
  // 初始化主题为系统主题，并订阅系统主题变化
  // #ifdef MP-WEIXIN
  appStore.initThemeFromSystem()
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
  // #endif

  // #ifdef H5
  // H5 端：根据用户偏好给 html 根元素添加主题类，覆盖媒体查询
  const updateGlobalThemeClass = () => {
    const el = document.documentElement
    if (!el)
      return
    el.classList.remove('theme-dark', 'theme-light')
    if (appStore.themePreference === 'system') {
      // 跟随系统：不加类，继续用 prefers-color-scheme
      return
    }
    el.classList.add(appStore.theme === 'dark' ? 'theme-dark' : 'theme-light')
  }
  // 首次应用
  updateGlobalThemeClass()
  // 监听偏好或主题变化
  watch(() => appStore.themePreference, updateGlobalThemeClass)
  watch(() => appStore.theme, updateGlobalThemeClass)
  // #endif
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

page {
  /* #ifdef MP-WEIXIN */
  /* 微信小程序使用纯色背景（浅色模式） */
  background: #ecf1f9;
  /* #endif */

  /* #ifndef MP-WEIXIN */
  /* 标准版本 */
  background: linear-gradient(135deg, #f3f7ff 0%, #f0f4ff 20%, #e8edff 45%, #e2e8ff 70%, #dde5ff 100%);
  /* #endif */

  min-height: 100vh;
  background-attachment: fixed;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

@media (prefers-color-scheme: dark) {
  page {
    /* #ifdef MP-WEIXIN */
    /* 微信小程序使用纯色背景（深色模式） */
    background: #0b1220;
    /* #endif */
    /* #ifndef MP-WEIXIN */
    background: linear-gradient(135deg, #0b1220 0%, #0d1426 20%, #0f182e 45%, #101a33 70%, #12203b 100%);
    /* #endif */
  }
}

/* #ifdef H5 */
/* 用户偏好覆盖（当 html 上存在主题类时，优先使用下列样式） */
.theme-light page {
  background: linear-gradient(135deg, #f3f7ff 0%, #f0f4ff 20%, #e8edff 45%, #e2e8ff 70%, #dde5ff 100%);
}
.theme-dark page {
  background: linear-gradient(135deg, #0b1220 0%, #0d1426 20%, #0f182e 45%, #101a33 70%, #12203b 100%);
}
/* #endif */

/* #ifdef H5 */
uni-page-head {
  display: none;
}

/* #endif */
</style>

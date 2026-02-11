<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { watch } from 'vue'
import { usePageAuth } from '@/hooks/usePageAuth'
import { useUserStore } from '@/store'
import { useAppStore } from '@/store/app'
import { notLoginPages as _notLoginPages, getNotLoginPages, initAnalytics } from '@/utils'
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only'

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
  // 初始化百度统计（仅 H5 环境生效）
  initAnalytics()

  // 初始化系统主题，并在 H5 下将主题同步到根节点，避免仅依赖 prefers-color-scheme 导致 H5 切换不生效
  const appStore = useAppStore()
  try {
    appStore.initThemeFromSystem()
  }
  catch (e) {
    // ignore
  }

  // #ifdef H5
  const applyH5Theme = (mode: 'light' | 'dark') => {
    const el = document.documentElement
    el.setAttribute('data-theme', mode)
    if (mode === 'dark') {
      el.classList.add('dark')
    } else {
      el.classList.remove('dark')
    }
  }
  applyH5Theme(appStore.theme)
  watch(() => appStore.theme, t => applyH5Theme(t))
  // #endif

  // #ifdef MP-WEIXIN
  // 微信端：主动设置导航栏与页面背景，确保深色模式下显示正确
  const applyMpTheme = (mode: 'light' | 'dark') => {
    const isDark = mode === 'dark'
    uni.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#0f182e' : '#ffffff',
    })
    uni.setBackgroundColor({
      backgroundColor: isDark ? '#0b1220' : '#ecf1f9',
      backgroundColorTop: isDark ? '#0b1220' : '#ecf1f9',
      backgroundColorBottom: isDark ? '#0b1220' : '#ecf1f9',
    })
  }
  applyMpTheme(appStore.theme)
  watch(() => appStore.theme, t => applyMpTheme(t))
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
  /* Global styles are now handled in src/style/index.scss */
  min-height: 100vh;
}


/* #ifdef H5 */
uni-page-head {
  display: none;
}
/* #endif */
</style>

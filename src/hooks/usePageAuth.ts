import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store'
import { notLoginPages as _notLoginPages, getNotLoginPages } from '@/utils'

const loginRoute = import.meta.env.VITE_LOGIN_URL
const firstPasswordRoute = '/pages/login/first-password'
const isDev = import.meta.env.DEV

function getTokens() {
  const userStore = useUserStore()
  const accessToken = userStore.userInfo.accessToken || uni.getStorageSync('accessToken')
  const refreshToken = userStore.userInfo.refreshToken || uni.getStorageSync('refreshToken')
  const storedFirstLogin = uni.getStorageSync('firstLogin')
  const firstLogin = userStore.userInfo.firstLogin === true || storedFirstLogin === true || storedFirstLogin === 'true'
  return { accessToken, refreshToken, firstLogin }
}

function tryAutoLogin() {
  return false
}

// 检查当前页面是否需要登录（白名单模式）
export function usePageAuth() {
  onLoad((options) => {
    try {
      // 获取当前页面路径
      const pages = getCurrentPages()
      console.log('📚 当前页面堆栈长度:', pages.length)

      if (!pages || pages.length === 0) {
        console.error('❌ 无法获取页面堆栈')
        return false
      }

      const currentPage = pages[pages.length - 1]
      const currentPath = `/${currentPage.route}`

      // 获取无需登录的页面列表
      let notLoginPages: string[] = []
      if (isDev) {
        notLoginPages = getNotLoginPages()
      }
      else {
        notLoginPages = _notLoginPages
      }

      // 如果当前页面在白名单中，直接放行
      const isNotNeedLogin = notLoginPages.includes(currentPath)

      if (isNotNeedLogin) {
        return true
      }

      const { accessToken, refreshToken, firstLogin } = getTokens()

      if (accessToken && firstLogin) {
        if (currentPath === firstPasswordRoute) {
          return true
        }

        uni.redirectTo({
          url: firstPasswordRoute,
          fail: () => {
            uni.reLaunch({
              url: firstPasswordRoute,
            })
          },
        })
        return false
      }

      if (accessToken) {
        return true
      }

      if (refreshToken) {
        const ok = tryAutoLogin()
        if (ok) {
          return true
        }
      }

      // 构建重定向URL
      const queryString = Object.entries(options || {})
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&')

      const currentFullPath = queryString ? `${currentPath}?${queryString}` : currentPath
      const redirectRoute = `${loginRoute}?redirect=${encodeURIComponent(currentFullPath)}`

      // 重定向到登录页
      uni.redirectTo({
        url: redirectRoute,
        success: () => {
        },
        fail: () => {
          uni.navigateTo({
            url: redirectRoute,
            success: () => {
            },
            fail: () => {
            },
          })
        },
      })

      return false
    }
    catch (error) {
      return false
    }
  })
}

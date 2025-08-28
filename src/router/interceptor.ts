import { useUserStore } from '@/store'
import { notLoginPages as _notLoginPages, getLastPage, getNotLoginPages } from '@/utils'

const loginRoute = import.meta.env.VITE_LOGIN_URL

function isLogined() {
  const userStore = useUserStore()
  return !!userStore.userInfo.accessToken
}

const isDev = import.meta.env.DEV

// 白名单登录拦截器 - （适用于大部分页面需要登录，少部分页面不需要登录）
const navigateToInterceptor = {
  invoke({ url }: { url: string }) {
    console.log('loginRoute', loginRoute)
    let path = url.split('?')[0]

    // 处理相对路径
    if (!path.startsWith('/')) {
      const currentPath = getLastPage().route
      const normalizedCurrentPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`
      const baseDir = normalizedCurrentPath.substring(0, normalizedCurrentPath.lastIndexOf('/'))
      path = `${baseDir}/${path}`
    }

    let notLoginPages: string[] = []
    if (isDev) {
      notLoginPages = getNotLoginPages()
    }
    else {
      notLoginPages = _notLoginPages
    }

    const isNotNeedLogin = notLoginPages.includes(path)
    
    if (isNotNeedLogin) {
      return true
    }

    const hasLogin = isLogined()
    
    if (hasLogin) {
      return true
    }

    const redirectRoute = `${loginRoute}?redirect=${encodeURIComponent(url)}`
    
    uni.redirectTo({ 
      url: redirectRoute,
      success: () => {
      },
      fail: (err) => {
      }
    })
    return false
  },
}

export const routeInterceptor = {
  install() {
    uni.addInterceptor('navigateTo', navigateToInterceptor)
    uni.addInterceptor('reLaunch', navigateToInterceptor)
    uni.addInterceptor('redirectTo', navigateToInterceptor)
    uni.addInterceptor('switchTab', navigateToInterceptor)
  },
}

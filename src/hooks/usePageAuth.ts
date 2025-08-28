import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store'
import { notLoginPages as _notLoginPages, getNotLoginPages } from '@/utils'

const loginRoute = import.meta.env.VITE_LOGIN_URL
const isDev = import.meta.env.DEV

function isLogined() {
  const userStore = useUserStore()
  return !!userStore.userInfo.username
}

// 检查当前页面是否需要登录（白名单模式）
export function usePageAuth() {
  console.log('🎯 usePageAuth hook 被初始化')
  
  onLoad((options) => {
    console.log('📋 首屏登录校验开始 - onLoad 被触发')
    console.log('🔧 环境变量 isDev:', isDev)
    console.log('🔑 登录路由配置:', loginRoute)
    
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
      console.log('📍 当前页面路径:', currentPath)
      console.log('📋 页面参数:', options)
      console.log('🔍 页面对象详情:', currentPage)

      // 获取无需登录的页面列表
      let notLoginPages: string[] = []
      if (isDev) {
        notLoginPages = getNotLoginPages()
        console.log('🧪 开发环境 - 动态获取白名单')
      }
      else {
        notLoginPages = _notLoginPages
        console.log('🏭 生产环境 - 使用静态白名单')
      }
      console.log('🔓 白名单页面列表:', notLoginPages)

      // 如果当前页面在白名单中，直接放行
      const isNotNeedLogin = notLoginPages.includes(currentPath)
      console.log('🔍 页面是否在白名单:', isNotNeedLogin)
      
      if (isNotNeedLogin) {
        console.log('✅ 页面在白名单中，允许访问')
        return true
      }

      // 检查登录状态
      const userStore = useUserStore()
      console.log('👤 用户Store状态:', userStore.userInfo)
      
      const hasLogin = isLogined()
      console.log('🔐 用户登录状态判断结果:', hasLogin)
      console.log('📝 用户名:', userStore.userInfo.username)
      
      if (hasLogin) {
        console.log('✅ 用户已登录，允许访问')
        return true
      }

      // 构建重定向URL
      const queryString = Object.entries(options || {})
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&')

      const currentFullPath = queryString ? `${currentPath}?${queryString}` : currentPath
      const redirectRoute = `${loginRoute}?redirect=${encodeURIComponent(currentFullPath)}`
      
      console.log('🔄 准备重定向到登录页')
      console.log('📱 当前完整路径:', currentFullPath)
      console.log('🔗 重定向URL:', redirectRoute)

      // 重定向到登录页
      console.log('🚀 开始执行重定向...')
      uni.redirectTo({ 
        url: redirectRoute,
        success: () => {
          console.log('✅ 重定向成功')
        },
        fail: (err) => {
          console.error('❌ 重定向失败:', err)
          
          // 尝试备用方案
          console.log('🔄 尝试备用跳转方案')
          uni.navigateTo({
            url: redirectRoute,
            success: () => {
              console.log('✅ 备用方案跳转成功')
            },
            fail: (navErr) => {
              console.error('❌ 备用方案也失败:', navErr)
            }
          })
        }
      })
      
      return false
    } catch (error) {
      console.error('❌ usePageAuth 执行异常:', error)
      return false
    }
  })
}

<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { usePageAuth } from '@/hooks/usePageAuth'
import { useUserStore } from '@/store'
import { getNotLoginPages, notLoginPages as _notLoginPages } from '@/utils'
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only'

const isDev = import.meta.env.DEV
const loginRoute = import.meta.env.VITE_LOGIN_URL

// 检查是否已登录
function isLogined() {
  const userStore = useUserStore()
  return !!userStore.userInfo.username
}

// 首次启动登录校验
function checkInitialAuth() {
  console.log('🚀 App启动 - 开始首次登录校验')
  
  // 等待一个短暂的延迟，确保页面初始化完成
  setTimeout(() => {
    try {
      const pages = getCurrentPages()
      console.log('📚 当前页面堆栈:', pages.length)
      
      if (!pages || pages.length === 0) {
        console.warn('⚠️ 页面堆栈为空，等待下一次检查')
        return
      }
      
      const currentPage = pages[pages.length - 1]
      const currentPath = `/${currentPage.route}`
      console.log('📍 App启动时的当前页面:', currentPath)
      
      // 获取白名单页面
      let notLoginPages: string[] = []
      if (isDev) {
        notLoginPages = getNotLoginPages()
      } else {
        notLoginPages = _notLoginPages
      }
      console.log('🔓 App启动 - 白名单页面:', notLoginPages)
      
      // 检查是否在白名单中
      const isNotNeedLogin = notLoginPages.includes(currentPath)
      console.log('🔍 App启动 - 页面是否在白名单:', isNotNeedLogin)
      
      if (isNotNeedLogin) {
        console.log('✅ App启动 - 页面在白名单中，无需登录')
        return
      }
      
      // 检查登录状态
      const hasLogin = isLogined()
      console.log('👤 App启动 - 用户登录状态:', hasLogin)
      
      if (hasLogin) {
        console.log('✅ App启动 - 用户已登录，无需跳转')
        return
      }
      
      // 需要跳转到登录页
      const redirectRoute = `${loginRoute}?redirect=${encodeURIComponent(currentPath)}`
      console.log('🔄 App启动 - 准备跳转到登录页:', redirectRoute)
      
      uni.redirectTo({
        url: redirectRoute,
        success: () => {
          console.log('✅ App启动 - 跳转到登录页成功')
        },
        fail: (err) => {
          console.error('❌ App启动 - 跳转到登录页失败:', err)
          // 尝试备用方案
          uni.navigateTo({
            url: redirectRoute,
            success: () => {
              console.log('✅ App启动 - 备用方案跳转成功')
            },
            fail: (navErr) => {
              console.error('❌ App启动 - 备用方案也失败:', navErr)
            }
          })
        }
      })
    } catch (error) {
      console.error('❌ App启动登录校验异常:', error)
    }
  }, 100) // 100ms延迟，确保页面初始化完成
}

usePageAuth()

onLaunch(() => {
  console.log('🚀 App Launch')
  checkInitialAuth()
})
onShow(() => {
  console.log('📱 App Show')
})
onHide(() => {
  console.log('😴 App Hide')
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

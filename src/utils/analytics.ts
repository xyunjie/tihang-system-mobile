/**
 * 百度统计 - uni-app H5 封装
 *
 * 使用方法：
 * 1. 在 App.vue 的 onLaunch 中调用 initAnalytics()
 * 2. SPA 路由跳转自动上报 PV（需在 router.afterEach 中调用）
 * 3. 自定义事件使用 trackEvent(category, action, label?, value?)
 */

// ============ 配置区域 - 请替换为你的百度统计 H5 站点 ID ============
const H5_SITE_ID = '1137dd49a2690f9a6b7d8914a67eb59d'
// ======================================================

let isInitialized = false

/**
 * 初始化百度统计（仅 H5 环境生效）
 */
export function initAnalytics() {
  // #ifndef H5
  return
  // #endif

  if (isInitialized)
    return
  isInitialized = true

  const _hmt: any[] = (window as any)._hmt || []
  ;(window as any)._hmt = _hmt

  const hm = document.createElement('script')
  hm.src = `https://hm.baidu.com/hm.js?${H5_SITE_ID}`
  hm.async = true
  const s = document.getElementsByTagName('script')[0]
  s.parentNode?.insertBefore(hm, s)

  console.log('[Analytics] 百度统计已初始化')
}

/**
 * 上报页面浏览 (PV)
 * @param pagePath 页面路径（不传则使用当前路径）
 */
export function trackPageView(pagePath?: string) {
  // #ifdef H5
  const _hmt = (window as any)._hmt
  if (!_hmt)
    return

  const path = pagePath || window.location.pathname + window.location.search
  _hmt.push(['_trackPageview', path])
  // #endif
}

/**
 * 上报自定义事件
 * @param category 事件类别
 * @param action 事件操作
 * @param label 事件标签（可选）
 * @param value 事件值（可选）
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number,
) {
  // #ifdef H5
  const _hmt = (window as any)._hmt
  if (!_hmt)
    return

  const args: any[] = ['_trackEvent', category, action]
  if (label !== undefined && label !== null)
    args.push(label)
  if (value !== undefined && value !== null)
    args.push(value)

  _hmt.push(args)
  // #endif
}

/**
 * 设置用户 ID（用于用户行为分析）
 * @param userId 用户唯一标识
 */
export function setUserId(userId: string) {
  // #ifdef H5
  const _hmt = (window as any)._hmt
  if (!_hmt)
    return

  _hmt.push(['_setUserId', userId])
  // #endif
}

/**
 * SPA 路由 PV 自动追踪示例
 * 需在 Vue Router afterEach 中调用
 */
export function trackRouter(router: any) {
  // #ifdef H5
  if (!router || !router.afterEach)
    return
  router.afterEach((to: any) => {
    trackPageView(to.fullPath || to.path)
  })
  // #endif
}

/**
 * 百度统计 - uni-app H5 封装
 *
 * 使用方法：
 * 1. 在 App.vue 的 onLaunch 中调用 initAnalytics()
 * 2. SPA 路由跳转自动上报 PV（需在 router.afterEach 中调用）
 * 3. 自定义事件使用 trackEvent(category, action, label?, value?)
 */

// ======================================================

let isInitialized = false

/**
 * 初始化百度统计（仅 H5 环境生效）
 * 注意：统计脚本已在 index.html 中加载，此函数仅用于确保 _hmt 数组存在
 */
export function initAnalytics() {
  // #ifndef H5
  return
  // #endif

  if (isInitialized)
    return
  isInitialized = true

  // 确保 _hmt 数组存在（脚本已在 index.html 中加载）
  if (!(window as any)._hmt) {
    (window as any)._hmt = []
  }

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

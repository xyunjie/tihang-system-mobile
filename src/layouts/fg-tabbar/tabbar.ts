import { reactive } from 'vue'
import { tabbarList as _tabBarList } from './tabbarList'

function getIndexByCurrentRoute(): number | undefined {
  try {
    const pages = getCurrentPages()
    if (!pages || pages.length === 0)
      return undefined
    const currentPage = pages[pages.length - 1]
    const currentPath = `/${currentPage.route}`
    const tabbarPaths = _tabBarList.map(item => `/${item.pagePath}`)
    const idx = tabbarPaths.findIndex(p => p === currentPath)
    return idx >= 0 ? idx : undefined
  }
  catch {
    return undefined
  }
}

/**
 * tabbar 状态，增加 storageSync 保证刷新浏览器时在正确的 tabbar 页面
 * 使用reactive简单状态，而不是 pinia 全局状态
 */
export const tabbarStore = reactive({
  curIdx: getIndexByCurrentRoute() ?? (uni.getStorageSync('app-tabbar-index') || 0),
  setCurIdx(idx: number) {
    this.curIdx = idx
    uni.setStorageSync('app-tabbar-index', idx)
  },
  syncWithRoute() {
    const idx = getIndexByCurrentRoute()
    if (typeof idx === 'number') {
      this.setCurIdx(idx)
    }
  },
})

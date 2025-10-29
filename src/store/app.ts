import { defineStore } from 'pinia'

// 本地存储键名
const THEME_PREF_KEY = 'app_theme_preference'

// 统一归一化主题偏好输入，兼容可能的对象包装
function normalizePref(input: any): 'light' | 'dark' | 'system' | null {
  const isValid = (v: any) => v === 'light' || v === 'dark' || v === 'system'
  if (isValid(input))
    return input
  if (input && typeof input === 'object') {
    const v1 = (input as any).value
    if (isValid(v1))
      return v1
    const v2 = (input as any)?.data?.value
    if (isValid(v2))
      return v2
    const v3 = (input as any)?.detail?.value
    if (isValid(v3))
      return v3
  }
  return null
}

function getStoredThemePreference(): 'light' | 'dark' | 'system' | null {
  try {
    const val = uni.getStorageSync(THEME_PREF_KEY)
    const normalized = normalizePref(val)
    if (normalized)
      return normalized
  }
  catch (e) {
    // ignore
  }
  return null
}

// 获取初始系统主题
function getInitialSystemTheme(): 'light' | 'dark' {
  // 优先使用官方推荐的 uni.getAppBaseInfo 获取主题信息
  try {
    const info = uni.getAppBaseInfo() as any
    console.log(info)
    // 微信小程序：优先从 host.theme 或 hostTheme 读取
    // #ifdef MP-WEIXIN
    const mpTheme = info?.hostTheme ?? info?.host?.theme
    if (mpTheme === 'dark' || mpTheme === 'light')
      return mpTheme
    // 兜底：使用 wx.getSystemInfoSync
    if (typeof wx !== 'undefined' && (wx as any)?.getSystemInfoSync) {
      const sys = (wx as any).getSystemInfoSync()
      const t = sys?.theme
      if (t === 'dark' || t === 'light')
        return t
    }
    // #endif

    // App 端：读取 appTheme；若为 auto，使用 getDeviceInfo().osTheme
    // #ifdef APP-PLUS
    if (info?.appTheme === 'dark' || info?.appTheme === 'light')
      return info.appTheme
    if (info?.appTheme === 'auto') {
      try {
        const dev = uni.getDeviceInfo?.() as any
        const osTheme = dev?.osTheme
        if (osTheme === 'dark' || osTheme === 'light')
          return osTheme
      }
      catch (e3) {
        // ignore
      }
    }
    // #endif

    // H5：尽量从 hostTheme 或 host.theme 获取（若不可用则回退）
    // #ifdef H5
    const h5Theme = info?.hostTheme ?? info?.host?.theme
    if (h5Theme === 'dark' || h5Theme === 'light')
      return h5Theme
    // #endif
  }
  catch (e) {
    // ignore
  }

  // 通用兜底：使用 getSystemInfoSync 读取 theme
  try {
    const sys = uni.getSystemInfoSync()
    const t = (sys as any)?.theme
    if (t === 'dark' || t === 'light')
      return t
  }
  catch (e2) {
    // ignore
  }

  return 'light'
}

type ThemeMode = 'light' | 'dark'
type ThemePreference = 'system' | ThemeMode

export const useAppStore = defineStore('app', {
  state: () => {
    const initial = getInitialSystemTheme()
    const storedPref = getStoredThemePreference()
    return {
      // 当前生效的主题（提供给组件库使用）
      theme: (storedPref && storedPref !== 'system' ? storedPref : initial) as ThemeMode,
      // 系统主题（仅用于跟随系统时计算）
      systemTheme: initial as ThemeMode,
      // 主题偏好：默认跟随系统
      themePreference: (storedPref ?? 'system') as ThemePreference,
    }
  },
  actions: {
    // 直接设定手动主题，同时更新偏好为手动
    setTheme(mode: ThemeMode) {
      this.themePreference = mode
      this.theme = mode
      try {
        uni.setStorageSync(THEME_PREF_KEY, mode)
      }
      catch (e) {
        // ignore
      }
    },
    // 设定偏好（system/light/dark），并据此更新生效主题
    setThemePreference(pref: ThemePreference) {
      const normalized = normalizePref(pref) ?? 'system'
      this.themePreference = normalized
      if (normalized === 'system') {
        this.theme = this.systemTheme
      }
      else {
        this.theme = normalized
      }
      try {
        uni.setStorageSync(THEME_PREF_KEY, normalized)
      }
      catch (e) {
        // ignore
      }
    },
    initThemeFromSystem() {
      // 初始化当前系统主题
      const current = getInitialSystemTheme()
      this.systemTheme = current
      if (this.themePreference === 'system') {
        this.theme = current
      }

      // 监听系统主题变化
      const handleThemeChange = (theme: string) => {
        const next: ThemeMode = theme === 'dark' ? 'dark' : 'light'
        this.systemTheme = next
        if (this.themePreference === 'system') {
          this.theme = next
        }
      }

      uni.onThemeChange((res) => {
        console.log(res.theme)
        handleThemeChange(res.theme)
      })
    },
    toggleTheme() {
      const next = this.theme === 'dark' ? 'light' : 'dark'
      this.setTheme(next)
    },
  },
})

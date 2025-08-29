import { useUserStore } from '@/store'
import { getEnvBaseUrl } from '@/utils'
import { platform } from '@/utils/platform'
import { stringifyQuery } from './queryString'

export type CustomRequestOptions = UniApp.RequestOptions & {
  query?: Record<string, any>
  /** 出错时是否隐藏错误提示 */
  hideErrorToast?: boolean
} & IUniUploadFileOptions // 添加uni.uploadFile参数类型

// 请求基准地址
const baseUrl = getEnvBaseUrl()



// 拦截器配置
const httpInterceptor = {
  // 拦截前触发
  invoke(options: CustomRequestOptions) {
    console.log('🚀 HTTP拦截器开始处理请求:', options.url)
    
    // 接口请求支持通过 query 参数配置 queryString
    if (options.query) {
      const queryStr = stringifyQuery(options.query)
      if (options.url.includes('?')) {
        options.url += `&${queryStr}`
      }
      else {
        options.url += `?${queryStr}`
      }
    }
    // 非 http 开头需拼接地址
    if (!options.url.startsWith('http')) {
      // #ifdef H5
      // console.log(__VITE_APP_PROXY__)
      if (JSON.parse(__VITE_APP_PROXY__)) {
        // 自动拼接代理前缀
        options.url = import.meta.env.VITE_APP_PROXY_PREFIX + options.url
      }
      else {
        options.url = baseUrl + options.url
      }
      // #endif
      // 非H5正常拼接
      // #ifndef H5
      options.url = baseUrl + options.url
      // #endif
      // TIPS: 如果需要对接多个后端服务，也可以在这里处理，拼接成所需要的地址
    }
    // 1. 请求超时
    options.timeout = 10000 // 10s
    // 2. （可选）添加小程序端请求头标识
    options.header = {
      platform, // 可选，与 uniapp 定义的平台一致，告诉后台来源
      ...options.header,
    }
    
    // 3. 简化token处理逻辑（同步）
    const userStore = useUserStore()
    const { accessToken, refreshToken } = userStore.userInfo
    const storedRefreshToken = uni.getStorageSync('refreshToken')
    const storedAccessToken = uni.getStorageSync('accessToken')
    
    // 获取有效的token
    const currentRefreshToken = refreshToken || storedRefreshToken
    const currentAccessToken = accessToken || storedAccessToken
    
    console.log('🔍 HTTP拦截器 - Token状态:', {
      hasRefreshToken: !!currentRefreshToken,
      hasAccessToken: !!currentAccessToken,
      url: options.url
    })
    
    // 如果有accessToken，直接添加到请求头
    if (currentAccessToken) {
      options.header.Authorization = `Bearer ${currentAccessToken}`
    }
    
    console.log('✅ HTTP拦截器处理完成，准备发送请求:', {
      url: options.url,
      method: options.method,
      hasAuth: !!options.header.Authorization
    })
  },
}

export const requestInterceptor = {
  install() {
    // 拦截 request 请求
    uni.addInterceptor('request', httpInterceptor)
    // 拦截 uploadFile 文件上传
    uni.addInterceptor('uploadFile', httpInterceptor)
    
    // 注意：uni-app不支持响应拦截器，所以401处理在http.ts中处理
    console.log('请求拦截器已注册，支持自动Token刷新')
  },
}

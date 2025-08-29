import type { CustomRequestOptions } from '@/http/interceptor'
import { useUserStore } from '@/store'

export function http<T>(options: CustomRequestOptions) {
  // 1. 返回 Promise 对象
  return new Promise<IResData<T>>(async (resolve, reject) => {
    // 在发送请求前检查token
    const userStore = useUserStore()
    const { refreshToken } = userStore.userInfo
    const storedRefreshToken = uni.getStorageSync('refreshToken')
    const currentRefreshToken = refreshToken || storedRefreshToken
    
    // 如果有refreshToken，检查并刷新token
    if (currentRefreshToken) {
      try {
        const isValid = await userStore.ensureTokenValid()
        if (!isValid) {
          console.log('❌ Token无效，跳转到登录页')
          uni.reLaunch({
            url: '/pages/login/index'
          })
          reject(new Error('登录过期，请重新登录'))
          return
        }
        
        // 更新请求头中的token
        const currentAccessToken = userStore.userInfo.accessToken || uni.getStorageSync('accessToken')
        if (currentAccessToken) {
          options.header = {
            ...options.header,
            Authorization: `Bearer ${currentAccessToken}`
          }
        }
      } catch (error) {
        console.log('❌ Token刷新失败:', error)
        reject(error)
        return
      }
    }
    
    console.log('🌐 发送请求:', {
      url: options.url,
      method: options.method,
      data: options.data,
      header: options.header,
      timeout: options.timeout
    })
    
    const startTime = Date.now()
    
    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      // 响应成功
      success(res) {
        const duration = Date.now() - startTime
        console.log('📨 收到响应:', {
          url: options.url,
          statusCode: res.statusCode,
          duration: duration + 'ms',
          dataType: typeof res.data,
          dataPreview: JSON.stringify(res.data).slice(0, 200)
        })
        
        // 状态码 2xx，参考 axios 的设计
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 2.1 提取核心数据 res.data
          resolve(res.data as IResData<T>)
        }
        else if (res.statusCode === 401) {
          // 401错误 - 由拦截器统一处理，这里直接拒绝
          console.log('❌ 收到401错误')
          reject(res)
        }
        else {
          // 其他错误 -> 根据后端错误信息轻提示
          console.log('❌ 请求错误:', res.statusCode, res.data)
          !options.hideErrorToast
          && uni.showToast({
            icon: 'none',
            title: (res.data as IResData<T>).msg || '请求错误',
          })
          reject(res)
        }
      },
      // 响应失败
      fail(err) {
        const duration = Date.now() - startTime
        console.log('❌ 网络错误:', {
          url: options.url,
          duration: duration + 'ms',
          error: err,
          errMsg: err.errMsg,
          statusCode: (err as any).statusCode
        })
        
        // 检查是否是超时
        if (err.errMsg && err.errMsg.includes('timeout')) {
          uni.showToast({
            icon: 'none',
            title: '请求超时，请检查网络',
          })
        } else {
          uni.showToast({
            icon: 'none',
            title: '网络错误，换个网络试试',
          })
        }
        reject(err)
      },
    })
  })
}

/**
 * GET 请求
 * @param url 后台地址
 * @param query 请求query参数
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpGet<T>(url: string, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'GET',
    header,
    ...options,
  })
}

/**
 * POST 请求
 * @param url 后台地址
 * @param data 请求body参数
 * @param query 请求query参数，post请求也支持query，很多微信接口都需要
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpPost<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    data,
    method: 'POST',
    header,
    ...options,
  })
}
/**
 * PUT 请求
 */
export function httpPut<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    data,
    query,
    method: 'PUT',
    header,
    ...options,
  })
}

/**
 * DELETE 请求（无请求体，仅 query）
 */
export function httpDelete<T>(url: string, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'DELETE',
    header,
    ...options,
  })
}

http.get = httpGet
http.post = httpPost
http.put = httpPut
http.delete = httpDelete

// 支持与 alovaJS 类似的API调用
http.Get = httpGet
http.Post = httpPost
http.Put = httpPut
http.Delete = httpDelete

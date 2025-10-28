import type { IUserInfoVo } from '@/api/types/login'
import type { CustomRequestOptions } from '@/http/interceptor'
import { refreshToken as refreshTokenApi } from '@/api/login'
import { useUserStore } from '@/store'
import { currRoute } from '@/utils'

// 请求队列接口
interface PendingRequest {
  options: CustomRequestOptions
  resolve: (value: any) => void
  reject: (reason?: any) => void
}

// 全局状态管理
let isRefreshingToken = false
let pendingRequests: PendingRequest[] = []
let refreshTokenPromise: Promise<IUserInfoVo> | null = null
// 添加请求到队列
function addRequestToQueue(request: PendingRequest) {
  pendingRequests.push(request)
}

// 处理队列中的请求
function processQueue(error?: any, newToken?: string) {
  const requests = [...pendingRequests]
  pendingRequests = [] // 先清空队列，避免重复处理

  requests.forEach(({ options, resolve, reject }) => {
    if (error) {
      reject(error)
    }
    else {
      // 更新token并重新发送请求
      options.header = {
        ...options.header,
        Authorization: `Bearer ${newToken}`,
      }
      // 重新发送请求（不会再次进入token刷新逻辑）
      executeRequest(options, resolve, reject)
    }
  })
}

// 刷新token
async function refreshToken(): Promise<IUserInfoVo> {
  // 如果已经有正在进行的刷新请求，直接返回该Promise
  if (refreshTokenPromise) {
    return refreshTokenPromise
  }
  const userStore = useUserStore()
  const storedRefreshToken = userStore.userInfo.refreshToken || uni.getStorageSync('refreshToken')

  if (!storedRefreshToken) {
    // 需要进行登录
    return
  }

  // 创建刷新Promise
  refreshTokenPromise = (async () => {
    try {
      const res = await refreshTokenApi(storedRefreshToken)
      if (res.code !== 0) {
        throw new Error(res.msg || 'Token刷新失败')
      }
      const { accessToken, refreshToken: newRefreshToken, expiresTime } = res.data
      const userStore = useUserStore()
      // 更新用户store和本地存储
      const updatedUserInfo = {
        ...userStore.userInfo,
        accessToken,
        refreshToken: newRefreshToken,
        expiresTime,
      }

      userStore.setUserInfo(updatedUserInfo)

      // 仅保存refreshToken和expiresTime到本地存储
      uni.setStorageSync('refreshToken', newRefreshToken)
      uni.setStorageSync('accessToken', accessToken)
      uni.setStorageSync('expiresTime', expiresTime)

      return updatedUserInfo
    }
    catch (error) {
      // 刷新失败，清理用户信息并跳转到登录页
      userStore.clearUserInfo()
      goLoginOnce()
      throw error
    }
    finally {
      // 清理刷新Promise
      refreshTokenPromise = null
    }
  })()

  return refreshTokenPromise
}

// 执行请求的核心函数
function executeRequest<T>(
  options: CustomRequestOptions,
  resolve: (value: IResData<T>) => void,
  reject: (reason?: any) => void,
) {
  // 检查是否需要先刷新token（从拦截器传递的标记）
  if ((options as any).__needsTokenRefresh) {
    // 清除标记，避免重复处理
    delete (options as any).__needsTokenRefresh

    if (isRefreshingToken) {
      addRequestToQueue({ options, resolve, reject })
      return
    }

    // 开始刷新token
    isRefreshingToken = true

    refreshToken()
      .then((userInfo) => {
        isRefreshingToken = false

        // 先处理队列中的请求
        processQueue(null, userInfo.accessToken)

        // 更新当前请求的token并发送
        options.header = {
          ...options.header,
          Authorization: `Bearer ${userInfo.accessToken}`,
        }
        executeRequest(options, resolve, reject)
      })
      .catch((error) => {
        console.error('❌ 提前刷新Token失败')
        isRefreshingToken = false
        // 处理队列中的请求（全部失败）
        processQueue(error)
        reject(error)
      })
    return
  }

  uni.request({
    ...options,
    dataType: 'json',
    // #ifndef MP-WEIXIN
    responseType: 'json',
    // #endif
    // 响应成功
    success(res) {
      // 状态码 2xx，参考 axios 的设计
      if (res.statusCode !== 200) {
        // 状态码非 2xx，抛出错误
        reject(new Error(`请求失败，状态码: ${res.statusCode}`))
        return
      }
      const data = res.data as IResData<T>
      if (data.code === 0) {
        // 请求成功
        resolve(data)
        return
      }
      if (data.code === 401) {
        // 排除刷新token接口本身
        if (options.url.includes('/admin-api/system/auth/refresh-token')) {
          useUserStore().clearUserInfo()
          goLoginOnce()
          reject(new Error('认证失败，请重新登录'))
          return
        }
        const userStore = useUserStore()
        const hasRefreshToken = userStore.userInfo.refreshToken || uni.getStorageSync('refreshToken')
        if (!hasRefreshToken) {
          // 无刷新令牌，直接清理并跳转登录
          userStore.clearUserInfo()
          uni.showToast({
            icon: 'none',
            title: data.msg || '账号未登录',
          })
          goLoginOnce()
          reject(new Error(data.msg || '账号未登录'))
          return
        }
        if (isRefreshingToken) {
          addRequestToQueue({ options, resolve, reject })
        }
        else {
          // 开始刷新token
          isRefreshingToken = true

          refreshToken()
            .then((userInfo) => {
              isRefreshingToken = false

              // 先处理队列中的请求
              processQueue(null, userInfo.accessToken)

              // 重新发送当前请求（第一个触发刷新的请求）
              options.header = {
                ...options.header,
                Authorization: `Bearer ${userInfo.accessToken}`,
              }
              executeRequest(options, resolve, reject)
            })
            .catch((error) => {
              isRefreshingToken = false
              // 处理队列中的请求（全部失败）
              processQueue(error)
              reject(error)
            })
        }
        return
      }
      resolve(data)
    },
    // 响应失败
    fail(err) {
      // 检查是否是超时
      if (err.errMsg && err.errMsg.includes('timeout')) {
        uni.showToast({
          icon: 'none',
          title: '请求超时，请检查网络',
        })
      }
      else {
        uni.showToast({
          icon: 'none',
          title: '网络错误，换个网络试试',
        })
      }
      reject(err)
    },
  })
}

export function http<T>(options: CustomRequestOptions) {
  // 1. 返回 Promise 对象
  return new Promise<IResData<T>>((resolve, reject) => {
    executeRequest(options, resolve, reject)
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
// 跳转登录页（带去重与当前页判断）
function goLoginOnce() {
  try {
    const { path } = currRoute()
    if (path === '/pages/login/index') {
      return
    }
  }
  catch (_) {
    // 忽略路由获取异常，继续跳转
  }
  uni.redirectTo({
    url: '/pages/login/index',
  })
}

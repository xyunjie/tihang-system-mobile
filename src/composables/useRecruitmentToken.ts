import type { RecruitmentAuthRespVO, RecruitmentTokenStatusRespVO } from '@/api/types/recruitment'
import { authRecruitment, checkTokenStatus } from '@/api/recruitment'
import { getSocialType } from '@/utils/platform'
import { ref } from 'vue'

const TOKEN_KEY = 'recruitment_token'
const TOKEN_EXPIRE_KEY = 'recruitment_token_expire'

/**
 * 纳新 Token 管理组合式函数
 */
export function useRecruitmentToken() {
  const token = ref<string | null>(null)
  const tokenExpireTime = ref<number>(0)
  const loading = ref(false)

  /**
   * 从本地存储加载 Token
   */
  function loadFromStorage() {
    try {
      token.value = uni.getStorageSync(TOKEN_KEY) || null
      tokenExpireTime.value = uni.getStorageSync(TOKEN_EXPIRE_KEY) || 0
    }
    catch (e) {
      console.error('加载 Token 失败:', e)
    }
  }

  /**
   * 检查本地 Token 是否有效
   */
  function isLocalValid(): boolean {
    return !!token.value && Date.now() < tokenExpireTime.value
  }

  /**
   * 保存 Token 到本地
   */
  function save(newToken: string, expireTime: number) {
    token.value = newToken
    tokenExpireTime.value = expireTime
    try {
      uni.setStorageSync(TOKEN_KEY, newToken)
      uni.setStorageSync(TOKEN_EXPIRE_KEY, expireTime)
    }
    catch (e) {
      console.error('保存 Token 失败:', e)
    }
  }

  /**
   * 清除 Token
   */
  function clear() {
    token.value = null
    tokenExpireTime.value = 0
    try {
      uni.removeStorageSync(TOKEN_KEY)
      uni.removeStorageSync(TOKEN_EXPIRE_KEY)
    }
    catch (e) {
      console.error('清除 Token 失败:', e)
    }
  }

  /**
   * 获取微信授权 code
   */
  async function getWxCode(): Promise<string | null> {
    // #ifdef MP-WEIXIN
    return new Promise((resolve) => {
      uni.login({
        success: (res) => {
          resolve(res.code || null)
        },
        fail: (err) => {
          console.error('获取微信 code 失败:', err)
          resolve(null)
        },
      })
    })
    // #endif

    // #ifdef H5
    // H5 环境需要从 URL 获取 code
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('code')
    // #endif

    return null
  }

  /**
   * 通过微信授权获取新 Token
   */
  async function authByWxCode(): Promise<string | null> {
    const code = await getWxCode()
    if (!code) {
      console.warn('获取微信 code 失败')
      return null
    }

    try {
      const res = await authRecruitment(code, getSocialType())
      if (res.code === 0 && res.data) {
        save(res.data.token, res.data.expireTime)
        return res.data.token
      }
      else {
        console.error('授权失败:', res.msg)
        return null
      }
    }
    catch (e) {
      console.error('授权请求失败:', e)
      return null
    }
  }

  /**
   * 确保 Token 有效
   * - 如果本地 Token 有效且未快过期，直接返回
   * - 如果本地 Token 快过期（<10分钟），检查并刷新
   * - 如果本地 Token 无效，重新授权
   */
  async function ensureValidToken(): Promise<string | null> {
    loading.value = true

    try {
      // 1. 加载本地 Token
      loadFromStorage()

      // 2. 如果本地无 Token 或已过期，重新授权
      if (!isLocalValid()) {
        console.log('本地 Token 无效，重新授权')
        return await authByWxCode()
      }

      // 3. 检查是否快过期（剩余时间小于 10 分钟）
      const remainingMs = tokenExpireTime.value - Date.now()
      const remainingMinutes = remainingMs / (1000 * 60)

      if (remainingMinutes > 15) {
        // 剩余时间充足，直接返回
        console.log(`Token 有效，剩余 ${remainingMinutes.toFixed(1)} 分钟`)
        return token.value
      }

      // 4. 快过期，调用检查接口尝试刷新
      console.log(`Token 快过期，剩余 ${remainingMinutes.toFixed(1)} 分钟，尝试刷新`)
      const res = await checkTokenStatus(token.value!)

      if (res.code === 0 && res.data) {
        if (res.data.needRefresh && res.data.newToken) {
          // 服务端已刷新，使用新 Token
          console.log('Token 已刷新')
          save(res.data.newToken, res.data.newExpireTime!)
          return res.data.newToken
        }
        else {
          // 不需要刷新，继续使用
          return token.value
        }
      }

      // 5. 检查失败，重新授权
      console.log('Token 检查失败，重新授权')
      return await authByWxCode()
    }
    catch (e) {
      console.error('确保 Token 有效失败:', e)
      return null
    }
    finally {
      loading.value = false
    }
  }

  return {
    token,
    tokenExpireTime,
    loading,
    loadFromStorage,
    isLocalValid,
    save,
    clear,
    getWxCode,
    authByWxCode,
    ensureValidToken,
  }
}

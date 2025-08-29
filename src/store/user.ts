import type { IUserInfoVo } from '@/api/types/login'
import type { ISystemUserInfoVo } from '@/api/types/user'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  login as _login,
  logout as _logout,
  wxLogin as _wxLogin,
  socialLogin as _socialLogin,
  bindAccount as _bindAccount,
  refreshToken as _refreshToken,
  getWxCode,
} from '@/api/login'
import { getUserInfo as _getUserInfo } from '@/api/user'
import { toast } from '@/utils/toast'
import { generateUUID } from '@/utils/uuid'
import type { IBindAccountForm } from '@/api/types/login'

// 初始化状态
const userInfoState: IUserInfoVo = {
  userId: "",
  username: '',
  avatar: '',
  accessToken: '',
  refreshToken: '',
  expiresTime: 0, // 改为数字类型
}

export const useUserStore = defineStore(
  'user',
  () => {
    // 定义用户信息
    const userInfo = ref<IUserInfoVo>({ ...userInfoState })
    
    // 设置用户信息
    const setUserInfo = (val: IUserInfoVo) => {
      console.log('设置用户信息', val)
      // 若头像为空 则使用默认头像
      if (!val.avatar) {
        val.avatar = userInfoState.avatar
      }
      else {
        val.avatar = 'https://oss.laf.run/ukw0y1-site/avatar.jpg?feige'
      }
      userInfo.value = val
    }
    
    const setUserAvatar = (avatar: string) => {
      userInfo.value.avatar = avatar
      console.log('设置用户头像', avatar)
      console.log('userInfo', userInfo.value)
    }
    
    // 删除用户信息
    const removeUserInfo = () => {
      userInfo.value = { ...userInfoState }
      uni.removeStorageSync('userInfo')
      uni.removeStorageSync('accessToken')
      uni.removeStorageSync('refreshToken')
      uni.removeStorageSync('expiresTime')
      uni.removeStorageSync('systemUserInfo')
      uni.removeStorageSync('extendedUserInfo')
      console.log('清理用户信息完成')
    }

    /**
     * 存储用户信息到本地存储
     * @param userData 用户信息
     * @param accessToken 访问令牌
     * @param refreshToken 刷新令牌
     * @param expiresTime 过期时间戳
     */
    const saveUserToStorage = (userData: IUserInfoVo, accessToken: string, refreshToken: string, expiresTime?: number) => {
      const finalExpiresTime = expiresTime || userData.expiresTime || 0
      const updatedUserData = {
        ...userData,
        accessToken,
        refreshToken,
        expiresTime: finalExpiresTime
      }
      
      uni.setStorageSync('userInfo', updatedUserData)
      uni.setStorageSync('accessToken', accessToken)
      uni.setStorageSync('refreshToken', refreshToken)
      uni.setStorageSync('expiresTime', finalExpiresTime)
      
      console.log('保存用户信息到本地:', {
        userId: userData.userId,
        expiresTime: finalExpiresTime,
        expiresDate: new Date(finalExpiresTime)
      })
    }

    /**
     * 检查Token是否过期
     * @param buffer 缓冲时间（毫秒），默认提前5分钟
     */
    const isTokenExpired = (buffer: number = 5 * 60 * 1000): boolean => {
      const expiresTime = userInfo.value.expiresTime || uni.getStorageSync('expiresTime') || 0
      if (!expiresTime) return true
      
      const now = Date.now()
      const isExpired = now >= (expiresTime - buffer)
      
      console.log('Token过期检查:', {
        now: new Date(now),
        expiresTime: new Date(expiresTime),
        buffer: buffer / 1000 / 60 + '分钟',
        isExpired
      })
      
      return isExpired
    }

    /**
     * 刷新AccessToken
     */
    const refreshAccessToken = async (): Promise<boolean> => {
      try {
        const currentRefreshToken = userInfo.value.refreshToken || uni.getStorageSync('refreshToken')
        
        if (!currentRefreshToken) {
          console.error('没有RefreshToken，无法刷新')
          return false
        }
        
        console.log('开始刷新AccessToken...')
        const res = await _refreshToken(currentRefreshToken)
        
        if (res.code === 0) {
          const newTokenData = res.data
          
          // 更新用户信息
          const updatedUserInfo: IUserInfoVo = {
            ...userInfo.value,
            accessToken: newTokenData.accessToken,
            refreshToken: newTokenData.refreshToken,
            expiresTime: newTokenData.expiresTime
          }
          
          setUserInfo(updatedUserInfo)
          saveUserToStorage(
            updatedUserInfo, 
            newTokenData.accessToken, 
            newTokenData.refreshToken, 
            newTokenData.expiresTime
          )
          
          console.log('AccessToken刷新成功', {
            newExpiresTime: new Date(newTokenData.expiresTime)
          })
          
          return true
        } else {
          console.error('Token刷新失败:', res.msg)
          return false
        }
      } catch (error) {
        console.error('Token刷新异常:', error)
        return false
      }
    }

    /**
     * 检查并刷新Token（如果需要）
     * @returns Promise<boolean> 返回true表示Token有效，false表示需要重新登录
     */
    const ensureTokenValid = async (): Promise<boolean> => {
      // 检查是否有用户信息
      if (!userInfo.value.accessToken && !uni.getStorageSync('accessToken')) {
        console.log('没有accessToken，需要登录')
        return false
      }
      
      // 检查Token是否过期
      if (!isTokenExpired()) {
        console.log('Token仍然有效')
        return true
      }
      
      console.log('Token即将过期，尝试刷新...')
      const refreshSuccess = await refreshAccessToken()
      
      if (!refreshSuccess) {
        console.log('Token刷新失败，需要重新登录')
        // 清理本地数据
        removeUserInfo()
        return false
      }
      
      return true
    }

    /**
     * 处理登录成功后的用户信息设置
     * @param loginData 登录返回数据
     * @param username 用户名（可选）
     * @param showToast 是否显示成功提示
     */
    const handleLoginSuccess = (loginData: any, username?: string, showToast = true) => {
      const userData: IUserInfoVo = {
        userId: loginData.userId,
        username: username || loginData.userId, // 优先使用传入的用户名，否则使用userId
        avatar: '',
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
        expiresTime: loginData.expiresTime,
      }
      
      console.log('登录成功数据:', {
        userId: userData.userId,
        expiresTime: new Date(loginData.expiresTime)
      })
      
      setUserInfo(userData)
      saveUserToStorage(userData, loginData.accessToken, loginData.refreshToken, loginData.expiresTime)
      getUserInfo()
      if (showToast) {
        toast.success('登录成功')
      }
    }

    /**
     * 构建绑定参数并跳转到绑定页面
     * @param socialCode 微信登录凭证
     * @param socialState 状态标识
     */
    const navigateToBindPage = (socialCode: string, socialState: string) => {
      const bindParams = {
        socialType: 34,
        socialCode,
        socialState
      }
      
      const queryString = Object.keys(bindParams)
        .map(key => `${key}=${encodeURIComponent(bindParams[key as keyof typeof bindParams])}`)
        .join('&')
      
      console.log('绑定参数', queryString)
      uni.navigateTo({
        url: `/pages/bind/index?${queryString}`,
      })
    }
    /**
     * 获取用户信息
     */
    const getUserInfo = async () => {
      const res = await _getUserInfo()
      const userData = res.data
      uni.setStorageSync('systemUserInfo', userData)
      // TODO 这里可以增加获取用户路由的方法 根据用户的角色动态生成路由
      return res
    }

    /**
     * 用户登录
     * @param credentials 登录参数
     * @param showToast 是否显示成功提示
     * @returns R<IUserLogin>
     */
    const login = async (credentials: {
      username: string
      password: string
      captchaVerification?: string
    }, showToast = true) => {
      const res = await _login(credentials)
      if (res.code !== 0) {
        toast.info(res.msg)
        return null
      }
      
      console.log('登录信息', res)
      handleLoginSuccess(res.data, credentials.username, showToast)
      return res
    }

    /**
     * 退出登录 并 删除用户信息
     */
    const logout = async () => {
      _logout()
      removeUserInfo()
    }

    /**
     * 微信登录
     */
    const wxLogin = async () => {
      // 获取微信小程序登录的code
      const data = await getWxCode()
      console.log('微信登录code', data)

      const res = await _wxLogin(data)
      await getUserInfo()
      return res
    }

    /**
     * 社交登录（微信）
     */
    const socialLogin = async() => {
      const state = generateUUID()
      const data = await getWxCode()
      console.log('微信登录code', data)
      
      const res = await _socialLogin({
        type: 34,
        code: data.code,
        state: state
      })
      
      // 处理特殊响应码：未绑定账号
      if (res.code === 1_002_000_005) {
        console.log('未绑定账号，需要先绑定')
        navigateToBindPage(data.code, state)
        return null // 返回null表示需要绑定
      } else {
        // 使用公共方法处理登录成功逻辑
        handleLoginSuccess(res.data, undefined, false)
        return res
      }
    }

    /**
     * 绑定账号
     * @param bindForm 绑定表单数据
     */
    const bindAccount = async (bindForm: IBindAccountForm) => {
      const res = await _bindAccount(bindForm)
      console.log('绑定信息', res)
      
      // 绑定成功后获取用户信息
      await getUserInfo()
      
      toast.success('绑定成功')
      return res
    }

    /**
     * 获取用户扩展信息
     * @returns 包含微信信息和手机号授权的完整用户信息
     */
    const getExtendedUserInfo = () => {
      return uni.getStorageSync('extendedUserInfo') || null
    }

    return {
      userInfo,
      login,
      wxLogin,
      socialLogin,
      bindAccount,
      getUserInfo,
      setUserInfo,
      setUserAvatar,
      logout,
      clearUserInfo: removeUserInfo, // 为了保持一致性，添加别名
      getExtendedUserInfo, // 新增：获取扩展用户信息
      // Token管理方法
      isTokenExpired,
      refreshAccessToken,
      ensureTokenValid,
    }
  },
  {
    persist: true,
  },
)

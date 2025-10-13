import type { IBindAccountForm, IUserInfoVo } from '@/api/types/login'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  bindAccount as _bindAccount,
  login as _login,
  logout as _logout,
  refreshToken as _refreshToken,
  socialLogin as _socialLogin,
  wxLogin as _wxLogin,
  getWxCode,
} from '@/api/login'
import { getUserInfo as _getUserInfo } from '@/api/user'
import { toast } from '@/utils/toast'
import { generateUUID } from '@/utils/uuid'

// 初始化状态
const userInfoState: IUserInfoVo = {
  userId: '',
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
      // 若头像为空 则使用默认头像
      if (!val.avatar) {
        val.avatar = userInfoState.avatar
      }
      else {
        val.avatar = ''
      }
      userInfo.value = val
    }

    const setUserAvatar = (avatar: string) => {
      userInfo.value.avatar = avatar
    }

    // 删除用户信息
    const removeUserInfo = () => {
      userInfo.value = { ...userInfoState }
      uni.removeStorageSync('refreshToken')
      uni.removeStorageSync('expiresTime')
      uni.removeStorageSync('accessToken')
      uni.removeStorageSync('systemUserInfo')
      uni.removeStorageSync('userInfo')
      uni.removeStorageSync('user')
    }

    /**
     * 存储必要信息到本地存储（仅refreshToken和expiresTime）
     * @param refreshToken 刷新令牌
     * @param expiresTime 过期时间戳
     */
    const saveTokenToStorage = (refreshToken: string, expiresTime?: number) => {
      uni.setStorageSync('refreshToken', refreshToken)
      if (expiresTime) {
        uni.setStorageSync('expiresTime', expiresTime)
      }
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

    const getUserInfoCache = async () => {
      const systemUserInfo = uni.getStorageSync('systemUserInfo')
      if (!systemUserInfo) {
        return await getUserInfo()
      }
      return systemUserInfo
    }

    /**
     * 处理登录成功后的用户信息设置
     * @param loginData 登录返回数据
     * @param username 用户名（可选）
     * @param showToast 是否显示成功提示
     */
    const handleLoginSuccess = async (loginData: any, username?: string, showToast = true) => {
      console.log('登录数据:', loginData)
      const userData: IUserInfoVo = {
        userId: loginData.userId,
        username: username || loginData.userId, // 优先使用传入的用户名，否则使用userId
        avatar: '',
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
        expiresTime: loginData.expiresTime,
      }
      saveTokenToStorage(loginData.refreshToken, loginData.expiresTime)
      const userInfo = await getUserInfo()
      userData.username = userInfo.data.username
      userData.avatar = userInfo.data.avatar
      setUserInfo(userData)
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
        socialState,
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
    const socialLogin = async () => {
      const state = generateUUID()
      const data = await getWxCode()
      console.log('微信登录code', data)

      const res = await _socialLogin({
        type: 34,
        code: data.code,
        state,
      })

      // 处理特殊响应码：未绑定账号
      if (res.code === 1_002_000_005) {
        console.log('未绑定账号，需要先绑定')
        navigateToBindPage(data.code, state)
        return null // 返回null表示需要绑定
      }
      if (res.code !== 0) {
        // 提示登录失败
        uni.showToast({
          icon: 'none',
          title: res.msg,
        })
        return null
      }
      // 使用公共方法处理登录成功逻辑
      handleLoginSuccess(res.data, undefined, false)
      return res
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
      getUserInfoCache,
      setUserInfo,
      setUserAvatar,
      logout,
      clearUserInfo: removeUserInfo, // 为了保持一致性，添加别名
      getExtendedUserInfo, // 新增：获取扩展用户信息
    }
  },
  {
    persist: true,
  },
)

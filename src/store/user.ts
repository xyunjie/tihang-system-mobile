import type { IBindAccountForm, IUserInfoVo } from '@/api/types/login'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  bindAccount as _bindAccount,
  login as _login,
  logout as _logout,
  socialLogin as _socialLogin,
  wxLogin as _wxLogin,
  getWxCode,
} from '@/api/login'
import { getUserInfo as _getUserInfo } from '@/api/user'
import { setUserId } from '@/utils/analytics'
import { toast } from '@/utils/toast'
import { generateUUID } from '@/utils/uuid'

// 初始化状态
const userInfoState: IUserInfoVo = {
  userId: '',
  username: '',
  nickname: '',
  avatar: '',
  accessToken: '',
  refreshToken: '',
  expiresTime: 0, // 改为数字类型
  firstLogin: false,
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

    const setFirstLogin = (firstLogin: boolean) => {
      userInfo.value.firstLogin = firstLogin
      uni.setStorageSync('firstLogin', firstLogin)
    }

    // 删除用户信息
    const removeUserInfo = () => {
      userInfo.value = { ...userInfoState }
      uni.removeStorageSync('refreshToken')
      uni.removeStorageSync('expiresTime')
      uni.removeStorageSync('accessToken')
      uni.removeStorageSync('firstLogin')
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
        nickname: loginData.nickname || loginData.userId, // 优先使用传入的昵称，否则使用userId
        avatar: '',
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
        expiresTime: loginData.expiresTime,
        firstLogin: loginData.firstLogin === true,
      }
      saveTokenToStorage(loginData.refreshToken, loginData.expiresTime)
      setFirstLogin(loginData.firstLogin === true)
      const userInfo = await getUserInfo()
      userData.username = userInfo.data.username
      userData.avatar = userInfo.data.avatar
      setUserInfo(userData)

      // 设置百度统计用户 ID
      if (loginData.userId) {
        setUserId(String(loginData.userId))
      }

      if (showToast) {
        toast.success('登录成功')
      }
    }

    /**
     * 构建绑定参数并跳转到绑定页面
     * @param socialCode 微信登录凭证
     * @param socialState 状态标识
     */
    const navigateToBindPage = (socialCode: string, socialState: string, socialType: number = 34) => {
      const bindParams = {
        socialType,
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
      await handleLoginSuccess(res.data, credentials.username, showToast)
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
     * 统一的社交登录（通过 code + state）
     * @param socialType 社交类型：34=微信小程序，31=微信H5
     * @param code 授权码
     * @param state 状态字符串
     */
    const socialLoginByCode = async (socialType: number, code: string, state?: string) => {
      const res = await _socialLogin({
        type: socialType,
        code,
        state,
      })

      // 未绑定账号
      if (res.code === 1_002_000_005) {
        console.log('未绑定账号，需要先绑定', { socialType, code, state })
        navigateToBindPage(code, state || '', socialType)
        return null
      }
      // 未授权/未登录等
      if (res.code === 401) {
        console.warn('社交登录未授权：', res.msg)
        uni.showToast({
          icon: 'none',
          title: res.msg || '授权未完成，请重试',
        })
        return null
      }
      if (res.code !== 0) {
        uni.showToast({
          icon: 'none',
          title: res.msg,
        })
        return null
      }
      // 登录成功
      await handleLoginSuccess(res.data, undefined, false)
      return res
    }

    /**
     * 社交登录（微信）
     */
    const socialLogin = async () => {
      const state = generateUUID()
      const data = await getWxCode()
      console.log('微信登录code', data)
      return socialLoginByCode(34, data.code, state)
    }

    /**
     * 社交登录（H5 微信浏览器，通过回调code）
     * @param code OAuth 回调code
     * @param state OAuth 状态
     */
    const socialLoginByCode31 = async (code: string, state?: string) => {
      return socialLoginByCode(31, code, state)
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
      socialLoginByCode,
      socialLoginByCode31,
      bindAccount,
      getUserInfo,
      getUserInfoCache,
      setUserInfo,
      setUserAvatar,
      setFirstLogin,
      logout,
      clearUserInfo: removeUserInfo, // 为了保持一致性，添加别名
      getExtendedUserInfo, // 新增：获取扩展用户信息
    }
  },
  {
    persist: true,
  },
)

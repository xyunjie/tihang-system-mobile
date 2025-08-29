import type { ISystemUserInfoVo, IUserInfoVo } from '@/api/types/login'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getUserInfo as _getUserInfo,
  login as _login,
  logout as _logout,
  wxLogin as _wxLogin,
  socialLogin as _socialLogin,
  bindAccount as _bindAccount,
  getWxCode,
} from '@/api/login'
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
  expiresTime: '',
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
    }

    /**
     * 存储用户信息到本地存储
     * @param userData 用户信息
     * @param accessToken 访问令牌
     * @param refreshToken 刷新令牌
     */
    const saveUserToStorage = (userData: IUserInfoVo, accessToken: string, refreshToken: string) => {
      uni.setStorageSync('userInfo', userData)
      uni.setStorageSync('accessToken', accessToken)
      uni.setStorageSync('refreshToken', refreshToken)
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
      
      console.log('userData', userData)
      setUserInfo(userData)
      saveUserToStorage(userData, loginData.accessToken, loginData.refreshToken)
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
    }
  },
  {
    persist: true,
  },
)

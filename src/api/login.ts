import type { ICaptcha, IUpdateInfo, IUpdatePassword, IUserInfoVo, IUserLogin, ILoginForm, IAuthSocialLoginReqVO, IBindAccountForm } from './types/login'
import { http } from '@/http/http'

/**
 * 获取验证码
 * @returns ICaptcha 验证码
 */
export function getCode() {
  return http.get<ICaptcha>('/admin-api/system/captcha/get')
}

/**
 * 用户登录 - 根据API文档更新
 * @param loginForm 登录表单
 */
export function login(loginForm: ILoginForm) {
  const headers: Record<string, any> = {
    'tenant-id': 1, // 默认租户ID
  }
  
  return http.post<IUserLogin>('/admin-api/system/auth/login', loginForm, {
    headers
  })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return http.get<IUserInfoVo>('/admin-api/system/auth/get-permission-info')
}

/**
 * 退出登录
 */
export function logout() {
  return http.post<void>('/admin-api/system/auth/logout')
}

/**
 * 修改用户信息
 */
export function updateInfo(data: IUpdateInfo) {
  return http.post('/user/updateInfo', data)
}

/**
 * 修改用户密码
 */
export function updateUserPassword(data: IUpdatePassword) {
  return http.post('/user/updatePassword', data)
}

/**
 * 获取微信登录凭证
 * @returns Promise 包含微信登录凭证(code)
 */
export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve(res),
      fail: err => reject(new Error(err)),
    })
  })
}

/**
 * 微信登录参数
 */

/**
 * 微信登录
 * @param params 微信登录参数，包含code
 * @returns Promise 包含登录结果
 */
export function wxLogin(data: { code: string }) {
  return http.post<IUserLogin>('/user/wxLogin', data)
}

/**
 * 三方登录
 * @returns Promise 包含登录结果
 */
export function socialLogin(data: IAuthSocialLoginReqVO) {
  return http.post<IUserLogin>('/admin-api/system/auth/social-login', data)
}

/**
 * 绑定账号
 * @param data 绑定账号参数
 * @returns Promise 包含登录结果
 */
export function bindAccount(data: IBindAccountForm) {
  return http.post<IUserLogin>('/admin-api/system/social-user/bind', data)
}
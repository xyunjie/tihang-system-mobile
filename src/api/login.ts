import type { AuthResetPasswordByEmailReqVO, GetWxUserInfoReqVO, IAuthSendScanMessageReqVO, IAuthSocialLoginReqVO, IBindAccountForm, ICaptcha, ILoginForm, ISocialAuthRedirectReqVO, ITokenRefreshResponse, IUserLogin, WxUserInfoRespVO } from './types/login'
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
  return http.post<IUserLogin>('/admin-api/system/auth/login', loginForm)
}

/**
 * 刷新Token
 * @param refreshToken 刷新令牌
 */
export function refreshToken(refreshToken: string) {
  return http.post<ITokenRefreshResponse>(`/admin-api/system/auth/refresh-token?refreshToken=${refreshToken}`)
}

/**
 * 退出登录
 */
export function logout() {
  return http.post<void>('/admin-api/system/auth/logout')
}

/**
 * 获取微信登录凭证
 * @returns Promise 包含微信登录凭证(code)
 */
export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        reject(new Error(err.errMsg))
      },
    })
  })
}

/**
 * 获取微信用户信息（openid 和 unionId）
 * 此接口用于获取微信用户的唯一标识，不进行登录操作
 * @param params 微信登录参数（type、code、state）
 * @returns Promise 包含 openid 和 unionId
 */
export function getWxUserInfoApi(params: GetWxUserInfoReqVO) {
  return http.post<WxUserInfoRespVO>('/admin-api/system/auth/social-user-info', params)
}

/**
 * 获取微信 H5 授权 URL
 * @param redirectUri 授权回调地址
 * @returns 授权 URL
 */
export function getWxH5AuthUrl(redirectUri: string) {
  return http.get<string>('/admin-api/system/auth/social-auth-redirect', { type: 31, redirectUri })
}

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

/**
 * 发送扫码登录消息
 * @param data 扫码登录消息参数
 * @returns Promise
 */
export function sendScanMessage(data: IAuthSendScanMessageReqVO) {
  return http.post<boolean>('/admin-api/system/auth/send-scan-message', data)
}

/**
 * 获取社交授权跳转链接
 * @param params 社交授权跳转参数
 * @returns Promise 包含跳转链接
 */
export function getSocialAuthRedirect(params: ISocialAuthRedirectReqVO) {
  return http.get<string>('/admin-api/system/auth/social-auth-redirect', params)
}

/**
 * 发送邮箱验证码（找回密码）
 * @param data { username, email }
 */
export function sendEmailCode(data: { username: string, email: string }) {
  // 根据 OpenAPI 要求附带 tenant-id 头；Authorization 将由拦截器按需添加
  const headers: Record<string, any> = {
    'tenant-id': 1,
  }
  return http.post<boolean>('/admin-api/system/auth/send-email-code', data, undefined, headers)
}

/**
 * 通过邮箱验证码重置密码
 * @param data { username, email, code, password }
 */
export function resetPasswordByEmail(data: AuthResetPasswordByEmailReqVO) {
  const headers: Record<string, any> = {
    'tenant-id': 1,
  }
  return http.post<boolean>('/admin-api/system/auth/reset-password-by-email', data, undefined, headers)
}

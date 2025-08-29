/**
 * 用户信息
 */
export interface IUserInfoVo {
  userId: string
  username: string
  avatar: string
  accessToken: string
  refreshToken?: string
  expiresTime?: number // 改为数字类型，存储时间戳
  // 扩展字段：微信用户信息
  wxNickName?: string
  wxAvatarUrl?: string
  wxGender?: number // 0:未知、1:男、2:女
  wxCountry?: string
  wxProvince?: string
  wxCity?: string
  // 扩展字段：手机号授权信息
  phoneAuthData?: {
    encryptedData: string
    iv: string
    cloudID?: string
    timestamp: number
  }
}

/**
 * 登录返回的信息 - 根据API文档更新
 */
export interface IUserLogin {
  userId: string
  accessToken: string
  refreshToken: string
  expiresTime: number // 改为数字类型，存储时间戳
}

/**
 * Token刷新响应
 */
export interface ITokenRefreshResponse {
  userId: string
  accessToken: string
  refreshToken: string
  expiresTime: number // 时间戳
}

/**
 * 登录请求参数 - 根据API文档定义
 */
export interface ILoginForm {
  username: string
  password: string
  captchaVerification?: string
  socialType?: number
  socialCode?: string
  socialState?: string
  socialCodeValid?: boolean
}

/**
 * 获取验证码
 */
export interface ICaptcha {
  captchaEnabled: boolean
  uuid: string
  image: string
}

/**
 * 上传成功的信息
 */
export interface IUploadSuccessInfo {
  fileId: number
  originalName: string
  fileName: string
  storagePath: string
  fileHash: string
  fileType: string
  fileBusinessType: string
  fileSize: number
}

export interface IAuthSocialLoginReqVO {
  type: number
  code: string
  state?: string
}

/**
 * 绑定账号请求参数
 */
export interface IBindAccountForm {
  type: number
  code: string
  state: string
}
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

/**
 * 发送扫码登录消息请求参数
 */
export interface IAuthSendScanMessageReqVO {
  /** 标识信息 */
  nonce: string
  /** 用户编号 */
  userId: string
  /** 状态 */
  status: string
}

/**
 * 社交授权跳转请求参数
 */
export interface ISocialAuthRedirectReqVO {
  /** 社交类型 */
  type: number
  /** 回调路径 */
  redirectUri: string
}

/**
 * 通过邮箱验证码重置密码请求体
 */
export interface AuthResetPasswordByEmailReqVO {
  /** 用户名 */
  username: string
  /** 邮箱 */
  email: string
  /** 验证码 */
  code: string
  /** 新密码 */
  password: string
}

/**
 * 获取微信用户信息请求参数
 */
export interface GetWxUserInfoReqVO {
  /** 社交类型：34=微信小程序，31=微信H5（服务号） */
  type: number
  /** 微信登录凭证 */
  code: string
  /** 状态字符串（H5 OAuth 需要） */
  state?: string
}

/**
 * 微信用户信息响应
 */
export interface WxUserInfoRespVO {
  /** 微信小程序唯一ID（小程序环境）或 微信公众号唯一ID（H5环境） */
  openid: string
  /** 微信开放平台ID（同一用户在不同应用下相同） */
  unionId?: string
  /** 昵称 */
  nickname?: string
  /** 头像 */
  avatar?: string
  /** 是否关注服务号（仅微信H5服务号环境有效） */
  subscribe?: boolean
}

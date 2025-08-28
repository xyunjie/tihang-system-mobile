/**
 * 用户信息
 */
export interface IUserInfoVo {
  userId: string
  username: string
  avatar: string
  accessToken: string
  refreshToken?: string
  expiresTime?: string
}

/**
 * 登录返回的信息 - 根据API文档更新
 */
export interface IUserLogin {
  userId: string
  accessToken: string
  refreshToken: string
  expiresTime: string
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
/**
 * 更新用户信息
 */
export interface IUpdateInfo {
  id: number
  name: string
  sex: string
}
/**
 * 更新用户信息
 */
export interface IUpdatePassword {
  id: number
  oldPassword: string
  newPassword: string
  confirmPassword: string
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
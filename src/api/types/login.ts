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

export interface ISystemUserInfoVo {
   /*用户编号 */
    id: number;

    /*用户账号 */
    username: string;

    /*用户昵称 */
    nickname: string;

    /*备注 */
    remark: string;

    /*部门ID */
    deptId: number;

    /*部门名称 */
    deptName: string;

    /*岗位编号数组 */
    postIds: Record<string, unknown>[];

    /*用户邮箱 */
    email: string;

    /*手机号码 */
    mobile: string;

    /*用户性别，参见 SexEnum 枚举类 */
    sex: number;

    /*用户头像 */
    avatar: string;

    /*状态，参见 CommonStatusEnum 枚举类 */
    status: number;

    /*最后登录 IP */
    loginIp: string;

    /*最后登录时间 */
    loginDate: Record<string, unknown>;

    /*创建时间 */
    createTime: Record<string, unknown>;
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
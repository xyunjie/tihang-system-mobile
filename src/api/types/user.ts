/**
 * 系统用户信息
 */
export interface ISystemUserInfoVo {
  /* 用户编号 */
  id: string

  /* 用户账号 */
  username: string

  /* 用户昵称 */
  nickname: string

  /* 用户邮箱 */
  email: string

  /* 手机号码 */
  mobile: string

  /* 用户性别，参见 SexEnum 枚举类 */
  sex: number

  /* 用户头像 */
  avatar: string

  /* 最后登录 IP */
  loginIp: string

  /* 最后登录时间 */
  loginDate: Record<string, unknown>

  /* 创建时间 */
  createTime: Record<string, unknown>

  /* */
  roles: {
    /* 角色编号 */
    id: number

    /* 角色名称 */
    name: string
  }[]

  /* */
  dept: {
    /* 部门编号 */
    id: number

    /* 部门名称 */
    name: string

    /* 父部门 ID */
    parentId: number
  }

  /* */
  posts: {
    /* 岗位序号 */
    id: number

    /* 岗位名称 */
    name: string
  }[]
}

/**
 * 用户个人信息更新 Request VO
 */
export interface IUserProfileUpdateReqVO {
  /* 用户邮箱 */
  email?: string

  /* 手机号码 */
  mobile?: string

  /* 角色头像 */
  avatar?: string
}

/**
 * 用户个人密码更新 Request VO
 */
export interface IUserProfileUpdatePasswordReqVO {
  /* 旧密码 */
  oldPassword: string

  /* 新密码 */
  newPassword: string
}

/**
 * 用户个人登录日志 Response VO
 */
export interface IUserProfileLoginLogRespVO {
  /* 编号 */
  id?: number

  /* 设备类型 */
  deviceType: string

  /* 浏览器类型 */
  browserType: string

  /* 用户地区 */
  userArea: string

  /* 创建时间（时间戳） */
  createTime: number

  /* 登录结果 */
  result: number

  /* 用户IP */
  userIp: string

  /* 操作系统 */
  os: string

  /* 日志类型（可选） */
  logType?: number

  /* 链路追踪编号（可选） */
  traceId?: string

  /* 用户编号（可选） */
  userId?: number

  /* 用户类型（可选） */
  userType?: number

  /* 用户账号（可选） */
  username?: string

  /* 浏览器UA（可选） */
  userAgent?: string
}

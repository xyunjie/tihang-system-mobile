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

  /* 学院班级 */
  schoolDeptName?: string
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

/**
 * 用户精简信息 Response VO
 */
export interface UserSimpleRespVO {
  /* 用户编号 */
  id: number

  /* 用户昵称 */
  nickname: string

  /* 部门ID */
  deptId?: number

  /* 部门名称 */
  deptName?: string
}

/**
 * 用户扩展数据 Response VO
 */
export interface UserExtraRespVO {
  /** ID */
  id: number
  /** 对应的用户id */
  userId: number
  /** 迁移的openid */
  openid?: string
  /** 用户昵称 */
  nickName?: string
  /** 个人介绍 */
  userInfo?: string
  facePath?: string
}

/**
 * 用户扩展数据结果类型
 */
export interface UserExtraResult {
  /** 状态码 */
  code: number
  /** 响应数据 */
  data: UserExtraRespVO
  /** 响应消息 */
  msg: string
}

/**
 * 用户精简信息列表响应
 */
export interface CommonResultListUserSimpleRespVO {
  code: number
  data: UserSimpleRespVO[]
  msg: string
}

// 部门树用户请求参数
export interface GetDeptTreeUsersParams {
  // 预留扩展参数，例如关键字筛选等
  keyword?: string
}

// 部门树用户响应结构
export interface GetDeptTreeUsersRes {
  code: number
  data: {
    dept: {
      id: number
      name: string
      parentId: number
      sort: number
      leaderUserId: number
      leaderName: string
      phone: string
      email: string
      status: number
      createTime: Record<string, unknown>
      transMap: Record<string, unknown>
    }
    children: {
      id: number
      name: string
      parentId: number
      sort: number
      leaderUserId: number
      leaderName: string
      phone: string
      email: string
      status: number
      createTime: Record<string, unknown>
      transMap: Record<string, unknown>
    }[]
    users: {
      id: number
      username: string
      nickname: string
      remark: string
      deptId: number
      deptName: string
      schoolDeptName: string
      roleIds: Record<string, unknown>[]
      roles: Record<string, unknown>[]
      ojUid: number
      ojInfo: {
        uid: number
        priv: number
      }
      gitId: number
      gitInfo: {
        id: number
        isAdmin: boolean
        prohibitLogin: boolean
      }
      postIds: Record<string, unknown>[]
      email: string
      mobile: string
      sex: number
      avatar: string
      status: number
      loginIp: string
      loginDate: Record<string, unknown>
      createTime: Record<string, unknown>
    }[]
    transMap: Record<string, unknown>
  }
  msg: string
}

// 获取用户个人信息请求参数（预留扩展）
export interface GetUserProfileParams {
  // 目前无需额外参数，占位以便未来扩展
}

// 获取用户个人信息响应结构
export interface GetUserProfileRes {
  /* 状态码 */
  code: number
  /* 返回数据 */
  data: ISystemUserInfoVo
  /* 返回消息 */
  msg: string
}

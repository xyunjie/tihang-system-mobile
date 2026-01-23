/**
 * 用户纳新登记新增/修改 Request VO
 */
export interface UserRecruitmentSaveReqVO {
  /* id */
  id?: number

  /* 姓名 */
  name: string

  /* 学号 */
  studentId: string

  /* 微信小程序唯一ID */
  openid?: string

  /* 微信开放平台ID */
  unionId?: string

  /* 社交类型：34=微信小程序，31=微信H5（服务号） */
  socialType?: number

  /* 邮箱 */
  email: string

  /* 手机号 */
  phone: string

  /* QQ号 */
  qqNumber: string

  /* 出生年月 */
  birthday: string

  /* 性别 */
  sex: number

  /* 民族 */
  nation: string

  /* 政治面貌 */
  politicalOutlook: string

  /* 用户介绍 */
  userIntroduce: string

  /* 加入原因 */
  joinReason: string

  /* 个人技能 */
  personalSkills: string

  /* 兴趣方向 */
  interestDirection: string

  /* 年级（字典） */
  grade: number

  /* 学校组织ID */
  schoolDeptId: number

  /* 对应的报名表ID */
  settingId: number

  /* 照片地址 */
  imageUrl: string

  /* 省份 */
  province: string

  /* 市/区 */
  city: string
}

/**
 * 用户纳新登记 Response VO
 */
export interface UserRecruitmentRespVO {
  /* id */
  id: number

  /* 姓名 */
  name: string

  /* 学号 */
  studentId: string

  /* 邮箱 */
  email: string

  /* 手机号 */
  phone: string

  /* QQ号 */
  qqNumber: string

  /* 出生年月 */
  birthday: string

  /* 性别 */
  sex: number

  /* 民族 */
  nation: string

  /* 政治面貌 */
  politicalOutlook: string

  /* 用户介绍 */
  userIntroduce: string

  /* 加入原因 */
  joinReason: string

  /* 个人技能 */
  personalSkills: string

  /* 兴趣方向 */
  interestDirection: string

  /* 年级（字典） */
  grade: number

  /* 学校组织ID */
  schoolDeptId: number

  /* 成员角色（录取后分配的角色） */
  roleId?: number

  /* 对应的报名表ID */
  settingId: number

  /* 照片地址 */
  imageUrl: string

  /* 省份 */
  province: string

  /* 市/区 */
  city: string

  /* 审核状态：0-待审核 1-审核通过 2-审核不通过 3-待面试/待笔试 10-拟录取 */
  status: number

  /* 创建时间 */
  createTime: string
}

/**
 * 纳新审核状态枚举
 */
export enum RecruitmentStatus {
  /* 待审核 */
  WAIT_AUDIT = 0,
  /* 审核通过 */
  PASS = 1,
  /* 审核不通过 */
  REFUSE = 2,
  /* 待面试/待笔试 */
  WAIT_INTERVIEW = 3,
  /* 拟录取 */
  FIT_ADMIT = 10,
}

/**
 * 获取审核状态文本
 */
export function getRecruitmentStatusText(status: number): string {
  switch (status) {
    case RecruitmentStatus.WAIT_AUDIT:
      return '待审核'
    case RecruitmentStatus.PASS:
      return '审核通过'
    case RecruitmentStatus.REFUSE:
      return '审核不通过'
    case RecruitmentStatus.WAIT_INTERVIEW:
      return '待面试/待笔试'
    case RecruitmentStatus.FIT_ADMIT:
      return '拟录取'
    default:
      return '未知状态'
  }
}

/**
 * 用户纳新计划配置 Response VO
 */
export interface UserRecruitmentConfigRespVO {
  /* ID */
  id: number

  /* 纳新名称/介绍 */
  name: string

  /* 开始时间 */
  startTime: string

  /* 结束时间 */
  endTime: string

  /* 纳新年级 */
  grade: number

  /* 纳新群链接 */
  groupLink: string

  /* 当前状态（0-开始报名  1-停止报名） */
  status: number

  /* 创建时间 */
  createTime: string
}

/**
 * 通用返回结果（纳新计划配置类型）
 */
export interface CommonResultUserRecruitmentConfigRespVO {
  /* 错误码 */
  code: number

  /* 返回数据 */
  data: UserRecruitmentConfigRespVO

  /* 返回消息 */
  msg: string
}

/**
 * 通用返回结果（Long类型）
 */
export interface CommonResultLong {
  /* 错误码 */
  code: number

  /* 返回数据 */
  data: number

  /* 返回消息 */
  msg: string
}

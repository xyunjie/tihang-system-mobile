/**
 * 审核状态枚举
 */
export enum RecruitmentStatus {
  WAIT_AUDIT = 0,
  PASS = 1,
  REFUSE = 2,
  WAIT_INTERVIEW = 3,
  FIT_ADMIT = 10,
}

export function getRecruitmentStatusText(status: number): string {
  switch (status) {
    case RecruitmentStatus.WAIT_AUDIT: return '等待审核'
    case RecruitmentStatus.PASS: return '审核通过'
    case RecruitmentStatus.REFUSE: return '审核不通过'
    case RecruitmentStatus.WAIT_INTERVIEW: return '待面试/待笔试'
    case RecruitmentStatus.FIT_ADMIT: return '拟录取'
    default: return '未知状态'
  }
}

/**
 * 纳新归档信息响应 VO
 */
export interface UserRecruitmentArchivesRespVO {
  id: number
  name: string
  studentId: string
  email: string
  phone: string
  qqNumber: string
  birthday: string
  sex: number
  nation: string
  politicalOutlook: string
  userIntroduce: string
  joinReason: string
  personalSkills: string
  interestDirection: string
  grade: number
  schoolDeptId: number
  schoolDeptName: string
  settingId: number
  settingName: string
  imageUrl: string
  province: string
  city: string
  /* 审核状态，对应 RecruitmentStatus 枚举 */
  status: number
  openid: string
  unionId?: string
  /* 系统密码，仅拟录取成员有值 */
  password?: string | null
  createTime: string
  time: string
  location: string
}

export type CommonResultLong = number

/**
 * 用户纳新提交状态响应 VO
 */
export interface UserRecruitmentRespVO {
  id: number
  status: number
  openid?: string
  unionId?: string
}

/**
 * 纳新计划配置响应 VO
 */
export interface UserRecruitmentConfigRespVO {
  id?: number
  groupLink?: string
  isOpen?: boolean
  [key: string]: any
}

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




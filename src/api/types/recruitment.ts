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
 * 纳新状态
 */
export enum RecruitmentStatus {
  APPLY = 0,
  PASS = 1,
  REFUSE = 2,
}

/**
 * 纳新状态文案
 */
export function getRecruitmentStatusText(status?: number) {
  switch (status) {
    case RecruitmentStatus.APPLY:
      return '审核中'
    case RecruitmentStatus.PASS:
      return '已通过'
    case RecruitmentStatus.REFUSE:
      return '已拒绝'
    default:
      return '未知'
  }
}


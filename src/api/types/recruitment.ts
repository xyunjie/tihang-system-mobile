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

  /* 学院 (临时字段) */
  schoolDept?: string

  /* 专业 (临时字段) */
  major?: string

  /* 班级 (临时字段) */
  classNumber?: string
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

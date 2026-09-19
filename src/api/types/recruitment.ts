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
  /** 仅审核不通过、需要回填表单时返回 */
  id?: number
  status: number
  /** 审核不通过时的审核备注 */
  remark?: string | null
  openid?: string
  unionId?: string
  name?: string
  studentId?: string
  email?: string
  phone?: string
  qqNumber?: string
  birthday?: string
  sex?: number
  nation?: string
  politicalOutlook?: string
  userIntroduce?: string
  joinReason?: string
  personalSkills?: string
  interestDirection?: string
  grade?: number
  schoolDeptId?: number
  settingId?: number
  imageUrl?: string
  province?: string
  city?: string
  collegeId?: number
  majorId?: number
  classId?: number
  /** 跳转状态页所需的最小本人进度，不包含管理员字段 */
  progress?: UserRecruitmentProgressRespVO
  /** 报名批次对应的纳新群链接 */
  groupLink?: string
}

/** 用户本人可见的纳新考核通过记录 */
export interface UserRecruitmentAssessmentPublicRespVO {
  assessmentStage: number
  assessmentType: string
  passed: boolean
  score?: number | string | null
}

/** 用户本人纳新进度响应，不包含管理员操作人和备注 */
export interface UserRecruitmentProgressRespVO {
  status: number
  assessments: UserRecruitmentAssessmentPublicRespVO[]
}

/** 填表页与状态页之间的一次性预加载缓存；身份仅用于消费后的同本人重试 */
export interface UserRecruitmentProgressPreload {
  token: string
  createdAt: number
  openid?: string
  unionId?: string
  progress: UserRecruitmentProgressRespVO
  groupLink?: string
}

/** 流动考核科目，对应后端 RecruitmentAssessmentType 枚举 */
export type RecruitmentAssessmentType = 'ELECTRONIC' | 'STRUCTURE' | 'PROGRAM' | 'OTHER'

/** 后端 LocalDateTime 序列化值：默认毫秒时间戳，兼容字符串 */
export type RecruitmentDateTime = number | string

/**
 * 后端 Long 型雪花 id：超出 JS 安全整数，后端 NumberSerializer 会序列化成字符串。
 * 只原样回传或与同源 id 比较，禁止 Number() 转换（会丢精度）。
 */
export type RecruitmentLongId = string | number

/** 本人在某科目的当前预约摘要 */
export interface UserRecruitmentSessionMyBooking {
  sessionId: RecruitmentLongId
  startTime: RecruitmentDateTime
  endTime: RecruitmentDateTime
  location: string
  cancelable: boolean
  uncancelableReason: string | null
}

/** 学生端可见的场次公开字段 + 本人预约状态 */
export interface UserRecruitmentSessionItem {
  id: RecruitmentLongId
  startTime: RecruitmentDateTime
  endTime: RecruitmentDateTime
  location: string
  capacity: number
  bookedCount: number
  full: boolean
  booked: boolean
  bookable: boolean
  unbookableReason: string | null
}

/** 按科目分组的场次列表，三个科目固定都返回 */
export interface UserRecruitmentSessionSubjectGroup {
  assessmentType: RecruitmentAssessmentType
  assessmentTypeName: string
  passed: boolean
  myBooking: UserRecruitmentSessionMyBooking | null
  sessions: UserRecruitmentSessionItem[]
}

/** GET /system/user-recruitment-session/list-runtime 响应 */
export interface UserRecruitmentSessionRuntimeRespVO {
  subjects: UserRecruitmentSessionSubjectGroup[]
}

/** 预约 / 取消预约共用请求，身份只用 openid/unionId */
export interface UserRecruitmentSessionBookReqVO {
  openid?: string
  unionId?: string
  sessionId: RecruitmentLongId
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

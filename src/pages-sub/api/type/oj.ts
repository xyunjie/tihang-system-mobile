/**
 * OJ 统计信息响应类型定义
 */
export interface HydroOjCountRespVO {
  /** 通过题目数量 */
  accepted: number
  /** 训练数量 */
  train: number
  /** 比赛数量 */
  contest: number
  /** 作业数量 */
  homework: number
}

/** 通用响应包装（如需使用） */
export interface CommonResultHydroOjCountRespVO {
  code: number
  data: HydroOjCountRespVO
  msg: string
}

/**
 * OJ 评测记录分页类型定义
 */
export interface ObjectIdRespVO {
  /** 时间戳 */
  timestamp: number
  /** 日期时间 */
  date: string
}

/** 单条评测记录 */
export interface HydroOjRecordInfoRespVO {
  id: ObjectIdRespVO
  pid: number
  title?: string
  status: number
  statusMsg?: string
  code?: string
  judgeAt?: string | number
  uname?: string
  lang?: string
  time?: number
  memory?: number
}

/** 分页结果 - 评测记录 */
export interface PageResultHydroOjRecordRespVO {
  /** 数据列表 */
  list: HydroOjRecordRespVO[]
  /** 总数量 */
  total: number
}

/** 通用结果包装 - 分页评测记录 */
export interface CommonResultPageResultHydroOjRecordRespVO {
  code: number
  data: PageResultHydroOjRecordRespVO
  msg: string
}

/** 获取评测记录分页请求参数 */
export interface GetHydroOjRecordPageReqVO {
  /** 页码，从 1 开始 */
  pageNo: number
  /** 每页条数，最大值为 100 */
  pageSize: number
}

/** 列表项评测记录（简要） */
export interface HydroOjRecordRespVO {
  /** 提交id */
  id: ObjectIdRespVO | string
  /** 题目id */
  pid: number
  /** 题目标题 */
  title?: string
  /** 评测时间 */
  judgeAt?: string
  /** 语言 */
  lang?: string
  /** 题目耗时（毫秒） */
  time?: number
  /** 题目状态码 */
  status: number
  /** 题目状态文本 */
  statusMsg?: string
  /** 题目得分（如有） */
  score?: number
}

/** 训练项中的题目结构定义（占位，可根据实际扩展） */
export type TrainingsVo = any

/** 训练列表项 */
export interface HydroOjTrainingPageRespVO {
  /** 训练ID（Mongo ObjectId 或字符串） */
  docId: ObjectIdRespVO | string
  /** 训练标题 */
  title: string
  /** 训练内容（可能为富文本） */
  content?: string
  /** 训练描述 */
  description?: string
  /** 进度 */
  progress?: number
  /** 是否加入训练 */
  join?: boolean
  /** 题目总数 */
  total: number
  /** 训练 章节 数量 */
  dagTotal: number
}

/** 训练列表分页结果 */
export interface PageResultHydroOjTrainingRespVO {
  /** 数据列表 */
  list: HydroOjTrainingPageRespVO[]
  /** 总数量 */
  total: number
}

/** 通用结果包装 - 分页训练列表 */
export interface CommonResultPageResultHydroOjTrainingRespVO {
  code: number
  data: PageResultHydroOjTrainingRespVO
  msg: string
}

/** 获取训练列表请求参数 */
export interface GetHydroOjTrainingPageReqVO {
  /** 页码，从 1 开始 */
  pageNo: number
  /** 每页条数，最大值为 100（后端允许200，这里按100约束亦可） */
  pageSize: number
}

/** DAG 前置阶段条目 */
export interface HydroDagRequirementRespVO {
  id: number | string
  title: string
  /** 是否已完成（可选） */
  isCompleted?: boolean
}

/** DAG 题目条目 */
export interface HydroDagProblemRespVO {
  pid: number | string
  title: string
  /** 是否已完成（可选） */
  isCompleted?: boolean
}

/** DAG 阶段节点 */
export interface HydroDagNodeRespVO {
  id: number | string
  title: string
  /** 前置阶段 */
  requireNids: HydroDagRequirementRespVO[]
  /** 本阶段题目列表 */
  pids: HydroDagProblemRespVO[]
}

/** 训练详情响应 */
export interface HydroOjTrainingDetailRespVO {
  /** 训练ID（Mongo ObjectId 或字符串） */
  docId: ObjectIdRespVO | string
  /** 训练标题 */
  title: string
  /** 训练内容（富文本或纯文本） */
  content?: string
  /** 训练描述 */
  description?: string
  /** 进度（可能为空） */
  progress?: number | null
  /** 章节数量（后端可能不返回，故可选） */
  dagTotal?: number
  /** 题目数量（后端可能不返回，故可选） */
  total?: number
  /** 是否参加 */
  join?: boolean
  /** DAG 阶段结构 */
  dag?: HydroDagNodeRespVO[]
}

/** 通用结果包装 - 训练详情 */
export interface CommonResultHydroOjTrainingDetailRespVO {
  code: number
  data: HydroOjTrainingDetailRespVO
  msg: string
}

/** 题目详情响应 */
export interface HydroProblemRespVO {
  /** 题目 id */
  pid: number
  /** 题目标题 */
  title: string
  /** 题目描述（HTML） */
  content: string
  /** 时间限制 */
  time: string
  /** 空间限制 */
  memory: string
}

/** 通用结果包装 - 题目详情 */
export interface CommonResultHydroProblemRespVO {
  code: number
  data: HydroProblemRespVO
  msg: string
}

/**
 * 比赛列表项
 */
export interface HydroOjContestItemRespVO {
  /** 比赛ID（Mongo ObjectId 或字符串） */
  docId: string
  /** 比赛标题 */
  title: string
  /** 比赛规则（如 OI/ICPC 等） */
  rule: string
  /** 开始时间 */
  startAt: string | number
  /** 结束时间 */
  endAt: string | number
  /** 排名（如返回） */
  rank?: number
  /** 是否 rated */
  rated?: boolean
}

/**
 * 比赛分页结果
 */
export interface PageResultHydroOjContestRespVO {
  /** 数据列表 */
  list: HydroOjContestItemRespVO[]
  /** 总数量 */
  total: number
}

/**
 * 比赛分页通用结果包装
 */
export interface CommonResultPageResultHydroOjContestRespVO {
  code: number
  data: PageResultHydroOjContestRespVO
  msg: string
}

/**
 * 获取比赛分页请求参数
 */
export interface GetHydroOjContestPageReqVO {
  /** 页码，从 1 开始 */
  pageNo: number
  /** 每页条数，最大值为 100（后端允许200） */
  pageSize: number
}

// 新增：比赛详情响应结构
export interface HydroOjContestDetailRespVO {
  /** 比赛ID（Mongo ObjectId 或字符串） */
  docId: string
  /** 比赛标题 */
  title: string
  /** 比赛介绍（HTML/Markdown 原文） */
  content?: string
  /** 比赛规则 */
  rule: string
  /** 开始时间 */
  startAt: string | number
  /** 结束时间 */
  endAt: string | number
  /** 个人排名（-1 表示未参与排名） */
  rank?: number
  /** 题目列表 */
  problems: HydroProblemRespVO[]
  /** 参赛人数 */
  userCount?: number
}

// 新增：通用结果包装 - 比赛详情
export interface CommonResultHydroOjContestDetailRespVO {
  code: number
  data: HydroOjContestDetailRespVO
  msg: string
}

// 新增：比赛提交记录单项（与通用评测记录结构一致，独立类型避免相互影响）
export interface HydroOjContestRecordItemRespVO {
  /** 提交id */
  id: ObjectIdRespVO | string
  /** 题目id */
  pid: number
  /** 题目标题 */
  title?: string
  /** 通过时间 */
  judgeAt?: string
  /** 语言 */
  lang?: string
  /** 题目耗时（毫秒） */
  time?: number
  /** 题目状态码 */
  status: number
  /** 题目状态文本 */
  statusMsg?: string
  /** 题目得分（如有） */
  score?: number
}

// 新增：通用结果包装 - 比赛提交记录列表
export interface CommonResultListHydroOjContestRecordRespVO {
  code: number
  data: HydroOjContestRecordItemRespVO[]
  msg: string
}

export interface HydroOjContestRankItemRespVO {
  uname: string
  rank: number
  score: number
  accept: number
  uid: number
}

export interface CommonResultListHydroOjContestRankRespVO {
  code: number
  data: HydroOjContestRankItemRespVO[]
  msg?: string
}

/**
 * 作业列表项
 */
export interface HydroOjHomeworkItemRespVO {
  /** 作业ID（Mongo ObjectId 或字符串） */
  docId: string
  /** 作业标题 */
  title: string
  /** 作业规则（与比赛一致，如 OI/ICPC 等） */
  rule: string
  /** 开始时间 */
  startAt: string | number
  /** 结束时间 */
  endAt: string | number
  /** 排名（如返回；-1 表示未参与排名） */
  rank?: number
  /** 是否 rated（保留字段，与比赛一致） */
  rated?: boolean
}

/**
 * 作业分页结果
 */
export interface PageResultHydroOjHomeworkRespVO {
  /** 数据列表 */
  list: HydroOjHomeworkItemRespVO[]
  /** 总数量 */
  total: number
}

/**
 * 作业分页通用结果包装
 */
export interface CommonResultPageResultHydroOjHomeworkRespVO {
  code: number
  data: PageResultHydroOjHomeworkRespVO
  msg: string
}

/**
 * 获取作业分页请求参数
 */
export interface GetHydroOjHomeworkPageReqVO {
  /** 页码，从 1 开始 */
  pageNo: number
  /** 每页条数，最大值为 100（后端允许200） */
  pageSize: number
}

/**
 * 学校组织架构相关类型定义
 */

/**
 * 学校组织架构响应 VO
 */
export interface SchoolDeptRespVO {
  /** ID */
  id: number
  /** 名称 */
  name: string
  /** 父ID */
  parentId: number
  /** 排序 */
  sort: number
  /** 状态 */
  status: number
}

/**
 * 学校组织架构列表响应
 */
export interface SchoolDeptListResp {
  code: number
  data: SchoolDeptRespVO[]
  msg: string
}

/**
 * 学校组织架构查询参数
 */
export interface SchoolDeptListReqVO {
  /** 名称 */
  name?: string
  /** 父ID */
  parentId?: number
}

/**
 * 部门精简信息 Response VO
 */
export interface DeptSimpleRespVO {
  /** 部门编号 */
  id: number
  /** 部门名称 */
  name: string
  /** 父部门 ID */
  parentId: number
}

/**
 * 部门精简列表响应
 */
export interface CommonResultListDeptSimpleRespVO {
  code: number
  data: DeptSimpleRespVO[]
  msg: string
}
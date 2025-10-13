/**
 * 地区相关的类型定义
 */

// 地区节点响应 VO
export interface AppAreaNodeRespVO {
  /** 编号 */
  id: number
  /** 名字 */
  name: string
  /** 子节点（可选，用于树形结构） */
  children?: AppAreaNodeRespVO[]
}

// 通用响应结构
export interface CommonResult<T> {
  /** 错误码 */
  code: number
  /** 返回数据 */
  data: T
  /** 错误提示 */
  msg: string
}

// 地区树响应类型
export type AreaTreeResponse = CommonResult<AppAreaNodeRespVO[]>

// 地区查询参数
export interface AreaQueryParams {
  /** 父级地区ID，默认为1（中国） */
  id?: number
}
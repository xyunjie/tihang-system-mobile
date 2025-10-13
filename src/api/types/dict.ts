/**
 * 字典数据相关类型定义
 */

/**
 * 用户 App - 字典数据信息 Response VO
 */
export interface AppDictDataRespVO {
  /** 字典数据编号 */
  id: number
  
  /** 字典标签 */
  label: string
  
  /** 字典值 */
  value: string
  
  /** 字典类型 */
  dictType: string
}

/**
 * 通用返回结果 - 字典数据列表
 */
export interface CommonResultListAppDictDataRespVO {
  /** 状态码 */
  code: number
  
  /** 字典数据列表 */
  data: AppDictDataRespVO[]
  
  /** 返回消息 */
  msg: string
}

/**
 * 获取字典数据请求参数
 */
export interface GetDictDataListByTypeReqVO {
  /** 字典类型 */
  type: string
}
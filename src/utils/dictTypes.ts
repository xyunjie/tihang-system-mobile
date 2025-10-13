/**
 * 字典类型枚举
 * 定义系统中所有的字典类型常量
 */

export enum DictTypeEnum {
  /** 通用状态 */
  COMMON_STATUS = 'common_status',

  /** 性别 */
  SYSTEM_USER_SEX = 'system_user_sex',

  /** 政治面貌 */
  POLITICAL_STATUS = 'user_political_status',

  /** 民族 */
  NATION = 'user_nation',

  /** 请假类型 */
  BPM_OA_LEAVE_TYPE = 'bpm_oa_leave_type',

}

/**
 * 字典类型描述映射
 */
export const DictTypeDescMap: Record<DictTypeEnum, string> = {
  [DictTypeEnum.COMMON_STATUS]: '通用状态',
  [DictTypeEnum.SYSTEM_USER_SEX]: '性别',
  [DictTypeEnum.POLITICAL_STATUS]: '政治面貌',
  [DictTypeEnum.NATION]: '民族',
  [DictTypeEnum.BPM_OA_LEAVE_TYPE]: '请假类型',
}

/**
 * 获取字典类型描述
 * @param dictType 字典类型
 * @returns 字典类型描述
 */
export function getDictTypeDesc(dictType: DictTypeEnum): string {
  return DictTypeDescMap[dictType] || dictType
}

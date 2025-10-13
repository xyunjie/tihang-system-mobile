import type { Component } from 'vue'
/**
 * 业务组件配置映射
 * 由于 uni-app 对动态组件的限制，改为静态配置管理
 */
export const supportedBusinessTypes = [
  'oa_leave',
  // 可以在这里添加更多支持的业务类型
  // 'expense_reimbursement',
  // 'purchase_request',
]

/**
 * 业务流程标题映射
 */
export const businessTitleMap: Record<string, string> = {
  oa_leave: '请假申请',
  // 'expense_reimbursement': '报销申请',
  // 'purchase_request': '采购申请',
  // 'asset_application': '资产申请',
  // 'meeting_room_booking': '会议室预订',
}

/**
 * 获取所有支持的业务组件键值
 */
export function getBusinessComponentKeys(): string[] {
  return [...supportedBusinessTypes]
}

/**
 * 检查是否存在指定的业务组件
 */
export function hasBusinessComponent(key: string): boolean {
  return supportedBusinessTypes.includes(key)
}

/**
 * 获取业务流程标题
 */
export function getBusinessTitle(key: string): string {
  return businessTitleMap[key] || '业务申请'
}

/**
 * 根据processKey获取对应的业务组件
 * 由于 uni-app 限制，不再返回动态组件，改为静态检查
 */
export function getBusinessComponent(key: string): boolean {
  return hasBusinessComponent(key)
}

/**
 * 业务组件接口定义
 * 所有业务组件都应该实现这个接口
 */
export interface BusinessFormProps {
  processDefinitionId: string
  processKey: string
}

export interface BusinessFormEmits {
  'form-data-change': [formData: Record<string, any>]
}

export interface BusinessFormMethods {
  validate: () => Promise<boolean> // 验证表单
  getFormData: () => any // 获取表单数据
}

/**
 * 新的业务组件设计原则：
 * 1. 业务组件只负责表单字段展示和数据收集
 * 2. 不包含审批步骤和提交按钮
 * 3. 通过 form-data-change 事件向父组件发送数据
 * 4. 通过 defineExpose 暴露 validate 和 getFormData 方法
 * 5. 父组件统一处理审批流程展示和表单提交
 */

/**
 * 添加新的业务组件
 * 使用方法：
 * 1. 在 businessComponentMap 中添加组件映射
 * 2. 在 businessTitleMap 中添加标题映射
 * 3. 确保业务组件实现了 BusinessFormProps 和 BusinessFormEmits 接口
 */

/**
 * 业务表单API配置
 * 管理不同业务类型的提交方法
 */

import type { Component } from 'vue'
import { createLeave } from '@/api/bpm'

/**
 * 业务表单提交方法类型定义
 */
export type BusinessFormSubmitFn = (formData: any) => Promise<any>

/**
 * 业务表单API配置映射
 */
export const businessApiMap: Record<string, BusinessFormSubmitFn> = {
  // 请假申请
  oa_leave: async (formData) => {
    return createLeave(formData)
  },

  // 可以在这里添加更多业务API配置
  // 'expense_reimbursement': async (formData) => {
  //   const { createExpense } = await import('@/api/bpm')
  //   return createExpense(formData)
  // },
  // 'purchase_request': async (formData) => {
  //   const { createPurchase } = await import('@/api/bpm')
  //   return createPurchase(formData)
  // },
}

/**
 * 获取业务表单提交方法
 */
export function getBusinessSubmitFn(processKey: string): BusinessFormSubmitFn | undefined {
  return businessApiMap[processKey]
}

/**
 * 检查是否支持指定的业务类型
 */
export function hasSupportedApi(processKey: string): boolean {
  return processKey in businessApiMap
}

/**
 * 统一的业务表单提交处理
 */
export async function submitBusinessForm(processKey: string, formData: any): Promise<any> {
  const submitFn = getBusinessSubmitFn(processKey)
  console.log(`开始提交业务表单: ${processKey}`)
  console.log(`提交数据:`, formData)
  console.log(`提交方法:`, submitFn)
  if (!submitFn) {
    throw new Error(`不支持的业务类型: ${processKey}`)
  }

  try {
    const response = await submitFn(formData)
    console.log(`${processKey} 提交成功:`, response)
    return response
  }
  catch (error) {
    console.error(`${processKey} 提交失败:`, error)
    throw error
  }
}

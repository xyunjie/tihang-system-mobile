import type {
  ApprovalDetailRespVO,
  BpmCategoryRespVO,
  BpmCustomFormCreateReqVO,
  BpmOAClassRespVO,
  BpmOAClassSaveReqVO,
  BpmOALeaveCreateReqVO,
  BpmOALeaveRespVO,
  BpmTaskApproveReqVO,
  BpmTaskCopyReqVO,
  BpmTaskDelegateReqVO,
  BpmTaskRejectReqVO,
  BpmTaskRespVO,
  BpmTaskReturnReqVO,
  BpmTaskSignCreateReqVO,
  BpmTaskStatisticsRespVO,
  BpmTaskTransferReqVO,
  CommonResultBoolean,
  CommonResultLong,
  GetApprovalDetailReqVO,
  GetProcessDefinitionReqVO,
  GetProcessInstanceCopyPageReqVO,
  GetProcessInstanceMyPageReqVO,
  GetTaskDonePageReqVO,
  GetTaskListByReturnReqVO,
  GetTaskTodoPageReqVO,
  PageResultBpmProcessInstanceMyRespVO,
  PageResultBpmTaskRespVO,
  ProcessDefinitionRespVO,
} from './types/bpm'
import { http } from '@/http/http'

/**
 * 获取流程分类的精简信息列表
 * @description 只包含被开启的分类，主要用于前端的下拉选项
 * @returns Promise<CommonResultListBpmCategoryRespVO> 流程分类列表
 */
export function getCategorySimpleList() {
  return http.get<BpmCategoryRespVO[]>('/admin-api/bpm/category/simple-list')
}

/**
 * 获取流程定义列表
 * @description 获取所有可用的流程定义列表
 * @returns Promise<ProcessDefinitionRespVO[]> 流程定义列表
 */
export function getProcessDefinitionList() {
  return http.get<ProcessDefinitionRespVO[]>('/admin-api/bpm/process-definition/list', {
    suspensionState: 1,
  })
}

/**
 * 获取流程定义详情
 * @description 获取流程审批详情，包括活动节点、候选用户等信息
 * @param params 请求参数
 * @returns Promise<ApprovalDetailRespVO> 流程定义详情
 */
export function getApprovalDetail(params: GetApprovalDetailReqVO) {
  return http.get<ApprovalDetailRespVO>('/admin-api/bpm/process-instance/get-approval-detail', params)
}

/**
 * 获取流程定义
 * @description 获取流程定义
 * @param params 请求参数
 * @returns Promise<ProcessDefinitionRespVO> 流程定义
 */
export function getProcessDefinitionDetail(params: GetProcessDefinitionReqVO) {
  return http.get<ProcessDefinitionRespVO>('/admin-api/bpm/process-definition/get', params)
}

/**
 * 创建请假申请
 * @description 创建一个新的请假申请
 * @param data 请假申请数据
 * @returns Promise<CommonResultLong> 创建结果，返回申请ID
 */
export function createLeave(data: BpmOALeaveCreateReqVO) {
  return http.post<CommonResultLong>('/admin-api/bpm/oa/leave/create', data)
}

/**
 * 获取请假申请
 * @description 根据编号获取请假申请详情
 * @param id 请假申请编号
 * @returns Promise<CommonResultBpmOALeaveRespVO> 请假申请详情
 */
export function getLeave(id: number) {
  return http.get<BpmOALeaveRespVO>('/admin-api/bpm/oa/leave/get', { id })
}

/**
 * 获取课表申报详情
 * @description 根据编号获取课表申报详情
 * @param id 课表申报编号
 * @returns Promise<BpmOAClassRespVO> 课表申报详情
 */
export function getClass(id: number) {
  const headers: Record<string, any> = {
    'tenant-id': 1,
  }
  return http.get<BpmOAClassRespVO>('/admin-api/bpm/oa/class/get', { id }, headers)
}

/**
 * 创建自定义表单流程
 * @description 创建一个新的自定义表单流程实例
 * @param data 自定义表单数据
 * @returns Promise<CommonResultLong> 创建结果，返回流程实例ID
 */
export function createCustomFormProcess(data: BpmCustomFormCreateReqVO) {
  return http.post<CommonResultLong>('/admin-api/bpm/process-instance/create', data)
}

/**
 * 获取任务统计信息
 * @description 获取待办、已办、抄送和今日新增任务的统计数据
 * @returns Promise<BpmTaskStatisticsRespVO> 任务统计数据
 */
export function getTaskStatistics() {
  return http.get<BpmTaskStatisticsRespVO>('/admin-api/bpm/task/statistics')
}

/**
 * 获取待办任务分页列表
 * @description 获取当前用户的待办任务分页数据
 * @param params 查询参数
 * @returns Promise<PageResultBpmTaskRespVO> 待办任务分页数据
 */
export function getTaskTodoPage(params: GetTaskTodoPageReqVO) {
  return http.get<PageResultBpmTaskRespVO>('/admin-api/bpm/task/todo-page', { ...params })
}

/**
 * 获取已办任务分页列表
 * @description 获取当前用户的已办任务分页数据
 * @param params 查询参数
 * @returns Promise<PageResultBpmTaskRespVO> 已办任务分页数据
 */
export function getTaskDonePage(params: GetTaskDonePageReqVO) {
  return http.get<PageResultBpmTaskRespVO>('/admin-api/bpm/task/done-page', { ...params })
}

/**
 * 创建 OA 课表申报
 * @param data 课表申报数据
 * @returns Promise<CommonResultLong> 新建的流程实例ID
 */
export function createClass(data: BpmOAClassSaveReqVO) {
  return http.post<CommonResultLong>('/admin-api/bpm/oa/class/create', data)
}

/**
 * 获取抄送列表分页数据
 * @description 获取当前用户的抄送列表分页数据
 * @param params 查询参数
 * @returns Promise<PageResultBpmTaskRespVO> 抄送列表分页数据
 */
export function getProcessInstanceCopyPage(params: GetProcessInstanceCopyPageReqVO) {
  return http.get<PageResultBpmTaskRespVO>('/admin-api/bpm/process-instance/copy/page', { ...params })
}

/**
 * 获取我的审批列表分页数据
 * @description 获取当前用户的我的审批列表分页数据
 * @param params 查询参数
 * @returns Promise<PageResultBpmProcessInstanceMyRespVO> 我的审批列表分页数据
 */
export function getProcessInstanceMyPage(params: GetProcessInstanceMyPageReqVO) {
  return http.get<PageResultBpmProcessInstanceMyRespVO>('/admin-api/bpm/process-instance/my-page', { ...params })
}

/**
 * 通过任务
 * @description 审批通过流程任务
 * @param data 审批数据
 * @returns Promise<CommonResultBoolean> 审批结果
 */
export function approveTask(data: BpmTaskApproveReqVO) {
  return http.put<CommonResultBoolean>('/admin-api/bpm/task/approve', data)
}

/**
 * 拒绝任务
 * @description 审批拒绝流程任务
 * @param data 拒绝数据
 * @returns Promise<CommonResultBoolean> 拒绝结果
 */
export function rejectTask(data: BpmTaskRejectReqVO) {
  return http.put<CommonResultBoolean>('/admin-api/bpm/task/reject', data)
}

/**
 * 委派任务
 * @description 委派流程任务给其他用户
 * @param data 委派数据
 * @returns Promise<CommonResultBoolean> 委派结果
 */
export function delegateTask(data: BpmTaskDelegateReqVO) {
  return http.put<CommonResultBoolean>('/admin-api/bpm/task/delegate', data)
}

/**
 * 转办任务
 * @description 转办流程任务给其他用户
 * @param data 转办数据
 * @returns Promise<CommonResultBoolean> 转办结果
 */
export function transferTask(data: BpmTaskTransferReqVO) {
  return http.put<CommonResultBoolean>('/admin-api/bpm/task/transfer', data)
}

/**
 * 抄送任务
 * @description 抄送流程任务给其他用户
 * @param data 抄送数据
 * @returns Promise<CommonResultBoolean> 抄送结果
 */
export function copyTask(data: BpmTaskCopyReqVO) {
  return http.put<CommonResultBoolean>('/admin-api/bpm/task/copy', data)
}

/**
 * 加签任务
 * @description 创建加签任务，支持前加签和后加签
 * @param data 加签数据
 * @returns Promise<CommonResultBoolean> 加签结果
 */
export function createSignTask(data: BpmTaskSignCreateReqVO) {
  return http.put<CommonResultBoolean>('/admin-api/bpm/task/create-sign', data)
}

/**
 * 获取所有可退回的节点
 * @description 用于【流程详情】的【退回】按钮
 * @param params 查询参数
 * @returns Promise<BpmTaskRespVO[]> 可退回节点列表
 */
export function getTaskListByReturn(params: GetTaskListByReturnReqVO) {
  return http.get<BpmTaskRespVO[]>('/admin-api/bpm/task/list-by-return', params)
}

/**
 * 退回任务
 * @description 用于【流程详情】的【退回】按钮
 * @param data 退回数据
 * @returns Promise<CommonResultBoolean> 退回结果
 */
export function returnTask(data: BpmTaskReturnReqVO) {
  return http.put<CommonResultBoolean>('/admin-api/bpm/task/return', data)
}

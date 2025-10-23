import type {
  GetHydroOjContestPageReqVO,
  GetHydroOjHomeworkPageReqVO,
  GetHydroOjRecordPageReqVO,
  GetHydroOjTrainingPageReqVO,
  HydroOjContestDetailRespVO,
  HydroOjContestRankItemRespVO,
  HydroOjContestRecordItemRespVO,
  HydroOjCountRespVO,
  HydroOjRecordInfoRespVO,
  HydroOjTrainingDetailRespVO,
  HydroProblemRespVO,
  PageResultHydroOjContestRespVO,
  PageResultHydroOjHomeworkRespVO,
  PageResultHydroOjRecordRespVO,
  PageResultHydroOjTrainingRespVO,
} from './type/oj'
import { http } from '@/http/http'

/**
 * 获取 OJ 相关统计信息
 * headers 需包含 tenant-id；Authorization 由拦截器自动注入
 */
export function getHydroOjCount() {
  return http.get<HydroOjCountRespVO>('/admin-api/api/hydro/count')
}

/**
 * 获取 OJ 评测记录分页
 */
export function getHydroOjRecordPage(params: GetHydroOjRecordPageReqVO) {
  return http.get<PageResultHydroOjRecordRespVO>(
    '/admin-api/api/hydro/get-record',
    params,
  )
}

/**
 * 获取 OJ 题目评测详情
 */
export function getHydroOjRecordInfo(id: string) {
  return http.get<HydroOjRecordInfoRespVO>(
    '/admin-api/api/hydro/get-record-info',
    { id },
  )
}

/**
 * 获取 OJ 训练列表分页
 */
export function getHydroOjTrainingPage(params: GetHydroOjTrainingPageReqVO) {
  return http.get<PageResultHydroOjTrainingRespVO>(
    '/admin-api/api/hydro/get-training',
    params,
  )
}

/**
 * 获取 OJ 训练详情
 */
export function getHydroOjTrainingDetail(docId: string) {
  return http.get<HydroOjTrainingDetailRespVO>(
    '/admin-api/api/hydro/get-training-detail',
    { docId },
  )
}

/**
 * 获取 OJ 题目详情（仅需 id 和可选 docId）
 * @description 根据 OpenAPI: /admin-api/api/hydro/get-problem-info
 */
export function getHydroOjProblemInfo(params: { id: number, docId?: string }) {
  return http.get<HydroProblemRespVO>(
    '/admin-api/api/hydro/get-problem-info',
    params,
  )
}

export function getHydroOjContestPage(params: GetHydroOjContestPageReqVO) {
  return http.get<PageResultHydroOjContestRespVO>(
    '/admin-api/api/hydro/get-contest',
    params,
  )
}

// 新增：获取 OJ 比赛详情
export function getHydroOjContestInfo(id: string) {
  return http.get<HydroOjContestDetailRespVO>(
    '/admin-api/api/hydro/get-contest-info',
    { id },
  )
}

// 新增：获取 OJ 比赛提交记录列表
export function getHydroOjContestRecord(id: string) {
  return http.get<HydroOjContestRecordItemRespVO[]>(
    '/admin-api/api/hydro/get-contest-record',
    { id },
  )
}

export function getHydroOjContestRank(id: string) {
  return http.get<HydroOjContestRankItemRespVO[]>(
    '/admin-api/api/hydro/get-contest-rank',
    { id },
  )
}

export function getHydroOjHomeworkPage(params: GetHydroOjHomeworkPageReqVO) {
  return http.get<PageResultHydroOjHomeworkRespVO>(
    '/admin-api/api/hydro/get-homework',
    params,
  )
}

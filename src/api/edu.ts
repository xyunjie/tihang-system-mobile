import { http } from '@/http/http'

/**
 * 学期精简信息 Response VO（后端返回结构未固定，这里做最小定义）
 */
export interface EduTermSimpleRespVO {
  id: number
  name: string
  [key: string]: any
}

/**
 * 获取学期精简列表
 * 后端接口：GET /admin-api/system/edu-term/simple-list
 */
export async function getEduTermSimpleList(){
  return await http.get<EduTermSimpleRespVO[]>('/admin-api/system/edu-term/simple-list')
}
import type { AppAreaNodeRespVO, AreaTreeResponse } from './types/area'
import { http } from '@/http/http'

/**
 * 获得地区树（精简版）
 * @param params 查询参数
 * @returns 地区树数据
 */
export function getAreaTreeSimple(id: number): Promise<AreaTreeResponse> {
  return http.get('/app-api/system/area/tree-simple', {
    id,
  })
}

/**
 * 获取省份列表
 * @returns 省份列表
 */
export async function getProvinceList(): Promise<AppAreaNodeRespVO[]> {
  try {
    const response = await getAreaTreeSimple(1)
    if (response.code === 0 && response.data) {
      return response.data
    }
    return []
  }
  catch (error) {
    console.error('获取省份列表失败:', error)
    return []
  }
}

/**
 * 获取城市列表
 * @param provinceId 省份ID
 * @returns 城市列表
 */
export async function getCityList(provinceId: number): Promise<AppAreaNodeRespVO[]> {
  try {
    const response = await getAreaTreeSimple(provinceId)
    if (response.code === 0 && response.data) {
      return response.data
    }
    return []
  }
  catch (error) {
    console.error('获取城市列表失败:', error)
    return []
  }
}

/**
 * 获取区县列表
 * @param cityId 城市ID
 * @returns 区县列表
 */
export async function getDistrictList(cityId: number): Promise<AppAreaNodeRespVO[]> {
  try {
    const response = await getAreaTreeSimple(cityId)
    if (response.code === 0 && response.data) {
      return response.data
    }
    return []
  }
  catch (error) {
    console.error('获取区县列表失败:', error)
    return []
  }
}

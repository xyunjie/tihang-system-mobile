import type { AppDictDataRespVO } from '@/api/types/dict'
import { http } from '@/http/http'

/**
 * 根据字典类型查询字典数据信息
 * @param type 字典类型
 * @returns 字典数据列表
 */
export function getDictDataListByType(type: string) {
  return http.get<AppDictDataRespVO[]>('/app-api/system/dict-data/type', {
    type,
  })
}

/**
 * 批量获取多个字典类型的数据
 * @param types 字典类型数组
 * @returns 字典数据映射对象
 */
export async function getDictDataListByTypes(types: string[]): Promise<Record<string, AppDictDataRespVO[]>> {
  const promises = types.map(type => getDictDataListByType(type))
  const results = await Promise.all(promises)

  const dictMap: Record<string, AppDictDataRespVO[]> = {}
  types.forEach((type, index) => {
    dictMap[type] = results[index]?.data || []
  })

  return dictMap
}

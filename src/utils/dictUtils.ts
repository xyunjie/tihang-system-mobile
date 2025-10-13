import type { AppDictDataRespVO } from '@/api/types/dict'
import type { DictTypeEnum } from '@/utils/dictTypes'
import { getDictDataListByType, getDictDataListByTypes } from '@/api/dict'

/**
 * 字典数据缓存
 */
const dictCache = new Map<string, AppDictDataRespVO[]>()

/**
 * 缓存过期时间（毫秒）- 默认30分钟
 */
const CACHE_EXPIRE_TIME = 30 * 60 * 1000

/**
 * 缓存时间戳记录
 */
const cacheTimestamps = new Map<string, number>()

/**
 * 字典工具类
 */
export class DictUtils {
  /**
   * 获取字典数据
   * @param dictType 字典类型
   * @param useCache 是否使用缓存，默认true
   * @returns 字典数据数组
   */
  static async getDictData(dictType: DictTypeEnum | string, useCache: boolean = false): Promise<AppDictDataRespVO[]> {
    const type = typeof dictType === 'string' ? dictType : (dictType as string)

    // 检查缓存
    if (useCache && this.isCacheValid(type)) {
      const cachedData = dictCache.get(type)
      if (cachedData) {
        console.log(`📚 从缓存获取字典数据: ${type}`)
        return cachedData
      }
    }

    try {
      console.log(`🌐 从API获取字典数据: ${type}`)
      const response = await getDictDataListByType(type)
      const dictData = response.data || []

      // 更新缓存
      if (useCache) {
        dictCache.set(type, dictData)
        cacheTimestamps.set(type, Date.now())
      }

      return dictData
    }
    catch (error) {
      console.error(`❌ 获取字典数据失败: ${type}`, error)
      // 如果API失败，尝试返回缓存数据
      const cachedData = dictCache.get(type)
      return cachedData || []
    }
  }

  /**
   * 批量获取字典数据
   * @param dictTypes 字典类型数组
   * @param useCache 是否使用缓存，默认true
   * @returns 字典数据映射对象
   */
  static async getDictDataBatch(dictTypes: (DictTypeEnum | string)[], useCache: boolean = true): Promise<Record<string, AppDictDataRespVO[]>> {
    const types = dictTypes.map(type => typeof type === 'string' ? type : (type as string))
    const result: Record<string, AppDictDataRespVO[]> = {}
    const needFetchTypes: string[] = []

    // 检查缓存
    if (useCache) {
      for (const type of types) {
        if (this.isCacheValid(type)) {
          const cachedData = dictCache.get(type)
          if (cachedData) {
            result[type] = cachedData
            continue
          }
        }
        needFetchTypes.push(type)
      }
    }
    else {
      needFetchTypes.push(...types)
    }

    // 批量获取未缓存的数据
    if (needFetchTypes.length > 0) {
      try {
        console.log(`🌐 批量获取字典数据: ${needFetchTypes.join(', ')}`)
        const batchResult = await getDictDataListByTypes(needFetchTypes)

        // 更新结果和缓存
        for (const type of needFetchTypes) {
          const dictData = batchResult[type] || []
          result[type] = dictData

          if (useCache) {
            dictCache.set(type, dictData)
            cacheTimestamps.set(type, Date.now())
          }
        }
      }
      catch (error) {
        console.error(`❌ 批量获取字典数据失败:`, error)
        // 如果API失败，尝试返回缓存数据
        for (const type of needFetchTypes) {
          const cachedData = dictCache.get(type)
          result[type] = cachedData || []
        }
      }
    }

    return result
  }

  /**
   * 根据字典值获取字典标签
   * @param dictType 字典类型
   * @param value 字典值
   * @param defaultLabel 默认标签，当找不到时返回
   * @returns 字典标签
   */
  static async getDictLabel(dictType: DictTypeEnum | string, value: string | number, defaultLabel?: string): Promise<string> {
    const dictData = await this.getDictData(dictType)
    const item = dictData.find(item => item.value === String(value))
    return item?.label || defaultLabel || String(value)
  }

  /**
   * 根据字典标签获取字典值
   * @param dictType 字典类型
   * @param label 字典标签
   * @param defaultValue 默认值，当找不到时返回
   * @returns 字典值
   */
  static async getDictValue(dictType: DictTypeEnum | string, label: string, defaultValue?: string): Promise<string> {
    const dictData = await this.getDictData(dictType)
    const item = dictData.find(item => item.label === label)
    return item?.value || defaultValue || label
  }

  /**
   * 获取字典选项（用于选择器组件）
   * @param dictType 字典类型
   * @returns 选项数组 {label, value}
   */
  static async getDictOptions(dictType: DictTypeEnum | string): Promise<Array<{ label: string, value: string }>> {
    const dictData = await this.getDictData(dictType)
    return dictData.map(item => ({
      label: item.label,
      value: item.value,
    }))
  }

  /**
   * 清除指定字典类型的缓存
   * @param dictType 字典类型，不传则清除所有缓存
   */
  static clearCache(dictType?: DictTypeEnum | string): void {
    if (dictType) {
      const type = typeof dictType === 'string' ? dictType : (dictType as string)
      dictCache.delete(type)
      cacheTimestamps.delete(type)
      console.log(`🗑️ 清除字典缓存: ${type}`)
    }
    else {
      dictCache.clear()
      cacheTimestamps.clear()
      console.log('🗑️ 清除所有字典缓存')
    }
  }

  /**
   * 预加载字典数据
   * @param dictTypes 字典类型数组
   */
  static async preloadDictData(dictTypes: (DictTypeEnum | string)[]): Promise<void> {
    console.log(`📦 预加载字典数据: ${dictTypes.join(', ')}`)
    await this.getDictDataBatch(dictTypes, true)
  }

  /**
   * 检查缓存是否有效
   * @param type 字典类型
   * @returns 是否有效
   */
  private static isCacheValid(type: string): boolean {
    const timestamp = cacheTimestamps.get(type)
    if (!timestamp)
      return false

    const now = Date.now()
    return (now - timestamp) < CACHE_EXPIRE_TIME
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计
   */
  static getCacheStats(): { total: number, types: string[] } {
    return {
      total: dictCache.size,
      types: Array.from(dictCache.keys()),
    }
  }
}

/**
 * 便捷方法：获取字典数据
 */
export const getDictData = DictUtils.getDictData.bind(DictUtils)

/**
 * 便捷方法：获取字典标签
 */
export const getDictLabel = DictUtils.getDictLabel.bind(DictUtils)

/**
 * 便捷方法：获取字典值
 */
export const getDictValue = DictUtils.getDictValue.bind(DictUtils)

/**
 * 便捷方法：获取字典选项
 */
export const getDictOptions = DictUtils.getDictOptions.bind(DictUtils)

/**
 * 便捷方法：清除缓存
 */
export const clearDictCache = DictUtils.clearCache.bind(DictUtils)

/**
 * 便捷方法：预加载字典数据
 */
export const preloadDictData = DictUtils.preloadDictData.bind(DictUtils)

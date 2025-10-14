import { pages, subPackages } from '@/pages.json'
import { isMpWeixin } from './platform'

export function getLastPage() {
  // getCurrentPages() 至少有1个元素，所以不再额外判断
  // const lastPage = getCurrentPages().at(-1)
  // 上面那个在低版本安卓中打包会报错，所以改用下面这个【虽然我加了 src/interceptions/prototype.ts，但依然报错】
  const pages = getCurrentPages()
  return pages[pages.length - 1]
}

/**
 * 获取当前页面路由的 path 路径和 redirectPath 路径
 * path 如 '/pages/login/index'
 * redirectPath 如 '/pages/demo/base/route-interceptor'
 */
export function currRoute() {
  try {
    const lastPage = getLastPage()
    const $page = (lastPage as any)?.$page
    const fullPath = $page && $page.fullPath
    console.log('page:', $page)
    if (fullPath) {
      return getUrlObj(fullPath)
    }
    // 如果没有 fullPath，备用方案
    const route = lastPage.route || ''
    const options = (lastPage as any).options || {}
    const path = route.startsWith('/') ? route : `/${route}`
    const queryString = Object.entries(options)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&')
    return getUrlObj(queryString ? `${path}?${queryString}` : path)
  }
  catch (error) {
    console.error('获取当前路由失败:', error)
    return getUrlObj('/pages/index/index')
  }
}

function ensureDecodeURIComponent(url: string) {
  if (url.startsWith('%')) {
    return ensureDecodeURIComponent(decodeURIComponent(url))
  }
  return url
}
/**
 * 解析 url 得到 path 和 query
 * 比如输入url: /pages/login/index?redirect=%2Fpages%2Fdemo%2Fbase%2Froute-interceptor
 * 输出: {path: /pages/login/index, query: {redirect: /pages/demo/base/route-interceptor}}
 */
export function getUrlObj(url: string) {
  const [path, queryStr] = url.split('?')
  // console.log(path, queryStr)

  if (!queryStr) {
    return {
      path,
      query: {},
    }
  }
  const query: Record<string, string> = {}
  queryStr.split('&').forEach((item) => {
    const [key, value] = item.split('=')
    // console.log(key, value)
    query[key] = ensureDecodeURIComponent(value) // 这里需要统一 decodeURIComponent 一下，可以兼容h5和微信y
  })
  return { path, query }
}
/**
 * 得到所有的需要登录的 pages，包括主包和分包的
 * 这里设计得通用一点，可以传递 key 作为判断依据，默认是 needLogin, 与 route-block 配对使用
 * 如果没有传 key，则表示所有的 pages，如果传递了 key, 则表示通过 key 过滤
 */
export function getAllPages(key = 'needLogin') {
  // 这里处理主包
  const mainPages = pages
    .filter((page) => {
      const hasKey = !key || page[key]
      return hasKey
    })
    .map(page => ({
      ...page,
      path: `/${page.path}`,
    }))

  // 这里处理分包
  const subPages: any[] = []
  subPackages.forEach((subPageObj) => {
    // console.log(subPageObj)
    const { root } = subPageObj

    subPageObj.pages
      .filter((page) => {
        const hasKey = !key || page[key]
        return hasKey
      })
      .forEach((page: { path: string } & Record<string, any>) => {
        subPages.push({
          ...page,
          path: `/${root}/${page.path}`,
        })
      })
  })
  const result = [...mainPages, ...subPages]
  return result
}

/**
 * 得到所有的需要登录的 pages，包括主包和分包的
 * 只得到 path 数组
 */
export function getNotLoginPages(): string[] {
  const result = getAllPages('notLogin').map(page => page.path)
  return result
}

/**
 * 得到所有的需要登录的 pages，包括主包和分包的
 * 只得到 path 数组
 */
export const notLoginPages: string[] = getAllPages('notLogin').map(page => page.path)

/**
 * 根据微信小程序当前环境，判断应该获取的 baseUrl
 */
export function getEnvBaseUrl() {
  // 请求基准地址
  let baseUrl = import.meta.env.VITE_SERVER_BASEURL

  // 微信小程序端环境区分
  if (isMpWeixin) {
    const {
      miniProgram: { envVersion },
    } = uni.getAccountInfoSync()

    switch (envVersion) {
      case 'develop':
        baseUrl = import.meta.env.VITE_SERVER_BASEURL__WEIXIN_DEVELOP || baseUrl
        break
      case 'trial':
        baseUrl = import.meta.env.VITE_SERVER_BASEURL__WEIXIN_TRIAL || baseUrl
        break
      case 'release':
        baseUrl = import.meta.env.VITE_SERVER_BASEURL__WEIXIN_RELEASE || baseUrl
        break
    }
  }

  return baseUrl
}

/**
 * 根据微信小程序当前环境，判断应该获取的 UPLOAD_BASEURL
 */
export function getEnvBaseUploadUrl() {
  // 请求基准地址
  let baseUploadUrl = import.meta.env.VITE_UPLOAD_BASEURL

  // 微信小程序端环境区分
  if (isMpWeixin) {
    const {
      miniProgram: { envVersion },
    } = uni.getAccountInfoSync()

    switch (envVersion) {
      case 'develop':
        baseUploadUrl = import.meta.env.VITE_UPLOAD_BASEURL__WEIXIN_DEVELOP || baseUploadUrl
        break
      case 'trial':
        baseUploadUrl = import.meta.env.VITE_UPLOAD_BASEURL__WEIXIN_TRIAL || baseUploadUrl
        break
      case 'release':
        baseUploadUrl = import.meta.env.VITE_UPLOAD_BASEURL__WEIXIN_RELEASE || baseUploadUrl
        break
    }
  }

  return baseUploadUrl
}

/**
 * 通用时间格式化工具函数
 * 解决小程序中显示GMT字样的问题
 * @param dateTimeStr 时间字符串或时间戳
 * @returns Date对象或null
 */
export function parseDateTime(dateTimeStr: string | number): Date | null {
  if (!dateTimeStr)
    return null

  try {
    // 处理时间戳（数字或数字字符串）
    if (typeof dateTimeStr === 'number' || /^\d+$/.test(String(dateTimeStr))) {
      const timestamp = Number(dateTimeStr)

      // 判断是秒级时间戳还是毫秒级时间戳
      // 如果小于 10000000000（对应 1973年），则认为是秒级时间戳
      const date = timestamp < 10000000000
        ? new Date(timestamp * 1000)
        : new Date(timestamp)

      if (!Number.isNaN(date.getTime())) {
        return date
      }
    }

    // 处理常见的时间格式
    let cleanDateStr = String(dateTimeStr).trim()

    // 加强GMT字样和时区信息的清理
    cleanDateStr = cleanDateStr.replace(/\s*GMT[+-]?\d*\s*(\([^)]*\))?/g, '')
    cleanDateStr = cleanDateStr.replace(/\s*\([^)]*\)/g, '')
    cleanDateStr = cleanDateStr.replace(/\s+/g, ' ').trim()

    // 处理ISO格式的时间字符串
    if (cleanDateStr.includes('T')) {
      // ISO格式: 2023-12-01T08:30:00 或 2023-12-01T08:30:00.000Z
      cleanDateStr = cleanDateStr.replace('Z', '')
      const date = new Date(cleanDateStr)

      // 验证日期是否有效
      if (!Number.isNaN(date.getTime())) {
        return date
      }
    }

    // 处理其他常见格式
    // 尝试直接解析
    const date = new Date(cleanDateStr)

    // 验证日期是否有效
    if (!Number.isNaN(date.getTime())) {
      return date
    }

    // 如果上述方法都失败，尝试手动解析
    // 支持格式: YYYY-MM-DD HH:mm:ss 或 YYYY/MM/DD HH:mm:ss
    const dateTimeRegex = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/
    const match = cleanDateStr.match(dateTimeRegex)

    if (match) {
      const [, year, month, day, hour, minute, second] = match
      return new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1, // 月份从0开始
        Number.parseInt(day),
        Number.parseInt(hour),
        Number.parseInt(minute),
        Number.parseInt(second),
      )
    }

    return null
  }
  catch (error) {
    return null
  }
}

/**
 * 安全的时间格式化函数
 * @param dateTimeStr 时间字符串或时间戳
 * @param options Intl.DateTimeFormatOptions
 * @returns 格式化后的时间字符串
 */
export function formatDateTime(dateTimeStr: string | number, options: Intl.DateTimeFormatOptions = {}): string {
  const date = parseDateTime(dateTimeStr)
  if (!date)
    return '--:--'

  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour12: false,
      ...options,
    }

    // 尝试使用 toLocaleString
    let result = date.toLocaleString('zh-CN', defaultOptions)

    // 检测是否包含英文内容或GMT字样，如果有则使用手动格式化
    const hasEnglishContent = (
      result.includes('GMT')
      || result.includes('CST')
      || /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i.test(result)
      || /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(result)
      || /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i.test(result)
      || /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(result)
    )

    if (hasEnglishContent) {
      result = manualFormatDate(date, options)
    }

    return result
  }
  catch (error) {
    // 如果 toLocaleString 失败，使用手动格式化
    return manualFormatDate(date, options)
  }
}

/**
 * 手动格式化日期，确保不出现GMT或英文日期
 * @param date Date对象
 * @param options 格式化选项
 * @returns 格式化后的字符串
 */
function manualFormatDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  // 星期映射
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekday = weekdays[date.getDay()]

  // 月份映射
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const monthLong = months[date.getMonth()]

  // 根据选项组合格式
  let result = ''

  // 如果没有指定任何选项，返回默认格式 yyyy-MM-dd HH:mm
  if (Object.keys(options).length === 0) {
    return `${year}-${month}-${day} ${hour}:${minute}`
  }

  // 处理年份
  if (options.year === 'numeric') {
    result += `${year}`
  }

  // 处理月份
  if (options.month === '2-digit') {
    if (result)
      result += '-'
    result += month
  }
  else if (options.month === 'long') {
    if (result)
      result += '年'
    result += monthLong
  }
  else if (options.month === 'numeric') {
    if (result)
      result += '-'
    result += String(date.getMonth() + 1)
  }

  // 处理日期
  if (options.day === '2-digit' || options.day === 'numeric') {
    if (result && !result.endsWith('月')) {
      result += '-'
    }
    else if (result.endsWith('月')) {
      // 中文格式
    }
    result += day
    if (result.includes('月') && !result.endsWith('日')) {
      result += '日'
    }
  }

  // 处理星期
  if (options.weekday === 'long') {
    if (result)
      result += ' '
    result += weekday
  }

  // 处理时间
  if (options.hour === '2-digit') {
    if (result)
      result += ' '
    result += hour
    if (options.minute === '2-digit') {
      result += `:${minute}`
      if (options.second === '2-digit') {
        result += `:${second}`
      }
    }
  }

  // 如果没有任何结果，返回默认格式
  if (!result) {
    result = `${year}-${month}-${day} ${hour}:${minute}`
  }

  return result
}

/**
 * 格式化时间为HH:mm格式
 * @param dateTimeStr 时间字符串或时间戳
 * @returns HH:mm格式的时间
 */
export function formatTimeOnly(dateTimeStr: string | number): string {
  const result = formatDateTime(dateTimeStr, {
    hour: '2-digit',
    minute: '2-digit',
  })

  // 如果结果为 '--:--'，返回它，否则确保只返回 HH:mm 格式
  if (result === '--:--') {
    return result
  }

  // 提取 HH:mm 部分，去掉可能的日期部分
  const timeMatch = result.match(/(\d{1,2}:\d{2})/)
  return timeMatch ? timeMatch[1] : result
}

/**
 * 格式化时间为相对时间（几小时前、几天前等）
 * @param dateTimeStr 时间字符串或时间戳
 * @returns 相对时间字符串
 */
export function formatRelativeTime(dateTimeStr: string | number): string {
  const date = parseDateTime(dateTimeStr)
  if (!date)
    return String(dateTimeStr)

  try {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 7) {
      return formatDateTime(dateTimeStr, {
        month: '2-digit',
        day: '2-digit',
      })
    }
    else if (diffDays > 0) {
      return `${diffDays}天前`
    }
    else if (diffHours > 0) {
      return `${diffHours}小时前`
    }
    else {
      return '刚刚'
    }
  }
  catch (error) {
    console.error('相对时间格式化错误:', error)
    return String(dateTimeStr)
  }
}

/**
 * 格式化时间为标准日期格式 yyyy-MM-dd
 * @param dateTimeStr 时间字符串或时间戳
 * @returns yyyy-MM-dd 格式的日期
 */
export function formatDateOnly(dateTimeStr: string | number): string {
  const date = parseDateTime(dateTimeStr)
  if (!date)
    return '--'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 格式化时间为标准日期时间格式 yyyy-MM-dd HH:mm
 * @param dateTimeStr 时间字符串或时间戳
 * @returns yyyy-MM-dd HH:mm 格式的日期时间
 */
export function formatStandardDateTime(dateTimeStr: string | number): string {
  const date = parseDateTime(dateTimeStr)
  if (!date)
    return '--'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 压缩图片到指定大小
 * 自适应压缩机制：如果图片大小超过目标大小，会逐步降低质量直到达标或质量低于10%
 * @param filePath 图片路径
 * @param maxSize 最大大小（字节），默认 500KB
 * @param quality 初始质量（0-1），默认 0.8
 * @returns Promise<string> 压缩后的图片路径
 * @example
 * // 压缩到 500KB
 * const compressedPath = await compressImage(filePath)
 *
 * // 压缩到 1MB
 * const compressedPath = await compressImage(filePath, 1024 * 1024)
 *
 * // 压缩到 2MB，初始质量 90%
 * const compressedPath = await compressImage(filePath, 2 * 1024 * 1024, 0.9)
 */
export function compressImage(
  filePath: string,
  maxSize: number = 500 * 1024,
  quality: number = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 先检查原始文件大小
    uni.getFileInfo({
      filePath,
      success: (fileInfo) => {
        if (fileInfo.size <= maxSize) {
          // 如果已经小于目标大小，直接返回
          console.log(`图片无需压缩: ${fileInfo.size} bytes`)
          resolve(filePath)
          return
        }

        // 需要压缩
        let currentQuality = quality

        function tryCompress() {
          uni.compressImage({
            src: filePath,
            quality: Math.round(currentQuality * 100),
            success: (compressRes) => {
              // 检查压缩后的文件大小
              uni.getFileInfo({
                filePath: compressRes.tempFilePath,
                success: (compressedFileInfo) => {
                  if (compressedFileInfo.size <= maxSize || currentQuality <= 0.1) {
                    // 达到目标大小或质量已经很低，返回结果
                    console.log(
                      `图片压缩成功: ${fileInfo.size} -> ${compressedFileInfo.size} bytes, 质量: ${currentQuality}`,
                    )
                    resolve(compressRes.tempFilePath)
                  }
                  else {
                    // 还是太大，降低质量再次压缩
                    currentQuality -= 0.1
                    tryCompress()
                  }
                },
                fail: () => reject(new Error('获取压缩后文件信息失败')),
              })
            },
            fail: () => reject(new Error('图片压缩失败')),
          })
        }

        tryCompress()
      },
      fail: () => reject(new Error('获取文件信息失败')),
    })
  })
}

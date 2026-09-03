import type { GetDeptTreeUsersParams, GetDeptTreeUsersRes, GetUserProfileParams, ISystemUserInfoVo, IUserProfileLoginLogRespVO, IUserProfileUpdatePasswordReqVO, IUserProfileUpdateReqVO, UserExtraRespVO, UserExtraResult, UserSimpleRespVO } from '@/api/types/user'
import { http } from '@/http/http'

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return http.get<ISystemUserInfoVo>('/admin-api/system/user/profile/get')
}

/**
 * 修改用户个人信息
 * @param data 用户信息更新数据
 */
export function updateUserProfile(data: IUserProfileUpdateReqVO) {
  return http.put<boolean>('/admin-api/system/user/profile/update', data)
}

/**
 * 修改用户密码
 * @param data 密码更新数据
 */
export function updateUserPassword(data: IUserProfileUpdatePasswordReqVO) {
  return http.put<boolean>('/admin-api/system/user/profile/update-password', data)
}

/**
 * 上传文件
 * @param filePath 文件路径
 * @param directory 文件目录（可选）
 */
export function uploadFile(filePath: string, directory?: string) {
  // 构建上传参数
  // 注意：Authorization 由 src/http/interceptor.ts 的 uploadFile 拦截器统一注入到 options.header，此处无需重复处理
  const uploadParams: any = {
    url: '/app-api/infra/file/upload',
    filePath,
    name: 'file',
  }

  // 如果指定了目录，添加到query参数中
  if (directory) {
    uploadParams.formData = {
      directory,
    }
  }

  return new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      ...uploadParams,
      success: (res) => {
        const { statusCode } = res
        // 响应体可能是很长的 HTML 错误页，只截前 200 字符用于定位问题
        const responseText = typeof res.data === 'string' ? res.data.slice(0, 200) : String(res.data)

        // 非 2xx 必须先于 JSON.parse 处理：此时响应大概率是 Nginx/Tomcat 的 HTML 错误页
        // （413 请求体过大 / 500 / 502），parse 必然失败，会把真实的 statusCode 掩盖掉
        if (statusCode < 200 || statusCode >= 300) {
          console.error('[uploadFile] HTTP 状态码异常', {
            url: uploadParams.url,
            statusCode,
            responseText,
          })
          reject(new Error(`上传失败（HTTP ${statusCode}）：${responseText}`))
          return
        }

        let result: any
        try {
          result = JSON.parse(res.data)
        }
        catch {
          console.error('[uploadFile] 响应不是合法 JSON', {
            url: uploadParams.url,
            statusCode,
            responseText,
          })
          reject(new Error(`服务器响应格式错误（HTTP ${statusCode}）：${responseText}`))
          return
        }

        if (result.code === 0) {
          resolve(result.data) // 返回文件URL
          return
        }

        console.error('[uploadFile] 业务处理失败', {
          url: uploadParams.url,
          statusCode,
          responseText,
          code: result.code,
          msg: result.msg,
        })
        reject(new Error(`上传失败（code ${result.code}）：${result.msg || '未知错误'}`))
      },
      fail: (error) => {
        // 传输层失败（CORS 预检被拦截、超时、小程序 uploadFile 域名白名单未配置等），
        // errMsg 是唯一线索，必须完整带出去
        const errMsg = error?.errMsg || '网络请求失败'
        console.error('[uploadFile] 请求失败', {
          url: uploadParams.url,
          errMsg,
          error,
        })
        reject(new Error(errMsg))
      },
    })
  })
}

/**
 * 获取用户登录日志
 */
export function getUserLoginLogs() {
  return http.get<IUserProfileLoginLogRespVO[]>('/admin-api/system/user/profile/get-login-log', undefined)
}

/**
 * 获取用户精简信息列表
 * 只包含被开启的用户，主要用于前端的下拉选项
 */
export async function getSimpleUserList(): Promise<UserSimpleRespVO[]> {

  try {
    const response = await http.get<UserSimpleRespVO[]>('/admin-api/system/user/simple-list', undefined)
    return response.data || []
  }
  catch (error) {
    console.error('获取用户精简列表失败:', error)
    throw error
  }
}

/**
 * 获取用户扩展数据
 * @param id 用户扩展数据ID
 */
export function getUserExtra(id: number) {
  return http.get<UserExtraRespVO>('/admin-api/system/user-extra/get', { id })
}

/**
 * 部门树用户
 * @param id 部门ID
 */
export function getDeptTreeUsers(id: number, params?: GetDeptTreeUsersParams) {
  return http.get<GetDeptTreeUsersRes['data']>('/admin-api/system/user/dept-tree-users', { id, ...(params || {}) })
}

/**
 * 获得登录用户信息（按ID）
 * @param id 用户ID
 * @param params 预留扩展参数
 */
export function getUserProfile(id: number, params?: GetUserProfileParams) {
  return http.get<ISystemUserInfoVo>('/admin-api/system/user/profile/get', { id, ...(params || {}) })
}

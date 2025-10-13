import type { ISystemUserInfoVo, IUserProfileLoginLogRespVO, IUserProfileUpdatePasswordReqVO, IUserProfileUpdateReqVO, UserExtraRespVO, UserExtraResult, UserSimpleRespVO } from '@/api/types/user'
import { http } from '@/http/http'
import { useUserStore } from '@/store'

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
  // 使用userStore获取token，保持一致性
  const userStore = useUserStore()
  const { accessToken } = userStore.userInfo

  const headers: Record<string, any> = {}

  // 如果有token，添加到请求头中
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  // 构建上传参数
  const uploadParams: any = {
    url: '/app-api/infra/file/upload',
    filePath,
    name: 'file',
    headers,
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
        try {
          console.log('上传响应:', res)
          const result = JSON.parse(res.data)

          if (result.code === 0) {
            resolve(result.data) // 返回文件URL
          }
          else {
            reject(new Error(result.msg || '上传失败'))
          }
        }
        catch (error) {
          reject(new Error('服务器响应格式错误'))
        }
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '网络请求失败'))
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

import type { ISystemUserInfoVo, IUserProfileLoginLogRespVO, IUserProfileUpdatePasswordReqVO, IUserProfileUpdateReqVO } from '@/api/types/user'
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
  const headers: Record<string, any> = {
    'tenant-id': 1, // 默认租户ID
  }

  return http.put<boolean>('/admin-api/system/user/profile/update', data, {
    headers,
  })
}

/**
 * 修改用户密码
 * @param data 密码更新数据
 */
export function updateUserPassword(data: IUserProfileUpdatePasswordReqVO) {
  const headers: Record<string, any> = {
    'tenant-id': 1, // 默认租户ID
  }

  return http.put<boolean>('/admin-api/system/user/profile/update-password', data, {
    headers,
  })
}

/**
 * 上传文件
 * @param filePath 文件路径
 * @param directory 文件目录（可选）
 */
export function uploadFile(filePath: string, directory?: string) {
  // 获取存储中的用户信息，用于获取token
  const userInfo = uni.getStorageSync('userInfo')

  const headers: Record<string, any> = {
    'tenant-id': 1,
  }

  // 如果有token，添加到请求头中
  if (userInfo?.accessToken) {
    headers.Authorization = `Bearer ${userInfo.accessToken}`
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
          console.error('响应数据解析失败:', error, res.data)
          reject(new Error('服务器响应格式错误'))
        }
      },
      fail: (error) => {
        console.error('上传请求失败:', error)
        reject(new Error(error.errMsg || '网络请求失败'))
      },
    })
  })
}

/**
 * 获取用户登录日志
 */
export function getUserLoginLogs() {
  const headers: Record<string, any> = {
    'tenant-id': 1, // 默认租户ID
  }

  return http.get<IUserProfileLoginLogRespVO[]>('/admin-api/system/user/profile/get-login-log', undefined, headers)
}

import type { DeptSimpleRespVO, SchoolDeptListReqVO, SchoolDeptRespVO } from '@/api/types/school-dept'
import { http } from '@/http/http'

/**
 * 获取学校组织架构列表
 * @param params 查询参数
 * @returns 学校组织架构列表
 */
export async function getSchoolDeptList(params?: SchoolDeptListReqVO): Promise<SchoolDeptRespVO[]> {
  try {
    const response = await http.get<SchoolDeptRespVO[]>('/admin-api/system/school-dept/list', { ...params })
    return response.data || []
  }
  catch (error) {
    console.error('获取学校组织架构列表失败:', error)
    throw error
  }
}

/**
 * 获取学院列表（父ID为0的组织架构）
 * @returns 学院列表
 */
export async function getCollegeList(): Promise<SchoolDeptRespVO[]> {
  return getSchoolDeptList({ parentId: 0 })
}

/**
 * 根据学院ID获取专业列表
 * @param collegeId 学院ID
 * @returns 专业列表
 */
export async function getMajorList(collegeId: number): Promise<SchoolDeptRespVO[]> {
  return getSchoolDeptList({ parentId: collegeId })
}

/**
 * 根据专业ID获取班级列表
 * @param majorId 专业ID
 * @returns 班级列表
 */
export async function getClassList(majorId: number, name: string): Promise<SchoolDeptRespVO[]> {
  return getSchoolDeptList({ parentId: majorId, name })
}

/**
 * 获取部门精简信息列表
 * 只包含被开启的部门，主要用于前端的下拉选项
 * @returns 部门精简信息列表
 */
export async function getSimpleDeptList(): Promise<DeptSimpleRespVO[]> {
  try {
    const response = await http.get<DeptSimpleRespVO[]>('/admin-api/system/dept/simple-list')
    return response.data || []
  }
  catch (error) {
    console.error('获取部门精简列表失败:', error)
    throw error
  }
}

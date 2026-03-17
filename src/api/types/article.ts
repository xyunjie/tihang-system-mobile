// 文章相关类型定义

// 排序字段
export interface SortingField {
  field: string
  order: string
}

// 文章搜索分页请求
export interface ArticleSearchPageReqVO {
  /** 页码，从 1 开始 */
  pageNo: number
  /** 每页条数，最大值为 100 */
  pageSize: number
  /** 排序字段 */
  sortingFields?: SortingField[]
  /** 关键词 */
  keyword?: string
  /** 文章标签 */
  tags?: string[]
}

// 文章搜索响应
export interface ArticleSearchRespVO {
  /** 文章ID */
  id: number
  /** 文章标题 */
  title: string
  /** 作者ID */
  authorId: number
  /** 作者名称 */
  authorName: string
  /** 编辑者ID */
  editorId: number
  /** 编辑者名称 */
  editorName: string
  /** 文章标签 */
  tags: string[]
  /** 文章标签名称 */
  tagNames: string[]
  /** 封面URL */
  coverImage?: string
  /** 文章摘要 */
  blogAbstract?: string
  /** 文章浏览量 */
  browse: number
  /** 文章收藏量 */
  star: number
  /** 文章点赞量 */
  love: number
  /** 文章消息量 */
  message: number
  /** 可见范围（0-全部可见，1-仅我可见，2-粉丝可见，3-VIP可见） */
  scope: number
  /** 文本类型 */
  textType: string
  /** 创建时间 */
  createTime: string
  /** 转换映射 */
  transMap?: Record<string, any>
}

// 分页结果
export interface PageResultArticleSearchRespVO {
  /** 数据 */
  list: ArticleSearchRespVO[]
  /** 总量 */
  total: number
}

// 通用响应结果
export interface CommonResultPageResultArticleSearchRespVO {
  code: number
  data: PageResultArticleSearchRespVO
  msg: string
}

// 文章详情响应 VO
export interface ArticleDetailRespVO {
  id: number
  title: string
  content: string
  authorId: number
  authorName: string
  editorId: number
  editorName: string
  tags: string[]
  tagNames: string[]
  coverImage: string
  blogAbstract: string
  browse: number
  star: number
  isStar: boolean
  love: number
  isLove: boolean
  message: number
  scope: number
  auditStatus: number
  createTime: string
  updateTime: string
  canAccess: boolean
  transMap?: Record<string, any>
}

// 文章详情响应结果
export interface CommonResultArticleDetailRespVO {
  code: number
  data: ArticleDetailRespVO
  msg: string
}

// 文章标签简单列表项
export interface ArticleTagSimpleRespVO {
  tagCode: string
  tagName: string
}

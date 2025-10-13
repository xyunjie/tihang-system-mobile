import type {
  ArticleDetailRespVO,
  ArticleSearchPageReqVO,
  PageResultArticleSearchRespVO,
} from './types/article'
import { http } from '@/http/http'

/**
 * 获得文章分页
 */
export function getArticlePage(data: ArticleSearchPageReqVO) {
  return http.post<PageResultArticleSearchRespVO>('/admin-api/blog/search/page', data)
}

/**
 * 获取文章详情
 */
export function getArticleDetail(id: number) {
  return http.get<ArticleDetailRespVO>('/admin-api/blog/article/detail', {
    id,
  })
}

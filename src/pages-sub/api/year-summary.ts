import type { YearSummaryRespVO } from './type/year-summary'
import { httpGet } from '@/http/http'

export function getYearSummary(userId: string | number, year?: number) {
  return httpGet<YearSummaryRespVO>(`/app-api/system/year-summary/${userId}`, { year })
}

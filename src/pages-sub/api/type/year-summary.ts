export interface KeywordSummaryRespVO {
  keyword: string
  reason?: string
  score?: number
}

export interface AttendanceSummaryRespVO {
  totalWorkingHours: number
  attendanceCount: number
  firstClockIn: string
  latestClockOut: string
  longestWorkingDay: string
}

export interface OASummaryRespVO {
  tasksDone: number
  processInitiated: number
  mostInitiatedProcess: string
  avgApprovalTimeMinutes: number
  mostApplyMonth: string
}

export interface ArticlesSummaryRespVO {
  articlesPublished: number
  mostPopularArticle: string
  articleViews: number
  articleLikes: number
  articleComments: number
  totalLikes: number
}

export interface LateNightSubmission {
  date: string
  time: string
  problem: string
}

export interface Difficulty {
  easy: number
  medium: number
  hard: number
}

export interface OJSummaryRespVO {
  submissions: number
  problemsPassed: number
  passRate: number
  currentRankPercent: number
  highestRank: number
  contests: number
  mostAttempted: string
  lateNightSubmission: LateNightSubmission
  difficulty: Difficulty
  maxStreak: number
  favLang: string
}

export interface GitSummaryRespVO {
  commits: number
  additions: number
  deletions: number
  activeDays: number
  mostProductiveDay: string
  peakTime: string | null
  topRepo: string
  contributions?: number[]
  topRepos?: Array<{
    name: string
    commits?: number
  }>
  topReposTop3?: string[]
  lastCommitTime?: string
}

export interface YearSummaryRespVO {
  year: number
  joinDays: number
  yearsTogether: number
  sameYearJoinCount: number
  keyword: KeywordSummaryRespVO
  attendance: AttendanceSummaryRespVO
  oa: OASummaryRespVO
  articles: ArticlesSummaryRespVO
  oj: OJSummaryRespVO
  git: GitSummaryRespVO
}

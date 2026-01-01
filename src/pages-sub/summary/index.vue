<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "年度总结",
    "navigationStyle": "custom"
  }
}
</route>

<script lang="ts" setup>
import type { YearSummaryRespVO } from '@/pages-sub/api/type/year-summary'
import dayjs from 'dayjs'
import { computed, onMounted, ref, watch } from 'vue'
import useRequest from '@/hooks/useRequest'
import { getYearSummary } from '@/pages-sub/api/year-summary'
import { useUserStore } from '@/store'

const DEFAULT_AVATAR = 'https://file.tihangstudio.cn/image/tihang_logo.png'

// Data Loading State
const loading = ref(true)
const userStore = useUserStore()
const userInfo = computed(() => {
  const systemUserInfo = uni.getStorageSync('systemUserInfo')
  if (systemUserInfo) {
    // If it's a JSON string, try to parse it
    if (typeof systemUserInfo === 'string') {
      try {
        return JSON.parse(systemUserInfo)
      }
      catch (e) {
        console.error('Failed to parse systemUserInfo', e)
      }
    }
    return systemUserInfo
  }

  return userStore.userInfo || {
    nickname: '梯航探索者',
    avatar: DEFAULT_AVATAR,
    createTime: '2023-09-01', // Default join date for preview
  }
})

// Safe Area & System Info
const systemInfo = uni.getSystemInfoSync()
const statusBarHeight = systemInfo.statusBarHeight || 0
const safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0
const reportYear = 2025

// Current Page Index for Animation Triggers
const currentPage = ref(0)
// Track maximum visited page index to implement lazy loading
const maxVisitedPage = ref(0)

const uid = computed(() => (userInfo.value as any)?.id || (userInfo.value as any)?.userId)
const { data: yearData, run } = useRequest<YearSummaryRespVO>(() => getYearSummary(uid.value, reportYear), {
  immediate: false,
})
const statsView = computed<any>(() => {
  const d = yearData?.value
  if (!d)
    return null
  return {
    joinDays: d.joinDays,
    yearsTogether: d.yearsTogether,
    sameYearJoinCount: d.sameYearJoinCount,
    keyword: d.keyword?.keyword,
    keywordScore: d.keyword?.score,
    keywordReason: d.keyword?.reason,
    totalWorkingHours: d.attendance?.totalWorkingHours,
    attendanceCount: d.attendance?.attendanceCount,
    firstClockIn: d.attendance?.firstClockIn,
    latestClockOut: d.attendance?.latestClockOut,
    longestWorkingDay: d.attendance?.longestWorkingDay,
    oaProcessInitiated: d.oa?.processInitiated,
    oaTasksDone: d.oa?.tasksDone,
    oaMostInitiatedProcess: d.oa?.mostInitiatedProcess,
    oaAvgApprovalTime: d.oa?.avgApprovalTimeMinutes != null ? `${(d.oa.avgApprovalTimeMinutes / 60).toFixed(1)}小时` : undefined,
    mostBusyMonth: d.oa?.mostApplyMonth,
    articlesPublished: d.articles?.articlesPublished,
    mostPopularArticle: d.articles?.mostPopularArticle,
    articleViews: d.articles?.articleViews,
    articleLikes: d.articles?.articleLikes,
    articleComments: d.articles?.articleComments,
    totalLikes: d.articles?.totalLikes,
    ojSubmissions: d.oj?.submissions,
    ojProblemsPassed: d.oj?.problemsPassed,
    ojPassRate: d.oj?.passRate != null ? `${(d.oj.passRate * 100).toFixed(1)}%` : undefined,
    ojCurrentRank: d.oj?.currentRankPercent != null ? `Top ${(d.oj.currentRankPercent * 100).toFixed(0)}%` : undefined,
    ojHighestRank: d.oj?.highestRank,
    ojContests: d.oj?.contests,
    ojMostAttempted: d.oj?.mostAttempted,
    ojLateNightSubmission: d.oj?.lateNightSubmission,
    ojDifficulty: d.oj?.difficulty,
    ojMaxStreak: d.oj?.maxStreak,
    favLang: d.oj?.favLang,
    gitCommits: d.git?.commits,
    gitAdditions: d.git?.additions,
    gitDeletions: d.git?.deletions,
    gitActiveDays: d.git?.activeDays,
    gitMostProductiveDay: d.git?.mostProductiveDay,
    gitTopRepo: d.git?.topRepo,
    gitTopRepos: Array.isArray(d.git?.topReposTop3)
      ? (d.git?.topReposTop3 || []).slice(0, 3).map(name => ({ name }))
      : (Array.isArray(d.git?.topRepos) ? (d.git?.topRepos || []).slice(0, 3) : (d.git?.topRepo ? [{ name: d.git.topRepo, commits: d.git?.commits }] : [])),
    gitLastCommitTime: d.git?.lastCommitTime,
  }
})

const ojTimePeriod = computed(() => {
  const t = statsView.value?.ojLateNightSubmission?.time
  if (!t)
    return ''
  const [hhStr, mmStr] = t.split(':')
  const hh = Number(hhStr) || 0
  const mm = Number(mmStr) || 0
  const minutes = hh * 60 + mm
  if (minutes < 270)
    return '凌晨'
  if (minutes < 480)
    return '早晨'
  if (minutes < 720)
    return '上午'
  if (minutes < 780)
    return '中午'
  if (minutes < 1110)
    return '下午'
  return '晚上'
})

const ojPassRatio = computed(() => {
  const sub = statsView.value?.ojSubmissions || 0
  const pass = statsView.value?.ojProblemsPassed || 0
  if (!sub || sub <= 0)
    return 0
  const r = Math.round((pass / sub) * 100)
  return r > 100 ? 100 : r < 0 ? 0 : r
})

const ojPeriodMessage = computed(() => {
  const problem = statsView.value?.ojLateNightSubmission?.problem || ''
  const p = ojTimePeriod.value
  if (p === '凌晨')
    return `整个城市都在沉睡，你还在挑战 《${problem}》。`
  if (p === '早晨')
    return `清晨的第一缕阳光伴你解题，《${problem}》正在被攻克。`
  if (p === '上午')
    return `精神最饱满的时段，你沉着应战《${problem}》。`
  if (p === '中午')
    return `午间短暂的休息，也挡不住你对《${problem}》的思考。`
  if (p === '下午')
    return `效率巅峰的下午，你稳步推进《${problem}》。`
  return `灯光下的坚持，《${problem}》仍在攻克之中。`
})

const oaBarHeights = computed(() => {
  const initiated = statsView.value?.oaProcessInitiated || 0
  const done = statsView.value?.oaTasksDone || 0
  const maxVal = Math.max(initiated, done)
  const MIN_BAR = 12
  if (maxVal <= 0)
    return { initiated: MIN_BAR, done: MIN_BAR }
  return {
    initiated: Math.max(MIN_BAR, Math.round((initiated / maxVal) * 100)),
    done: Math.max(MIN_BAR, Math.round((done / maxVal) * 100)),
  }
})

const oaInitiatedCount = computed(() => statsView.value?.oaProcessInitiated ?? 0)
const oaDoneCount = computed(() => statsView.value?.oaTasksDone ?? 0)
const mostInitiatedText = computed(() => {
  const initiated = oaInitiatedCount.value
  if (!initiated || initiated <= 0)
    return '无数据'
  return statsView.value?.oaMostInitiatedProcess ?? '—'
})
const avgApprovalText = computed(() => statsView.value?.oaAvgApprovalTime ?? '—')
const mostBusyMonthText = computed(() => statsView.value?.mostBusyMonth ?? '—')
const hasMostBusyMonth = computed(() => {
  const m = statsView.value?.mostBusyMonth
  return !!(m && String(m).trim().length > 0)
})

const gitAdditionsText = computed(() => {
  const v = statsView.value?.gitAdditions
  return typeof v === 'number' ? `+${v}` : '—'
})
const gitDeletionsText = computed(() => {
  const v = statsView.value?.gitDeletions
  return typeof v === 'number' ? `-${v}` : '—'
})
const gitActiveDaysText = computed(() => {
  const v = statsView.value?.gitActiveDays
  return typeof v === 'number' ? `${v}` : '—'
})

const gitHasData = computed(() => {
  const d = statsView.value
  if (!d)
    return false
  return !!(d.gitCommits || (Array.isArray(d.gitTopRepos) && d.gitTopRepos.length) || d.gitTopRepo || d.gitAdditions != null || d.gitDeletions != null || d.gitActiveDays)
})

const attendanceHasData = computed(() => {
  const d = statsView.value
  if (!d)
    return false
  return !!((d.totalWorkingHours && d.totalWorkingHours > 0) || (d.attendanceCount && d.attendanceCount > 0) || d.firstClockIn || d.latestClockOut || d.longestWorkingDay)
})
const hasWorkingHours = computed(() => {
  const v = statsView.value?.totalWorkingHours
  return typeof v === 'number' && v > 0
})
const hasFirstClockIn = computed(() => !!statsView.value?.firstClockIn)
const hasLatestClockOut = computed(() => !!statsView.value?.latestClockOut)
const hasLongestWorkingDay = computed(() => !!statsView.value?.longestWorkingDay)
const totalWorkingHoursText = computed(() => {
  const v = statsView.value?.totalWorkingHours
  return typeof v === 'number' && v > 0 ? `${v}` : '—'
})
const longestWorkingDayText = computed(() => statsView.value?.longestWorkingDay ?? '—')
const firstClockInText = computed(() => statsView.value?.firstClockIn ?? '—')
const latestClockOutText = computed(() => statsView.value?.latestClockOut ?? '—')
const attendanceCountText = computed(() => {
  const v = statsView.value?.attendanceCount
  return typeof v === 'number' && v > 0 ? `${v}` : '—'
})
const articleHasData = computed(() => {
  const d = statsView.value
  if (!d)
    return false
  return !!(d.articlesPublished && d.articlesPublished > 0)
})

const oaHasData = computed(() => {
  const d = statsView.value
  if (!d)
    return false
  return !!((d.oaProcessInitiated && d.oaProcessInitiated > 0) || (d.oaTasksDone && d.oaTasksDone > 0) || d.oaMostInitiatedProcess || d.oaAvgApprovalTime || d.mostBusyMonth)
})

const ojHasData = computed(() => {
  const d = statsView.value
  if (!d)
    return false
  const hasNums = (d.ojSubmissions || 0) > 0
    || (d.ojProblemsPassed || 0) > 0
    || (d.ojContests || 0) > 0
    || (d.ojHighestRank || 0) > 0
    || (d.ojMaxStreak || 0) > 0
  const hasText = !!(d.ojMostAttempted) || !!(d.favLang)
  const hasLate = !!(d.ojLateNightSubmission)
  const hasPassRate = typeof d.ojPassRate === 'string'
    ? Number.parseFloat(String(d.ojPassRate).replace('%', '')) > 0
    : (typeof d.ojPassRate === 'number' ? d.ojPassRate > 0 : false)
  return hasNums || hasText || hasLate || hasPassRate
})

function formatLastCommitTime() {
  return statsView.value?.gitLastCommitTime
}

// Calculate Join Days
const joinDate = computed(() => {
  const date = userInfo.value?.createTime || '2023-09-01'
  return dayjs(date).format('YYYY年MM月DD日')
})

const userAvatar = computed(() => {
  const a = (userInfo.value as any)?.avatar
  if (!a || typeof a !== 'string' || a.trim() === '')
    return DEFAULT_AVATAR
  return a
})

const isNewMember = computed(() => {
  const createTime = dayjs(userInfo.value?.createTime || '2023-09-01')
  // Assuming 'This Year' matches the report year (2025) or current year
  return createTime.year() === dayjs().year()
})

watch(yearData, () => {
  loading.value = false
})

// Interactive Elements State
const showBusyMonth = ref(false)
const showLikes = ref(false)
const posterRef = ref<HTMLElement | null>(null)
const exporting = ref(false)

// Click to Next Page Logic
function handlePageClick() {
  // Page 4 (Index 3): Work - Reveal Busy Month first
  if (currentPage.value === 3 && !showBusyMonth.value) {
    showBusyMonth.value = true
    return
  }

  // Default: Go to next page
  if (currentPage.value < 7) {
    currentPage.value++
  }
}

// Simple Reveal for Busy Month
function revealBusyMonth() {
  showBusyMonth.value = true
}

function handleLike() {
  if (!showLikes.value) {
    showLikes.value = true
    // Trigger haptic feedback if available
    uni.vibrateShort()
  }
}

// Swiper Change Handler
function onSwiperChange(e: any) {
  currentPage.value = e.detail.current
  // Update max visited page for lazy loading
  if (currentPage.value > maxVisitedPage.value) {
    maxVisitedPage.value = currentPage.value
  }
}

onMounted(() => {
  run()
})

function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="relative box-border h-100vh w-full overflow-hidden bg-black">
    <!-- Loading -->
    <view
      class="absolute inset-0 z-50 flex items-center justify-center bg-gray-900 transition-opacity duration-700 ease-out"
      :class="loading ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <view class="animate-pulse text-xl text-white">
        正在生成您的年度报告...
      </view>
    </view>

    <!-- Custom Back Button -->
    <view
      class="absolute left-4 z-50 h-8 w-8 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-colors active:bg-black/40"
      :style="{ top: `${statusBarHeight + 10}px` }"
      @click.stop="goBack"
    >
      <view class="i-carbon-chevron-left text-xl text-white" />
    </view>

    <!-- Content -->
    <swiper
      class="h-full w-full"
      :vertical="false"
      :indicator-dots="false"
      :current="currentPage"
      @change="onSwiperChange"
      @click="handlePageClick"
    >
      <!-- Page 1: Cover -->
      <swiper-item>
        <view
          class="relative box-border h-full w-full flex flex-col items-center justify-center overflow-hidden from-violet-950 via-slate-900 to-black bg-gradient-to-br p-8"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
          <!-- Interactive Background Elements -->
          <view class="animate-float-slow absolute left-10 top-20 h-32 w-32 rounded-full bg-purple-500 opacity-20 blur-3xl" />
          <view class="animate-float-slow-reverse absolute bottom-20 right-10 h-40 w-40 rounded-full bg-indigo-500 opacity-20 blur-3xl" />

          <!-- Avatar with Wave Effect -->
          <view class="relative z-10 mb-6">
            <view class="animate-ping-slow absolute inset-0 rounded-full bg-white/20" />
            <view class="relative z-10 h-24 w-24 overflow-hidden border-4 border-white/20 rounded-full opacity-0 shadow-2xl" :class="{ 'animate-fade-in-down': !loading && currentPage === 0 }">
              <image :src="userAvatar" class="h-full w-full" mode="aspectFill" />
            </view>
          </view>

          <view class="z-10 mb-2 text-3xl text-white font-bold opacity-0" :class="{ 'animate-fade-in-up': !loading && currentPage === 0 }">
            {{ userInfo.nickname }}
          </view>
          <view class="z-10 mb-12 text-lg text-indigo-200 opacity-0 delay-200" :class="{ 'animate-fade-in-up': !loading && currentPage === 0 }">
            梯航小助手 · 2025 年度总结
          </view>

          <view class="z-10 mb-20 text-center text-sm text-white/60 leading-relaxed opacity-0 delay-300" :class="{ 'animate-fade-in-up': !loading && currentPage === 0 }">
            这一年<br>
            我们一起见证了无数个日夜的奋斗<br>
            让我们一起回顾这段旅程
          </view>

          <view class="animate-pulse-slow absolute bottom-12 z-10 flex items-center gap-2">
            <view class="flex items-center opacity-80 -space-x-4">
              <view class="i-carbon-chevron-left animate-slide-left text-4xl text-white" />
              <view class="i-carbon-chevron-left animate-slide-left text-4xl text-white/60 delay-100" />
              <view class="i-carbon-chevron-left animate-slide-left text-4xl text-white/30 delay-200" />
            </view>
            <text class="ml-4 text-xs text-white/80 tracking-widest">
              向左滑动开启
            </text>
          </view>
        </view>
      </swiper-item>

      <!-- Page 2: Join Date -->
      <swiper-item>
        <view
          v-if="maxVisitedPage >= 1"
          class="relative box-border h-full w-full flex flex-col justify-center overflow-hidden from-blue-900 via-sky-900 to-slate-900 bg-gradient-to-br p-8 text-white"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
          <view class="animate-pulse-slow absolute h-80 w-80 rounded-full bg-blue-500 opacity-20 blur-[100px] -right-20 -top-20" />

          <view class="mb-6 text-2xl font-light opacity-0" :class="{ 'animate-slide-in-right': currentPage === 1 }">
            故事开始于
          </view>
          <view class="mb-8 text-4xl font-bold opacity-0 delay-100" :class="{ 'animate-slide-in-right': currentPage === 1 }">
            {{ joinDate }}
          </view>

          <!-- Conditional Content based on Join Year -->
          <view v-if="isNewMember">
            <view class="mb-8 text-lg leading-relaxed opacity-0 delay-200" :class="{ 'animate-slide-in-right': currentPage === 1 }">
              那是一个特别的日子<br>
              你与 <text class="animate-stamp mx-1 inline-block text-2xl text-yellow-400 font-bold">
                {{ statsView?.sameYearJoinCount }}
              </text> 位伙伴<br>
              一同开启了这段旅程
            </view>

            <view class="mt-8 border border-white/10 rounded-2xl bg-white/5 p-6 text-xl opacity-0 backdrop-blur-sm delay-300" :class="{ 'animate-zoom-in': currentPage === 1 }">
              欢迎加入梯航大家庭<br>
              <view class="mt-4 text-sm text-gray-400">
                未来的日子，我们并肩同行
              </view>
            </view>
          </view>

          <view v-else>
            <view class="mt-8 border border-white/10 rounded-2xl bg-white/5 p-6 text-xl opacity-0 backdrop-blur-sm delay-200" :class="{ 'animate-zoom-in': currentPage === 1 }">
              至今，我们已经相伴 <text class="mx-2 inline-block animate-count-up text-5xl text-sky-400 font-bold">
                {{ statsView?.joinDays }}
              </text> 天
              <view class="mt-4 text-sm text-gray-400">
                共同度过了 {{ statsView?.yearsTogether }} 个春夏秋冬
              </view>
            </view>
          </view>
        </view>
      </swiper-item>

      <!-- Page 3: Attendance -->
      <swiper-item>
        <view
          v-if="maxVisitedPage >= 2"
          class="relative box-border h-full w-full flex flex-col justify-center overflow-hidden from-emerald-900 via-teal-900 to-gray-900 bg-gradient-to-br p-8 text-white"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
          <view class="mb-10 text-3xl font-bold opacity-0" :class="{ 'animate-fade-in-down': currentPage === 2 }">
            勤奋的足迹
          </view>

          <view v-if="attendanceHasData" class="grid grid-cols-2 mb-8 gap-4">
            <!-- Total Hours -->
            <view class="rounded-2xl bg-white/10 p-4 opacity-0 backdrop-blur-md transition-colors delay-100 hover:bg-white/20" :class="{ 'animate-zoom-in': currentPage === 2 }">
              <view class="mb-1 text-sm text-emerald-200">
                年度工时
              </view>
              <view class="text-3xl font-bold">
                <view v-if="hasWorkingHours">
                  {{ totalWorkingHoursText }} <text class="text-sm font-normal">
                    h
                  </text>
                </view>
                <view v-else class="text-base opacity-80">
                  尚未记录工时
                </view>
              </view>
            </view>
            <!-- Longest Day -->
            <view class="rounded-2xl bg-white/10 p-4 opacity-0 backdrop-blur-md transition-colors delay-200 hover:bg-white/20" :class="{ 'animate-zoom-in': currentPage === 2 }">
              <view class="mb-1 text-sm text-emerald-200">
                最长一天
              </view>
              <view class="text-xl font-bold">
                <text v-if="hasLongestWorkingDay">
                  {{ longestWorkingDayText }}
                </text>
                <text v-else class="text-base opacity-80">
                  暂无最长打卡日
                </text>
              </view>
            </view>
            <!-- Earliest In -->
            <view class="rounded-2xl bg-white/10 p-4 opacity-0 backdrop-blur-md transition-colors delay-300 hover:bg-white/20" :class="{ 'animate-zoom-in': currentPage === 2 }">
              <view class="mb-1 text-sm text-emerald-200">
                最早打卡
              </view>
              <view class="text-3xl font-bold">
                <text v-if="hasFirstClockIn">
                  {{ firstClockInText }}
                </text>
                <text v-else class="text-base opacity-80">
                  暂无最早打卡记录
                </text>
              </view>
            </view>
            <!-- Latest Out -->
            <view class="rounded-2xl bg-white/10 p-4 opacity-0 backdrop-blur-md transition-colors delay-400 hover:bg-white/20" :class="{ 'animate-zoom-in': currentPage === 2 }">
              <view class="mb-1 text-sm text-emerald-200">
                最晚打卡
              </view>
              <view class="text-3xl font-bold">
                <text v-if="hasLatestClockOut">
                  {{ latestClockOutText }}
                </text>
                <text v-else class="text-base opacity-80">
                  暂无最晚打卡记录
                </text>
              </view>
            </view>
          </view>
          <view v-else class="mb-8 flex items-center justify-center">
            <view class="border border-white/10 rounded-2xl bg-white/10 p-6 text-center text-white/80">
              <view class="mb-2 text-sm">
                暂无考勤数据
              </view>
              <view class="text-xs opacity-70">
                也许，新的打卡记录正在路上
              </view>
            </view>
          </view>

          <view
            class="group relative mt-4 overflow-hidden border-l-4 border-emerald-500 rounded-2xl bg-white/10 p-6 opacity-0 backdrop-blur-sm transition-all duration-500"
            :class="{ 'animate-slide-in-up delay-500': currentPage === 2 }"
          >
            <view v-if="attendanceHasData" class="text-sm leading-relaxed opacity-80">
              这一年，你一共打卡 <text class="mx-1 inline-block animate-count-up text-xl text-emerald-400 font-bold">
                {{ attendanceCountText }}
              </text> 次。<br>
              每一个清晨的问候，<br>
              都是对梦想最长情的告白。
            </view>
            <view v-else class="text-center text-sm leading-relaxed opacity-80">
              这一年暂未产生考勤记录<br>
              期待你的第一次打卡
            </view>
          </view>
        </view>
      </swiper-item>

      <!-- Page 4: Work (OA) -->
      <swiper-item>
        <view
          v-if="maxVisitedPage >= 3"
          class="relative box-border h-full w-full flex flex-col justify-center overflow-hidden from-orange-900 via-red-900 to-slate-900 bg-gradient-to-br p-8 text-white"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
          <view class="mb-10 text-3xl font-bold opacity-0" :class="{ 'animate-fade-in-down': currentPage === 3 }">
            高效的工作
          </view>

          <view v-if="oaHasData" class="relative mb-8 h-48 w-full flex items-center justify-center opacity-0 delay-100" :class="{ 'animate-zoom-in': currentPage === 3 }">
            <!-- Animated Chart Bars -->
            <view
              class="absolute bottom-0 left-10 w-16 rounded-t-lg bg-orange-500/80 transition-all duration-1000 ease-out"
              :style="{ height: currentPage === 3 ? `${oaBarHeights.initiated}%` : '0%' }"
            >
              <view class="absolute w-full text-center text-sm -top-6" :class="{ 'opacity-100': currentPage === 3, 'opacity-0': currentPage !== 3 }">
                {{ oaInitiatedCount }}
              </view>
              <view class="absolute bottom-2 w-full text-center text-xs opacity-70">
                发起
              </view>
            </view>
            <view
              class="absolute bottom-0 right-10 w-16 rounded-t-lg bg-red-500/80 transition-all duration-1000 delay-200 ease-out"
              :style="{ height: currentPage === 3 ? `${oaBarHeights.done}%` : '0%' }"
            >
              <view class="absolute w-full text-center text-sm -top-6" :class="{ 'opacity-100': currentPage === 3, 'opacity-0': currentPage !== 3 }">
                {{ oaDoneCount }}
              </view>
              <view class="absolute bottom-2 w-full text-center text-xs opacity-70">
                处理
              </view>
            </view>
            <view class="absolute bottom-0 h-px w-full bg-white/20" />
            <view v-if="oaInitiatedCount === 0 && oaDoneCount === 0" class="absolute inset-x-0 text-center text-xs opacity-70 -bottom-8">
              今年尚未产生 OA 流程记录
            </view>
          </view>
          <view v-else class="relative mb-8 opacity-0 delay-100" :class="{ 'animate-zoom-in': currentPage === 3 }">
            <view class="mx-auto w-full border border-white/10 rounded-2xl bg-white/5 p-6 text-center text-white/80">
              暂无OA工作数据
            </view>
          </view>

          <!-- Additional OA Stats -->
          <view v-if="oaHasData" class="grid grid-cols-2 mb-6 gap-4 opacity-0 delay-200" :class="{ 'animate-slide-in-up': currentPage === 3 }">
            <view class="border border-white/10 rounded-xl bg-white/10 p-3">
              <view class="mb-1 text-xs text-orange-200">
                发起最多
              </view>
              <view class="truncate text-lg font-bold">
                {{ mostInitiatedText }}
              </view>
            </view>
            <view class="border border-white/10 rounded-xl bg-white/10 p-3">
              <view class="mb-1 text-xs text-orange-200">
                平均耗时
              </view>
              <view class="text-lg font-bold">
                {{ avgApprovalText }}
              </view>
            </view>
          </view>
          <view v-else class="mb-6 text-center opacity-0 delay-200" :class="{ 'animate-slide-in-up': currentPage === 3 }">
            <view class="inline-block border border-white/10 rounded-xl bg-white/10 px-4 py-3 text-xs opacity-80">
              等待你的下一次流程发起与处理
            </view>
          </view>

          <view
            class="relative overflow-hidden rounded-2xl p-6 opacity-0 backdrop-blur-md transition-all duration-500 delay-300"
            :class="[
              currentPage === 3 ? 'animate-slide-in-up' : '',
              showBusyMonth ? 'bg-white/10' : 'bg-white/5',
            ]"
            @click.stop="revealBusyMonth"
          >
            <view v-if="!showBusyMonth && oaHasData" class="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
              <view class="flex flex-col animate-pulse items-center gap-2">
                <view class="i-carbon-touch-1 text-3xl text-orange-400" />
                <text class="text-xs text-orange-200">
                  点击揭晓
                </text>
              </view>
            </view>

            <view v-if="oaHasData" class="mb-4 transition-all duration-500" :class="{ 'blur-sm opacity-50': !showBusyMonth }">
              <text class="mr-2 text-2xl text-orange-300 font-bold" :class="{ 'animate-zoom-in': showBusyMonth }">
                {{ statsView?.mostBusyMonth }}
              </text>
              <text class="text-sm opacity-80">
                {{ hasMostBusyMonth ? '是你最忙碌的一个月' : '暂无最忙月份' }}
              </text>
            </view>
            <view v-if="oaHasData" class="text-sm leading-relaxed opacity-70 transition-all duration-500" :class="{ 'blur-sm opacity-50': !showBusyMonth }">
              流程流转之间，是你忙碌的身影。<br>
              每一个节点的完成，都凝聚着你的智慧。<br>
              你也因此成为了大家眼中的“效率担当”。
            </view>
            <view v-else class="text-center text-sm leading-relaxed opacity-70">
              暂无“最忙月份”统计
            </view>
          </view>
        </view>
      </swiper-item>

      <!-- Page 5: Articles & Learning -->
      <swiper-item>
        <view
          v-if="maxVisitedPage >= 4"
          class="relative box-border h-full w-full flex flex-col justify-center overflow-hidden from-pink-900 via-rose-900 to-black bg-gradient-to-br p-8 text-white"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
          <view class="mb-10 text-3xl font-bold opacity-0" :class="{ 'animate-fade-in-down': currentPage === 4 }">
            知识的沉淀
          </view>

          <view class="mb-12 flex flex-col items-center justify-center">
            <view class="animate-pulse-slow relative opacity-0" :class="{ 'animate-zoom-in': currentPage === 4 }">
              <view class="h-48 w-48 flex items-center justify-center border border-pink-500/30 rounded-full">
                <view class="h-36 w-36 flex flex-col items-center justify-center rounded-full from-pink-600 to-rose-600 bg-gradient-to-tr shadow-lg shadow-pink-900/50 transition-transform duration-500 hover:scale-110">
                  <view class="text-5xl font-bold">
                    {{ statsView?.articlesPublished }}
                  </view>
                  <view class="mt-1 text-xs opacity-80">
                    篇创作
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="opacity-0 delay-200 space-y-4" :class="{ 'animate-slide-in-up': currentPage === 4 }">
            <view
              v-if="articleHasData"
              class="relative overflow-hidden border border-white/10 rounded-2xl bg-white/10 p-5 backdrop-blur-md transition-transform active:scale-98"
              @click.stop="handleLike"
            >
              <view v-if="showLikes" class="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                <view class="animate-float-up absolute bottom-0 left-1/2 text-pink-500 opacity-0 -translate-x-1/2" style="animation-delay: 0s">
                  ❤️
                </view>
                <view class="animate-float-up absolute bottom-0 left-1/3 text-pink-400 opacity-0" style="animation-delay: 0.2s">
                  ❤️
                </view>
                <view class="animate-float-up absolute bottom-0 left-2/3 text-pink-600 opacity-0" style="animation-delay: 0.4s">
                  ❤️
                </view>
              </view>
              <view class="mb-2 flex items-center gap-1 text-xs text-pink-300">
                <view class="i-carbon-trophy" />
                年度最受欢迎文章
              </view>
              <view class="line-clamp-2 mb-4 text-xl font-bold leading-snug">
                {{ statsView?.mostPopularArticle }}
              </view>
              <view class="flex items-center justify-between text-sm text-white/70">
                <view class="flex items-center gap-1">
                  <view class="i-carbon-view" />
                  <text>{{ statsView?.articleViews }}</text>
                </view>
                <view class="flex items-center gap-1" :class="{ 'text-pink-400 font-bold': showLikes }">
                  <view class="i-carbon-favorite" :class="{ 'animate-bounce': showLikes }" />
                  <text>{{ statsView?.articleLikes }}</text>
                </view>
                <view class="flex items-center gap-1">
                  <view class="i-carbon-chat" />
                  <text>{{ statsView?.articleComments }}</text>
                </view>
              </view>
            </view>
            <view v-else class="border border-white/10 rounded-2xl bg-white/10 p-5 text-center opacity-80">
              <view class="mb-2 text-sm text-white">
                暂无文章发布记录
              </view>
              <view class="text-xs text-white/70">
                每一篇文章，都是经验的沉淀。期待你的第一篇作品！
              </view>
            </view>
            <view class="px-4 text-center text-sm opacity-60">
              "分享是最好的学习"<br>
              你的每一次记录，都照亮了后来者的路。
            </view>
          </view>
        </view>
      </swiper-item>

      <!-- Page 6: OJ -->
      <swiper-item>
        <view
          v-if="maxVisitedPage >= 5"
          class="relative box-border h-full w-full flex flex-col justify-center overflow-hidden from-cyan-900 via-blue-900 to-black bg-gradient-to-br p-8 text-white"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
          <!-- Matrix background effect placeholder -->
          <view class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#22d3ee 1px, transparent 1px); background-size: 20px 20px;" />

          <view class="z-10 mb-8 text-3xl font-bold opacity-0" :class="{ 'animate-fade-in-down': currentPage === 5 }">
            在线评测
          </view>

          <view
            v-if="ojHasData"
            class="relative z-10 overflow-hidden border border-gray-700 rounded-xl bg-gray-800/50 p-6 opacity-0 backdrop-blur-sm delay-100"
            :class="{ 'animate-zoom-in': currentPage === 5 }"
          >
            <view class="mb-6 flex items-end justify-between">
              <view>
                <view class="mb-1 text-xs text-gray-400">
                  提交总数
                </view>
                <view class="animate-count-up text-3xl text-cyan-400 font-mono">
                  {{ statsView?.ojSubmissions }}
                </view>
              </view>
              <view class="text-right">
                <view class="mb-1 text-xs text-gray-400">
                  通过题目
                </view>
                <view class="animate-count-up text-3xl text-blue-400 font-mono">
                  {{ statsView?.ojProblemsPassed }}
                </view>
              </view>
            </view>

            <view class="mb-2 h-2 overflow-hidden rounded-full bg-gray-700">
              <view
                class="h-full from-cyan-500 to-blue-500 bg-gradient-to-r transition-all duration-[2000ms] ease-out"
                :style="{ width: currentPage === 5 ? `${ojPassRatio}%` : '0%' }"
              />
            </view>
            <view class="flex justify-end text-xs text-gray-500">
              <text>通过率: {{ statsView?.ojPassRate }}</text>
            </view>
          </view>
          <view v-else class="relative z-10 overflow-hidden border border-gray-700 rounded-xl bg-gray-800/40 p-6 text-center opacity-0 backdrop-blur-sm delay-100" :class="{ 'animate-zoom-in': currentPage === 5 }">
            暂无在线评测数据
          </view>

          <!-- New Stats Section -->
          <view v-if="ojHasData" class="z-10 mt-6 opacity-0 delay-200 space-y-3" :class="{ 'animate-slide-in-up': currentPage === 5 }">
            <!-- Contests & Most Attempted in one row -->
            <view class="grid grid-cols-3 gap-3">
              <view class="col-span-1 border border-white/10 rounded-lg bg-white/5 p-3 text-center">
                <view class="mb-1 text-xs text-gray-400">
                  参赛
                </view>
                <view class="text-lg font-bold">
                  {{ statsView?.ojContests }}
                </view>
              </view>
              <view class="col-span-2 border border-white/10 rounded-lg bg-white/5 p-3 text-center">
                <view class="mb-1 text-xs text-gray-400">
                  尝试最多
                </view>
                <view class="truncate text-base text-orange-200 font-bold">
                  {{ statsView?.ojMostAttempted }}
                </view>
              </view>
            </view>

            <!-- Late Night Submission Story -->
            <view class="relative overflow-hidden border border-cyan-500/20 rounded-lg from-blue-900/40 to-cyan-900/40 bg-gradient-to-r p-4">
              <view class="i-carbon-moon absolute right-2 top-2 text-4xl text-yellow-100/20" />
              <view class="mb-2 text-sm text-cyan-200 font-bold">
                星光不问赶路人
              </view>
              <view class="text-xs text-gray-300 leading-relaxed">
                <text class="text-cyan-400 font-bold">
                  {{ statsView?.ojLateNightSubmission?.date }}
                </text>
                {{ ojTimePeriod }} <text class="text-cyan-400 font-bold">
                  {{ statsView?.ojLateNightSubmission?.time }}
                </text>，<br>
                {{ ojPeriodMessage }}
              </view>
            </view>
          </view>
          <view v-else class="z-10 mt-6 text-center opacity-0 delay-200" :class="{ 'animate-slide-in-up': currentPage === 5 }">
            <view class="inline-block border border-white/10 rounded-lg bg-white/5 px-4 py-3 text-xs opacity-80">
              还没有评测记录，期待你的下一次提交
            </view>
          </view>

          <view class="animate-pulse-slow z-10 mt-12 text-center text-xs text-gray-500 font-mono opacity-0 delay-500" :class="{ 'animate-fade-in-up': currentPage === 5 }">
            while(problem) { solve(); }
          </view>
        </view>
      </swiper-item>

      <!-- Page 7: Git -->
      <swiper-item>
        <view
          v-if="maxVisitedPage >= 6"
          v-show="currentPage === 6"
          class="relative box-border h-full w-full flex flex-col justify-center overflow-hidden from-gray-900 via-neutral-900 to-black bg-gradient-to-br p-8 text-white"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
          <view class="z-10 mb-8 text-3xl font-bold opacity-0 will-change-transform" :class="{ 'animate-fade-in': currentPage === 6 }">
            代码贡献
          </view>

          <!-- Git Stats Cards -->
          <view v-if="gitHasData" class="relative mb-6 opacity-0 delay-100 will-change-transform space-y-4" :class="{ 'animate-zoom-in': currentPage === 6 }">
            <!-- Top Day Card -->
            <view class="flex items-center justify-between border border-white/10 rounded-2xl bg-gray-800/60 p-4">
              <view>
                <view class="animate-typewriter mb-1 w-0 overflow-hidden whitespace-nowrap border-r-2 border-transparent text-xs text-gray-400">
                  最高产出日
                </view>
                <view class="text-lg text-white font-bold">
                  {{ statsView?.gitMostProductiveDay }}
                </view>
              </view>
              <view class="text-right">
                <view class="mb-1 text-xs text-gray-400">
                  提交次数
                </view>
                <view class="animate-count-up text-xl text-green-400 font-mono">
                  {{ statsView?.gitCommits }}
                </view>
              </view>
            </view>

            <!-- 提交仓库排行榜 -->
            <view class="border border-white/10 rounded-2xl bg-gray-800/60 p-4">
              <view class="mb-1 text-center text-xs text-gray-400">
                提交仓库排行榜
              </view>
              <view class="text-sm text-purple-300 font-bold">
                <view v-if="statsView?.gitTopRepos?.length" class="space-y-1">
                  <view v-for="(r, idx) in statsView?.gitTopRepos" :key="idx" class="break-all">
                    <text class="mr-2 opacity-70">
                      #{{ Number(idx) + 1 }}
                    </text>{{ r.name }}
                  </view>
                </view>
                <view v-else class="text-center opacity-60">
                  暂无数据
                </view>
              </view>
            </view>
          </view>
          <view v-else class="relative mb-6 text-center text-sm text-gray-400 opacity-0 delay-100 space-y-2" :class="{ 'animate-zoom-in': currentPage === 6 }">
            <view class="mx-auto w-full border border-white/10 rounded-2xl bg-gray-800/60 p-6">
              <view class="mb-2 text-base text-white font-bold">
                暂无代码贡献数据
              </view>
              <view class="mb-1">
                每一次提交，都是成长的脚印。期待你的下一次 commit！
              </view>
              <view class="text-xs opacity-70">
                小贴士：确认账号已绑定、仓库有权限，或稍后再试
              </view>
            </view>
          </view>

          <!-- Code Frequency & Activity -->
          <view v-if="gitHasData" class="border border-white/5 rounded-2xl bg-black/40 p-5 opacity-0 delay-200" :class="{ 'animate-fade-in': currentPage === 6 }">
            <view class="mb-6 flex items-center justify-between text-sm">
              <view class="flex gap-4">
                <text class="text-green-400 font-mono">
                  {{ gitAdditionsText }}
                </text>
                <text class="text-red-400 font-mono">
                  {{ gitDeletionsText }}
                </text>
              </view>
              <view class="text-right">
                <text class="block text-gray-500">
                  活跃天数 {{ gitActiveDaysText }}
                </text>
                <text class="block text-gray-500">
                  最近提交 {{ formatLastCommitTime() }}
                </text>
              </view>
            </view>

            <!-- Contribution Graph Mock (Grid) -->
            <view class="mb-2 text-xs text-gray-500">
              贡献热力图
            </view>
            <view class="flex flex-wrap justify-center gap-1 opacity-80">
              <view
                v-for="i in 52" :key="i"
                class="h-3 w-3 rounded-sm transition-opacity hover:opacity-100"
                :class="{ 'animate-pulse-slow': i % 7 === 0 }"
                :style="{
                  backgroundColor: Math.random() > 0.7 ? '#166534' : (Math.random() > 0.4 ? '#15803d' : '#22c55e'),
                  opacity: Math.random() * 0.5 + 0.3,
                  animationDelay: `${i * 20}ms`,
                }"
              />
            </view>
          </view>
          <view v-else class="opacity-0 delay-200" :class="{ 'animate-fade-in': currentPage === 6 }">
            <view class="mx-auto w-full border border-white/10 rounded-2xl bg-black/30 p-5 text-center text-gray-400 leading-relaxed">
              暂无可展示的代码频率与活跃度<br>
              也许，下一次 push 就会点亮你的热力图
            </view>
          </view>

          <view class="z-10 mt-12 text-center text-xs text-gray-600 font-mono opacity-0 delay-500" :class="{ 'animate-typewriter': currentPage === 6 }">
            > git push origin dream
          </view>
        </view>
      </swiper-item>

      <!-- Page 8: Summary & Keyword -->
      <swiper-item>
        <view
          v-if="maxVisitedPage >= 7"
          class="relative box-border h-full w-full flex flex-col items-center justify-center overflow-hidden from-violet-900 via-fuchsia-900 to-black bg-gradient-to-br p-4 text-white space-y-2"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 16}px` }"
        >
          <view class="absolute right-10 top-10 rotate-12 text-9xl font-black opacity-10">
            {{ reportYear }}
          </view>

          <view class="mb-8 text-xl opacity-0" :class="{ 'animate-fade-in-down': currentPage === 7 }">
            你的年度关键词
          </view>

          <view class="relative mb-6 opacity-0 delay-200" :class="{ 'animate-zoom-in': currentPage === 7 }">
            <view class="animate-pulse-slow absolute inset-0 rounded-full bg-fuchsia-500 opacity-40 blur-[60px]" />
            <view class="relative z-10 scale-100 from-white to-fuchsia-200 bg-gradient-to-r bg-clip-text text-6xl text-transparent font-black tracking-widest transition-transform duration-300 hover:scale-110" style="-webkit-background-clip: text;">
              {{ statsView?.keyword }}
            </view>
          </view>

          <view
            id="poster-root"
            ref="posterRef"
            class="mb-4 max-w-160 w-full border border-white/10 rounded-2xl bg-white/10 p-5 opacity-0 backdrop-blur-md delay-300"
            data-poster="true"
            :class="{ 'animate-slide-in-up': currentPage === 7 }"
          >
            <view class="mb-4 flex items-center">
              <image :src="userAvatar" class="mr-3 h-12 w-12 rounded-full" mode="aspectFill" />
              <view class="flex-1">
                <view class="text-base font-bold">
                  {{ userInfo.nickname }}
                </view>
                <view class="text-xs opacity-70">
                  加入于 {{ joinDate }}
                </view>
              </view>
              <view class="border border-white/10 rounded-full bg-white/15 px-2 py-1 text-xs">
                年度总结
              </view>
            </view>
            <view class="mb-3 text-center">
              <view class="from-white to-fuchsia-200 bg-gradient-to-r bg-clip-text text-2xl text-transparent font-black tracking-wide" style="-webkit-background-clip:text;">
                {{ statsView?.keyword }}
              </view>
              <view class="mt-1 text-xs opacity-70">
                评分 {{ statsView?.keywordScore ?? '—' }}
              </view>
            </view>
            <view class="grid grid-cols-3 gap-3 text-center">
              <view class="border border-white/10 rounded-xl bg-white/8 p-3">
                <view class="text-xs opacity-70">
                  加入天数
                </view>
                <view class="mt-1 text-sm font-bold">
                  {{ statsView?.joinDays ?? '—' }}
                </view>
              </view>
              <view class="border border-white/10 rounded-xl bg-white/8 p-3">
                <view class="text-xs opacity-70">
                  通过题目
                </view>
                <view class="mt-1 text-sm font-bold">
                  {{ statsView?.ojProblemsPassed ?? '—' }}
                </view>
              </view>
              <view class="border border-white/10 rounded-xl bg-white/8 p-3">
                <view class="text-xs opacity-70">
                  Git 提交
                </view>
                <view class="mt-1 text-sm font-bold">
                  {{ statsView?.gitCommits ?? '—' }}
                </view>
              </view>
              <view class="border border-white/10 rounded-xl bg-white/8 p-3">
                <view class="text-xs opacity-70">
                  文章发布
                </view>
                <view class="mt-1 text-sm font-bold">
                  {{ statsView?.articlesPublished ?? '—' }}
                </view>
              </view>
              <view class="border border-white/10 rounded-xl bg-white/8 p-3">
                <view class="text-xs opacity-70">
                  总获赞
                </view>
                <view class="mt-1 text-sm font-bold">
                  {{ statsView?.totalLikes ?? '—' }}
                </view>
              </view>
            </view>
            <view class="mt-4 text-center text-xs opacity-70">
              梯航小助手 · {{ reportYear }} 年度总结
            </view>
          </view>

          <!-- Hexagon removed to keep within screen height -->

          <!-- Summary card removed to avoid exceeding screen height -->

          <!-- 保存图片按钮移除 -->

          <!-- 下一页按钮移除以避免超过屏幕高度 -->
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<style scoped>
/* Normalize uni-view layout spacing for this page */
uni-view {
  box-sizing: border-box;
  word-break: break-word;
}

/* Custom Animations */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes count-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-count-up {
  animation: count-up 0.5s ease-out forwards;
}
@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes zoom-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes pulse-slow {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes float-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
@keyframes float-slow-reverse {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}
@keyframes ping-slow {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    opacity: 1;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes bounce-x {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(10px);
  }
}

.animate-fade-in-down {
  animation: fade-in-down 0.8s ease-out forwards;
}
.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out forwards;
}
.animate-slide-in-right {
  animation: slide-in-right 0.8s ease-out forwards;
}
.animate-slide-in-up {
  animation: slide-in-up 0.8s ease-out forwards;
}
.animate-zoom-in {
  animation: zoom-in 0.6s ease-out forwards;
}
.animate-pulse-slow {
  animation: pulse-slow 3s infinite ease-in-out;
}
.animate-spin-slow {
  animation: spin-slow 20s linear infinite;
}
.animate-float-slow {
  animation: float-slow 4s ease-in-out infinite;
}
.animate-float-slow-reverse {
  animation: float-slow-reverse 5s ease-in-out infinite;
}
.animate-ping-slow {
  animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.animate-bounce-in {
  animation: bounce-in 0.8s cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
}
.animate-bounce-x {
  animation: bounce-x 1s infinite ease-in-out;
}

@keyframes slide-left {
  0% {
    opacity: 0;
    transform: translateX(10px);
  }
  50% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-10px);
  }
}
.animate-slide-left {
  animation: slide-left 1.5s infinite;
}
@keyframes stamp {
  0% {
    opacity: 0;
    transform: scale(3);
  }
  80% {
    opacity: 1;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes float-up {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(1.5);
    opacity: 0;
  }
}
@keyframes typewriter {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

.animate-stamp {
  animation: stamp 0.5s cubic-bezier(0.6, 0.04, 0.98, 0.335) forwards;
  animation-delay: 0.5s;
  opacity: 0;
}
.animate-float-up {
  animation: float-up 1s ease-out forwards;
}
.animate-typewriter {
  animation: typewriter 2s steps(20) forwards;
  animation-delay: 0.5s;
}

.delay-100 {
  animation-delay: 100ms;
}
.delay-200 {
  animation-delay: 200ms;
}
.delay-300 {
  animation-delay: 300ms;
}
.delay-500 {
  animation-delay: 500ms;
}
.delay-700 {
  animation-delay: 700ms;
}
</style>

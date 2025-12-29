<route lang="jsonc">
{
  "style": {
    "navigationBarTitleText": "年度总结",
    "navigationStyle": "custom"
  }
}
</route>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/store'
import dayjs from 'dayjs'

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
        } catch (e) {
            console.error('Failed to parse systemUserInfo', e)
        }
    }
    return systemUserInfo
  }
  
  return userStore.userInfo || {
    nickname: '梯航探索者',
    avatar: '/static/images/default-avatar.png',
    createTime: '2023-09-01' // Default join date for preview
  }
})

// Safe Area & System Info
const systemInfo = uni.getSystemInfoSync()
const statusBarHeight = systemInfo.statusBarHeight || 0
const safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0
const screenWidth = systemInfo.windowWidth

// Current Page Index for Animation Triggers
const currentPage = ref(0)
// Track maximum visited page index to implement lazy loading
const maxVisitedPage = ref(0)

// Stats Data - Mock Data for Preview
const stats = ref({
  joinDays: 365,
  rank: 108,
  attendanceCount: 248,
  firstClockIn: '07:23',
  totalWorkingHours: 2080,
  longestWorkingDay: '11月11日',
  latestClockOut: '23:45',
  
  oaTasksDone: 156,
  oaProcessInitiated: 42,
  oaMostInitiatedProcess: '请假申请',
  oaAvgApprovalTime: '4.5小时',
  mostBusyMonth: '11月',
  
  articlesPublished: 12,
  mostPopularArticle: 'UniApp 高级开发指南',
  articleViews: 8848,
  articleLikes: 356,
  articleComments: 128,
  totalLikes: 1520,

  // OJ Stats
  ojProblemsPassed: 88, // 通过题目
  ojSubmissions: 350,   // 提交次数
  ojPassRate: '25.1%',  // 通过率
  ojRank: 'Top 10%',
  ojHighestRank: 5,
  ojCurrentRank: 'Top 10%',
  ojContests: 12,
  ojMostAttempted: '两数之和 (25次)',
  ojLateNightSubmission: {
    date: '2025年1月3日',
    time: '03:15',
    problem: '最长回文子串'
  },
  
  ojDifficulty: { easy: 30, medium: 45, hard: 13 },
  ojMaxStreak: 15,
  favLang: 'C++',
  // Git Stats
  gitCommits: 1243,     // 提交次数
  gitAdditions: 45210,  // 代码增加行数
  gitDeletions: 12034,  // 代码删除行数
  gitActiveDays: 210,   // 活跃天数
  gitMostProductiveDay: '周三',
  gitPeakTime: '22:00 - 02:00',
  gitTopRepo: 'tihang-system-mobile',
  
  keyword: '全能大神',
  ability: [85, 90, 75, 88, 92, 80],
  sameYearJoinCount: 42,
  yearsTogether: 1
})

// Calculate Join Days
const joinDate = computed(() => {
  const date = userInfo.value?.createTime || '2023-09-01'
  return dayjs(date).format('YYYY年MM月DD日')
})

const isNewMember = computed(() => {
    const createTime = dayjs(userInfo.value?.createTime || '2023-09-01')
    // Assuming 'This Year' matches the report year (2025) or current year
    return createTime.year() === dayjs().year()
})

// Fetch Data - Mocked
const fetchData = async () => {
  // Pre-calculate data to prevent layout shift after loading
  const createTime = dayjs(userInfo.value?.createTime || new Date())
  stats.value.joinDays = dayjs().diff(createTime, 'day')
  if (stats.value.joinDays < 0) stats.value.joinDays = 100
  
  // Calculate years passed (rounded up or roughly)
  const years = dayjs().diff(createTime, 'year')
  stats.value.yearsTogether = years > 0 ? years : 1

  setTimeout(() => {
    loading.value = false
  }, 1500)
}

// Interactive Elements State
// Click to Next Page Logic
const handlePageClick = () => {
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

const showBusyMonth = ref(false)
const showLikes = ref(false)

// Simple Reveal for Busy Month
const revealBusyMonth = () => {
    showBusyMonth.value = true
}

const handleLike = () => {
    if (!showLikes.value) {
        showLikes.value = true
        // Trigger haptic feedback if available
        uni.vibrateShort()
    }
}

// Swiper Change Handler
const onSwiperChange = (e: any) => {
  currentPage.value = e.detail.current
  // Update max visited page for lazy loading
  if (currentPage.value > maxVisitedPage.value) {
    maxVisitedPage.value = currentPage.value
  }
}

onMounted(() => {
  fetchData()
})

const goBack = () => {
  uni.navigateBack()
}
</script>

<template>
  <view class="h-100vh w-full bg-black overflow-hidden relative box-border">
    <!-- Loading -->
    <view 
        class="absolute inset-0 flex items-center justify-center bg-gray-900 z-50 transition-opacity duration-700 ease-out"
        :class="loading ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <view class="text-white text-xl animate-pulse">正在生成您的年度报告...</view>
    </view>

    <!-- Custom Back Button -->
    <view 
      class="absolute left-4 z-50 flex items-center justify-center w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm active:bg-black/40 transition-colors"
      :style="{ top: `${statusBarHeight + 10}px` }"
      @click.stop="goBack"
    >
      <view class="i-carbon-chevron-left text-white text-xl"></view>
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
          class="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-950 via-slate-900 to-black p-8 relative overflow-hidden box-border"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
            <!-- Interactive Background Elements -->
            <view class="absolute top-20 left-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20 animate-float-slow"></view>
            <view class="absolute bottom-20 right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-float-slow-reverse"></view>
            
            <!-- Avatar with Wave Effect -->
            <view class="relative mb-6 z-10">
                <view class="absolute inset-0 bg-white/20 rounded-full animate-ping-slow"></view>
                <view class="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl relative z-10 opacity-0" :class="{ 'animate-fade-in-down': !loading && currentPage === 0 }">
                    <image :src="userInfo.avatar || '/static/images/default-avatar.png'" class="w-full h-full" mode="aspectFill" />
                </view>
            </view>

            <view class="text-white text-3xl font-bold mb-2 z-10 opacity-0" :class="{ 'animate-fade-in-up': !loading && currentPage === 0 }">{{ userInfo.nickname }}</view>
            <view class="text-indigo-200 text-lg mb-12 z-10 delay-200 opacity-0" :class="{ 'animate-fade-in-up': !loading && currentPage === 0 }">梯航小助手 · 2025 年度总结</view>
            
            <view class="text-white/60 text-sm mb-20 z-10 text-center leading-relaxed delay-300 opacity-0" :class="{ 'animate-fade-in-up': !loading && currentPage === 0 }">
                这一年<br/>
                我们一起见证了无数个日夜的奋斗<br/>
                让我们一起回顾这段旅程
            </view>

            <view class="absolute bottom-12 flex items-center gap-2 animate-pulse-slow z-10">
                <view class="flex items-center -space-x-4 opacity-80">
                    <view class="i-carbon-chevron-left text-4xl text-white animate-slide-left"></view>
                    <view class="i-carbon-chevron-left text-4xl text-white/60 animate-slide-left delay-100"></view>
                    <view class="i-carbon-chevron-left text-4xl text-white/30 animate-slide-left delay-200"></view>
                </view>
                <text class="text-xs tracking-widest ml-4 text-white/80">向左滑动开启</text>
            </view>
        </view>
      </swiper-item>

      <!-- Page 2: Join Date -->
      <swiper-item>
        <view 
          v-if="maxVisitedPage >= 1"
          class="h-full w-full flex flex-col justify-center bg-gradient-to-br from-blue-900 via-sky-900 to-slate-900 p-8 text-white relative overflow-hidden box-border"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
            <view class="absolute -right-20 -top-20 w-80 h-80 bg-blue-500 rounded-full blur-[100px] opacity-20 animate-pulse-slow"></view>

            <view class="text-2xl font-light mb-6 opacity-0" :class="{ 'animate-slide-in-right': currentPage === 1 }">故事开始于</view>
            <view class="text-4xl font-bold mb-8 delay-100 opacity-0" :class="{ 'animate-slide-in-right': currentPage === 1 }">{{ joinDate }}</view>
            
            <!-- Conditional Content based on Join Year -->
            <view v-if="isNewMember">
                <view class="text-lg opacity-0 mb-8 leading-relaxed delay-200" :class="{ 'animate-slide-in-right': currentPage === 1 }">
                    那是一个特别的日子<br/>
                    你与 <text class="text-yellow-400 font-bold text-2xl mx-1 inline-block animate-stamp">{{ stats.sameYearJoinCount }}</text> 位伙伴<br/>
                    一同开启了这段旅程
                </view>
                
                <view class="mt-8 text-xl delay-300 bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 opacity-0" :class="{ 'animate-zoom-in': currentPage === 1 }">
                    欢迎加入梯航大家庭<br/>
                    <view class="text-sm mt-4 text-gray-400">未来的日子，我们并肩同行</view>
                </view>
            </view>
            
            <view v-else>
                <view class="mt-8 text-xl delay-200 bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 opacity-0" :class="{ 'animate-zoom-in': currentPage === 1 }">
                    至今，我们已经相伴 <text class="text-sky-400 font-bold text-5xl mx-2 inline-block animate-count-up">{{ stats.joinDays }}</text> 天
                    <view class="text-sm mt-4 text-gray-400">共同度过了 {{ stats.yearsTogether }} 个春夏秋冬</view>
                </view>
            </view>
        </view>
      </swiper-item>

      <!-- Page 3: Attendance -->
      <swiper-item>
        <view 
          v-if="maxVisitedPage >= 2"
          class="h-full w-full flex flex-col justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-gray-900 p-8 text-white relative overflow-hidden box-border"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
            <view class="text-3xl font-bold mb-10 opacity-0" :class="{ 'animate-fade-in-down': currentPage === 2 }">勤奋的足迹</view>
            
            <view class="grid grid-cols-2 gap-4 mb-8">
                <!-- Total Hours -->
                <view class="bg-white/10 rounded-2xl p-4 backdrop-blur-md delay-100 hover:bg-white/20 transition-colors opacity-0" :class="{ 'animate-zoom-in': currentPage === 2 }">
                    <view class="text-sm text-emerald-200 mb-1">年度工时</view>
                    <view class="text-3xl font-bold">{{ stats.totalWorkingHours }} <text class="text-sm font-normal">h</text></view>
                </view>
                <!-- Longest Day -->
                <view class="bg-white/10 rounded-2xl p-4 backdrop-blur-md delay-200 hover:bg-white/20 transition-colors opacity-0" :class="{ 'animate-zoom-in': currentPage === 2 }">
                    <view class="text-sm text-emerald-200 mb-1">最长一天</view>
                    <view class="text-xl font-bold">{{ stats.longestWorkingDay }}</view>
                </view>
                <!-- Earliest In -->
                <view class="bg-white/10 rounded-2xl p-4 backdrop-blur-md delay-300 hover:bg-white/20 transition-colors opacity-0" :class="{ 'animate-zoom-in': currentPage === 2 }">
                    <view class="text-sm text-emerald-200 mb-1">最早上班</view>
                    <view class="text-3xl font-bold">{{ stats.firstClockIn }}</view>
                </view>
                <!-- Latest Out -->
                <view class="bg-white/10 rounded-2xl p-4 backdrop-blur-md delay-400 hover:bg-white/20 transition-colors opacity-0" :class="{ 'animate-zoom-in': currentPage === 2 }">
                    <view class="text-sm text-emerald-200 mb-1">最晚下班</view>
                    <view class="text-3xl font-bold">{{ stats.latestClockOut }}</view>
                </view>
            </view>

            <view class="mt-4 opacity-0 transition-all duration-500 rounded-2xl p-6 backdrop-blur-sm border-l-4 border-emerald-500 group relative overflow-hidden bg-white/10" 
                  :class="{ 'animate-slide-in-up delay-500': currentPage === 2 }">
                <view class="text-sm opacity-80 leading-relaxed">
                    这一年，你一共打卡 <text class="text-emerald-400 font-bold text-xl mx-1 animate-count-up inline-block">{{ stats.attendanceCount }}</text> 次。<br/>
                    每一个清晨的问候，<br/>
                    都是对梦想最长情的告白。
                </view>
            </view>
        </view>
      </swiper-item>

      <!-- Page 4: Work (OA) -->
      <swiper-item>
        <view 
          v-if="maxVisitedPage >= 3"
          class="h-full w-full flex flex-col justify-center bg-gradient-to-br from-orange-900 via-red-900 to-slate-900 p-8 text-white relative overflow-hidden box-border"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
            <view class="text-3xl font-bold mb-10 opacity-0" :class="{ 'animate-fade-in-down': currentPage === 3 }">高效的工作</view>
            
            <view class="relative h-48 w-full mb-8 flex items-center justify-center delay-100 opacity-0" :class="{ 'animate-zoom-in': currentPage === 3 }">
                 <!-- Animated Chart Bars -->
                 <view class="absolute bottom-0 left-10 w-16 bg-orange-500/80 rounded-t-lg transition-all duration-1000 ease-out" 
                       :style="{ height: currentPage === 3 ? '60%' : '0%' }">
                    <view class="absolute -top-6 w-full text-center text-sm" :class="{ 'opacity-100': currentPage === 3, 'opacity-0': currentPage !== 3 }">{{ stats.oaProcessInitiated }}</view>
                    <view class="absolute bottom-2 w-full text-center text-xs opacity-70">发起</view>
                 </view>
                 <view class="absolute bottom-0 right-10 w-16 bg-red-500/80 rounded-t-lg transition-all duration-1000 ease-out delay-200" 
                       :style="{ height: currentPage === 3 ? '90%' : '0%' }">
                    <view class="absolute -top-6 w-full text-center text-sm" :class="{ 'opacity-100': currentPage === 3, 'opacity-0': currentPage !== 3 }">{{ stats.oaTasksDone }}</view>
                    <view class="absolute bottom-2 w-full text-center text-xs opacity-70">处理</view>
                 </view>
                 <view class="absolute bottom-0 w-full h-px bg-white/20"></view>
            </view>
            
            <!-- Additional OA Stats -->
            <view class="grid grid-cols-2 gap-4 mb-6 delay-200 opacity-0" :class="{ 'animate-slide-in-up': currentPage === 3 }">
                <view class="bg-white/10 rounded-xl p-3 border border-white/10">
                    <view class="text-xs text-orange-200 mb-1">发起最多</view>
                    <view class="text-lg font-bold truncate">{{ stats.oaMostInitiatedProcess }}</view>
                </view>
                <view class="bg-white/10 rounded-xl p-3 border border-white/10">
                    <view class="text-xs text-orange-200 mb-1">平均耗时</view>
                    <view class="text-lg font-bold">{{ stats.oaAvgApprovalTime }}</view>
                </view>
            </view>

            <view class="rounded-2xl p-6 backdrop-blur-md delay-300 opacity-0 relative overflow-hidden transition-all duration-500" 
                  :class="[
                      currentPage === 3 ? 'animate-slide-in-up' : '',
                      showBusyMonth ? 'bg-white/10' : 'bg-white/5'
                  ]"
                  @click.stop="revealBusyMonth">
                
                <view v-if="!showBusyMonth" class="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <view class="flex flex-col items-center gap-2 animate-pulse">
                        <view class="i-carbon-touch-1 text-orange-400 text-3xl"></view>
                        <text class="text-xs text-orange-200">点击揭晓</text>
                    </view>
                </view>

                <view class="mb-4 transition-all duration-500" :class="{ 'blur-sm opacity-50': !showBusyMonth }">
                    <text class="text-orange-300 font-bold text-2xl mr-2" :class="{ 'animate-zoom-in': showBusyMonth }">{{ stats.mostBusyMonth }}</text>
                    <text class="text-sm opacity-80">是你最忙碌的一个月</text>
                </view>
                <view class="text-sm opacity-70 leading-relaxed transition-all duration-500" :class="{ 'blur-sm opacity-50': !showBusyMonth }">
                    流程流转之间，是你忙碌的身影。<br/>
                    每一个节点的完成，都凝聚着你的智慧。<br/>
                    你也因此成为了大家眼中的“效率担当”。
                </view>
            </view>
        </view>
      </swiper-item>

      <!-- Page 5: Articles & Learning -->
      <swiper-item>
        <view 
          v-if="maxVisitedPage >= 4"
          class="h-full w-full flex flex-col justify-center bg-gradient-to-br from-pink-900 via-rose-900 to-black p-8 text-white relative overflow-hidden box-border"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
            <view class="text-3xl font-bold mb-10 opacity-0" :class="{ 'animate-fade-in-down': currentPage === 4 }">知识的沉淀</view>
            
            <view class="flex flex-col items-center justify-center mb-12">
                <view class="relative animate-pulse-slow opacity-0" :class="{ 'animate-zoom-in': currentPage === 4 }">
                    <view class="w-48 h-48 rounded-full border border-pink-500/30 flex items-center justify-center">
                        <view class="w-36 h-36 rounded-full bg-gradient-to-tr from-pink-600 to-rose-600 flex flex-col items-center justify-center shadow-lg shadow-pink-900/50 hover:scale-110 transition-transform duration-500">
                            <view class="text-5xl font-bold">{{ stats.articlesPublished }}</view>
                            <view class="text-xs mt-1 opacity-80">篇创作</view>
                        </view>
                    </view>
                </view>
            </view>

            <view class="space-y-4 delay-200 opacity-0" :class="{ 'animate-slide-in-up': currentPage === 4 }">
                <!-- Popular Article Card -->
                <view class="bg-white/10 p-5 rounded-2xl border border-white/10 relative overflow-hidden backdrop-blur-md transition-transform active:scale-98"
                      @click.stop="handleLike">
                    
                    <!-- Floating Hearts Animation Container -->
                    <view v-if="showLikes" class="absolute inset-0 pointer-events-none overflow-hidden z-20">
                        <view class="absolute bottom-0 left-1/2 -translate-x-1/2 text-pink-500 animate-float-up opacity-0" style="animation-delay: 0s">❤️</view>
                        <view class="absolute bottom-0 left-1/3 text-pink-400 animate-float-up opacity-0" style="animation-delay: 0.2s">❤️</view>
                        <view class="absolute bottom-0 left-2/3 text-pink-600 animate-float-up opacity-0" style="animation-delay: 0.4s">❤️</view>
                    </view>

                    <view class="text-xs text-pink-300 mb-2 flex items-center gap-1">
                        <view class="i-carbon-trophy"></view>
                        年度最受欢迎文章
                    </view>
                    <view class="text-xl font-bold mb-4 line-clamp-2 leading-snug">{{ stats.mostPopularArticle }}</view>
                    
                    <view class="flex justify-between items-center text-sm text-white/70">
                        <view class="flex items-center gap-1">
                            <view class="i-carbon-view"></view>
                            <text>{{ stats.articleViews }}</text>
                        </view>
                        <view class="flex items-center gap-1" :class="{ 'text-pink-400 font-bold': showLikes }">
                            <view class="i-carbon-favorite" :class="{ 'animate-bounce': showLikes }"></view>
                            <text>{{ stats.articleLikes }}</text>
                        </view>
                        <view class="flex items-center gap-1">
                            <view class="i-carbon-chat"></view>
                            <text>{{ stats.articleComments }}</text>
                        </view>
                    </view>
                </view>
                
                <view class="text-center text-sm opacity-60 mt-8 px-4">
                    "分享是最好的学习"<br/>
                    你的每一次记录，都照亮了后来者的路。
                </view>
            </view>
        </view>
      </swiper-item>

      <!-- Page 6: OJ -->
      <swiper-item>
        <view 
          v-if="maxVisitedPage >= 5"
          class="h-full w-full flex flex-col justify-center bg-gradient-to-br from-cyan-900 via-blue-900 to-black p-8 text-white relative overflow-hidden box-border"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
            <!-- Matrix background effect placeholder -->
            <view class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#22d3ee 1px, transparent 1px); background-size: 20px 20px;"></view>

            <view class="text-3xl font-bold mb-8 z-10 opacity-0" :class="{ 'animate-fade-in-down': currentPage === 5 }">算法挑战</view>
            
            <view class="bg-gray-800/50 rounded-xl p-6 border border-gray-700 backdrop-blur-sm z-10 delay-100 opacity-0 relative overflow-hidden" 
                  :class="{ 'animate-zoom-in': currentPage === 5 }">
                
                <view class="flex justify-between items-end mb-6">
                    <view>
                        <view class="text-xs text-gray-400 mb-1">提交总数</view>
                        <view class="text-3xl font-mono text-cyan-400 animate-count-up">{{ stats.ojSubmissions }}</view>
                    </view>
                    <view class="text-right">
                        <view class="text-xs text-gray-400 mb-1">通过题目</view>
                        <view class="text-3xl font-mono text-blue-400 animate-count-up">{{ stats.ojProblemsPassed }}</view>
                    </view>
                </view>
                
                <view class="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                    <view class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-[2000ms] ease-out"
                          :style="{ width: currentPage === 5 ? '75%' : '0%' }"></view>
                </view>
                <view class="flex justify-between text-xs text-gray-500">
                    <text>Pass Rate: {{ stats.ojPassRate }}</text>
                    <text>Rank: {{ stats.ojCurrentRank }}</text>
                </view>
            </view>

            <!-- New Stats Section -->
            <view class="mt-6 space-y-3 z-10 delay-200 opacity-0" :class="{ 'animate-slide-in-up': currentPage === 5 }">
                
                <!-- Most Attempted -->
                <view class="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                    <view class="flex items-center gap-2">
                        <view class="i-carbon-warning-alt text-orange-400"></view>
                        <text class="text-sm">尝试最多</text>
                    </view>
                    <text class="font-bold text-orange-100 text-sm">{{ stats.ojMostAttempted }}</text>
                </view>

                <!-- Contest Stats Grid -->
                <view class="grid grid-cols-2 gap-3">
                    <view class="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                        <view class="text-xs text-gray-400 mb-1">参赛</view>
                        <view class="font-bold text-lg">{{ stats.ojContests }}</view>
                    </view>
                    <view class="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                        <view class="text-xs text-gray-400 mb-1">最高排名</view>
                        <view class="font-bold text-lg text-yellow-400">{{ stats.ojHighestRank }}</view>
                    </view>
                </view>

                <!-- Late Night Submission Story -->
                <view class="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 rounded-lg p-4 border border-cyan-500/20 relative overflow-hidden">
                    <view class="absolute right-2 top-2 i-carbon-moon text-yellow-100/20 text-4xl"></view>
                    <view class="text-sm text-cyan-200 mb-2 font-bold">星光不问赶路人</view>
                    <view class="text-xs text-gray-300 leading-relaxed">
                        <text class="text-cyan-400 font-bold">{{ stats.ojLateNightSubmission.date }}</text> 
                        凌晨 <text class="text-cyan-400 font-bold">{{ stats.ojLateNightSubmission.time }}</text>，<br/>
                        整个城市都在沉睡，<br/>
                        你还在挑战 <text class="text-white font-bold">《{{ stats.ojLateNightSubmission.problem }}》</text>。
                    </view>
                </view>
            </view>

            <view class="mt-12 text-xs font-mono text-gray-500 z-10 text-center animate-pulse-slow opacity-0 delay-500" :class="{ 'animate-fade-in-up': currentPage === 5 }">
                while(problem) { solve(); }
            </view>
        </view>
      </swiper-item>

      <!-- Page 7: Git -->
      <swiper-item>
        <view 
          v-if="maxVisitedPage >= 6"
          class="h-full w-full flex flex-col justify-center bg-gradient-to-br from-gray-900 via-neutral-900 to-black p-8 text-white relative overflow-hidden box-border"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
            <view class="text-3xl font-bold mb-8 z-10 opacity-0" :class="{ 'animate-fade-in-down': currentPage === 6 }">代码贡献</view>
            
            <!-- Git Stats Cards -->
            <view class="space-y-4 mb-6 delay-100 opacity-0 relative" :class="{ 'animate-zoom-in': currentPage === 6 }">
                
                <!-- Top Repo Card -->
                <view class="bg-gray-800/60 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                    <view>
                        <view class="text-xs text-gray-400 mb-1 animate-typewriter overflow-hidden whitespace-nowrap border-r-2 border-transparent w-0">Top Repository</view>
                        <view class="font-bold text-lg text-white truncate w-40">{{ stats.gitTopRepo }}</view>
                    </view>
                    <view class="text-right">
                        <view class="text-xs text-gray-400 mb-1">Commits</view>
                        <view class="font-mono text-xl text-green-400 animate-count-up">{{ stats.gitCommits }}</view>
                    </view>
                </view>

                <!-- Productivity Card -->
                <view class="bg-gray-800/60 rounded-2xl p-4 border border-white/10 grid grid-cols-2 divide-x divide-white/10">
                    <view class="px-2 text-center">
                        <view class="text-xs text-gray-400 mb-1">Most Productive</view>
                        <view class="font-bold text-lg text-yellow-400">{{ stats.gitMostProductiveDay }}</view>
                    </view>
                    <view class="px-2 text-center">
                        <view class="text-xs text-gray-400 mb-1">Peak Time</view>
                        <view class="font-bold text-lg text-purple-400">{{ stats.gitPeakTime }}</view>
                    </view>
                </view>
            </view>

            <!-- Code Frequency & Activity -->
            <view class="bg-black/40 rounded-2xl p-5 border border-white/5 delay-200 opacity-0" :class="{ 'animate-slide-in-up': currentPage === 6 }">
                <view class="flex items-center justify-between mb-6 text-sm">
                    <view class="flex gap-4">
                        <text class="text-green-400 font-mono">+{{ stats.gitAdditions }}</text>
                        <text class="text-red-400 font-mono">-{{ stats.gitDeletions }}</text>
                    </view>
                    <text class="text-gray-500">{{ stats.gitActiveDays }} Active Days</text>
                </view>

                <!-- Contribution Graph Mock (Grid) -->
                <view class="text-xs text-gray-500 mb-2">Contribution Graph</view>
                <view class="flex flex-wrap gap-1 justify-center opacity-80">
                    <view v-for="i in 52" :key="i" 
                          class="w-3 h-3 rounded-sm transition-opacity hover:opacity-100"
                          :class="{ 'animate-pulse-slow': i % 7 === 0 }"
                          :style="{ 
                              backgroundColor: Math.random() > 0.7 ? '#166534' : (Math.random() > 0.4 ? '#15803d' : '#22c55e'),
                              opacity: Math.random() * 0.5 + 0.3,
                              animationDelay: i * 20 + 'ms'
                          }"
                    ></view>
                </view>
            </view>

            <view class="mt-12 text-xs font-mono text-gray-600 z-10 text-center opacity-0 delay-500" :class="{ 'animate-typewriter': currentPage === 6 }">
                > git push origin dream
            </view>
        </view>
      </swiper-item>

      <!-- Page 8: Summary & Keyword -->
      <swiper-item>
        <view 
          v-if="maxVisitedPage >= 7"
          class="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-900 via-fuchsia-900 to-black p-8 text-white relative overflow-hidden box-border"
          :style="{ paddingTop: `${statusBarHeight}px`, paddingBottom: `${safeAreaBottom + 20}px` }"
        >
            <view class="absolute top-10 right-10 opacity-10 text-9xl font-black rotate-12">2025</view>
            
            <view class="text-xl mb-8 opacity-0" :class="{ 'animate-fade-in-down': currentPage === 7 }">你的年度关键词</view>
            
            <view class="relative mb-12 delay-200 opacity-0" :class="{ 'animate-zoom-in': currentPage === 7 }">
                <view class="absolute inset-0 bg-fuchsia-500 blur-[60px] opacity-40 rounded-full animate-pulse-slow"></view>
                <view class="text-6xl font-black relative z-10 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-fuchsia-200 scale-100 hover:scale-110 transition-transform duration-300" style="-webkit-background-clip: text;">
                    {{ stats.keyword }}
                </view>
            </view>
            
            <!-- Hexagon Ability Chart Placeholder (CSS) -->
            <view class="opacity-0 delay-300" :class="{ 'animate-zoom-in': currentPage === 7 }">
                <view class="relative w-40 h-40 mb-8 animate-spin-slow opacity-30">
                     <view class="absolute inset-0 border-2 border-white/30 rotate-0"></view>
                     <view class="absolute inset-0 border-2 border-white/30 rotate-60"></view>
                     <view class="absolute inset-0 border-2 border-white/30 rotate-120"></view>
                </view>
            </view>
            
            <view class="bg-white/10 rounded-2xl p-6 w-full backdrop-blur-md mb-8 border border-white/10 delay-300 opacity-0" :class="{ 'animate-slide-in-up': currentPage === 7 }">
                <view class="flex justify-between mb-3 border-b border-white/10 pb-2">
                    <text class="opacity-70 text-sm">入职天数</text>
                    <text class="font-bold">{{ stats.joinDays }} 天</text>
                </view>
                <view class="flex justify-between mb-3 border-b border-white/10 pb-2">
                    <text class="opacity-70 text-sm">通过题目</text>
                    <text class="font-bold">{{ stats.ojProblemsPassed }} 个</text>
                </view>
                <view class="flex justify-between">
                    <text class="opacity-70 text-sm">Git Commits</text>
                    <text class="font-bold">{{ stats.gitCommits }} 次</text>
                </view>
            </view>

            <button 
                class="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold py-4 rounded-full shadow-lg shadow-violet-900/50 active:scale-95 transition-transform delay-500 opacity-0"
                :class="{ 'animate-bounce-in': currentPage === 7 }"
                @click.stop="goBack"
            >
                开启 2026 新篇章
            </button>
        </view>
      </swiper-item>

    </swiper>


  </view>
</template>

<style scoped>
/* Custom Animations */
@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}
.animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
@keyframes fade-in-down {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes count-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-count-up { animation: count-up 0.5s ease-out forwards; }
@keyframes slide-in-right {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
}
@keyframes slide-in-up {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes zoom-in {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}
@keyframes pulse-slow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
}
@keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
@keyframes float-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}
@keyframes float-slow-reverse {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(10px); }
}
@keyframes ping-slow {
    0% { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(1.5); opacity: 0; }
}
@keyframes bounce-in {
    0% { opacity: 0; transform: scale(0.3); }
    50% { opacity: 1; transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); }
}
@keyframes bounce-x {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(10px); }
}

.animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
.animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
.animate-slide-in-right { animation: slide-in-right 0.8s ease-out forwards; }
.animate-slide-in-up { animation: slide-in-up 0.8s ease-out forwards; }
.animate-zoom-in { animation: zoom-in 0.6s ease-out forwards; }
.animate-pulse-slow { animation: pulse-slow 3s infinite ease-in-out; }
.animate-spin-slow { animation: spin-slow 20s linear infinite; }
.animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
.animate-float-slow-reverse { animation: float-slow-reverse 5s ease-in-out infinite; }
.animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
.animate-bounce-in { animation: bounce-in 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards; }
.animate-bounce-x { animation: bounce-x 1s infinite ease-in-out; }

@keyframes slide-left {
    0% { opacity: 0; transform: translateX(10px); }
    50% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(-10px); }
}
.animate-slide-left { animation: slide-left 1.5s infinite; }
@keyframes stamp {
    0% { opacity: 0; transform: scale(3); }
    80% { opacity: 1; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
}
@keyframes float-up {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
}
@keyframes typewriter {
    from { width: 0; }
    to { width: 100%; }
}

.animate-stamp { animation: stamp 0.5s cubic-bezier(0.6, 0.04, 0.98, 0.335) forwards; animation-delay: 0.5s; opacity: 0; }
.animate-float-up { animation: float-up 1s ease-out forwards; }
.animate-typewriter { animation: typewriter 2s steps(20) forwards; animation-delay: 0.5s; }

.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-500 { animation-delay: 500ms; }
.delay-700 { animation-delay: 700ms; }
</style>

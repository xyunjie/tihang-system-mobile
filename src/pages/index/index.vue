<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page -->
<route lang="jsonc" type="home">
{
  "layout": "tabbar",
  "style": {
    // 'custom' 表示开启自定义导航栏，默认 'default'
    "navigationStyle": "default",
    "navigationBarTitleText": "梯航小助手",
    "enablePullDownRefresh": true
  }
}
</route>

<script lang="ts" setup>
import type { ArticleSearchRespVO } from '@/api/types/article'
import type { NoticeRespVO } from '@/api/types/notice'
import type { NotifyMessageRespVO } from '@/api/types/notify-message'
import { computed } from 'vue'
import { getArticlePage } from '@/api/article'
import { getTodayAttendanceRecord } from '@/api/attendance'
import { getNoticePage } from '@/api/notice'
import { getMyNotifyMessagePage, getUnreadCount } from '@/api/notify-message'
import ThemeCard from '@/components/ThemeCard.vue'
import { getAttendanceBadgeBgClass } from '@/config/attendance'
import { WECHAT_SHARE_IMAGE_URL } from '@/config/share'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'
import { formatDateOnly, formatRelativeTime, formatStandardDateTime, formatTimeOnly, parseDateTime } from '@/utils'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

defineOptions({
  name: 'Home',
})

// 主题适配：浅色/深色
const appStore = useAppStore()
const userStore = useUserStore()
const isDark = computed(() => appStore.theme === 'dark')

// 问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6)
    return '夜深了'
  if (hour < 9)
    return '早上好'
  if (hour < 12)
    return '上午好'
  if (hour < 14)
    return '中午好'
  if (hour < 17)
    return '下午好'
  if (hour < 19)
    return '傍晚好'
  return '晚上好'
})

// 当前日期
const currentDate = computed(() => {
  dayjs.locale('zh-cn')
  return dayjs().format('MM月DD日 dddd')
})

// 底部覆盖层背景
const homeBottomStyle = computed(() => ({
  background: isDark.value
    ? 'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(15,23,42,0.85) 70%)'
    : 'linear-gradient(180deg, rgba(241,245,249,1) 0%, rgba(241,245,249,0.85) 70%)',
}))

const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))
const borderMutedClass = computed(() => (isDark.value ? 'border-white/10' : 'border-gray-100'))
const activeRowBgClass = computed(() => (isDark.value ? 'active:bg-white/5' : 'active:bg-gray-50'))
const subTileBgClass = computed(() => (isDark.value ? 'bg-white/6 border border-white/8' : 'bg-slate-50 border border-slate-100'))

// 骨架屏颜色
const skBaseClass = computed(() => (isDark.value ? 'bg-white/10' : 'bg-gray-200'))

// 今日考勤信息
const todayAttendance = reactive({
  date: formatDateOnly(Date.now()),
  clockInTime: '--:--',
  clockOutTime: '--:--',
  workDuration: '暂无数据',
  attendanceStatus: '暂无数据',
  location: '暂无位置信息',
  loading: false,
  result: 0,
})

// 通知公告
const notificationList = ref<NoticeRespVO[]>([])
const notificationLoading = ref(false)

// 消息提醒
const messageList = ref<NotifyMessageRespVO[]>([])
const messageLoading = ref(false)
const unreadCount = ref(0)

// 文章列表
const articleList = ref<ArticleSearchRespVO[]>([])
const articleLoading = ref(false)

// 页面加载状态
const pageLoading = ref(true)
const isRefreshing = ref(false)
const systemUserInfo = ref<any>({})

onLoad(() => {
  pageLoading.value = true
  // 初始化系统用户信息
  const info = uni.getStorageSync('systemUserInfo')
  if (info) systemUserInfo.value = info
  
  Promise.allSettled([
    loadTodayAttendance(),
    loadNotificationList(),
    loadMessageList(),
    loadUnreadCount(),
    loadArticleList(),
  ]).finally(() => {
    pageLoading.value = false
  })
})

onShow(() => {
  loadUnreadCount()
  loadMessageList()
  setPageBackgroundColor()
  // 每次显示时更新用户信息
  const info = uni.getStorageSync('systemUserInfo')
  if (info) systemUserInfo.value = info
})

// #ifdef MP-WEIXIN
onShareAppMessage(() => ({
  title: '梯航小助手',
  path: '/pages/index/index',
  imageUrl: WECHAT_SHARE_IMAGE_URL,
}))

onShareTimeline(() => ({
  title: '梯航小助手',
  query: '',
  imageUrl: WECHAT_SHARE_IMAGE_URL,
}))
// #endif

// 下拉刷新
async function handlePullDownRefresh() {
  if (isRefreshing.value) {
    uni.stopPullDownRefresh()
    return
  }
  isRefreshing.value = true
  try {
    await Promise.all([
      loadTodayAttendance(),
      loadNotificationList(),
      loadMessageList(),
      loadUnreadCount(),
      loadArticleList(),
    ])
    uni.showToast({ title: '刷新成功', icon: 'success', duration: 1000 })
  }
  catch (error) {
    uni.showToast({ title: '刷新失败', icon: 'none', duration: 2000 })
  }
  finally {
    uni.stopPullDownRefresh()
    setTimeout(() => { isRefreshing.value = false }, 1000)
  }
}

onPullDownRefresh(handlePullDownRefresh)

// 加载数据逻辑
async function loadTodayAttendance() {
  try {
    todayAttendance.loading = true
    const response = await getTodayAttendanceRecord()
    if (response.code === 0 && response.data) {
      const { onDuty, offDuty, result } = response.data
      if (onDuty)
        todayAttendance.clockInTime = formatAttendanceTime(onDuty.recognizeTime)
      if (offDuty)
        todayAttendance.clockOutTime = formatAttendanceTime(offDuty.recognizeTime)
      
      if (onDuty && offDuty) {
        todayAttendance.workDuration = calculateWorkDuration(onDuty.recognizeTime, offDuty.recognizeTime)
      }
      else if (onDuty) {
        todayAttendance.workDuration = calculateCurrentWorkDuration(onDuty.recognizeTime)
      }

      todayAttendance.attendanceStatus = getAttendanceStatusText(result)
      todayAttendance.result = result
      if (onDuty?.deviceSn) {
        todayAttendance.location = `设备: ${onDuty.deviceSn}`
      }
    } else {
       todayAttendance.attendanceStatus = '暂无数据'
       todayAttendance.result = 0
    }
  }
  catch (error) {
    console.error('加载考勤数据错误:', error)
  }
  finally {
    todayAttendance.loading = false
  }
}

// 辅助函数保持不变
function formatAttendanceTime(dateTimeStr: string | number): string {
  if (!dateTimeStr) return '--:--'
  return formatTimeOnly(dateTimeStr) || '--:--'
}

function calculateWorkDuration(startTime: string | number, endTime: string | number): string {
  try {
    const start = parseDateTime(startTime)
    const end = parseDateTime(endTime)
    if (!start || !end) return '--'
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}小时${diffMinutes}分钟`
  } catch { return '--' }
}

function calculateCurrentWorkDuration(startTime: string | number): string {
  try {
    const start = parseDateTime(startTime)
    if (!start) return '--'
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}小时${diffMinutes}分钟`
  } catch { return '--' }
}

function getAttendanceStatusText(result: number): string {
  const map: Record<number, string> = { 1: '正常', 2: '迟到', 3: '早退', 4: '缺卡', 5: '请假', 6: '缺勤' }
  return map[result] || '暂无数据'
}

function getAttendanceStatusColorClass(result: number): string {
  const map: Record<number, string> = {
    1: 'text-green-500 bg-green-50 border-green-200',
    2: 'text-orange-500 bg-orange-50 border-orange-200',
    3: 'text-orange-500 bg-orange-50 border-orange-200',
    4: 'text-red-500 bg-red-50 border-red-200',
    5: 'text-blue-500 bg-blue-50 border-blue-200',
    6: 'text-red-500 bg-red-50 border-red-200',
  }
  if (isDark.value) {
     const darkMap: Record<number, string> = {
        1: 'text-green-400 bg-green-500/10 border-green-500/20',
        2: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        3: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        4: 'text-red-400 bg-red-500/10 border-red-500/20',
        5: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        6: 'text-red-400 bg-red-500/10 border-red-500/20',
     }
     return darkMap[result] || 'text-gray-400 bg-white/5 border-white/10'
  }
  return map[result] || 'text-gray-500 bg-gray-50 border-gray-200'
}

async function loadNotificationList() {
  try {
    notificationLoading.value = true
    const response = await getNoticePage({ pageNo: 1, pageSize: 3, status: 0 })
    if (response.code === 0 && response.data) notificationList.value = response.data.list
  } finally { notificationLoading.value = false }
}

function formatNotificationTime(createTime: string | number): string {
  return createTime ? formatStandardDateTime(createTime) : ''
}

function getNotificationTypeText(type: number): string {
  return { 1: '通知', 2: '公告' }[type] || '消息'
}

function getNotificationTypeColor(type: number): string {
  if (isDark.value) {
    return {
      1: 'text-blue-400 bg-blue-500/10',
      2: 'text-red-400 bg-red-500/10',
    }[type] || 'text-gray-400 bg-white/5'
  }
  return {
    1: 'text-blue-600 bg-blue-50',
    2: 'text-red-600 bg-red-50',
  }[type] || 'text-gray-600 bg-gray-50'
}

function getPlainTextContent(htmlContent: string): string {
  if (!htmlContent) return ''
  return htmlContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

async function loadMessageList() {
  try {
    messageLoading.value = true
    const response = await getMyNotifyMessagePage({ pageNo: 1, pageSize: 3 })
    if (response.code === 0 && response.data) messageList.value = response.data.list
  } finally { messageLoading.value = false }
}

async function loadUnreadCount() {
  try {
    const response = await getUnreadCount()
    if (response.code === 0 && typeof response.data === 'number') unreadCount.value = response.data
  } catch (error) { console.error(error) }
}

function formatMessageTime(createTime: string | number): string {
  return createTime ? formatRelativeTime(createTime) : ''
}

function navigateTo(route: string) {
  const NAV_DEBOUNCE_MS = 800
  ;(navigateTo as any)._lastTs = (navigateTo as any)._lastTs ?? 0
  const now = Date.now()
  if (now - (navigateTo as any)._lastTs < NAV_DEBOUNCE_MS) return
  ;(navigateTo as any)._lastTs = now
  if (route) uni.navigateTo({ url: route, fail: () => uni.showToast({ title: '跳转失败', icon: 'none' }) })
}

function formatTimeDisplay(time: string) {
  return time === '--:--' ? '--:--' : time
}

async function loadArticleList() {
  try {
    articleLoading.value = true
    const response = await getArticlePage({ pageNo: 1, pageSize: 5 })
    if (response.code === 0 && response.data) articleList.value = response.data.list
  } catch { articleList.value = [] }
  finally { articleLoading.value = false }
}

function formatArticleTime(createTime: string | number): string {
  return createTime ? formatStandardDateTime(createTime) : ''
}

function formatCount(count: number) {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString()
}

// 动态设置背景色，防止下拉露出不同底色
function setPageBackgroundColor() {
  const bgColor = isDark.value ? '#020617' : '#f5f7fa'
  uni.setBackgroundColor({
    backgroundColor: bgColor,
    backgroundColorTop: bgColor,
    backgroundColorBottom: bgColor,
  })
}

// 监听主题变化
watch(() => isDark.value, () => {
  setPageBackgroundColor()
})
</script>

<template>
  <view class="relative min-h-screen bg-[#f5f7fa] dark:bg-slate-950">
    <!-- 顶部背景 -->
    <view class="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#2563eb] to-[#3b82f6] rounded-b-[2.5rem] shadow-sm z-0" />

    <!-- 头部区域 -->
    <view class="relative z-10 pt-14 px-5 pb-8 text-white">
      <view class="flex justify-between items-start mb-4">
        <view>
          <view class="text-2xl font-bold mb-1 opacity-95 tracking-wide text-shadow-sm">
            {{ greeting }}，{{ systemUserInfo.nickname || userStore.userInfo.username || '用户' }}
          </view>
          <view class="text-sm opacity-85 font-medium tracking-wide">
            {{ currentDate }}
          </view>
        </view>
        <view class="relative p-2.5 bg-white/15 rounded-full backdrop-blur-md border border-white/10 active:bg-white/25 transition-all shadow-sm" @click="navigateTo('/pages-sub/message/index')">
          <view v-if="unreadCount > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-500 z-10" />
          <wd-icon name="chat" size="22px" color="#fff" />
        </view>
      </view>
    </view>

    <!-- 核心考勤卡片 -->
    <view class="relative z-10 px-4 -mt-6">
      <ThemeCard card-class="mb-6 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] dark:shadow-blue-900/20 overflow-hidden border-0" :padding="false" @click="navigateTo('/pages-sub/attendance/record')">
        <view class="flex items-stretch min-h-28">
          <!-- 左侧状态指示条 -->
          <view class="w-1.5" :class="todayAttendance.result === 1 ? 'bg-emerald-500' : (todayAttendance.result > 1 ? 'bg-orange-500' : 'bg-slate-300')" />
          
          <view class="flex-1 p-5 bg-white dark:bg-slate-800">
            <view class="flex justify-between items-center mb-6">
              <view class="flex items-center gap-2">
                <view class="text-lg font-bold" :class="textPrimaryClass">今日考勤</view>
                <view 
                  class="px-2 py-0.5 text-xs rounded border"
                  :class="getAttendanceStatusColorClass(todayAttendance.result)"
                >
                  {{ todayAttendance.attendanceStatus }}
                </view>
              </view>
              <view class="flex items-center text-xs" :class="textSecondaryClass">
                <wd-icon name="time" size="14px" class="mr-1 opacity-80" />
                工时: {{ todayAttendance.workDuration }}
              </view>
            </view>

            <view class="flex justify-between items-center">
              <view class="flex-1">
                <view class="text-xs mb-1.5 font-medium opacity-70" :class="textMutedClass">上班打卡</view>
                <view class="text-xl font-bold font-mono tracking-tight" :class="todayAttendance.clockInTime !== '--:--' ? (isDark ? 'text-white' : 'text-slate-800') : textMutedClass">
                  {{ todayAttendance.clockInTime }}
                </view>
              </view>
              
              <view class="mx-6 h-8 w-[1px] bg-slate-100 dark:bg-slate-700" />

              <view class="flex-1 text-right">
                <view class="text-xs mb-1.5 font-medium opacity-70" :class="textMutedClass">下班打卡</view>
                <view class="text-xl font-bold font-mono tracking-tight" :class="todayAttendance.clockOutTime !== '--:--' ? (isDark ? 'text-white' : 'text-slate-800') : textMutedClass">
                  {{ todayAttendance.clockOutTime }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </ThemeCard>
    </view>

    <!-- 主要内容区 -->
    <view class="px-4 pb-24 space-y-6">
      
      <!-- 通知与公告 -->
      <view>
        <view class="flex justify-between items-center mb-3 px-1">
          <view class="text-base font-bold tracking-tight" :class="textPrimaryClass">通知公告</view>
          <view class="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center active:opacity-70 transition-opacity" @click="navigateTo('/pages-sub/notification/index')">
            全部 <wd-icon name="arrow-right" size="12px" class="ml-0.5" />
          </view>
        </view>
        
        <ThemeCard :padding="false" card-class="shadow-sm border border-slate-100 dark:border-slate-800">
          <view v-if="notificationList.length > 0">
            <view 
              v-for="(item, index) in notificationList.slice(0, 3)" 
              :key="item.id"
              class="relative p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
              :class="{'border-b border-slate-100 dark:border-slate-800': index < 2}"
              @click="navigateTo(`/pages-sub/notification/detail?id=${item.id}`)"
            >
              <view class="flex justify-between items-start gap-3">
                <view class="flex-1 min-w-0">
                  <view class="flex items-center gap-2 mb-1.5">
                    <view class="px-1.5 py-0.5 text-[10px] font-medium rounded leading-none flex-shrink-0" :class="getNotificationTypeColor(item.type)">
                      {{ getNotificationTypeText(item.type) }}
                    </view>
                    <view class="text-sm font-medium truncate" :class="textPrimaryClass">
                      {{ item.title }}
                    </view>
                  </view>
                  <view class="text-xs line-clamp-1 opacity-70" :class="textSecondaryClass">
                    {{ getPlainTextContent(item.content) }}
                  </view>
                </view>
                <view class="text-[10px] font-medium flex-shrink-0 mt-0.5 opacity-50" :class="textMutedClass">
                  {{ formatNotificationTime(item.createTime).split(' ')[0] }}
                </view>
              </view>
            </view>
          </view>
          <view v-else class="py-10 flex flex-col items-center justify-center opacity-40">
            <wd-icon name="info-circle" size="28px" class="mb-2" color="#94a3b8" />
            <view class="text-xs text-slate-400 font-medium">暂无通知公告</view>
          </view>
        </ThemeCard>
      </view>

      <!-- 最新资讯 -->
      <view>
        <view class="flex justify-between items-center mb-3 px-1">
          <view class="text-base font-bold tracking-tight" :class="textPrimaryClass">最新资讯</view>
          <view class="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center active:opacity-70 transition-opacity" @click="navigateTo('/pages-sub/article/index')">
            全部 <wd-icon name="arrow-right" size="12px" class="ml-0.5" />
          </view>
        </view>

        <view class="space-y-3">
          <ThemeCard 
            v-for="article in articleList.slice(0, 5)" 
            :key="article.id"
            :padding="false"
            card-class="shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.99] transition-transform duration-200"
            @click="navigateTo(`/pages-sub/article/detail?id=${article.id}`)"
          >
            <view class="p-4 flex gap-4 bg-white dark:bg-slate-800 rounded-2xl">
               <view class="flex-1 flex flex-col justify-between min-h-[4.5rem]">
                 <view class="text-sm font-medium line-clamp-2 leading-relaxed tracking-wide" :class="textPrimaryClass">
                   {{ article.title }}
                 </view>
                 
                 <view class="flex justify-between items-center mt-3 text-xs" :class="textMutedClass">
                   <view class="flex items-center gap-2 opacity-80">
                     <text class="font-medium">{{ article.authorName }}</text>
                     <text class="opacity-30">|</text>
                     <text>{{ formatArticleTime(article.createTime).split(' ')[0] }}</text>
                   </view>
                   <view class="flex items-center gap-1 opacity-60">
                     <wd-icon name="view" size="14px" />
                     <text>{{ formatCount(article.browse) }}</text>
                   </view>
                 </view>
               </view>
            </view>
          </ThemeCard>
          
          <view v-if="articleList.length === 0 && !articleLoading" class="py-12 text-center opacity-40">
             <view class="text-sm text-slate-400 font-medium">暂无最新文章</view>
          </view>
        </view>
      </view>

    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
  -webkit-appearance: none;
  background: transparent;
}
</style>

<style>
/* 强制覆盖 page 背景色，解决 H5 端下拉露底问题 */
page {
  background-color: #f5f7fa;
}
.dark page {
  background-color: #020617;
}
</style>

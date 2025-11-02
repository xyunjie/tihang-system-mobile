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
import { WECHAT_SHARE_IMAGE_URL } from '@/config/share'
import { useAppStore } from '@/store/app'
import { formatDateOnly, formatRelativeTime, formatStandardDateTime, formatTimeOnly, parseDateTime } from '@/utils'

defineOptions({
  name: 'Home',
})

// 主题适配：浅色/深色
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
// 底部覆盖层背景，叠在占位符之上但在 TabBar 之下
const homeBottomStyle = computed(() => ({
  background: isDark.value
    ? 'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(15,23,42,0.85) 70%)'
    : 'linear-gradient(180deg, rgba(238,242,247,1) 0%, rgba(238,242,247,0.85) 70%)',
}))
// 增强卡片边界与阴影，避免与背景融为一体
const cardBgClass = computed(() =>
  isDark.value
    ? 'bg-[#0b1220] border border-white/15 shadow-lg'
    : 'bg-white border border-gray-100 shadow-md',
)
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-gray-400'))
const borderMutedClass = computed(() => (isDark.value ? 'border-white/10' : 'border-gray-100'))
const activeRowBgClass = computed(() => (isDark.value ? 'active:bg-white/5' : 'active:bg-gray-50'))
const subTileBgClass = computed(() => (isDark.value ? 'bg-white/6 border border-white/8' : 'bg-gray-50 border border-gray-100'))

// 骨架屏颜色（主题感知）
const skBaseClass = computed(() => (isDark.value ? 'bg-white/15' : 'bg-gray-200'))
const skStrongClass = computed(() => (isDark.value ? 'bg-white/20' : 'bg-gray-300'))
const skBorderClass = computed(() => (isDark.value ? 'border-white/10' : 'border-gray-100'))

// 中性小图标背景（主题感知）
const iconMutedBgClass = computed(() => (isDark.value ? 'bg-white/35' : 'bg-gray-400'))
// 强调型图标容器背景（通知列表左侧图标容器）
const iconAccentContainerClass = computed(() => (isDark.value ? 'bg-blue-500/12' : 'bg-blue-100'))

// 今日考勤信息（考勤机自动记录）
const todayAttendance = reactive({
  date: formatDateOnly(Date.now()),
  clockInTime: '--:--',
  clockOutTime: '--:--',
  workDuration: '暂无数据',
  attendanceStatus: '暨无记录',
  location: '考勤机：暂无数据',
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

// 下拉刷新状态
const isRefreshing = ref(false)

// 测试 uni API 自动引入
onLoad(() => {
  // 设置页面加载状态
  pageLoading.value = true

  // 加载今日考勤数据
  loadTodayAttendance()
  // 加载通知公告数据
  loadNotificationList()
  // 加载文章列表数据
  loadArticleList()

  // 所有数据加载完成后取消页面加载状态
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
  // 加载消息提醒数据
  loadMessageList()
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

// 下拉刷新处理
async function handlePullDownRefresh() {
  if (isRefreshing.value) {
    uni.stopPullDownRefresh()
    return
  }
  isRefreshing.value = true

  try {
    // 重新加载所有数据
    await Promise.all([
      loadTodayAttendance(),
      loadNotificationList(),
      loadMessageList(),
      loadUnreadCount(),
      loadArticleList(),
    ])

    uni.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1000,
    })
  }
  catch (error) {
    uni.showToast({
      title: '刷新失败，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    // 停止下拉刷新
    uni.stopPullDownRefresh()

    // 延迟1秒重置防护状态，避免频繁误触
    setTimeout(() => {
      isRefreshing.value = false
    }, 1000)
  }
}

// 页面下拉刷新
onPullDownRefresh(() => {
  handlePullDownRefresh()
})

// 加载今日考勤数据
async function loadTodayAttendance() {
  try {
    todayAttendance.loading = true

    const response = await getTodayAttendanceRecord()
    if (response.code === 0 && response.data) {
      const { onDuty, offDuty, result } = response.data
      // 处理上班打卡
      if (onDuty) {
        todayAttendance.clockInTime = formatAttendanceTime(onDuty.recognizeTime)
      }

      // 处理下班打卡
      if (offDuty) {
        todayAttendance.clockOutTime = formatAttendanceTime(offDuty.recognizeTime)
      }
      // 计算工作时长
      if (onDuty && offDuty) {
        todayAttendance.workDuration = calculateWorkDuration(onDuty.recognizeTime, offDuty.recognizeTime)
      }
      else if (onDuty) {
        todayAttendance.workDuration = calculateCurrentWorkDuration(onDuty.recognizeTime)
      }

      // 设置考勤状态
      todayAttendance.attendanceStatus = getAttendanceStatusText(result)
      // 保存result值用于背景样式
      todayAttendance.result = result

      // 设置设备信息
      if (onDuty?.deviceSn) {
        todayAttendance.location = `考勤机: ${onDuty.deviceSn}`
      }
    }
    else {
      todayAttendance.attendanceStatus = '未打卡'

      uni.showToast({
        title: response.msg || '获取考勤信息失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('加载考勤数据错误:', error) // 改进错误日志
    todayAttendance.attendanceStatus = '加载失败'

    uni.showToast({
      title: '获取考勤信息失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    todayAttendance.loading = false
  }
}

// 格式化考勤时间
function formatAttendanceTime(dateTimeStr: string | number): string {
  if (!dateTimeStr)
    return '--:--'

  const result = formatTimeOnly(dateTimeStr)
  return result || '--:--'
}

// 计算工作时长
function calculateWorkDuration(startTime: string | number, endTime: string | number): string {
  try {
    const start = parseDateTime(startTime)
    const end = parseDateTime(endTime)

    if (!start || !end) {
      console.error('无法解析工作时间:', { startTime, endTime })
      return '--'
    }

    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHours}小时${diffMinutes}分钟`
  }
  catch (error) {
    console.error('计算工作时长错误:', error)
    return '--'
  }
}

// 计算当前工作时长
function calculateCurrentWorkDuration(startTime: string | number): string {
  try {
    const start = parseDateTime(startTime)

    if (!start) {
      console.error('无法解析开始时间:', startTime)
      return '--'
    }

    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHours}小时${diffMinutes}分钟`
  }
  catch (error) {
    console.error('计算当前工作时长错误:', error)
    return '--'
  }
}

// 获取考勤状态文本
function getAttendanceStatusText(result: number): string {
  // 1正常，2迟到，3早退，4缺卡，5请假，6缺勤
  switch (result) {
    case 1:
      return '考勤正常'
    case 2:
      return '迟到'
    case 3:
      return '早退'
    case 4:
      return '缺卡'
    case 5:
      return '请假'
    case 6:
      return '缺勤'
    default:
      return '暂无数据'
  }
}

// 获取考勤状态文本背景样式
function getAttendanceStatusTextBackground(result: number): string {
  // 根据不同考勤结果返回状态文本的背景颜色
  switch (result) {
    case 1:
      // 正常 - 绿色背景
      return 'bg-green-600/80'
    case 2:
      // 迟到 - 橙色背景
      return 'bg-orange-600/80'
    case 3:
      // 早退 - 黄色背景
      return 'bg-yellow-600/80'
    case 4:
      // 缺卡 - 红色背景
      return 'bg-red-600/80'
    case 5:
      // 请假 - 紫色背景
      return 'bg-purple-600/80'
    case 6:
      // 缺勤 - 灰色背景
      return 'bg-gray-600/80'
    default:
      // 默认 - 白色半透明背景
      return 'bg-white/20'
  }
}

// 获取考勤结果的数值，用于背景样式判断
function getAttendanceResultValue(): number {
  // 优先使用保存的result值
  if (todayAttendance.result > 0) {
    return todayAttendance.result
  }

  // 如果没有result值，根据状态文本反推
  if (todayAttendance.attendanceStatus !== '暨无记录' && todayAttendance.attendanceStatus !== '加载失败') {
    switch (todayAttendance.attendanceStatus) {
      case '考勤正常': return 1
      case '迟到': return 2
      case '早退': return 3
      case '缺卡': return 4
      case '请假': return 5
      case '缺勤': return 6
      default: return 0
    }
  }
  return 0
}

// 加载通知公告数据
async function loadNotificationList() {
  try {
    notificationLoading.value = true

    const response = await getNoticePage({
      pageNo: 1,
      pageSize: 3, // 首页只显示3条
      status: 0, // 只显示启用的通知
    })

    if (response.code === 0 && response.data) {
      notificationList.value = response.data.list
    }
    else {
      uni.showToast({
        title: response.msg || '获取通知公告失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    uni.showToast({
      title: '获取通知公告失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    notificationLoading.value = false
  }
}

// 格式化通知公告时间
function formatNotificationTime(createTime: string | number): string {
  if (!createTime)
    return ''

  return formatStandardDateTime(createTime)
}

// 获取通知类型文本
function getNotificationTypeText(type: number): string {
  switch (type) {
    case 1: return '系统通知'
    case 2: return '系统公告'
    default: return '通知'
  }
}

// 获取通知类型颜色
function getNotificationTypeColor(type: number): string {
  if (isDark.value) {
    switch (type) {
      case 1: return 'text-blue-400 bg-blue-500/12 border-blue-400/20'
      case 2: return 'text-red-400 bg-red-500/12 border-red-400/20'
      case 3: return 'text-green-400 bg-green-500/12 border-green-400/20'
      default: return 'text-gray-400 bg-white/6 border-white/10'
    }
  }
  else {
    switch (type) {
      case 1: return 'text-blue-600 bg-blue-50 border-blue-200' // 系统通知
      case 2: return 'text-red-600 bg-red-50 border-red-200' // 公告
      case 3: return 'text-green-600 bg-green-50 border-green-200' // 活动
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }
}

// 将HTML内容转换为纯文本显示
function getPlainTextContent(htmlContent: string): string {
  if (!htmlContent)
    return ''

  // 移除HTML标签并解码HTML实体
  return htmlContent
    .replace(/<[^>]*>/g, '') // 移除HTML标签
    .replace(/&nbsp;/g, ' ') // 替换非断空格
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .trim()
}
function gotoLogin() {
  uni.redirectTo({
    url: '/pages/login/index',
  })
}

// 加载消息提醒数据
async function loadMessageList() {
  try {
    messageLoading.value = true

    const response = await getMyNotifyMessagePage({
      pageNo: 1,
      pageSize: 3, // 首页只显示3条
    })

    if (response.code === 0 && response.data) {
      messageList.value = response.data.list
    }
    else {
      uni.showToast({
        title: response.msg || '获取消息提醒失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    uni.showToast({
      title: '获取消息提醒失败',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    messageLoading.value = false
  }
}

// 加载未读消息数量
async function loadUnreadCount() {
  try {
    const response = await getUnreadCount()

    if (response.code === 0 && typeof response.data === 'number') {
      unreadCount.value = response.data
    }
  }
  catch (error) {
    console.error('获取未读消息数量失败:', error)
  }
}

// 格式化消息时间
function formatMessageTime(createTime: string | number): string {
  if (!createTime)
    return ''

  return formatRelativeTime(createTime)
}

// 获取消息类型颜色
function getMessageTypeColor(templateType: number): string {
  if (isDark.value) {
    switch (templateType) {
      case 1: return 'text-blue-400 bg-blue-500/12'
      case 2: return 'text-orange-400 bg-orange-500/12'
      case 3: return 'text-green-400 bg-green-500/12'
      case 4: return 'text-purple-400 bg-purple-500/12'
      default: return 'text-gray-400 bg-white/6'
    }
  }
  else {
    switch (templateType) {
      case 1: return 'text-blue-600 bg-blue-50' // 系统消息
      case 2: return 'text-orange-600 bg-orange-50' // 审批消息
      case 3: return 'text-green-600 bg-green-50' // 考勤消息
      case 4: return 'text-purple-600 bg-purple-50' // 项目消息
      default: return 'text-gray-600 bg-gray-50'
    }
  }
}

// 跳转到指定页面
function navigateTo(route: string) {
  if (route) {
    // 实际的路由跳转
    uni.navigateTo({
      url: route,
      fail: () => {
        uni.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 2000,
        })
      },
    })
  }
}

// 格式化时间显示
function formatTimeDisplay(time: string) {
  return time === '--:--' ? '未打卡' : time
}

// 加载文章列表数据
async function loadArticleList() {
  try {
    articleLoading.value = true

    const response = await getArticlePage({
      pageNo: 1,
      pageSize: 5, // 首页只显示5条
    })

    if (response.code === 0 && response.data) {
      articleList.value = response.data.list
    }
  }
  catch (error) {
    // 如果接口失败，使用静态数据作为兜底
    articleList.value = [] as ArticleSearchRespVO[]
  }
  finally {
    articleLoading.value = false
  }
}

// 格式化文章时间
function formatArticleTime(createTime: string | number): string {
  if (!createTime)
    return ''

  return formatStandardDateTime(createTime)
}

// 格式化数量显示
function formatCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}
</script>

<template>
  <view class="relative min-h-screen">
    <!-- 底部覆盖层：高度跟随 H5 TabBar 与安全区，避免白底 -->
    <view class="home-bottom-bg" :style="homeBottomStyle" />
    <!-- 页面初始加载骨架屏 -->
    <view v-if="pageLoading" class="home-content min-h-screen px-4 pt-1">
      <view class="space-y-6">
        <!-- 考勤信息骨架屏 -->
        <ThemeCard card-class="mb-6 animate-pulse" :padding="false">
          <view class="px-4 py-3" :class="[skStrongClass]">
            <view class="flex items-center justify-between">
              <view class="h-6 w-32 rounded" :class="skStrongClass" />
              <view class="h-8 w-20 rounded-full" :class="skStrongClass" />
            </view>
          </view>
          <view class="p-4">
            <view class="grid grid-cols-2 mb-4 gap-4">
              <view class="text-center">
                <view class="mx-auto mb-2 h-8 w-20 rounded" :class="skBaseClass" />
                <view class="mx-auto h-4 w-16 rounded" :class="skBaseClass" />
              </view>
              <view class="text-center">
                <view class="mx-auto mb-2 h-8 w-20 rounded" :class="skBaseClass" />
                <view class="mx-auto h-4 w-16 rounded" :class="skBaseClass" />
              </view>
            </view>
            <view class="rounded-xl p-3" :class="subTileBgClass">
              <view class="mb-2 h-4 w-32 rounded" :class="skBaseClass" />
              <view class="h-3 w-24 rounded" :class="skBaseClass" />
            </view>
          </view>
        </ThemeCard>

        <!-- 通知公告骨架屏 -->
        <ThemeCard card-class="mb-6 animate-pulse" :padding="false">
          <view class="border-b px-4 py-3" :class="[skBorderClass]">
            <view class="flex items-center justify-between">
              <view class="h-6 w-24 rounded" :class="skBaseClass" />
              <view class="h-4 w-16 rounded" :class="skBaseClass" />
            </view>
          </view>
          <view class="p-4 space-y-3">
            <view v-for="n in 3" :key="n">
              <view class="mb-2 flex items-start">
                <view class="mr-3 h-8 w-8 rounded-lg" :class="skBaseClass" />
                <view class="flex-1">
                  <view class="mb-2 h-4 w-3/4 rounded" :class="skBaseClass" />
                  <view class="h-3 w-full rounded" :class="skBaseClass" />
                </view>
                <view class="ml-3 h-6 w-16 rounded-full" :class="skBaseClass" />
              </view>
              <view class="h-3 w-20 rounded" :class="skBaseClass" />
            </view>
          </view>
        </ThemeCard>

        <!-- 消息提醒骨架屏 -->
        <ThemeCard card-class="mb-6 animate-pulse" :padding="false">
          <view class="border-b px-4 py-3" :class="[skBorderClass]">
            <view class="flex items-center justify-between">
              <view class="h-6 w-24 rounded" :class="skBaseClass" />
              <view class="h-4 w-16 rounded" :class="skBaseClass" />
            </view>
          </view>
          <view class="p-4 space-y-3">
            <view v-for="n in 3" :key="n">
              <view class="mb-2 flex items-start justify-between">
                <view class="flex flex-1 items-start">
                  <view class="mr-3 h-8 w-8 rounded-lg" :class="skBaseClass" />
                  <view class="flex-1">
                    <view class="mb-2 h-4 w-2/3 rounded" :class="skBaseClass" />
                    <view class="h-3 w-full rounded" :class="skBaseClass" />
                  </view>
                </view>
                <view class="ml-3 flex flex-col items-end">
                  <view class="h-3 w-12 rounded" :class="skBaseClass" />
                  <view class="mt-1 h-2 w-2 rounded-full" :class="skBaseClass" />
                </view>
              </view>
            </view>
          </view>
        </ThemeCard>

        <!-- 文章列表骨架屏 -->
        <ThemeCard card-class="mb-6 animate-pulse" :padding="false">
          <view class="border-b px-4 py-3" :class="[skBorderClass]">
            <view class="flex items-center justify-between">
              <view class="h-6 w-24 rounded" :class="skBaseClass" />
              <view class="h-4 w-16 rounded" :class="skBaseClass" />
            </view>
          </view>
          <view class="p-4 space-y-4">
            <view v-for="n in 3" :key="n">
              <view class="mb-2 flex items-start justify-between">
                <view class="flex-1">
                  <view class="mb-2 h-4 w-4/5 rounded" :class="skBaseClass" />
                  <view class="h-3 w-full rounded" :class="skBaseClass" />
                </view>
                <view class="ml-3 h-6 w-16 rounded-full" :class="skBaseClass" />
              </view>
              <view class="flex items-center justify-between">
                <view class="h-3 w-32 rounded" :class="skBaseClass" />
                <view class="h-3 w-24 rounded" :class="skBaseClass" />
              </view>
            </view>
          </view>
        </ThemeCard>
      </view>
    </view>
    <!-- 主要内容区域 -->
    <view
      v-else class="home-content px-4 pt-1"
    >
      <!-- 第一部分：今日考勤信息 -->
      <ThemeCard card-class="mb-6" :padding="false">
        <view class="bg-blue-500 px-4 py-3">
          <view class="flex items-center justify-between">
            <view class="text-lg text-white font-semibold">
              {{ todayAttendance.date }}
            </view>
            <view class="flex items-center">
              <view class="rounded-full px-3 py-1" :class="getAttendanceStatusTextBackground(getAttendanceResultValue())">
                <text class="text-sm text-white font-medium">
                  {{ todayAttendance.attendanceStatus }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <view class="p-4">
          <!-- 考勤机记录显示 -->
          <view class="grid grid-cols-2 mb-4 gap-4">
            <view class="text-center">
              <view class="mb-2 text-2xl text-green-500 font-bold">
                {{ formatTimeDisplay(todayAttendance.clockInTime) }}
              </view>
              <view class="text-sm" :class="textSecondaryClass">
                上班记录
              </view>
            </view>
            <view class="text-center">
              <view class="mb-2 text-2xl text-blue-500 font-bold">
                {{ formatTimeDisplay(todayAttendance.clockOutTime) }}
              </view>
              <view class="text-sm" :class="textSecondaryClass">
                下班记录
              </view>
            </view>
          </view>

          <!-- 考勤信息详情 -->
          <view class="rounded-xl p-3" :class="subTileBgClass">
            <view class="mb-2 flex items-center justify-between">
              <view class="flex items-center">
                <view class="mr-2 h-5 w-5 rounded bg-blue-500" />
                <view class="text-sm font-medium" :class="textPrimaryClass">
                  工作时长：{{ todayAttendance.workDuration }}
                </view>
              </view>
            </view>
            <view class="flex items-center text-xs" :class="textSecondaryClass">
              <view class="mr-1 h-3 w-3 rounded" :class="iconMutedBgClass" />
              <text>{{ todayAttendance.location }}</text>
            </view>
          </view>
        </view>
      </ThemeCard>

      <!-- 第二部分：通知公告 -->
      <ThemeCard card-class="mb-6" :padding="false">
        <view class="border-b px-4 py-3" :class="[borderMutedClass]">
          <view class="flex items-center justify-between">
            <view class="text-lg font-semibold" :class="[textPrimaryClass]">
              通知公告
            </view>
            <view class="flex items-center">
              <view class="text-sm text-blue-500" @click="navigateTo('/pages-sub/notification/index')">
                查看全部 ›
              </view>
            </view>
          </view>
        </view>

        <view class="p-4">
          <view
            v-for="(notification, index) in notificationList.slice(0, 3)"
            :key="notification.id"
            class="border-b pb-3 transition-all last:border-b-0 last:pb-0" :class="[borderMutedClass, activeRowBgClass, { 'mb-3': index < notificationList.slice(0, 3).length - 1 }]"
            @click="navigateTo(`/pages-sub/notification/detail?id=${notification.id}`)"
          >
            <view class="mb-2 flex items-start justify-between">
              <view class="flex flex-1 items-start">
                <view class="mr-3 h-8 w-8 flex items-center justify-center rounded-lg" :class="iconAccentContainerClass">
                  <view class="h-4 w-4 rounded bg-blue-500" />
                </view>
                <view class="flex-1">
                  <view class="line-clamp-1 text-sm font-medium" :class="textPrimaryClass">
                    {{ notification.title }}
                  </view>
                  <view class="line-clamp-2 mt-1 text-xs" :class="textSecondaryClass">
                    {{ getPlainTextContent(notification.content) }}
                  </view>
                </view>
              </view>
              <view class="ml-3 flex flex-col items-end">
                <view class="rounded-full px-2 py-1 text-xs font-medium" :class="getNotificationTypeColor(notification.type)">
                  {{ getNotificationTypeText(notification.type) }}
                </view>
              </view>
            </view>

            <view class="text-xs" :class="textMutedClass">
              {{ formatNotificationTime(notification.createTime) }}
            </view>
          </view>

          <!-- 没有通知时的显示 -->
          <view v-if="notificationList.length === 0" class="py-6 text-center">
            <view class="text-sm" :class="textSecondaryClass">
              暂无通知公告
            </view>
          </view>
        </view>
      </ThemeCard>

      <!-- 第三部分：消息提醒 -->
      <ThemeCard card-class="mb-6" :padding="false">
        <view class="border-b px-4 py-3" :class="[borderMutedClass]">
          <view class="flex items-center justify-between">
            <view class="text-lg font-semibold" :class="[textPrimaryClass]">
              消息提醒
            </view>
            <view class="flex items-center">
              <view v-if="unreadCount > 0" class="mr-2 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-xs text-white font-medium">
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </view>
              <view class="text-sm text-blue-500" @click="navigateTo('/pages-sub/message/index')">
                查看全部 ›
              </view>
            </view>
          </view>
        </view>

        <view class="p-4">
          <view
            v-for="(message, index) in messageList.slice(0, 3)"
            :key="message.id"
            class="border-b pb-3 transition-all last:border-b-0 last:pb-0" :class="[borderMutedClass, activeRowBgClass, { 'mb-3': index < messageList.slice(0, 3).length - 1 }]"
            @click="navigateTo(`/pages-sub/message/detail?id=${message.id}`)"
          >
            <view class="mb-2 flex items-start justify-between">
              <view class="flex flex-1 items-start">
                <view class="mr-3 h-8 w-8 flex items-center justify-center rounded-lg" :class="getMessageTypeColor(message.templateType)">
                  <view class="h-4 w-4 rounded bg-current" />
                </view>
                <view class="flex-1">
                  <view class="line-clamp-1 text-sm font-medium" :class="[textPrimaryClass, { 'font-bold': !message.readStatus }]">
                    {{ message.templateNickname || '系统' }}
                  </view>
                  <view class="line-clamp-2 mt-1 text-xs" :class="textSecondaryClass">
                    {{ getPlainTextContent(message.templateContent) }}
                  </view>
                </view>
              </view>
              <view class="ml-3 flex flex-col items-end">
                <view class="text-xs" :class="textMutedClass">
                  {{ formatMessageTime(message.createTime) }}
                </view>
                <view v-if="!message.readStatus" class="mt-1 h-2 w-2 rounded-full bg-red-500" />
              </view>
            </view>
          </view>

          <!-- 没有消息时的显示 -->
          <view v-if="messageList.length === 0" class="py-6 text-center">
            <view class="mx-auto mb-2 h-8 w-8 rounded-full bg-gray-200" />
            <view class="text-sm" :class="textSecondaryClass">
              暂无消息提醒
            </view>
          </view>
        </view>
      </ThemeCard>

      <!-- 第四部分：文章列表 -->
      <ThemeCard card-class="mb-6" :padding="false">
        <view class="border-b px-4 py-3" :class="[borderMutedClass]">
          <view class="flex items-center justify-between">
            <view class="text-lg font-semibold" :class="[textPrimaryClass]">
              最新文章
            </view>
            <view class="text-sm text-blue-500" @click="navigateTo('/pages-sub/article/index')">
              查看全部 ›
            </view>
          </view>
        </view>

        <view class="p-4">
          <!-- 文章列表内容 -->
          <view v-if="articleList.length > 0">
            <view
              v-for="(article, index) in articleList.slice(0, 5)"
              :key="article.id"
              class="border-b pb-4 transition-all last:border-b-0 last:pb-0" :class="[borderMutedClass, activeRowBgClass, { 'mb-4': index < articleList.slice(0, 5).length - 1 }]"
              @click="navigateTo(`/pages-sub/article/detail?id=${article.id}`)"
            >
              <view class="mb-2 flex items-start justify-between">
                <view class="flex-1">
                  <view class="line-clamp-2 mb-1 text-sm font-medium" :class="textPrimaryClass">
                    {{ article.title }}
                  </view>
                  <view class="line-clamp-2 text-xs" :class="textSecondaryClass">
                    {{ article.blogAbstract }}
                  </view>
                </view>
                <view class="ml-3 rounded-full px-2 py-1 text-xs font-medium" :class="[textSecondaryClass, isDark ? 'bg-white/5' : 'bg-gray-50']">
                  {{ article.tagNames && article.tagNames[0] }}
                </view>
              </view>

              <view class="flex items-center justify-between">
                <view class="flex items-center text-xs" :class="textSecondaryClass">
                  <view class="mr-2 h-3 w-3 rounded" :class="iconMutedBgClass" />
                  <text class="mr-2">
                    {{ article.authorName }}
                  </text>
                  <text class="mr-2">
                    {{ formatArticleTime(article.createTime) }}
                  </text>
                </view>
                <view class="flex items-center text-xs" :class="textMutedClass">
                  <text class="mr-2">
                    阅读 {{ formatCount(article.browse) }}
                  </text>
                  <text>点赞 {{ formatCount(article.love) }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 没有文章时的显示 -->
          <view v-else class="py-8 text-center">
            <view class="mx-auto mb-2 h-10 w-10 rounded-xl bg-gray-200" />
            <view class="text-sm" :class="textSecondaryClass">
              暂无文章内容
            </view>
          </view>
        </view>
      </ThemeCard>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 骨架屏动画样式 */
@keyframes skeleton-loading {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: skeleton-loading 1.5s infinite;
}

@media (prefers-color-scheme: dark) {
  .skeleton-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.18) 25%,
      rgba(255, 255, 255, 0.12) 50%,
      rgba(255, 255, 255, 0.18) 75%
    );
    background-size: 200px 100%;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 滚动性能优化 */
.min-h-screen {
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;
  transform: translateZ(0);
}

/* UnoCSS原子类样式 */
</style>

<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page -->
<route lang="jsonc" type="home">
{
  "layout": "tabbar",
  "style": {
    // 'custom' 表示开启自定义导航栏，默认 'default'
    "navigationStyle": "default",
    "navigationBarTitleText": "梯航小助手"
  }
}
</route>

<script lang="ts" setup>
import type { NoticeRespVO } from '@/api/types/notice'
import type { NotifyMessageRespVO } from '@/api/types/notify-message'
import { getTodayAttendanceRecord } from '@/api/attendance'
import { getNoticePage } from '@/api/notice'
import { getMyNotifyMessagePage } from '@/api/notify-message'
import { useUserStore } from '@/store'

defineOptions({
  name: 'Home',
})

const userStore = useUserStore()

// 获取屏幕边界到安全区域距离
let safeAreaInsets
let systemInfo

// #ifdef MP-WEIXIN
// 微信小程序使用新的API
systemInfo = uni.getWindowInfo()
safeAreaInsets = systemInfo.safeArea
  ? {
      top: systemInfo.safeArea.top,
      right: systemInfo.windowWidth - systemInfo.safeArea.right,
      bottom: systemInfo.windowHeight - systemInfo.safeArea.bottom,
      left: systemInfo.safeArea.left,
    }
  : null
// #endif

// #ifndef MP-WEIXIN
// 其他平台继续使用uni API
systemInfo = uni.getSystemInfoSync()
safeAreaInsets = systemInfo.safeAreaInsets
// #endif

// 假数据
const welcomeData = reactive({
  username: userStore.userInfo.username || '管理员',
  avatar: userStore.userInfo.avatar || '/static/images/default-avatar.png',
  department: '梯航智能车创新工作室',
  role: '系统管理员',
})

// 今日考勤信息（考勤机自动记录）
const todayAttendance = reactive({
  date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
  clockInTime: '--:--',
  clockOutTime: '--:--',
  status: 'working', // working, completed, absent
  workDuration: '--',
  isLate: false,
  isEarlyLeave: false,
  attendanceStatus: '暂无记录',
  location: '办公楼一楼考勤机',
  loading: false,
})

// 通知公告
const notificationList = ref<NoticeRespVO[]>([])
const notificationLoading = ref(false)

// 消息提醒
const messageList = ref<NotifyMessageRespVO[]>([])
const messageLoading = ref(false)

// 文章列表
const articleList = ref([
  {
    id: 1,
    title: '2024年智能车竞赛规则解读与备赛指南',
    summary: '详细解读今年智能车竞赛的新规则变化，为参赛队伍提供全面的备赛指导...',
    author: '张教授',
    publishTime: '2024-01-15 10:30',
    readCount: 168,
    likeCount: 23,
    category: '竞赛指导',
    status: 'published',
  },
  {
    id: 2,
    title: '新成员培训计划正式启动',
    summary: '本学期新成员培训将分为理论学习、实践操作、项目实战三个阶段进行...',
    author: '李老师',
    publishTime: '2024-01-14 16:20',
    readCount: 89,
    likeCount: 15,
    category: '培训通知',
    status: 'published',
  },
  {
    id: 3,
    title: '智能车控制算法优化实践',
    summary: '通过PID控制算法的深度优化，显著提升了智能车的路径跟踪精度...',
    author: '王同学',
    publishTime: '2024-01-13 14:15',
    readCount: 234,
    likeCount: 45,
    category: '技术分享',
    status: 'published',
  },
  {
    id: 4,
    title: '工作室月度总结与下月计划',
    summary: '回顾本月工作成果，制定下月发展规划，推进各项目按时完成...',
    author: '赵老师',
    publishTime: '2024-01-12 09:45',
    readCount: 156,
    likeCount: 28,
    category: '工作总结',
    status: 'published',
  },
  {
    id: 5,
    title: '实验室安全管理规范更新',
    summary: '为确保实验室安全，更新了设备使用规范和应急处理流程...',
    author: '安全委员会',
    publishTime: '2024-01-11 11:20',
    readCount: 98,
    likeCount: 12,
    category: '安全管理',
    status: 'published',
  },
])

// 测试 uni API 自动引入
onLoad(() => {
  console.log('userInfo', userStore.userInfo)
  if (!userStore.userInfo.accessToken) {
    gotoLogin()
  }
})

onShow(() => {
// 加载今日考勤数据
  loadTodayAttendance()
  // 加载通知公告数据
  loadNotificationList()
  // 加载消息提醒数据
  loadMessageList()
})

// 加载今日考勤数据
async function loadTodayAttendance() {
  try {
    todayAttendance.loading = true

    const response = await getTodayAttendanceRecord()

    if (response.code === 0 && response.data) {
      const { onDuty, offDuty } = response.data

      // 处理上班打卡
      if (onDuty) {
        todayAttendance.clockInTime = formatAttendanceTime(onDuty.recognizeTime)
        todayAttendance.isLate = onDuty.result === 1 // AttendanceResult.LATE
      }

      // 处理下班打卡
      if (offDuty) {
        todayAttendance.clockOutTime = formatAttendanceTime(offDuty.recognizeTime)
        todayAttendance.isEarlyLeave = offDuty.result === 1 // AttendanceResult.EARLY_LEAVE
        todayAttendance.status = 'completed'
      }
      else {
        todayAttendance.status = onDuty ? 'working' : 'absent'
      }

      // 计算工作时长
      if (onDuty && offDuty) {
        todayAttendance.workDuration = calculateWorkDuration(onDuty.recognizeTime, offDuty.recognizeTime)
      }
      else if (onDuty) {
        todayAttendance.workDuration = calculateCurrentWorkDuration(onDuty.recognizeTime)
      }

      // 设置考勤状态
      todayAttendance.attendanceStatus = getAttendanceStatusText(onDuty, offDuty)

      // 设置设备信息
      if (onDuty?.deviceSn) {
        todayAttendance.location = `考勤机: ${onDuty.deviceSn}`
      }

      console.log('✨ 考勤数据处理完成:', todayAttendance)
    }
    else {
      console.warn('⚠️ 获取考勤数据失败:', response.msg)
      todayAttendance.attendanceStatus = '未打卡'

      uni.showToast({
        title: response.msg || '获取考勤信息失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('❌ 加载考勤数据错误:', error)
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
function formatAttendanceTime(dateTimeStr: string): string {
  if (!dateTimeStr)
    return '--:--'

  try {
    const date = new Date(dateTimeStr)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }
  catch (error) {
    console.error('时间格式化错误:', error)
    return '--:--'
  }
}

// 计算工作时长
function calculateWorkDuration(startTime: string, endTime: string): string {
  try {
    const start = new Date(startTime)
    const end = new Date(endTime)
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
function calculateCurrentWorkDuration(startTime: string): string {
  try {
    const start = new Date(startTime)
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
function getAttendanceStatusText(onDuty: any, offDuty: any): string {
  if (!onDuty)
    return '未打卡'

  if (offDuty) {
    // 已下班
    if (onDuty.result === 2 && offDuty.result === 3)
      return '迟到早退'
    if (onDuty.result === 2)
      return '迟到'
    if (offDuty.result === 3)
      return '早退'
    return '正常出勤'
  }
  else {
    // 尚未下班
    if (onDuty.result === 2)
      return '迟到上班'
    return '正常工作'
  }
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
      console.log('✨ 通知公告数据加载完成:', notificationList.value)
    }
    else {
      console.warn('⚠️ 获取通知公告数据失败:', response.msg)
      uni.showToast({
        title: response.msg || '获取通知公告失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('❌ 加载通知公告数据错误:', error)
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
function formatNotificationTime(createTime: string): string {
  if (!createTime)
    return ''

  try {
    const date = new Date(createTime)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }
  catch (error) {
    console.error('时间格式化错误:', error)
    return createTime
  }
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
  switch (type) {
    case 1: return 'text-blue-600 bg-blue-50 border-blue-200' // 系统通知
    case 2: return 'text-red-600 bg-red-50 border-red-200' // 公告
    case 3: return 'text-green-600 bg-green-50 border-green-200' // 活动
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

// 获取通知图标
function getNotificationIcon(type: number): string {
  switch (type) {
    case 1: return '🔔' // 系统通知
    case 2: return '📢' // 公告
    case 3: return '🎉' // 活动
    default: return '📢'
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
      console.log('✨ 消息提醒数据加载完成:', messageList.value)
    }
    else {
      console.warn('⚠️ 获取消息提醒数据失败:', response.msg)
      uni.showToast({
        title: response.msg || '获取消息提醒失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    console.error('❌ 加载消息提醒数据错误:', error)
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

// 格式化消息时间
function formatMessageTime(createTime: string): string {
  if (!createTime)
    return ''

  try {
    const date = new Date(createTime)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) {
      return '刚刚'
    }
    else if (diffHours < 24) {
      return `${diffHours}小时前`
    }
    else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }
  catch (error) {
    console.error('时间格式化错误:', error)
    return createTime
  }
}

// 获取消息类型颜色
function getMessageTypeColor(templateType: number): string {
  switch (templateType) {
    case 1: return 'text-blue-600 bg-blue-50' // 系统消息
    case 2: return 'text-orange-600 bg-orange-50' // 审批消息
    case 3: return 'text-green-600 bg-green-50' // 考勤消息
    case 4: return 'text-purple-600 bg-purple-50' // 项目消息
    default: return 'text-gray-600 bg-gray-50'
  }
}

// 获取消息图标
function getMessageIcon(templateType: number): string {
  switch (templateType) {
    case 1: return '🔔' // 系统消息
    case 2: return '📋' // 审批消息
    case 3: return '⏰' // 考勤消息
    case 4: return '📁' // 项目消息
    default: return '💬'
  }
}

// 跳转到指定页面
function navigateTo(route: string) {
  if (route) {
    // 实际的路由跳转
    uni.navigateTo({
      url: route,
      fail: (error) => {
        console.error('路由跳转失败:', error)
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

// 获取消息未读数量
function getUnreadMessageCount() {
  return messageList.value.filter(msg => !msg.readStatus).length
}

// 获取文章分类颜色
function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    竞赛指导: 'text-blue-600 bg-blue-50',
    培训通知: 'text-green-600 bg-green-50',
    技术分享: 'text-purple-600 bg-purple-50',
    工作总结: 'text-orange-600 bg-orange-50',
    安全管理: 'text-red-600 bg-red-50',
  }
  return colors[category] || 'text-gray-600 bg-gray-50'
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
  <view class="min-h-screen bg-gray-50">
    <!-- 未登录状态 -->
    <view v-if="!userStore.userInfo.username" class="flex flex-col items-center justify-center py-20">
      <view class="mb-4 h-16 w-16 flex items-center justify-center rounded-2xl bg-blue-100">
        <text class="text-2xl">
          🔐
        </text>
      </view>
      <view class="mb-2 text-lg text-gray-800 font-medium">
        请先登录
      </view>
      <view class="mb-6 text-sm text-gray-500">
        登录后即可使用系统功能
      </view>
      <wd-button
        type="primary"
        size="medium"
        custom-style="border-radius: 12rpx; font-size: 28rpx;"
        @click="gotoLogin"
      >
        立即登录
      </wd-button>
    </view>

    <!-- 主要内容区域 -->
    <view v-else class="px-4 pt-1">
      <!-- 第一部分：今日考勤信息 -->
      <view class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <view class="from-blue-500 to-blue-600 bg-gradient-to-r px-4 py-3">
          <view class="flex items-center justify-between">
            <view class="text-lg text-white font-semibold">
              {{ todayAttendance.date }}
            </view>
            <view class="flex items-center">
              <view class="rounded-full bg-white/20 px-3 py-1">
                <text class="text-sm text-white font-medium">
                  {{ todayAttendance.attendanceStatus }}
                </text>
              </view>
              <view
                class="ml-2 h-8 w-8 flex items-center justify-center rounded-full bg-white/20 transition-all active:bg-white/30"
                @click="loadTodayAttendance"
              >
                <text class="text-sm text-white" :class="{ 'animate-spin': todayAttendance.loading }">
                  🔄
                </text>
              </view>
            </view>
          </view>
        </view>

        <view class="p-4">
          <!-- 考勤机记录显示 -->
          <view class="grid grid-cols-2 mb-4 gap-4">
            <view class="text-center">
              <view class="mb-2 text-2xl text-green-600 font-bold">
                {{ formatTimeDisplay(todayAttendance.clockInTime) }}
              </view>
              <view class="text-sm text-gray-600">
                上班记录
              </view>
              <view v-if="todayAttendance.isLate" class="mt-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-600">
                迟到
              </view>
            </view>
            <view class="text-center">
              <view class="mb-2 text-2xl text-blue-600 font-bold">
                {{ formatTimeDisplay(todayAttendance.clockOutTime) }}
              </view>
              <view class="text-sm text-gray-600">
                下班记录
              </view>
              <view v-if="todayAttendance.isEarlyLeave" class="mt-1 rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-600">
                早退
              </view>
            </view>
          </view>

          <!-- 考勤信息详情 -->
          <view class="rounded-xl bg-gray-50 p-3">
            <view class="mb-2 flex items-center justify-between">
              <view class="flex items-center">
                <text class="mr-2 text-lg">
                  ⏱️
                </text>
                <view class="text-sm text-gray-800 font-medium">
                  工作时长：{{ todayAttendance.workDuration }}
                </view>
              </view>
            </view>
            <view class="flex items-center text-xs text-gray-500">
              <text class="mr-1">
                📍
              </text>
              <text>{{ todayAttendance.location }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 第二部分：通知公告 -->
      <view class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <view class="border-b border-gray-100 px-4 py-3">
          <view class="flex items-center justify-between">
            <view class="text-lg text-gray-800 font-semibold">
              通知公告
            </view>
            <view class="flex items-center">
              <view v-if="notificationLoading" class="mr-2 text-xs text-gray-500">
                加载中...
              </view>
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
            class="border-b border-gray-50 pb-3 transition-all last:border-b-0 active:bg-gray-50 last:pb-0"
            :class="{ 'mb-3': index < notificationList.slice(0, 3).length - 1 }"
            @click="navigateTo(`/pages-sub/notification/detail?id=${notification.id}`)"
          >
            <view class="mb-2 flex items-start justify-between">
              <view class="flex flex-1 items-start">
                <text class="mr-2 text-lg">
                  {{ getNotificationIcon(notification.type) }}
                </text>
                <view class="flex-1">
                  <view class="line-clamp-1 text-sm text-gray-800 font-medium">
                    {{ notification.title }}
                  </view>
                  <view class="line-clamp-2 mt-1 text-xs text-gray-500">
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

            <view class="text-xs text-gray-400">
              {{ formatNotificationTime(notification.createTime) }}
            </view>
          </view>

          <!-- 没有通知时的显示 -->
          <view v-if="notificationList.length === 0 && !notificationLoading" class="py-6 text-center">
            <view class="text-sm text-gray-500">
              暂无通知公告
            </view>
          </view>

          <!-- 加载中显示 -->
          <view v-if="notificationLoading" class="py-6 text-center">
            <view class="mb-2 animate-spin text-2xl">
              🔄
            </view>
            <view class="text-sm text-gray-500">
              加载中...
            </view>
          </view>
        </view>
      </view>

      <!-- 第三部分：消息提醒 -->
      <view class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <view class="border-b border-gray-100 px-4 py-3">
          <view class="flex items-center justify-between">
            <view class="text-lg text-gray-800 font-semibold">
              🔔 消息提醒
            </view>
            <view class="flex items-center">
              <view v-if="getUnreadMessageCount() > 0" class="mr-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white">
                {{ getUnreadMessageCount() }}
              </view>
              <view v-if="messageLoading" class="mr-2 text-xs text-gray-500">
                加载中...
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
            class="border-b border-gray-50 pb-3 transition-all last:border-b-0 active:bg-gray-50 last:pb-0"
            :class="{ 'mb-3': index < messageList.slice(0, 3).length - 1 }"
            @click="navigateTo(`/pages-sub/message/detail?id=${message.id}`)"
          >
            <view class="mb-2 flex items-start justify-between">
              <view class="flex flex-1 items-start">
                <view class="mr-3 h-8 w-8 flex items-center justify-center rounded-lg" :class="getMessageTypeColor(message.templateType)">
                  <text class="text-sm">
                    {{ getMessageIcon(message.templateType) }}
                  </text>
                </view>
                <view class="flex-1">
                  <view class="line-clamp-1 text-sm text-gray-800 font-medium" :class="{ 'font-bold': !message.readStatus }">
                    {{ message.templateNickname || '系统' }}
                  </view>
                  <view class="line-clamp-2 mt-1 text-xs text-gray-500">
                    {{ getPlainTextContent(message.templateContent) }}
                  </view>
                </view>
              </view>
              <view class="ml-3 flex flex-col items-end">
                <view class="text-xs text-gray-400">
                  {{ formatMessageTime(message.createTime) }}
                </view>
                <view v-if="!message.readStatus" class="mt-1 h-2 w-2 rounded-full bg-red-500" />
              </view>
            </view>
          </view>

          <!-- 没有消息时的显示 -->
          <view v-if="messageList.length === 0 && !messageLoading" class="py-6 text-center">
            <view class="mb-2 text-3xl">
              🔔
            </view>
            <view class="text-sm text-gray-500">
              暂无消息提醒
            </view>
          </view>

          <!-- 加载中显示 -->
          <view v-if="messageLoading" class="py-6 text-center">
            <view class="mb-2 animate-spin text-2xl">
              🔄
            </view>
            <view class="text-sm text-gray-500">
              加载中...
            </view>
          </view>
        </view>
      </view>

      <!-- 第四部分：文章列表 -->
      <view class="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <view class="border-b border-gray-100 px-4 py-3">
          <view class="flex items-center justify-between">
            <view class="text-lg text-gray-800 font-semibold">
              📝 最新文章
            </view>
            <view class="text-sm text-blue-500" @click="navigateTo('/pages/article/index')">
              查看全部 ›
            </view>
          </view>
        </view>

        <view class="p-4">
          <view
            v-for="(article, index) in articleList.slice(0, 5)"
            :key="article.id"
            class="border-b border-gray-50 pb-4 transition-all last:border-b-0 active:bg-gray-50 last:pb-0"
            :class="{ 'mb-4': index < articleList.slice(0, 5).length - 1 }"
            @click="navigateTo(`/pages/article/detail?id=${article.id}`)"
          >
            <view class="mb-2 flex items-start justify-between">
              <view class="flex-1">
                <view class="line-clamp-2 mb-1 text-sm text-gray-800 font-medium">
                  {{ article.title }}
                </view>
                <view class="line-clamp-2 text-xs text-gray-500">
                  {{ article.summary }}
                </view>
              </view>
              <view class="ml-3 rounded-full px-2 py-1 text-xs font-medium" :class="getCategoryColor(article.category)">
                {{ article.category }}
              </view>
            </view>

            <view class="flex items-center justify-between">
              <view class="flex items-center text-xs text-gray-500">
                <text class="mr-2">
                  👤 {{ article.author }}
                </text>
                <text class="mr-2">
                  {{ article.publishTime }}
                </text>
              </view>
              <view class="flex items-center text-xs text-gray-400">
                <text class="mr-2">
                  👁️ {{ formatCount(article.readCount) }}
                </text>
                <text>❤️ {{ formatCount(article.likeCount) }}</text>
              </view>
            </view>
          </view>

          <!-- 没有文章时的显示 -->
          <view v-if="articleList.length === 0" class="py-8 text-center">
            <view class="mb-2 text-4xl">
              📝
            </view>
            <view class="text-sm text-gray-500">
              暂无文章内容
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>

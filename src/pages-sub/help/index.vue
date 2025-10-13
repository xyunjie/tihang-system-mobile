<!-- 帮助中心页面 -->
<route lang="jsonc" type="page">
{
  "layout": "tabbar",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "帮助中心"
  }
}
</route>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({
  name: 'HelpCenter',
})

// 帮助分类
const helpCategories = ref([
  {
    id: 1,
    title: '账号与安全',
    icon: '🔐',
    items: [
      { id: 101, title: '如何修改密码？' },
      { id: 102, title: '忘记密码怎么办？' },
      { id: 103, title: '如何绑定手机号？' },
      { id: 104, title: '账号被盗怎么办？' },
    ],
  },
  {
    id: 2,
    title: '功能使用',
    icon: '📱',
    items: [
      { id: 201, title: '如何提交纳新申请？' },
      { id: 202, title: '如何查看通知公告？' },
      { id: 203, title: '如何查看个人信息？' },
      { id: 204, title: '如何接收消息提醒？' },
    ],
  },
  {
    id: 3,
    title: '常见问题',
    icon: '❓',
    items: [
      { id: 301, title: '为什么无法登录？' },
      { id: 302, title: '页面加载缓慢怎么办？' },
      { id: 303, title: '如何清理缓存？' },
      { id: 304, title: '如何联系客服？' },
    ],
  },
])

// 热门问题
const hotQuestions = ref([
  { id: 1, title: '忘记密码如何找回？', views: 1256 },
  { id: 2, title: '如何修改个人信息？', views: 987 },
  { id: 3, title: '账号被锁定怎么办？', views: 854 },
  { id: 4, title: '如何绑定手机号码？', views: 723 },
])

// 联系客服
function contactSupport() {
  uni.showModal({
    title: '联系客服',
    content: '客服微信：tihang_service\n服务时间：周一至周五 9:00-18:00',
    confirmText: '复制微信号',
    success: (res) => {
      if (res.confirm) {
        uni.setClipboardData({
          data: 'tihang_service',
          success: () => {
            uni.showToast({
              title: '已复制微信号',
              icon: 'success',
            })
          },
        })
      }
    },
  })
}

// 查看问题详情
function viewQuestionDetail(question: any) {
  // 保存问题信息到本地存储
  uni.setStorageSync('helpQuestionId', question.id)
  uni.setStorageSync('helpQuestionTitle', question.title)

  // 跳转到详情页面
  uni.navigateTo({
    url: '/pages-sub/help/detail',
  })
}
</script>

<template>
  <view class="min-h-screen bg-gray-50">
    <!-- 搜索框 -->
    <view class="mx-4 my-3">
      <view class="flex items-center rounded-2xl bg-white px-4 py-3 shadow-sm">
        <text class="text-gray-400">
          🔍
        </text>
        <input
          class="ml-2 flex-1 text-sm text-gray-600"
          type="text"
          placeholder="搜索帮助内容"
          disabled
        >
      </view>
    </view>

    <!-- 热门问题 -->
    <view class="mx-4 mb-4 rounded-2xl bg-white p-4 shadow-sm">
      <view class="mb-3 flex items-center">
        <text class="text-lg font-bold">
          🔥 热门问题
        </text>
      </view>
      <view class="space-y-3">
        <view
          v-for="question in hotQuestions"
          :key="question.id"
          class="flex items-center justify-between rounded-xl px-3 py-3 transition-colors active:bg-gray-50"
          @click="viewQuestionDetail(question)"
        >
          <view class="flex-1 text-sm text-gray-800">
            {{ question.title }}
          </view>
          <view class="ml-2 text-xs text-gray-400">
            {{ question.views }} 浏览
          </view>
          <view class="ml-2 text-gray-400">
            ›
          </view>
        </view>
      </view>
    </view>

    <!-- 帮助分类 -->
    <view v-for="category in helpCategories" :key="category.id" class="mx-4 mb-4 rounded-2xl bg-white p-4 shadow-sm">
      <view class="mb-3 flex items-center">
        <text class="mr-2 text-lg">
          {{ category.icon }}
        </text>
        <text class="text-base text-gray-800 font-bold">
          {{ category.title }}
        </text>
      </view>
      <view class="grid grid-cols-2 gap-3">
        <view
          v-for="item in category.items"
          :key="item.id"
          class="rounded-xl bg-gray-50 p-3 transition-colors active:bg-gray-100"
          @click="viewQuestionDetail(item)"
        >
          <view class="text-sm text-gray-700">
            {{ item.title }}
          </view>
        </view>
      </view>
    </view>

    <!-- 联系客服 -->
    <view class="mx-4 mb-6 rounded-2xl bg-white p-4 shadow-sm">
      <view class="flex items-center justify-between">
        <view class="flex items-center">
          <text class="mr-2 text-lg">
            👨‍💻
          </text>
          <view>
            <view class="text-base text-gray-800 font-bold">
              联系客服
            </view>
            <view class="text-xs text-gray-500">
              遇到问题？联系客服帮您解决
            </view>
          </view>
        </view>
        <button
          class="rounded-xl bg-blue-500 px-4 py-2 text-sm text-white"
          @click="contactSupport"
        >
          联系我们
        </button>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="mb-6 px-4 text-center">
      <view class="text-xs text-gray-400">
        没有找到您要的答案？请联系客服获取帮助
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>

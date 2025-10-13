<!-- 帮助问题详情页面 -->
<route lang="jsonc" type="page">
{
  "layout": "default",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "问题详情"
  }
}
</route>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({
  name: 'HelpDetail',
})
// 获取页面参数
const questionId = Number(uni.getStorageSync('helpQuestionId') || 0)
const questionTitle = uni.getStorageSync('helpQuestionTitle') || '问题详情'

// 设置页面标题
uni.setNavigationBarTitle({
  title: questionTitle,
})

// 模拟问题详情数据
const questionDetail = ref({
  id: questionId,
  title: questionTitle,
  content: '',
  updateTime: '2025-09-20',
})

// 常见问题内容
const questionContents: Record<number, string> = {
  101: `<p>修改密码的步骤如下：</p>
  <p>1. 进入&quot;我的&quot;页面，点击&quot;账号安全&quot;</p>
  <p>2. 在账号安全页面找到&quot;修改密码&quot;选项</p>
  <p>3. 输入当前密码和新密码</p>
  <p>4. 确认新密码并提交</p>
  <p>5. 系统会提示修改成功</p>`,

  102: `<p>忘记密码可以通过以下方式找回：</p>
  <p>1. 在登录页面点击&quot;忘记密码&quot;</p>
  <p>2. 输入您的手机号码</p>
  <p>3. 输入收到的短信验证码</p>
  <p>4. 设置新的登录密码</p>
  <p>5. 完成密码重置</p>`,

  103: `<p>绑定手机号的步骤：</p>
  <p>1. 进入&quot;我的&quot;页面，点击&quot;个人资料&quot;</p>
  <p>2. 找到手机号字段，点击&quot;修改&quot;</p>
  <p>3. 输入要绑定的手机号码</p>
  <p>4. 输入收到的验证码</p>
  <p>5. 点击确认完成绑定</p>`,

  201: `<p>提交纳新申请的方法：</p>
  <p>1. 进入首页，点击&quot;纳新登记&quot;</p>
  <p>2. 填写个人基本信息</p>
  <p>3. 上传相关证明材料</p>
  <p>4. 提交申请并等待审核</p>
  <p>5. 可在个人中心查看申请状态</p>`,

  202: `<p>查看通知公告：</p>
  <p>1. 在首页点击&quot;通知公告&quot;</p>
  <p>2. 浏览最新的通知列表</p>
  <p>3. 点击具体通知查看详细内容</p>
  <p>4. 重要通知会有红色标识</p>`,

  301: `<p>无法登录的常见原因及解决方法：</p>
  <p>1. 检查用户名和密码是否正确</p>
  <p>2. 确认网络连接正常</p>
  <p>3. 清理应用缓存后重新尝试</p>
  <p>4. 如仍无法登录，请联系客服</p>`,

  // 热门问题
  1: `<p>忘记密码找回步骤：</p>
  <p>1. 在登录页面点击&quot;忘记密码&quot;</p>
  <p>2. 输入您的手机号码</p>
  <p>3. 输入收到的短信验证码</p>
  <p>4. 设置新的登录密码</p>
  <p>5. 完成密码重置</p>
  <p>注意事项：新密码需包含字母和数字，长度不少于8位。</p>`,

  2: `<p>修改个人信息：</p>
  <p>1. 进入&quot;我的&quot;页面</p>
  <p>2. 点击头像或昵称进入个人资料</p>
  <p>3. 点击需要修改的项目</p>
  <p>4. 输入新的信息并保存</p>
  <p>部分信息需要审核后生效</p>`,
}

// 初始化问题内容
questionDetail.value.content = questionContents[Number(questionId)]
  || `<p>暂无该问题的详细内容</p>
  <p>如果您有其他疑问，请联系客服获取帮助。</p>`

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
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-4">
    <view class="rounded-2xl bg-white p-4 shadow-sm">
      <view class="mb-4 border-b border-gray-100 pb-3">
        <view class="text-lg text-gray-800 font-bold">
          {{ questionDetail.title }}
        </view>
        <view class="mt-1 text-xs text-gray-500">
          更新时间：{{ questionDetail.updateTime }}
        </view>
      </view>

      <view class="prose prose-sm max-w-none">
        <view class="text-gray-700">
          <rich-text :nodes="questionDetail.content" />
        </view>
      </view>
    </view>

    <view class="mt-6 rounded-2xl bg-white p-4 shadow-sm">
      <view class="text-center text-sm text-gray-600">
        <p>以上内容是否解决了您的问题？</p>
      </view>
      <view class="mt-4 flex justify-center gap-4">
        <button class="border border-green-500 rounded-xl px-6 py-2 text-green-500">
          已解决
        </button>
        <button
          class="rounded-xl bg-blue-500 px-6 py-2 text-white"
          @click="contactSupport"
        >
          未解决，联系客服
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>

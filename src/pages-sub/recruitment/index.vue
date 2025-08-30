<!-- 使用 type="page" 属性设置页面 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "纳新登记",
  },
  "notLogin": true
}
</route>

<script setup lang="ts">
import type { UserRecruitmentConfigRespVO, UserRecruitmentSaveReqVO } from '@/api/types/recruitment'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { createUserRecruitment, getUserRecruitmentConfig } from '@/api/recruitment'
import { showToast } from '@/utils/toast'

// 页面状态
const loading = ref(true)
const submitting = ref(false)
const showTemplateMessage = ref(false)
const showNoRecruitment = ref(false)
const devMode = ref(import.meta.env.DEV) // 开发模式标识

// 纳新配置
const recruitmentConfig = ref<UserRecruitmentConfigRespVO | null>(null)

// 表单数据
const formData = ref<UserRecruitmentSaveReqVO>(
  {
    name: '',
    studentId: '',
    email: '',
    phone: '',
    qqNumber: '',
    birthday: '',
    sex: 1,
    nation: '',
    politicalOutlook: '',
    userIntroduce: '',
    joinReason: '',
    personalSkills: '',
    interestDirection: '',
    grade: 0,
    schoolDeptId: 1,
    settingId: 0,
    imageUrl: '',
    province: '',
    city: '',
    schoolDept: '',
    major: '',
    classNumber: '',
  },
)

// 照片上传
const photoList = ref<any[]>([])

// 选择器选项
const gradeOptions = ref([
  { label: '大一', value: 1 },
  { label: '大二', value: 2 },
  { label: '大三', value: 3 },
  { label: '大四', value: 4 },
  { label: '研一', value: 5 },
  { label: '研二', value: 6 },
  { label: '研三', value: 7 },
])

const politicalOptions = ref([
  { label: '群众', value: '群众' },
  { label: '共青团员', value: '共青团员' },
  { label: '中共党员', value: '中共党员' },
  { label: '中共预备党员', value: '中共预备党员' },
  { label: '民主党派', value: '民主党派' },
])

// 表单验证规则
const rules: any = {
  name: [
    {
      required: true,
      message: '请输入姓名',
    },
  ],
  studentId: [
    {
      required: true,
      message: '请输入学号',
    },
  ],
  email: [
    {
      required: true,
      message: '请输入邮箱',
    },
    {
      required: false,
      pattern: /^[\w.%+-]+@[\w.-]+\.[a-z]{2,}$/i,
      message: '邮箱格式不正确',
    },
  ],
  phone: [
    {
      required: true,
      message: '请输入手机号',
    },
    {
      required: false,
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式不正确',
    },
  ],
  qqNumber: [
    {
      required: true,
      message: '请输入QQ号',
    },
    {
      required: false,
      pattern: /^[1-9]\d{4,10}$/,
      message: 'QQ号格式不正确',
    },
  ],
  nation: [
    {
      required: true,
      message: '请输入民族',
    },
  ],
  userIntroduce: [
    {
      required: true,
      message: '请输入个人介绍',
    },
  ],
  joinReason: [
    {
      required: true,
      message: '请输入加入原因',
    },
  ],
  personalSkills: [
    {
      required: true,
      message: '请输入个人技能',
    },
  ],
  interestDirection: [
    {
      required: true,
      message: '请输入兴趣方向',
    },
  ],
  province: [
    {
      required: true,
      message: '请输入省份',
    },
  ],
  city: [
    {
      required: true,
      message: '请输入市/区',
    },
  ],
  schoolDept: [
    {
      required: true,
      message: '请输入学院',
    },
  ],
  major: [
    {
      required: true,
      message: '请输入专业',
    },
  ],
  classNumber: [
    {
      required: true,
      message: '请输入班级',
    },
  ],
}

const formRef = ref()

// 加载纳新配置
async function loadRecruitmentConfig() {
  try {
    loading.value = true

    // 临时mock数据，用于开发调试
    const mockData = {
      code: 0,
      data: {
        id: 1,
        name: '2024年春季纳新',
        startTime: '2024-03-01 09:00:00',
        endTime: '2024-03-31 18:00:00',
        grade: 1,
        groupLink: 'https://qm.qq.com/cgi-bin/qm/qr?k=123456',
        status: 0, // 0-开始报名
        createTime: '2024-03-01 09:00:00',
      },
      msg: '获取成功',
    }

    // 首先尝试真实API
    try {
      const response = await getUserRecruitmentConfig()
      console.log('纳新配置响应:', response)

      if (response.code === 1002032101) {
        // 没有纳新计划
        console.log('⚠️ 暂无正在进行的纳新计划，开发环境将使用mock数据')
        if (import.meta.env.DEV) {
          // 开发环境：使用mock数据继续开发
          recruitmentConfig.value = mockData.data
          formData.value.settingId = mockData.data.id
          showTemplateMessage.value = true
          showToast({
            message: '开发模式：使用模拟纳新数据',
            icon: 'none',
          })
        }
        else {
          // 生产环境：显示无纳新计划
          showNoRecruitment.value = true
        }
        return
      }
      if (response.code !== 0) {
        throw new Error(response.msg || '获取纳新配置失败')
      }

      // 使用真实数据
      recruitmentConfig.value = response.data
      formData.value.settingId = response.data.id

      // 检查纳新状态
      if (response.data.status === 0) {
        showTemplateMessage.value = true
      }
      else {
        showNoRecruitment.value = true
      }
    }
    catch (apiError) {
      console.warn('API调用失败，使用mock数据:', apiError)

      // 使用mock数据继续开发
      recruitmentConfig.value = mockData.data
      formData.value.settingId = mockData.data.id

      // 显示模板消息
      showTemplateMessage.value = true

      showToast({
        message: 'API暂不可用，使用模拟数据',
        icon: 'none',
      })
    }
  }
  catch (error) {
    console.error('获取纳新配置失败:', error)
    showToast({
      message: '网络错误，请稍后重试',
      icon: 'error',
    })
    // 暂时允许继续显示表单，用于调试
    // showNoRecruitment.value = true
  }
  finally {
    loading.value = false
  }
}

// 页面加载时获取纳新配置
onLoad(() => {
  loadRecruitmentConfig()
})

// 页面显示时获取纳新配置
onShow(() => {
  loadRecruitmentConfig()
})

// 时间格式化
function formatTime(timeStr: string) {
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

// 模板消息确认
function onConfirmTemplate() {
  showTemplateMessage.value = false
}

// 加入纳新群
function onJoinGroup() {
  if (recruitmentConfig.value?.groupLink) {
    // 复制群链接到剪贴板
    uni.setClipboardData({
      data: recruitmentConfig.value.groupLink,
      success: () => {
        showToast('群链接已复制到剪贴板')
      },
    })
  }
  showTemplateMessage.value = false
}

// 无纳新计划确认
function onNoRecruitmentConfirm() {
  uni.navigateBack()
}

// 开发模式继续
function onDevModeContinue() {
  console.log('🔧 开发模式：强制显示纳新表单')

  // 使用mock数据
  const mockData = {
    id: 1,
    name: '开发模式-模拟纳新',
    startTime: '2024-03-01 09:00:00',
    endTime: '2024-03-31 18:00:00',
    grade: 1,
    groupLink: 'https://qm.qq.com/cgi-bin/qm/qr?k=dev-mock',
    status: 0,
    createTime: '2024-03-01 09:00:00',
  }

  recruitmentConfig.value = mockData
  formData.value.settingId = mockData.id
  showNoRecruitment.value = false
  showTemplateMessage.value = false // 不显示须知弹窗，直接显示表单

  showToast({
    message: '开发模式：已加载模拟数据',
    icon: 'success',
  })

  // 输出调试信息
  console.log('🐛 开发模式状态:', {
    loading: loading.value,
    showNoRecruitment: showNoRecruitment.value,
    showTemplateMessage: showTemplateMessage.value,
    recruitmentConfig: !!recruitmentConfig.value,
  })
}

// 年级选择
function onGradeChange(value: any) {
  formData.value.grade = value.value
}

// 生日选择
function onBirthdayChange(value: any) {
  formData.value.birthday = value
}

// 政治面貌选择
function onPoliticalChange(value: any) {
  formData.value.politicalOutlook = value.value
}

// 文件上传前处理
function beforeUpload(file: any) {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    showToast('请选择图片文件')
    return false
  }

  // 检查文件大小 (5MB)
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    showToast('图片大小不能超过5MB')
    return false
  }

  return true
}

// 文件上传成功
function onUploadSuccess(response: any) {
  console.log('上传成功响应:', response)
  if (response && response.url) {
    formData.value.imageUrl = response.url
    showToast('照片上传成功')
  }
  else {
    console.error('上传响应格式异常:', response)
    showToast('照片上传失败，响应格式异常')
  }
}

// 文件上传失败
function onUploadError(error: any) {
  console.error('照片上传失败:', error)
  showToast('照片上传失败，请重试')
}

// 提交申请
async function onSubmit() {
  try {
    // 表单验证
    if (formRef.value) {
      const valid = await formRef.value.validate()
      if (!valid) {
        return
      }
    }

    // 检查必填项
    if (!formData.value.imageUrl) {
      showToast('请上传证件照')
      return
    }

    if (!formData.value.birthday) {
      showToast('请选择出生日期')
      return
    }

    if (!formData.value.grade) {
      showToast('请选择年级')
      return
    }

    if (!formData.value.politicalOutlook) {
      showToast('请选择政治面貌')
      return
    }

    submitting.value = true

    // 提交申请
    const response = await createUserRecruitment(formData.value)

    if (response.code === 0) {
      showToast('申请提交成功')
      // 跳转回上一页或首页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
    else {
      showToast(response.msg || '提交失败，请重试')
    }
  }
  catch (error) {
    console.error('提交申请失败:', error)
    showToast('提交失败，请检查网络连接')
  }
  finally {
    submitting.value = false
  }
}

// 调试信息显示
function showDebugInfo() {
  const debugInfo = {
    loading: loading.value,
    submitting: submitting.value,
    showTemplateMessage: showTemplateMessage.value,
    showNoRecruitment: showNoRecruitment.value,
    recruitmentConfig: recruitmentConfig.value,
    formDataValid: !!formData.value.name,
    devMode: devMode.value,
    env: import.meta.env.DEV ? 'development' : 'production',
    apiResponse: 'check console',
  }

  console.log('🐛 调试信息:', debugInfo)

  uni.showModal({
    title: '调试信息',
    content: JSON.stringify(debugInfo, null, 2),
    showCancel: false,
  })
}

// 强制显示表单（开发调试用）
function forceShowForm() {
  console.log('🚀 强制显示表单')

  // 设置模拟数据
  if (!recruitmentConfig.value) {
    recruitmentConfig.value = {
      id: 999,
      name: '强制显示模式',
      startTime: '2024-01-01 09:00:00',
      endTime: '2024-12-31 18:00:00',
      grade: 1,
      groupLink: '',
      status: 0,
      createTime: '2024-01-01 09:00:00',
    }
    formData.value.settingId = 999
  }

  // 关闭所有弹窗
  loading.value = false
  showNoRecruitment.value = false
  showTemplateMessage.value = false

  showToast({
    message: '强制显示模式已启用',
    icon: 'success',
  })
}
</script>

<template>
  <view class="recruitment-page">
    <!-- 模板消息弹窗 -->
    <wd-message-box
      v-model="showTemplateMessage"
      type="warning"
      title="纳新登记须知"
      :close-on-click-modal="false"
      :show-cancel-button="true"
      confirm-button-text="我知道了"
      cancel-button-text="加入纳新群"
      @confirm="onConfirmTemplate"
      @cancel="onJoinGroup"
    >
      <view class="template-message">
        <span class="message-text">
          您的信息仅用于工作室报名申请，不会发生泄露！<br>
          请保证所填写的信息真实有效，请按照要求正确填写！<br>
          如有疑问请联系纳新群管理员！
        </span>
        <span v-if="recruitmentConfig" class="time-text">
          本次纳新时间为：{{ formatTime(recruitmentConfig.startTime) }} - {{ formatTime(recruitmentConfig.endTime) }}
        </span>
      </view>
    </wd-message-box>

    <!-- 无纳新计划提醒弹窗 -->
    <wd-message-box
      v-model="showNoRecruitment"
      type="error"
      title="暂无纳新计划"
      :close-on-click-modal="false"
      :show-cancel-button="devMode"
      confirm-button-text="确定"
      cancel-button-text="开发模式继续"
      @confirm="onNoRecruitmentConfirm"
      @cancel="onDevModeContinue"
    >
      <span>当前暂无正在进行的纳新计划，请关注官方通知。</span>
      <view v-if="devMode" class="mt-2 text-xs text-orange-600">
        💡 开发模式：可以点击"开发模式继续"查看页面效果
      </view>
    </wd-message-box>

    <!-- 主要表单内容 -->
    <view v-if="!loading && (recruitmentConfig || devMode)" class="form-container">
      <!-- 开发模式提示 -->
      <view v-if="devMode && !recruitmentConfig" class="mb-4 rounded-lg bg-orange-50 p-3">
        <view class="flex items-center text-sm text-orange-600">
          🐛 当前为开发模式，使用模拟数据
        </view>
      </view>
      <wd-form ref="formRef" :model="formData" :rules="rules">
        <!-- 姓名 -->
        <wd-cell-group title="基本信息" border>
          <wd-input
            v-model="formData.name"
            label="姓名"
            placeholder="请输入真实姓名"
            required
            prop="name"
          />

          <!-- 性别 -->
          <wd-cell title="性别" required>
            <wd-radio-group v-model="formData.sex" inline>
              <wd-radio :value="1">
                男
              </wd-radio>
              <wd-radio :value="2">
                女
              </wd-radio>
            </wd-radio-group>
          </wd-cell>

          <!-- 证件照 -->
          <wd-cell title="证件照" required>
            <view class="upload-container">
              <wd-upload
                v-model="photoList"
                :limit="1"
                accept="image"
                :before-upload="beforeUpload"
                @success="onUploadSuccess"
                @error="onUploadError"
              >
                <wd-button type="primary" size="small">
                  选择照片
                </wd-button>
              </wd-upload>
              <view v-if="formData.imageUrl" class="mt-2 text-xs text-green-600">
                📷 照片已上传
              </view>
            </view>
          </wd-cell>

          <!-- 学号 -->
          <wd-input
            v-model="formData.studentId"
            label="学号"
            placeholder="请输入学号"
            required
            prop="studentId"
          />

          <!-- QQ号 -->
          <wd-input
            v-model="formData.qqNumber"
            label="QQ号"
            placeholder="请输入QQ号"
            required
            prop="qqNumber"
          />

          <!-- 邮箱 -->
          <wd-input
            v-model="formData.email"
            label="邮箱"
            placeholder="请输入邮箱地址"
            required
            prop="email"
          />

          <!-- 手机号 -->
          <wd-input
            v-model="formData.phone"
            label="手机号"
            placeholder="请输入手机号"
            required
            prop="phone"
          />
        </wd-cell-group>

        <!-- 学院专业信息 -->
        <wd-cell-group title="学院专业信息" border>
          <!-- 学院 -->
          <wd-input
            v-model="formData.schoolDept"
            label="学院"
            placeholder="请输入所在学院"
            required
            prop="schoolDept"
          />

          <!-- 专业 -->
          <wd-input
            v-model="formData.major"
            label="专业"
            placeholder="请输入专业"
            required
            prop="major"
          />

          <!-- 班级 -->
          <wd-input
            v-model="formData.classNumber"
            label="班级"
            placeholder="请输入班级"
            required
            prop="classNumber"
          />

          <!-- 年级 -->
          <wd-cell title="年级" required>
            <wd-picker
              v-model="formData.grade"
              :columns="gradeOptions"
              @confirm="onGradeChange"
            />
          </wd-cell>
        </wd-cell-group>

        <!-- 个人信息 -->
        <wd-cell-group title="个人详细信息" border>
          <!-- 出生日期 -->
          <wd-cell title="出生日期" required>
            <wd-datetime-picker
              v-model="formData.birthday"
              type="date"
              @confirm="onBirthdayChange"
            />
          </wd-cell>

          <!-- 民族 -->
          <wd-input
            v-model="formData.nation"
            label="民族"
            placeholder="请输入民族"
            required
            prop="nation"
          />

          <!-- 政治面貌 -->
          <wd-cell title="政治面貌" required>
            <wd-picker
              v-model="formData.politicalOutlook"
              :columns="politicalOptions"
              @confirm="onPoliticalChange"
            />
          </wd-cell>

          <!-- 籍贯 -->
          <wd-input
            v-model="formData.province"
            label="省份"
            placeholder="请输入省份"
            required
            prop="province"
          />

          <wd-input
            v-model="formData.city"
            label="市/区"
            placeholder="请输入市或区"
            required
            prop="city"
          />
        </wd-cell-group>

        <!-- 个人能力信息 -->
        <wd-cell-group title="个人能力与意向" border>
          <!-- 个人介绍 -->
          <wd-textarea
            v-model="formData.userIntroduce"
            label="个人介绍"
            placeholder="请简要介绍自己（200字以内）"
            :maxlength="200"
            show-word-limit
            required
            prop="userIntroduce"
          />

          <!-- 加入原因 -->
          <wd-textarea
            v-model="formData.joinReason"
            label="加入原因"
            placeholder="请说明加入工作室的原因（200字以内）"
            :maxlength="200"
            show-word-limit
            required
            prop="joinReason"
          />

          <!-- 个人技能 -->
          <wd-textarea
            v-model="formData.personalSkills"
            label="个人技能"
            placeholder="请描述您的个人技能和特长（200字以内）"
            :maxlength="200"
            show-word-limit
            required
            prop="personalSkills"
          />

          <!-- 兴趣方向 -->
          <wd-textarea
            v-model="formData.interestDirection"
            label="兴趣方向"
            placeholder="请描述您感兴趣的技术方向（200字以内）"
            :maxlength="200"
            show-word-limit
            required
            prop="interestDirection"
          />
        </wd-cell-group>

        <!-- 提交按钮 -->
        <view class="submit-container">
          <wd-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="onSubmit"
          >
            提交申请
          </wd-button>
        </view>
      </wd-form>
    </view>

    <!-- 调试信息 -->
    <view v-if="loading" class="fixed inset-0 flex items-center justify-center bg-white">
      <view class="text-center">
        <wd-loading />
        <view class="mt-4 text-sm text-gray-500">
          正在加载纳新配置...
        </view>
      </view>
    </view>

    <!-- 开发调试面板 -->
    <view v-if="!loading" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <view class="rounded-full bg-blue-500 px-3 py-2 text-xs text-white shadow-lg" @click="showDebugInfo">
        🐛 调试
      </view>
      <view v-if="devMode" class="rounded-full bg-green-500 px-3 py-2 text-xs text-white shadow-lg" @click="forceShowForm">
        📝 强制显示
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.recruitment-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.template-message {
  padding: 16px 0;

  .message-text {
    display: block;
    line-height: 1.6;
    margin-bottom: 16px;
    color: #666;
  }

  .time-text {
    display: block;
    font-weight: bold;
    color: #e74c3c;
  }
}

.form-container {
  padding: 16px;
}

.upload-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.submit-container {
  margin-top: 32px;
  margin-bottom: 32px;
}
</style>

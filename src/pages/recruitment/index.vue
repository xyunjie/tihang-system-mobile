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
import { ref } from 'vue'
import { useMessage } from 'wot-design-uni'
import { createUserRecruitment, getUserRecruitmentConfig } from '@/api/recruitment'
import { uploadFile } from '@/api/user'
import KspCropper from '@/components/ksp-cropper.vue'
import { showToast } from '@/utils/toast'

// 初始化消息框
const message = useMessage()

// 页面状态
const loading = ref(true)
const submitting = ref(false)

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
const showCropper = ref(false)
const cropperImageUrl = ref('')

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

    // 获取真实纳新配置
    const response = await getUserRecruitmentConfig()

    if (response.code === 1002032101) {
      // 没有纳新计划
      message.alert({
        msg: '当前暂无正在进行的纳新计划，请关注官方通知。',
        title: '暂无纳新计划',
        closeOnClickModal: false,
        showCancelButton: true,
      }).then(() => {
        console.log('暂无纳新计划,用户点击确定')
        // 回到上一层
        uni.navigateBack()
      }).catch(() => {
        console.log('暂无纳新计划,用户点击取消')
      })
      return
    }
    if (response.code !== 0) {
      // 没有纳新计划
      message.alert({
        msg: '获取纳新计划失败，请联系管理员解决！',
        title: '请求失败',
        closeOnClickModal: false,
        showCancelButton: false,
      }).then(() => {
        console.log('请求失败,用户点击确定')
        // 回到上一层
        uni.navigateBack()
      }).catch(() => {
        console.log('请求失败,用户点击取消')
      })
      return
    }
    // 使用真实数据
    recruitmentConfig.value = response.data
    formData.value.settingId = response.data.id

    // 显示纳新须知
    showRecruitmentNotice()
  }
  catch (error) {
    console.error('获取纳新配置失败:', error)
    showToast({
      message: '网络错误，请稍后重试',
      icon: 'error',
    })
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

// 显示纳新须知
function showRecruitmentNotice() {
  message.confirm({
    title: '纳新须知',
    msg: `您的信息仅用于工作室报名申请，不会发生泄露！
请保证所填写的信息真实有效，请按照要求正确填写！
如有疑问请联系纳新群管理员！\n
    
本次纳新时间为：${formatTime(recruitmentConfig.value!.startTime)} - ${formatTime(recruitmentConfig.value!.endTime)}`,
    confirmButtonText: '我知道了',
    cancelButtonText: '加入纳新群',
    closeOnClickModal: false,
  }).then(() => {
    // 用户点击了"我知道了"
    console.log('用户点击了"我知道了"')
  }).catch(() => {
    // 用户点击了"加入纳新群"
    if (recruitmentConfig.value?.groupLink) {
      console.log('用户点击了"加入纳新群"')
      // 复制群链接到剪贴板
      uni.setClipboardData({
        data: recruitmentConfig.value.groupLink,
        success: () => {
          showToast('群链接已复制到剪贴板')
        },
      })
    }
  })
}

// 时间格式化
function formatTime(timeStr: string) {
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
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

// 选择证件照
function onSelectPhoto() {
  uni.chooseImage({
    count: 1,
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      cropperImageUrl.value = tempFilePath
      showCropper.value = true
    },
    fail: (err) => {
      console.error('选择图片失败:', err)
      showToast('选择图片失败，请重试')
    },
  })
}

// 裁剪完成
function onCropperOk(res: any) {
  showCropper.value = false
  const tempFilePath = res.path

  // 上传裁剪后的图片
  uploadFile(tempFilePath)
    .then((url) => {
      formData.value.imageUrl = url
      showToast('照片上传成功')
    })
    .catch((error) => {
      console.error('上传失败:', error)
      showToast('照片上传失败，请重试')
    })
}

// 取消裁剪
function onCropperCancel() {
  showCropper.value = false
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
</script>

<template>
  <view class="min-h-screen bg-gray-100">
    <!-- 消息框组件 -->
    <wd-message-box />

    <!-- 图片裁剪组件 -->
    <ksp-cropper
      v-if="showCropper"
      :url="cropperImageUrl"
      :width="300"
      :height="400"
      mode="fixed"
      @ok="onCropperOk"
      @cancel="onCropperCancel"
    />

    <!-- 主要表单内容 -->
    <view v-if="!loading && recruitmentConfig" class="p-4">
      <wd-form ref="formRef" :model="formData" :rules="rules">
        <!-- 姓名 -->
        <wd-cell-group title="基本信息">
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
            <view class="flex flex-col items-center">
              <view
                class="h-33.25 w-25 flex flex-col items-center justify-center overflow-hidden border border-gray-400 rounded border-dashed bg-gray-50"
                @click="onSelectPhoto"
              >
                <image
                  v-if="formData.imageUrl"
                  :src="formData.imageUrl"
                  class="h-full w-full object-cover"
                  mode="aspectFill"
                />
                <view v-else class="h-full w-full flex flex-col items-center justify-center">
                  <wd-icon name="camera" size="24px" color="#999" />
                  <text class="mt-1 text-xs text-gray-500">
                    点击上传
                  </text>
                </view>
              </view>
              <text class="mt-2 text-xs text-gray-500">
                一寸证件照
              </text>
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
        <wd-cell-group title="学院专业信息">
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
        <wd-cell-group title="个人详细信息">
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
        <wd-cell-group title="个人能力与意向">
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
        <view class="mb-8 mt-8 px-4">
          <wd-button
            type="primary"
            size="large"
            block
            :loading="submitting"
            @click="onSubmit"
          >
            提交申请
          </wd-button>
        </view>
      </wd-form>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="fixed inset-0 flex items-center justify-center bg-white">
      <view class="text-center">
        <wd-loading />
        <view class="mt-4 text-sm text-gray-500">
          正在加载纳新配置...
        </view>
      </view>
    </view>
  </view>
</template>

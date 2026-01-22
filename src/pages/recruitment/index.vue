<!-- 使用 type="page" 属性设置页面 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "纳新登记"
  },
  "notLogin": true
}
</route>

<script setup lang="ts">
import type { UserRecruitmentConfigRespVO, UserRecruitmentSaveReqVO } from '@/api/types/recruitment'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useMessage } from 'wot-design-uni'
import { getCityList, getProvinceList } from '@/api/area'
import { getWxCode } from '@/api/login'
import { createUserRecruitment, getUserRecruitmentConfig } from '@/api/recruitment'
import { getClassList, getCollegeList, getMajorList } from '@/api/school-dept'
import { uploadFile } from '@/api/user'
import KspCropper from '@/components/ksp-cropper.vue'
import { DictTypeEnum } from '@/utils/dictTypes'
import { DictUtils } from '@/utils/dictUtils'
import { isMpWeixin } from '@/utils/platform'
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
    openid: '',
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
  },
)

// 照片上传
const showCropper = ref(false)
const cropperImageUrl = ref('')

const politicalOptions = ref<Array<{ label: string, value: string, id: number }>>([])

const nationOptions = ref<Array<{ label: string, value: string, id: number }>>([])

// 省市区选项数据
const provinceOptions = ref<Array<{ label: string, value: string, id: number }>>([])
const cityOptions = ref<Array<{ label: string, value: string, id: number }>>([])
const selectedProvinceId = ref<number | null>(null)
const selectedCityId = ref<number | null>(null)

// 学院专业班级选项数据
const collegeOptions = ref<Array<{ label: string, value: number, id: number }>>([])
const majorOptions = ref<Array<{ label: string, value: number, id: number }>>([])
const classOptions = ref<Array<{ label: string, value: number, id: number }>>([])
const selectedCollegeId = ref<number | null>(null)
const selectedMajorId = ref<number | null>(null)
const selectedClassId = ref<number | null>(null)

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
      message: '请选择省份',
    },
  ],
  city: [
    {
      required: true,
      message: '请选择市/区',
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

// 加载省市区数据
async function loadAreaData() {
  try {
    // 获取省份列表
    const provinces = await getProvinceList()
    provinceOptions.value = provinces.map(province => ({
      label: province.name,
      value: province.name,
      id: province.id,
    }))
  }
  catch (error) {
    showToast('网络错误，请稍后重试')
  }
}

// 加载城市数据
async function loadCityData(provinceId: number) {
  try {
    // 获取城市列表
    const cities = await getCityList(provinceId)
    cityOptions.value = cities.map(city => ({
      label: city.name,
      value: city.name,
      id: city.id,
    }))
  }
  catch (error) {
    showToast('网络错误，请稍后重试')
  }
}

// 加载学院数据
async function loadCollegeData() {
  try {
    // 获取学院列表（parentId为0表示顶级学院）
    const colleges = await getCollegeList()
    collegeOptions.value = colleges.map(college => ({
      label: college.name,
      value: college.id,
      id: college.id,
    }))
  }
  catch (error) {
    showToast('网络错误，请稍后重试')
  }
}

// 加载专业数据
async function loadMajorData(collegeId: number) {
  try {
    // 获取专业列表
    const majors = await getMajorList(collegeId)
    majorOptions.value = majors.map(major => ({
      label: major.name,
      value: major.id,
      id: major.id,
    }))
  }
  catch (error) {
    showToast('网络错误，请稍后重试')
  }
}

// 加载班级数据
async function loadClassData(majorId: number) {
  try {
    // 获取班级列表
    const classes = await getClassList(majorId, String(recruitmentConfig.value.grade).slice(-2))
    classOptions.value = classes.map(classItem => ({
      label: classItem.name,
      value: classItem.id,
      id: classItem.id,
    }))
  }
  catch (error) {
    showToast('网络错误，请稍后重试')
  }
}

async function loadNationData() {
  try {
    console.log('🔄 开始加载民族数据')

    // 获取民族列表
    const nations = await DictUtils.getDictData(DictTypeEnum.NATION)
    nationOptions.value = nations.map(nation => ({
      label: nation.label,
      value: nation.value,
      id: nation.id,
    }))

    console.log('✅ 民族数据加载完成:', nationOptions.value.length, '个民族')
  }
  catch (error) {
    console.error('❌ 加载民族数据失败:', error)
    showToast('网络错误，请稍后重试')
  }
}

async function loadPoliticalStatusData() {
  try {
    // 获取政治面貌列表
    const politicalStatuses = await DictUtils.getDictData(DictTypeEnum.POLITICAL_STATUS)
    politicalOptions.value = politicalStatuses.map(politicalStatus => ({
      label: politicalStatus.label,
      value: politicalStatus.value,
      id: politicalStatus.id,
    }))
  }
  catch (error) {
    console.error('❌ 加载政治面貌数据失败:', error)
    showToast('网络错误，请稍后重试')
  }
}

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
      })
      return
    }
    // 使用真实数据
    recruitmentConfig.value = response.data
    formData.value.settingId = response.data.id
    formData.value.grade = response.data.grade

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

// 获取微信登录凭证
async function getWxLoginCode() {
  // #ifdef MP-WEIXIN
  const res = await getWxCode()
  formData.value.openid = res.code
  // #endif
}

// 检查是否在微信环境中
function checkWechatEnvironment(): boolean {
  let isWechat = false
  // #ifdef MP-WEIXIN
  isWechat = true
  // #endif

  // #ifdef H5
  // 检查是否在微信浏览器中
  const ua = navigator.userAgent.toLowerCase()
  isWechat = ua.includes('micromessenger')
  // #endif

  // 其他平台（非微信环境）
  return isWechat
}

// 处理非微信环境的访问
function handleNonWechatEnvironment() {
  message.alert({
    msg: '纳新登记功能仅在微信环境中可用，请在微信小程序或微信浏览器中访问。',
    title: '访问受限',
    confirmButtonText: '我知道了',
    showCancelButton: false,
    closeOnClickModal: false,
  }).then(() => {
    // 返回上一页
    uni.navigateBack({
      fail: () => {
        // 如果无法返回，跳转到首页
        uni.reLaunch({
          url: '/pages/index/index',
        })
      },
    })
  }).catch(() => {
    // 用户点击遮罩（不应该发生，因为 closeOnClickModal 为 false）
    uni.navigateBack()
  })
}

// 页面加载时获取纳新配置
onLoad(async () => {
  // 检查微信环境
  if (!checkWechatEnvironment()) {
    handleNonWechatEnvironment()
    return
  }

  // 并行加载纳新配置、省市区数据、学院数据和微信登录凭证
  await Promise.all([
    loadRecruitmentConfig(),
    loadAreaData(),
    loadCollegeData(),
    loadNationData(),
    loadPoliticalStatusData(),
  ])
})

// 页面显示时获取纳新配置
onShow(() => {
  // loadRecruitmentConfig()
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
  }).catch(() => {
    // 用户点击了"加入纳新群"
    if (recruitmentConfig.value?.groupLink) {
      openGroupLink(recruitmentConfig.value.groupLink)
    }
  })
}

// 打开纳新群链接
function openGroupLink(url: string) {
  uni.navigateTo({
    url: `/pages-sub/webview/index?url=${encodeURIComponent(url)}`,
    fail: (err) => {
      console.error('打开链接失败:', err)
      showToast('打开链接失败，请稍后重试')
    },
  })
}

// 时间格式化
function formatTime(timeStr: string | number) {
  try {
    const date = new Date(timeStr)
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  }
  catch {
    return String(timeStr)
  }
}

// 生日选择
function onBirthdayChange(value: any) {
  // 处理时间戳转换为日期格式
  const timestamp = value.value // 获取时间戳
  if (!timestamp)
    return

  // 将时间戳转换为 yyyy-MM-dd 格式
  const date = new Date(Number(timestamp))
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  formData.value.birthday = `${year}-${month}-${day}`
}

// 政治面貌选择
function onPoliticalChange(value: any) {
  formData.value.politicalOutlook = value.value
}

// 政治面貌选择
function onNationChange(value: any) {
  formData.value.nation = value.value
}

// 省份选择
async function onProvinceChange(value: any) {
  const selectedOption = provinceOptions.value.find(option => option.value === value.value)
  if (selectedOption) {
    formData.value.province = selectedOption.value
    selectedProvinceId.value = selectedOption.id

    // 清空城市选择
    formData.value.city = ''
    selectedCityId.value = null
    cityOptions.value = []

    // 加载对应的城市数据
    await loadCityData(selectedOption.id)
  }
}

// 城市选择
function onCityChange(value: any) {
  const selectedOption = cityOptions.value.find(option => option.value === value.value)
  if (selectedOption) {
    formData.value.city = selectedOption.value
    selectedCityId.value = selectedOption.id
  }
}

// 学院选择
async function onCollegeChange(value: any) {
  const selectedOption = collegeOptions.value.find(option => option.value === value.value)
  if (selectedOption) {
    selectedCollegeId.value = selectedOption.id

    selectedMajorId.value = null
    selectedClassId.value = null
    majorOptions.value = []
    classOptions.value = []

    // 加载对应的专业数据
    await loadMajorData(selectedOption.id)
  }
}

// 专业选择
async function onMajorChange(value: any) {
  const selectedOption = majorOptions.value.find(option => option.value === value.value)
  if (selectedOption) {
    selectedMajorId.value = selectedOption.id

    selectedClassId.value = null
    classOptions.value = []

    // 加载对应的班级数据
    await loadClassData(selectedOption.id)
  }
}

// 班级选择
function onClassChange(value: any) {
  const selectedOption = classOptions.value.find(option => option.value === value.value)
  if (selectedOption) {
    formData.value.schoolDeptId = selectedOption.value
    selectedClassId.value = selectedOption.id
  }
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
      showToast('网络错误，请稍后重试')
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

    if (!selectedCollegeId.value) {
      showToast('请选择学院')
      return
    }

    if (!selectedMajorId.value) {
      showToast('请选择专业')
      return
    }

    if (!selectedClassId.value) {
      showToast('请选择班级')
      return
    }

    submitting.value = true

    // 准备提交数据，包含微信code用于后端获取openid
    await getWxLoginCode()
    const submitData = {
      ...formData.value,
    }

    // 提交申请
    const response = await createUserRecruitment(submitData)

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
  <view class="recruitment-page min-h-screen bg-[#f5f7fa]">
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

    <!-- 顶部 Header -->
    <view class="header-section relative overflow-hidden from-[#2563eb] to-[#1e40af] bg-gradient-to-br px-6 pb-12 pt-8">
      <!-- 装饰圆形 -->
      <view class="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-white/10" />
      <view class="absolute bottom-[-20px] left-[-20px] h-24 w-24 rounded-full bg-white/5" />

      <view class="relative z-10">
        <view class="mb-2 text-2xl text-white font-bold">
          纳新登记
        </view>
        <view class="text-sm text-white/80">
          欢迎加入我们，开启你的技术之旅
        </view>
      </view>
    </view>

    <!-- 主要表单内容 -->
    <view v-if="!loading && recruitmentConfig" class="relative z-10 mt-[-24px] px-4 pb-8">
      <wd-form ref="formRef" :model="formData" :rules="rules">
        <!-- 基本信息卡片 -->
        <view class="form-card mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <view class="card-header mb-4 flex items-center">
            <view class="mr-3 h-8 w-1 rounded-full bg-[#2563eb]" />
            <text class="text-lg text-gray-800 font-semibold">
              基本信息
            </text>
          </view>

          <!-- 证件照上传 -->
          <view class="photo-upload mb-6 flex items-center">
            <view
              class="photo-box relative h-32 w-24 flex flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden border-2 border-[#2563eb]/30 rounded-xl border-dashed bg-[#f0f7ff] transition-all"
              hover-class="border-[#2563eb]"
              @click="onSelectPhoto"
            >
              <image
                v-if="formData.imageUrl"
                :src="formData.imageUrl"
                class="h-full w-full object-cover"
                mode="aspectFill"
              />
              <view v-else class="flex flex-col items-center">
                <wd-icon name="camera" size="28px" color="#2563eb" />
                <text class="mt-2 text-xs text-[#2563eb]">
                  上传照片
                </text>
              </view>
            </view>
            <view class="ml-4 flex-1">
              <text class="mb-1 block text-sm text-gray-700 font-medium">
                一寸证件照 <text class="text-red-500">
                  *
                </text>
              </text>
              <text class="text-xs text-gray-400">
                请上传清晰的正面免冠照片
              </text>
            </view>
          </view>

          <wd-input
            v-model="formData.name"
            label="姓名"
            placeholder="请输入真实姓名"
            required
            prop="name"
          />

          <wd-cell title="性别" required center>
            <wd-radio-group v-model="formData.sex" shape="button">
              <wd-radio :value="1">
                男
              </wd-radio>
              <wd-radio :value="2">
                女
              </wd-radio>
            </wd-radio-group>
          </wd-cell>

          <wd-input
            v-model="formData.studentId"
            label="学号"
            placeholder="请输入学号"
            required
            prop="studentId"
          />

          <wd-input
            v-model="formData.phone"
            label="手机号"
            placeholder="请输入手机号"
            required
            prop="phone"
          />

          <wd-input
            v-model="formData.qqNumber"
            label="QQ号"
            placeholder="请输入QQ号"
            required
            prop="qqNumber"
          />

          <wd-input
            v-model="formData.email"
            label="邮箱"
            placeholder="请输入邮箱地址"
            required
            prop="email"
          />
        </view>

        <!-- 个人详细信息卡片 -->
        <view class="form-card mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <view class="card-header mb-4 flex items-center">
            <view class="mr-3 h-8 w-1 rounded-full bg-[#2563eb]" />
            <text class="text-lg text-gray-800 font-semibold">
              个人详情
            </text>
          </view>

          <wd-cell title="出生日期" required center>
            <wd-datetime-picker
              v-model="formData.birthday"
              :min-date="946656000000"
              type="date"
              @confirm="onBirthdayChange"
            />
          </wd-cell>

          <wd-cell title="民族" required center>
            <wd-picker
              v-model="formData.nation"
              :columns="nationOptions"
              @confirm="onNationChange"
            />
          </wd-cell>

          <wd-cell title="政治面貌" required center>
            <wd-picker
              v-model="formData.politicalOutlook"
              :columns="politicalOptions"
              @confirm="onPoliticalChange"
            />
          </wd-cell>

          <wd-cell title="省份" required center>
            <wd-picker
              v-model="formData.province"
              :columns="provinceOptions"
              placeholder="请选择省份"
              @confirm="onProvinceChange"
            />
          </wd-cell>

          <wd-cell title="市/区" required center>
            <wd-picker
              v-model="formData.city"
              :columns="cityOptions"
              placeholder="请选择市或区"
              :disabled="!selectedProvinceId"
              @confirm="onCityChange"
            />
          </wd-cell>
        </view>

        <!-- 学院专业信息卡片 -->
        <view class="form-card mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <view class="card-header mb-4 flex items-center">
            <view class="mr-3 h-8 w-1 rounded-full bg-[#2563eb]" />
            <text class="text-lg text-gray-800 font-semibold">
              学院信息
            </text>
          </view>

          <wd-cell title="学院" required center>
            <wd-picker
              v-model="selectedCollegeId"
              :columns="collegeOptions"
              placeholder="请选择学院"
              @confirm="onCollegeChange"
            />
          </wd-cell>

          <wd-cell title="专业" required center>
            <wd-picker
              v-model="selectedMajorId"
              :columns="majorOptions"
              placeholder="请选择专业"
              :disabled="!selectedCollegeId"
              @confirm="onMajorChange"
            />
          </wd-cell>

          <wd-cell title="班级" required center>
            <wd-picker
              v-model="selectedClassId"
              :columns="classOptions"
              placeholder="请选择班级"
              :disabled="!selectedMajorId"
              @confirm="onClassChange"
            />
          </wd-cell>
        </view>

        <!-- 个人能力与意向卡片 -->
        <view class="form-card mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <view class="card-header mb-4 flex items-center">
            <view class="mr-3 h-8 w-1 rounded-full bg-[#2563eb]" />
            <text class="text-lg text-gray-800 font-semibold">
              能力与意向
            </text>
          </view>

          <view class="textarea-section mb-4">
            <view class="mb-2 text-sm text-gray-700 font-medium">
              个人介绍 <text class="text-red-500">
                *
              </text>
            </view>
            <wd-textarea
              v-model="formData.userIntroduce"
              placeholder="请简要介绍自己（兴趣爱好、性格特点等）"
              :maxlength="200"
              show-word-limit
              required
              prop="userIntroduce"
            />
          </view>

          <view class="textarea-section mb-4">
            <view class="mb-2 text-sm text-gray-700 font-medium">
              加入原因 <text class="text-red-500">
                *
              </text>
            </view>
            <wd-textarea
              v-model="formData.joinReason"
              placeholder="请说明加入工作室的原因"
              :maxlength="200"
              show-word-limit
              required
              prop="joinReason"
            />
          </view>

          <view class="textarea-section mb-4">
            <view class="mb-2 text-sm text-gray-700 font-medium">
              个人技能 <text class="text-red-500">
                *
              </text>
            </view>
            <wd-textarea
              v-model="formData.personalSkills"
              placeholder="请描述您的个人技能和特长"
              :maxlength="200"
              show-word-limit
              required
              prop="personalSkills"
            />
          </view>

          <view class="textarea-section">
            <view class="mb-2 text-sm text-gray-700 font-medium">
              兴趣方向 <text class="text-red-500">
                *
              </text>
            </view>
            <wd-textarea
              v-model="formData.interestDirection"
              placeholder="请描述您感兴趣的技术方向"
              :maxlength="200"
              show-word-limit
              required
              prop="interestDirection"
            />
          </view>
        </view>

        <!-- 提交按钮 -->
        <view class="submit-section mt-6 px-2 pb-8">
          <wd-button
            type="primary"
            size="large"
            block
            :loading="submitting"
            custom-class="submit-btn"
            @click="onSubmit"
          >
            提交申请
          </wd-button>
          <view class="mt-3 text-center text-xs text-gray-400">
            提交即表示您同意我们的信息收集与使用规范
          </view>
        </view>
      </wd-form>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <view class="text-center">
        <wd-loading color="#2563eb" />
        <view class="mt-4 text-sm text-gray-500">
          正在加载纳新配置...
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.recruitment-page {
  --primary-color: #2563eb;
}

.form-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.photo-box:active {
  border-color: var(--primary-color);
  background-color: #e0edff;
}

:deep(.submit-btn) {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  height: 48px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
}

:deep(.wd-input) {
  padding: 12px 0;
}

:deep(.wd-cell) {
  padding: 4px 0;
}

:deep(.wd-textarea) {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
}

.wd-input {
  padding: 12px 0 !important;
}
</style>

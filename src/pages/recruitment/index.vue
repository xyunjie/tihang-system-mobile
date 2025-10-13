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
    console.log('🔄 开始加载省份数据...')

    // 获取省份列表
    const provinces = await getProvinceList()
    provinceOptions.value = provinces.map(province => ({
      label: province.name,
      value: province.name,
      id: province.id,
    }))

    console.log('✅ 省份数据加载完成:', provinceOptions.value.length, '个省份')
  }
  catch (error) {
    console.error('❌ 加载省份数据失败:', error)
    showToast('加载省份数据失败，请稍后重试')
  }
}

// 加载城市数据
async function loadCityData(provinceId: number) {
  try {
    console.log('🔄 开始加载城市数据，省份ID:', provinceId)

    // 获取城市列表
    const cities = await getCityList(provinceId)
    cityOptions.value = cities.map(city => ({
      label: city.name,
      value: city.name,
      id: city.id,
    }))

    console.log('✅ 城市数据加载完成:', cityOptions.value.length, '个城市')
  }
  catch (error) {
    console.error('❌ 加载城市数据失败:', error)
    showToast('加载城市数据失败，请稍后重试')
  }
}

// 加载学院数据
async function loadCollegeData() {
  try {
    console.log('🔄 开始加载学院数据')

    // 获取学院列表（parentId为0表示顶级学院）
    const colleges = await getCollegeList()
    collegeOptions.value = colleges.map(college => ({
      label: college.name,
      value: college.id,
      id: college.id,
    }))

    console.log('✅ 学院数据加载完成:', collegeOptions.value.length, '个学院')
  }
  catch (error) {
    console.error('❌ 加载学院数据失败:', error)
    showToast('加载学院数据失败，请稍后重试')
  }
}

// 加载专业数据
async function loadMajorData(collegeId: number) {
  try {
    console.log('🔄 开始加载专业数据，学院ID:', collegeId)

    // 获取专业列表
    const majors = await getMajorList(collegeId)
    majorOptions.value = majors.map(major => ({
      label: major.name,
      value: major.id,
      id: major.id,
    }))

    console.log('✅ 专业数据加载完成:', majorOptions.value.length, '个专业')
  }
  catch (error) {
    console.error('❌ 加载专业数据失败:', error)
    showToast('加载专业数据失败，请稍后重试')
  }
}

// 加载班级数据
async function loadClassData(majorId: number) {
  try {
    console.log('🔄 开始加载班级数据，专业ID:', majorId)

    // 获取班级列表
    const classes = await getClassList(majorId, String(recruitmentConfig.value.grade).slice(-2))
    classOptions.value = classes.map(classItem => ({
      label: classItem.name,
      value: classItem.id,
      id: classItem.id,
    }))

    console.log('✅ 班级数据加载完成:', classOptions.value.length, '个班级')
  }
  catch (error) {
    console.error('❌ 加载班级数据失败:', error)
    showToast('加载班级数据失败，请稍后重试')
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
    showToast('加载民族数据失败，请稍后重试')
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
    showToast('加载政治面貌数据失败，请稍后重试')
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
        console.log('请求失败,用户点击取消')
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
  try {
    // 检查是否在微信小程序环境
    // #ifdef MP-WEIXIN
    console.log('🔄 开始获取微信登录凭证')
    const res = await getWxCode()
    formData.value.openid = res.code
    console.log('✅ 微信登录凭证获取成功:', res.code)
    // #endif

    // #ifndef MP-WEIXIN
    console.log('⚠️ 非微信小程序环境，跳过获取微信登录凭证')
    // #endif
  }
  catch (error) {
    console.error('❌ 获取微信登录凭证失败:', error)
    // 获取失败不影响正常流程，只是无法获取openid
  }
}

// 页面加载时获取纳新配置
onLoad(async () => {
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
            <wd-radio-group v-model="formData.sex" shape="button">
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

        <!-- 个人信息 -->
        <wd-cell-group title="个人详细信息">
          <!-- 出生日期 -->
          <wd-cell title="出生日期" required>
            <wd-datetime-picker
              v-model="formData.birthday"
              :min-date="946656000000"
              type="date"
              @confirm="onBirthdayChange"
            />
          </wd-cell>

          <!-- 民族 -->
          <wd-cell title="民族" required>
            <wd-picker
              v-model="formData.nation"
              :columns="nationOptions"
              @confirm="onNationChange"
            />
          </wd-cell>

          <!-- 政治面貌 -->
          <wd-cell title="政治面貌" required>
            <wd-picker
              v-model="formData.politicalOutlook"
              :columns="politicalOptions"
              @confirm="onPoliticalChange"
            />
          </wd-cell>

          <!-- 籍贯 -->
          <wd-cell title="省份" required>
            <wd-picker
              v-model="formData.province"
              :columns="provinceOptions"
              placeholder="请选择省份"
              @confirm="onProvinceChange"
            />
          </wd-cell>

          <wd-cell title="市/区" required>
            <wd-picker
              v-model="formData.city"
              :columns="cityOptions"
              placeholder="请选择市或区"
              :disabled="!selectedProvinceId"
              @confirm="onCityChange"
            />
          </wd-cell>
        </wd-cell-group>

        <!-- 学院专业信息 -->
        <wd-cell-group title="学院专业信息">
          <!-- 学院 -->
          <wd-cell title="学院" required>
            <wd-picker
              v-model="selectedCollegeId"
              :columns="collegeOptions"
              placeholder="请选择学院"
              @confirm="onCollegeChange"
            />
          </wd-cell>

          <!-- 专业 -->
          <wd-cell title="专业" required>
            <wd-picker
              v-model="selectedMajorId"
              :columns="majorOptions"
              placeholder="请选择专业"
              :disabled="!selectedCollegeId"
              @confirm="onMajorChange"
            />
          </wd-cell>

          <!-- 班级 -->
          <wd-cell title="班级" required>
            <wd-picker
              v-model="selectedClassId"
              :columns="classOptions"
              placeholder="请选择班级"
              :disabled="!selectedMajorId"
              @confirm="onClassChange"
            />
          </wd-cell>
        </wd-cell-group>

        <!-- 个人能力信息 -->
        <wd-cell-group title="个人能力与意向">
          <!-- 个人介绍 -->
          <wd-cell title="个人介绍" vertical required>
            <wd-textarea
              v-model="formData.userIntroduce"
              placeholder="请简要介绍自己"
              :maxlength="200"
              show-word-limit
              required
              prop="userIntroduce"
            />
          </wd-cell>

          <!-- 加入原因 -->
          <wd-cell title="加入原因" vertical required>
            <wd-textarea
              v-model="formData.joinReason"
              placeholder="请说明加入工作室的原因"
              :maxlength="200"
              show-word-limit
              required
              prop="joinReason"
            />
          </wd-cell>

          <!-- 个人技能 -->
          <wd-cell title="个人技能" vertical required>
            <wd-textarea
              v-model="formData.personalSkills"
              placeholder="请描述您的个人技能和特长"
              :maxlength="200"
              show-word-limit
              required
              prop="personalSkills"
            />
          </wd-cell>

          <!-- 兴趣方向 -->
          <wd-cell title="兴趣方向" vertical required>
            <wd-textarea
              v-model="formData.interestDirection"
              placeholder="请描述您感兴趣的技术方向"
              :maxlength="200"
              show-word-limit
              required
              prop="interestDirection"
            />
          </wd-cell>
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

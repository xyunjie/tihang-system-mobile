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
import type { UserRecruitmentConfigRespVO, UserRecruitmentRespVO, UserRecruitmentSaveReqVO } from '@/api/types/recruitment'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'
import { useMessage } from 'wot-design-uni'
import { getCityList, getProvinceList } from '@/api/area'
import { getSocialAuthRedirect, getWxCode, getWxUserInfoApi } from '@/api/login'
import { createUserRecruitment, getSubmitStatus, getUserRecruitmentConfig, updateUserRecruitment } from '@/api/recruitment'
import { getClassList, getCollegeList, getMajorList } from '@/api/school-dept'
import { RecruitmentStatus } from '@/api/types/recruitment'
import { uploadFile } from '@/api/user'
import KspCropper from '@/components/ksp-cropper.vue'
import { useRecruitmentToken } from '@/composables/useRecruitmentToken'
import { useAppStore } from '@/store/app'
import { DictTypeEnum } from '@/utils/dictTypes'
import { DictUtils } from '@/utils/dictUtils'
import { getSocialType, isWechatBrowser } from '@/utils/platform'
import { showToast } from '@/utils/toast'

// 初始化消息框
const message = useMessage()

// Token 管理
const { token: recruitmentToken, ensureValidToken, loading: tokenLoading } = useRecruitmentToken()

const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-slate-500'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-slate-400'))

function setPageBackgroundColor() {
  const bgColor = isDark.value ? '#020617' : '#f5f7fa'
  uni.setBackgroundColor({
    backgroundColor: bgColor,
    backgroundColorTop: bgColor,
    backgroundColorBottom: bgColor,
  })
}

// 页面状态
const loading = ref(true)
const submitting = ref(false)

// 是否为重新提交模式（审核不通过后重新填写）
const isResubmit = ref(false)
// 之前提交的记录ID（用于更新）
const previousSubmitId = ref<number | null>(null)

// 纳新配置
const recruitmentConfig = ref<UserRecruitmentConfigRespVO | null>(null)

// 表单数据
const formData = ref<UserRecruitmentSaveReqVO>(
  {
    name: '',
    studentId: '',
    openid: '',
    unionId: '',
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

// 微信用户信息缓存
const wxUserInfo = ref<{ openid: string, unionId?: string, subscribe?: boolean } | null>(null)

// 照片上传
const showCropper = ref(false)
const cropperImageUrl = ref('')
const uploadingPhoto = ref(false)

const politicalOptions = ref<Array<{ label: string, value: string, id: number }>>([])

const nationOptions = ref<Array<{ label: string, value: string, id: number }>>([])

// 省市区选项数据
const provinceOptions = ref<Array<{ label: string, value: string, id: number }>>([])
const cityOptions = ref<Array<{ label: string, value: string, id: number }>>([])
const selectedProvinceId = ref<number | undefined>(undefined)
const selectedCityId = ref<number | undefined>(undefined)

// 学院专业班级选项数据
const collegeOptions = ref<Array<{ label: string, value: number, id: number }>>([])
const majorOptions = ref<Array<{ label: string, value: number, id: number }>>([])
const classOptions = ref<Array<{ label: string, value: number, id: number }>>([])
const selectedCollegeId = ref<number | undefined>(undefined)
const selectedMajorId = ref<number | undefined>(undefined)
const selectedClassId = ref<number | undefined>(undefined)

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
    console.error('❌ 加载省市区数据失败:', error)
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
    console.error('❌ 加载城市数据失败:', error)
    showToast('网络错误，请稍后重试')
  }
}

// 加载学院数据
async function loadCollegeData() {
  try {
    // 获取学院列表（parentId为0表示顶级学院）
    const colleges = await getCollegeList()
    console.log('colleges', colleges)
    collegeOptions.value = colleges.map(college => ({
      label: college.name,
      value: college.id,
      id: college.id,
    }))
    console.log('collegeOptions', collegeOptions.value)
  }
  catch (error) {
    console.error('❌ 加载学院数据失败:', error)
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
    console.error('❌ 加载专业数据失败:', error)
    showToast('网络错误，请稍后重试')
  }
}

// 加载班级数据
async function loadClassData(majorId: number, grade?: number) {
  try {
    // 优先使用传入的 grade，否则使用配置中的 grade
    const gradeValue = grade ?? recruitmentConfig.value?.grade
    if (!gradeValue) {
      console.error('❌ 加载班级数据失败: 缺少年级信息')
      return
    }
    // 获取班级列表
    const classes = await getClassList(majorId, String(gradeValue).slice(-2))
    classOptions.value = classes.map(classItem => ({
      label: classItem.name,
      value: classItem.id,
      id: classItem.id,
    }))
  }
  catch (error) {
    console.error('❌ 加载班级数据失败:', error)
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
        showCancelButton: false,
      }).then(() => {
        console.log('暂无纳新计划,用户点击确定')
        // 尝试回到上一层，如果失败则不做任何操作
        uni.navigateBack({
          fail: () => {
            console.log('无法返回上一页')
          },
        })
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

// 获取微信用户信息（openid 和 unionId）
async function getWxUserInfo() {
  try {
    const socialType = getSocialType()
    const codeRes = await getWxCode()

    // 调用后端接口获取 openid 和 unionId
    const res = await getWxUserInfoApi({
      type: socialType,
      code: codeRes.code,
    })

    if (res.code === 0 && res.data) {
      wxUserInfo.value = {
        openid: res.data.openid,
        unionId: res.data.unionId,
      }
      formData.value.openid = res.data.openid
      formData.value.unionId = res.data.unionId || ''
      return true
    }
    return false
  }
  catch (error) {
    console.error('获取微信用户信息失败:', error)
    return false
  }
}

// 检查是否在微信环境中
function checkWechatEnvironment(): boolean {
  // #ifdef MP-WEIXIN
  return true
  // #endif

  // #ifdef H5
  return isWechatBrowser()
  // #endif

  // 其他平台（非微信环境）
  return false
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

// 初始化微信认证信息（H5 微信浏览器环境）
async function initWxAuthH5() {
  // 如果已经有 openid，不需要再次授权
  if (wxUserInfo.value?.openid) {
    return
  }

  try {
    // 获取当前页面的完整 URL 作为回调地址（去掉现有的 code 和 state 参数）
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('code')
    currentUrl.searchParams.delete('state')
    const redirectUri = currentUrl.toString()

    // 获取微信授权链接
    const res = await getSocialAuthRedirect({
      type: getSocialType(), // 31 = 微信H5服务号
      redirectUri,
    })

    if (res.code === 0 && res.data) {
      // 跳转到微信授权页面
      window.location.href = res.data
    }
    else {
      console.error('获取微信授权链接失败:', res.msg)
    }
  }
  catch (error) {
    console.error('初始化微信认证失败:', error)
  }
}

// 处理微信授权回调（H5 微信浏览器环境）
async function handleWxAuthCallback(code: string, state?: string) {
  try {
    const res = await getWxUserInfoApi({
      type: getSocialType(), // 31 = 微信H5服务号
      code,
      state,
    })

    if (res.code === 0 && res.data) {
      wxUserInfo.value = {
        openid: res.data.openid,
        unionId: res.data.unionId,
        subscribe: res.data.subscribe,
      }
      formData.value.openid = res.data.openid
      formData.value.unionId = res.data.unionId || ''

      console.log('微信用户信息获取成功:', {
        openid: res.data.openid,
        unionId: res.data.unionId,
        subscribe: res.data.subscribe,
      })

      return true
    }
    else {
      console.error('获取微信用户信息失败:', res.msg)
      return false
    }
  }
  catch (error) {
    console.error('处理微信授权回调失败:', error)
    return false
  }
}

// 服务号二维码链接
const WECHAT_QRCODE_URL = 'https://file.tihangstudio.cn/image/wechat-qrcode.jpg'

// 处理未关注服务号的情况
function handleNotSubscribed() {
  message.confirm({
    title: '请先关注服务号',
    msg: '为了更好地为您提供服务，请先关注我们的微信服务号后再进行纳新登记。\n\n关注后请刷新页面重新进入。',
    confirmButtonText: '查看二维码',
    cancelButtonText: '返回',
    closeOnClickModal: false,
  }).then(() => {
    // 用户点击"查看二维码"，跳转到二维码图片页面
    // #ifdef H5
    window.open(WECHAT_QRCODE_URL, '_blank')
    // #endif
    // #ifdef MP-WEIXIN
    uni.previewImage({
      urls: [WECHAT_QRCODE_URL],
      current: WECHAT_QRCODE_URL,
    })
    // #endif
  }).catch(() => {
    // 用户点击"返回"
    uni.navigateBack({
      fail: () => {
        uni.reLaunch({
          url: '/pages/index/index',
        })
      },
    })
  })
}

// 检查是否已提交过纳新申请
async function checkSubmitStatus(): Promise<UserRecruitmentRespVO | null> {
  // 确保 Token 有效
  const authToken = await ensureValidToken()
  if (!authToken) {
    console.warn('获取 Token 失败')
    return null
  }

  try {
    const res = await getSubmitStatus(authToken)
    if (res.code === 0 && res.data) {
      return res.data
    }
    return null
  }
  catch (error) {
    console.error('检查提交状态失败:', error)
    return null
  }
}

// 回填表单数据
async function fillFormData(data: UserRecruitmentRespVO) {
  formData.value = {
    id: data.id,
    name: data.name,
    studentId: data.studentId,
    openid: wxUserInfo.value?.openid || '',
    unionId: wxUserInfo.value?.unionId || '',
    email: data.email,
    phone: data.phone,
    qqNumber: data.qqNumber,
    birthday: data.birthday,
    sex: data.sex,
    nation: data.nation,
    politicalOutlook: data.politicalOutlook,
    userIntroduce: data.userIntroduce,
    joinReason: data.joinReason,
    personalSkills: data.personalSkills,
    interestDirection: data.interestDirection,
    grade: data.grade,
    schoolDeptId: data.schoolDeptId,
    settingId: data.settingId,
    imageUrl: data.imageUrl,
    province: data.province,
    city: data.city,
  }

  // 回填省份并加载城市
  if (data.province) {
    const provinceOption = provinceOptions.value.find(p => p.value === data.province)
    if (provinceOption) {
      selectedProvinceId.value = provinceOption.id
      await loadCityData(provinceOption.id)
      // 回填城市
      if (data.city) {
        const cityOption = cityOptions.value.find(c => c.value === data.city)
        if (cityOption) {
          selectedCityId.value = cityOption.id
        }
      }
    }
  }

  // 回填学院专业班级（按顺序加载）
  if (data.collegeId) {
    // 1. 回显学院
    selectedCollegeId.value = data.collegeId

    // 2. 加载专业列表并回显专业
    await loadMajorData(data.collegeId)
    if (data.majorId) {
      selectedMajorId.value = data.majorId

      // 3. 加载班级列表并回显班级
      await loadClassData(data.majorId, data.grade)
      if (data.classId) {
        selectedClassId.value = data.classId
        formData.value.schoolDeptId = data.classId
      }
    }
  }
}

// 页面加载时获取纳新配置
onLoad(async (options) => {
  // 检查微信环境
  if (!checkWechatEnvironment()) {
    handleNonWechatEnvironment()
    return
  }

  // #ifdef H5
  // H5 微信浏览器环境
  if (isWechatBrowser()) {
    // 检查是否从微信授权回调返回（URL 中包含 code 和 state 参数）
    if (options?.code) {
      // 从微信授权回调返回，处理获取用户信息
      const success = await handleWxAuthCallback(options.code, options.state)
      if (!success) {
        showToast('获取微信用户信息失败，请重试')
        return
      }

      // 授权成功后，检查是否关注了服务号
      if (!wxUserInfo.value?.subscribe) {
        // 未关注服务号，先加载纳新配置（用于获取服务号二维码等信息）
        await loadRecruitmentConfig()
        // 显示引导关注弹窗
        handleNotSubscribed()
        return
      }

      // 已关注服务号，继续加载其他数据
    }
    else {
      // 没有 code 参数，需要跳转到微信授权页面
      // 跳转微信授权
      await initWxAuthH5()
      return
    }
  }
  // #endif

  // #ifdef MP-WEIXIN
  // 微信小程序环境：直接获取微信用户信息
  const wxSuccess = await getWxUserInfo()
  if (!wxSuccess) {
    console.warn('微信小程序获取用户信息失败')
  }
  // #endif

  // 并行加载纳新配置、省市区数据、学院数据
  await Promise.all([
    loadRecruitmentConfig(),
    loadAreaData(),
    loadCollegeData(),
    loadNationData(),
    loadPoliticalStatusData(),
  ])

  // 检查是否已提交过纳新申请
  const submitData = await checkSubmitStatus()
  if (submitData) {
    // 已提交过申请
    if (submitData.status === RecruitmentStatus.REFUSE) {
      // 审核不通过，允许重新提交
      isResubmit.value = true
      previousSubmitId.value = submitData.id
      // 回填表单数据
      await fillFormData(submitData)
    }
    else {
      // 其他状态，跳转到已提交页面
      const groupLink = recruitmentConfig.value?.groupLink
        ? encodeURIComponent(recruitmentConfig.value.groupLink)
        : ''
      uni.redirectTo({
        url: `/pages/recruitment/success?groupLink=${groupLink}&status=${submitData.status}`,
      })
    }
  }
})

// 页面显示时获取纳新配置
onShow(() => {
  // loadRecruitmentConfig()
  setPageBackgroundColor()
})

watch(() => isDark.value, () => {
  setPageBackgroundColor()
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
  // #ifdef H5
  window.location.href = url
  // #endif
  // #ifdef MP-WEIXIN
  uni.navigateTo({
    url: `/pages-sub/webview/index?url=${encodeURIComponent(url)}`,
    fail: (err) => {
      console.error('打开链接失败:', err)
      showToast('打开链接失败，请稍后重试')
    },
  })
  // #endif
  // #ifdef APP-PLUS
  plus.runtime.openURL(url)
  // #endif
  // 其他平台暂不支持
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
  // 如果没有滑动选择，value.value 可能是 undefined，默认选择第一个选项
  const selectedValue = value.value ?? politicalOptions.value[0]?.value
  if (selectedValue === undefined)
    return
  formData.value.politicalOutlook = selectedValue
}

// 民族选择
function onNationChange(value: any) {
  // 如果没有滑动选择，value.value 可能是 undefined，默认选择第一个选项
  const selectedValue = value.value ?? nationOptions.value[0]?.value
  if (selectedValue === undefined)
    return
  formData.value.nation = selectedValue
}

// 省份选择
async function onProvinceChange(value: any) {
  // 如果没有滑动选择，value.value 可能是 undefined，默认选择第一个选项
  const selectedValue = value.value ?? provinceOptions.value[0]?.value
  if (selectedValue === undefined)
    return

  const selectedOption = provinceOptions.value.find(option => option.value === selectedValue)
  if (selectedOption) {
    formData.value.province = selectedOption.value
    selectedProvinceId.value = selectedOption.id

    // 清空城市选择
    formData.value.city = ''
    selectedCityId.value = undefined
    cityOptions.value = []

    // 加载对应的城市数据
    await loadCityData(selectedOption.id)
  }
}

// 城市选择
function onCityChange(value: any) {
  // 如果没有滑动选择，value.value 可能是 undefined，默认选择第一个选项
  const selectedValue = value.value ?? cityOptions.value[0]?.value
  if (selectedValue === undefined)
    return

  const selectedOption = cityOptions.value.find(option => option.value === selectedValue)
  if (selectedOption) {
    formData.value.city = selectedOption.value
    selectedCityId.value = selectedOption.id
  }
}

// 学院选择
async function onCollegeChange(value: any) {
  console.log('学院选择', value)
  // 如果没有滑动选择，value.value 可能是 undefined，默认选择第一个选项
  const selectedValue = value.value ?? collegeOptions.value[0]?.value
  if (selectedValue === undefined)
    return

  const selectedOption = collegeOptions.value.find(option => option.value === selectedValue)
  if (selectedOption) {
    selectedCollegeId.value = selectedOption.id

    selectedMajorId.value = undefined
    selectedClassId.value = undefined
    majorOptions.value = []
    classOptions.value = []

    // 加载对应的专业数据
    await loadMajorData(selectedOption.id)
  }
}

// 专业选择
async function onMajorChange(value: any) {
  // 如果没有滑动选择，value.value 可能是 undefined，默认选择第一个选项
  const selectedValue = value.value ?? majorOptions.value[0]?.value
  if (selectedValue === undefined)
    return

  const selectedOption = majorOptions.value.find(option => option.value === selectedValue)
  if (selectedOption) {
    selectedMajorId.value = selectedOption.id

    selectedClassId.value = undefined
    classOptions.value = []

    // 加载对应的班级数据
    await loadClassData(selectedOption.id)
  }
}

// 班级选择
function onClassChange(value: any) {
  // 如果没有滑动选择，value.value 可能是 undefined，默认选择第一个选项
  const selectedValue = value.value ?? classOptions.value[0]?.value
  if (selectedValue === undefined)
    return

  const selectedOption = classOptions.value.find(option => option.value === selectedValue)
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

  // 显示上传loading状态
  uploadingPhoto.value = true

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
    .finally(() => {
      uploadingPhoto.value = false
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

    // 确保 Token 有效
    const authToken = await ensureValidToken()
    if (!authToken) {
      showToast('授权已过期，请刷新页面重试')
      return
    }

    // 准备提交数据（openid/unionId 由后端从 Token 中获取）
    const submitData = {
      ...formData.value,
    }

    // 根据是否为重新提交，调用不同的接口
    const response = isResubmit.value
      ? await updateUserRecruitment(authToken, submitData)
      : await createUserRecruitment(authToken, submitData)

    if (response.code === 0) {
      showToast('申请提交成功')
      // 跳转到提交成功页面，传递纳新群链接
      setTimeout(() => {
        const groupLink = recruitmentConfig.value?.groupLink
          ? encodeURIComponent(recruitmentConfig.value.groupLink)
          : ''
        uni.redirectTo({
          url: `/pages/recruitment/success?groupLink=${groupLink}`,
        })
      }, 1000)
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
  <view class="recruitment-page min-h-screen">
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
          欢迎加入梯航工作室
        </view>
      </view>
    </view>

    <!-- 重新提交提示 -->
    <view v-if="isResubmit && recruitmentConfig" class="relative z-20 mx-4 mb-4 mt-[-12px]">
      <view class="flex items-center rounded-xl bg-amber-50 px-4 py-3 shadow-sm dark:bg-amber-500/10">
        <wd-icon name="warning" size="20px" color="#d97706" />
        <view class="ml-3 flex-1">
          <view class="text-sm text-amber-700 font-medium dark:text-amber-300">
            您的申请未通过审核
          </view>
          <view class="mt-1 text-xs text-amber-600 dark:text-amber-300/80">
            请修改信息后重新提交，我们会尽快审核
          </view>
        </view>
      </view>
    </view>

    <!-- 主要表单内容 -->
    <view v-if="!loading && recruitmentConfig" class="relative z-10 mt-[-24px] px-4 pb-8">
      <wd-form ref="formRef" :model="formData" :rules="rules">
        <!-- 基本信息卡片 -->
        <view class="form-card mb-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <view class="card-header mb-4 flex items-center">
            <view class="mr-3 h-8 w-1 rounded-full bg-[#2563eb]" />
            <text class="text-lg font-semibold" :class="textPrimaryClass">
              基本信息
            </text>
          </view>

          <!-- 证件照上传 -->
          <view class="photo-upload mb-6 flex items-center">
            <view
              class="photo-box relative h-32 w-24 flex flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden border-2 border-[#2563eb]/30 rounded-xl border-dashed bg-[#f0f7ff] transition-all dark:border-[#2563eb]/40 dark:bg-blue-500/10"
              hover-class="border-[#2563eb]"
              @click="onSelectPhoto"
            >
              <!-- 上传中loading状态 -->
              <view v-if="uploadingPhoto" class="flex flex-col items-center">
                <wd-loading color="#2563eb" size="28px" />
                <text class="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  上传中...
                </text>
              </view>
              <!-- 已上传的照片 -->
              <image
                v-else-if="formData.imageUrl"
                :src="formData.imageUrl"
                class="h-full w-full object-cover"
                mode="aspectFill"
              />
              <!-- 默认上传提示 -->
              <view v-else class="flex flex-col items-center">
                <wd-icon name="camera" size="28px" color="#2563eb" />
                <text class="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  上传照片
                </text>
              </view>
            </view>
            <view class="ml-4 flex-1">
              <text class="mb-1 block text-sm font-medium" :class="textSecondaryClass">
                一寸证件照 <text class="text-red-500">
                  *
                </text>
              </text>
              <text class="text-xs" :class="textMutedClass">
                请上传清晰的正面免冠照片
              </text>
            </view>
          </view>

          <view class="overflow-hidden border border-gray-100 rounded-xl dark:border-gray-700">
            <wd-input
              v-model="formData.name"
              label-width="30%"
              label="姓名"
              placeholder="请输入真实姓名"
              required
              prop="name"
              :no-border="false"
            />

            <wd-cell title-width="30%" title="性别" required center>
              <wd-radio-group v-model="formData.sex" shape="button" inline>
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
              label-width="30%"
              placeholder="请输入学号"
              required
              prop="studentId"
              :no-border="false"
            />

            <wd-input
              v-model="formData.phone"
              label="手机号"
              label-width="30%"
              placeholder="请输入手机号"
              required
              prop="phone"
              :no-border="false"
            />

            <wd-input
              v-model="formData.qqNumber"
              label="QQ号"
              label-width="30%"
              placeholder="请输入QQ号"
              required
              prop="qqNumber"
              :no-border="false"
            />

            <wd-input
              v-model="formData.email"
              label="邮箱"
              label-width="30%"
              placeholder="请输入邮箱地址"
              required
              prop="email"
              :no-border="false"
            />
          </view>
        </view>

        <!-- 个人详细信息卡片 -->
        <view class="form-card mb-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <view class="card-header mb-4 flex items-center">
            <view class="mr-3 h-8 w-1 rounded-full bg-[#2563eb]" />
            <text class="text-lg font-semibold" :class="textPrimaryClass">
              个人详情
            </text>
          </view>

          <view class="overflow-hidden border border-gray-100 rounded-xl dark:border-gray-700">
            <wd-cell title-width="30%" title="出生日期" required center>
              <wd-datetime-picker
                v-model="formData.birthday"
                :min-date="946656000000"
                type="date"
                @confirm="onBirthdayChange"
              />
            </wd-cell>

            <wd-cell title-width="30%" title="民族" required center>
              <wd-picker
                v-model="formData.nation"
                :columns="nationOptions"
                @confirm="onNationChange"
              />
            </wd-cell>

            <wd-cell title-width="30%" title="政治面貌" required center>
              <wd-picker
                v-model="formData.politicalOutlook"
                :columns="politicalOptions"
                @confirm="onPoliticalChange"
              />
            </wd-cell>

            <wd-cell title-width="30%" title="省份" required center>
              <wd-picker
                v-model="formData.province"
                :columns="provinceOptions"
                placeholder="请选择省份"
                @confirm="onProvinceChange"
              />
            </wd-cell>

            <wd-cell title-width="30%" title="市/区" required center>
              <wd-picker
                v-model="formData.city"
                :columns="cityOptions"
                placeholder="请选择市或区"
                :disabled="!selectedProvinceId"
                @confirm="onCityChange"
              />
            </wd-cell>
          </view>
        </view>

        <!-- 学院专业信息卡片 -->
        <view class="form-card mb-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <view class="card-header mb-4 flex items-center">
            <view class="mr-3 h-8 w-1 rounded-full bg-[#2563eb]" />
            <text class="text-lg font-semibold" :class="textPrimaryClass">
              学院信息
            </text>
          </view>

          <view class="overflow-hidden border border-gray-100 rounded-xl dark:border-gray-700">
            <wd-cell title-width="30%" title="学院" required center>
              <wd-picker
                v-model="selectedCollegeId"
                :columns="collegeOptions"
                placeholder="请选择学院"
                @confirm="onCollegeChange"
              />
            </wd-cell>

            <wd-cell title-width="30%" title="专业" required center>
              <wd-picker
                v-model="selectedMajorId"
                :columns="majorOptions"
                placeholder="请选择专业"
                :disabled="!selectedCollegeId"
                @confirm="onMajorChange"
              />
            </wd-cell>

            <wd-cell title-width="30%" title="班级" required center>
              <wd-picker
                v-model="selectedClassId"
                :columns="classOptions"
                placeholder="请选择班级"
                :disabled="!selectedMajorId"
                @confirm="onClassChange"
              />
            </wd-cell>
          </view>
        </view>

        <!-- 个人能力与意向卡片 -->
        <view class="form-card mb-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <view class="card-header mb-4 flex items-center">
            <view class="mr-3 h-8 w-1 rounded-full bg-[#2563eb]" />
            <text class="text-lg font-semibold" :class="textPrimaryClass">
              能力与意向
            </text>
          </view>

          <view class="textarea-section mb-4">
            <view class="mb-2 text-sm font-medium" :class="textSecondaryClass">
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
            <view class="mb-2 text-sm font-medium" :class="textSecondaryClass">
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
            <view class="mb-2 text-sm font-medium" :class="textSecondaryClass">
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
            <view class="mb-2 text-sm font-medium" :class="textSecondaryClass">
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
          <view class="mt-3 text-center text-xs" :class="textMutedClass">
            提交即表示您同意我们的信息收集与使用规范
          </view>
        </view>
      </wd-form>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-800">
      <view class="text-center">
        <wd-loading color="#2563eb" />
        <view class="mt-4 text-sm" :class="textMutedClass">
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

/* 统一 Input 和 Cell 的高度与内边距 */
:deep(.wd-cell),
:deep(.wd-input) {
  min-height: 54px; /* 设定统一最小高度 */
  display: flex;
  align-items: center; /* 垂直居中 */
}

:deep(.wd-input) {
  padding: 0 12px !important; /* 覆盖原有 padding，统一左右间距 */
}

:deep(.wd-cell__wrapper) {
  padding: 0 !important; /* 移除内部 wrapper padding，由父级控制 */
  min-height: 54px;
  display: flex;
  align-items: center;
  width: 100%;
}

:deep(.wd-cell) {
  padding: 0 12px !important; /* 统一左右间距 */
}

/* 深色模式下表单文字颜色适配 */
.dark :deep(.wd-cell__title) {
  color: #cbd5e1 !important; /* slate-300 */
}

:deep(.wd-textarea) {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
}
.dark :deep(.wd-textarea) {
  background: rgba(255, 255, 255, 0.04);
}

/* 修复单选框文字颜色 */
.dark :deep(.wd-radio__label) {
  color: #cbd5e1 !important;
}

/* 修复 Picker/Select 内部文字换行问题 */
:deep(.wd-picker__text) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 修复 RadioGroup 垂直居中 */
:deep(.wd-radio-group) {
  display: flex;
  align-items: center;
}

/* 修复 Input/Cell 样式覆盖 */
.wd-input {
  padding: 0 12px !important;
}
</style>

<style>
page {
  background-color: #f5f7fa;
}
.dark page {
  background-color: #020617;
}
</style>

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
import { computed, getCurrentInstance, ref, watch } from 'vue'
import { useMessage } from 'wot-design-uni'
import { getCityList, getProvinceList } from '@/api/area'
import { getSocialAuthRedirect, getWxCode, getWxUserInfoApi } from '@/api/login'
import { createUserRecruitment, getSubmitStatus, getUserRecruitmentConfig, updateUserRecruitment } from '@/api/recruitment'
import { getClassList, getCollegeList, getMajorList } from '@/api/school-dept'
import { RecruitmentStatus } from '@/api/types/recruitment'
import { uploadFile } from '@/api/user'
import KspCropper from '@/components/ksp-cropper.vue'
import { useAppStore } from '@/store/app'
import { DictTypeEnum } from '@/utils/dictTypes'
import { DictUtils } from '@/utils/dictUtils'
import { getSocialType, isWechatBrowser } from '@/utils/platform'
import { showToast } from '@/utils/toast'

// 初始化消息框
const message = useMessage()

const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
// 需要以属性形式传给组件的主色（wd-icon / wd-loading 只接受色值，无法直接用 CSS 变量）
const brandColor = computed(() => (isDark.value ? '#3b82f6' : '#2563eb'))

function setPageBackgroundColor() {
  const bgColor = isDark.value ? '#0b1220' : '#f5f7fa'
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

/* -------------------------------------------------------------------------
 * 以下为纯展示 / 交互逻辑：完成度统计 + 校验失败定位
 * 不参与任何提交数据的组装，也不改变表单字段本身
 * ---------------------------------------------------------------------- */

const instance = getCurrentInstance()

interface RequiredFieldMeta {
  /** 字段标识，同时用作锚点 id（field-<key>）与行内错误提示的 key */
  key: string
  /** 所属卡片，用于卡片标题右侧的完成度 chip */
  card: 'basic' | 'detail' | 'school' | 'ability'
  /** 该字段是否已填写 */
  isFilled: () => boolean
}

// 必填字段清单：顺序与页面上字段的排列顺序一致
// 完成度统计（底部进度 + 卡片 chip）与校验失败定位都只依赖这一份清单
const REQUIRED_FIELDS: RequiredFieldMeta[] = [
  { key: 'imageUrl', card: 'basic', isFilled: () => Boolean(formData.value.imageUrl) },
  { key: 'name', card: 'basic', isFilled: () => Boolean(formData.value.name) },
  { key: 'sex', card: 'basic', isFilled: () => Boolean(formData.value.sex) },
  { key: 'studentId', card: 'basic', isFilled: () => Boolean(formData.value.studentId) },
  { key: 'phone', card: 'basic', isFilled: () => Boolean(formData.value.phone) },
  { key: 'qqNumber', card: 'basic', isFilled: () => Boolean(formData.value.qqNumber) },
  { key: 'email', card: 'basic', isFilled: () => Boolean(formData.value.email) },
  { key: 'birthday', card: 'detail', isFilled: () => Boolean(formData.value.birthday) },
  { key: 'nation', card: 'detail', isFilled: () => Boolean(formData.value.nation) },
  { key: 'politicalOutlook', card: 'detail', isFilled: () => Boolean(formData.value.politicalOutlook) },
  { key: 'province', card: 'detail', isFilled: () => Boolean(formData.value.province) },
  { key: 'city', card: 'detail', isFilled: () => Boolean(formData.value.city) },
  { key: 'college', card: 'school', isFilled: () => Boolean(selectedCollegeId.value) },
  { key: 'major', card: 'school', isFilled: () => Boolean(selectedMajorId.value) },
  { key: 'class', card: 'school', isFilled: () => Boolean(selectedClassId.value) },
  { key: 'userIntroduce', card: 'ability', isFilled: () => Boolean(formData.value.userIntroduce) },
  { key: 'joinReason', card: 'ability', isFilled: () => Boolean(formData.value.joinReason) },
  { key: 'personalSkills', card: 'ability', isFilled: () => Boolean(formData.value.personalSkills) },
  { key: 'interestDirection', card: 'ability', isFilled: () => Boolean(formData.value.interestDirection) },
]

// 字段在页面中的先后顺序，用于把用户滚动到"最靠前"的那个错误字段
const FIELD_ORDER = REQUIRED_FIELDS.map(field => field.key)

const requiredTotal = REQUIRED_FIELDS.length
const filledCount = computed(() => REQUIRED_FIELDS.filter(field => field.isFilled()).length)
const progressPercent = computed(() => Math.round((filledCount.value / requiredTotal) * 100))

// 各卡片的完成度，与 REQUIRED_FIELDS 共用同一份清单
const cardProgress = computed(() => {
  const result = {
    basic: { filled: 0, total: 0 },
    detail: { filled: 0, total: 0 },
    school: { filled: 0, total: 0 },
    ability: { filled: 0, total: 0 },
  }
  REQUIRED_FIELDS.forEach((field) => {
    const item = result[field.card]
    item.total += 1
    if (field.isFilled()) {
      item.filled += 1
    }
  })
  return result
})

// 行内错误提示：key 为字段标识，value 为提示文案
const fieldErrors = ref<Record<string, string>>({})
// 当前需要闪一下高亮的字段
const flashKey = ref('')
let flashTimer: ReturnType<typeof setTimeout> | null = null

function fieldRowClass(key: string) {
  return {
    'is-error': Boolean(fieldErrors.value[key]),
    'is-flash': flashKey.value === key,
  }
}

// 滚动到指定字段并闪一次高亮（只改背景色，不改变布局尺寸）
function scrollToField(key: string) {
  const query = instance?.proxy
    ? uni.createSelectorQuery().in(instance.proxy)
    : uni.createSelectorQuery()
  query.select(`#field-${key}`).boundingClientRect()
  query.selectViewport().scrollOffset()
  query.exec((res: any[]) => {
    const rect = res && res[0]
    const viewport = res && res[1]
    if (!rect) {
      return
    }
    // 顶部留出 16 的余量
    const scrollTop = Math.max((rect.top || 0) + (viewport?.scrollTop || 0) - 16, 0)
    uni.pageScrollTo({ scrollTop, duration: 300 })

    if (flashTimer) {
      clearTimeout(flashTimer)
    }
    // 等滚动动画结束再闪，避免用户看不到
    flashTimer = setTimeout(() => {
      flashKey.value = key
      flashTimer = setTimeout(() => {
        flashKey.value = ''
        flashTimer = null
      }, 300)
    }, 300)
  })
}

// 在若干个出错字段中，定位到页面上最靠前的那个
function locateFirstError(keys: string[]) {
  const target = keys
    .filter(key => FIELD_ORDER.includes(key))
    .sort((a, b) => FIELD_ORDER.indexOf(a) - FIELD_ORDER.indexOf(b))[0]
  if (target) {
    scrollToField(target)
  }
}

// 记录一个校验未通过的字段，并立刻定位
function reportFieldError(key: string, msg: string, keys: string[]) {
  if (key) {
    fieldErrors.value[key] = msg
    if (!keys.includes(key)) {
      keys.push(key)
    }
  }
  locateFirstError(keys)
}

// 把 wd-form 的校验结果同步成行内错误态（左侧红色竖条 + 定位用）
// wd-form 自身已经在字段下方渲染了错误文案，这里不重复渲染
function collectFormErrors(result: any, keys: string[]) {
  const errors = result?.errors
  if (!Array.isArray(errors)) {
    return
  }
  errors.forEach((item: any) => {
    if (!item?.prop) {
      return
    }
    fieldErrors.value[item.prop] = item.message || ''
    if (!keys.includes(item.prop)) {
      keys.push(item.prop)
    }
  })
}

// 用户修改任意字段后清掉行内错误，与 wd-form 的 resetOnChange 行为保持一致
watch(
  () => ({
    ...formData.value,
    collegeId: selectedCollegeId.value,
    majorId: selectedMajorId.value,
    classId: selectedClassId.value,
  }),
  () => {
    if (Object.keys(fieldErrors.value).length > 0) {
      fieldErrors.value = {}
    }
  },
  { deep: true },
)

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

// 纳新配置加载结果
// ok=配置可用；unavailable=无可用纳新计划（不存在或已过报名时间窗）；failed=接口业务失败；error=网络异常
type ConfigLoadStatus = 'ok' | 'unavailable' | 'failed' | 'error'

// 加载纳新配置
// 只负责取数并返回状态，不做任何弹窗/跳转：
// 报名截止到完成录取之间的评审期，配置接口会返回"无可用计划"，但已报名的学生仍要能进自己的状态页，
// 因此提示与跳转统一交给 onLoad 决策，避免弹窗和 redirect 互相打架
async function loadRecruitmentConfig(): Promise<ConfigLoadStatus> {
  try {
    loading.value = true

    // 获取真实纳新配置
    const response = await getUserRecruitmentConfig()

    // 没有纳新计划（或已过报名时间窗）
    if (response.code === 1002032101) {
      return 'unavailable'
    }
    if (response.code !== 0) {
      console.error('获取纳新配置失败:', response.msg)
      return 'failed'
    }
    // 使用真实数据
    recruitmentConfig.value = response.data
    formData.value.settingId = response.data.id
    formData.value.grade = response.data.grade
    return 'ok'
  }
  catch (error) {
    console.error('获取纳新配置失败:', error)
    return 'error'
  }
  finally {
    loading.value = false
  }
}

// 纳新配置不可用时的统一处理：提示后返回上一页，不再触发任何跳转
function handleConfigUnavailable(status: ConfigLoadStatus) {
  // 网络异常：仅提示，保留在当前页面让用户自行重试
  if (status === 'error') {
    showToast({
      message: '网络错误，请稍后重试',
      icon: 'error',
    })
    return
  }

  const noPlan = status === 'unavailable'
  message.alert({
    msg: noPlan ? '当前暂无正在进行的纳新计划，请关注官方通知。' : '获取纳新计划失败，请联系管理员解决！',
    title: noPlan ? '暂无纳新计划' : '请求失败',
    closeOnClickModal: false,
    showCancelButton: false,
  }).then(() => {
    // 尝试回到上一层，如果失败则不做任何操作
    uni.navigateBack({
      fail: () => {
        console.log('无法返回上一页')
      },
    })
  }).catch(() => {
  })
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
  if (!wxUserInfo.value?.openid) {
    return null
  }

  try {
    const res = await getSubmitStatus(wxUserInfo.value.openid, wxUserInfo.value.unionId)
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

  // 并行加载纳新配置、报名状态、省市区数据、学院数据
  // 报名状态必须与配置一起查，且由下面的分支统一决策，避免"弹窗提示"与"跳转状态页"同时发生
  const [configStatus, submitData] = await Promise.all([
    loadRecruitmentConfig(),
    checkSubmitStatus(),
    loadAreaData(),
    loadCollegeData(),
    loadNationData(),
    loadPoliticalStatusData(),
  ])

  // 1. 已提交且不是审核不通过：直接进入自己的状态/结果页
  // 评审期（报名已截止、尚未完成录取）配置不可用，但不能拦住已报名的学生，此时 groupLink 取不到就传空
  if (submitData && submitData.status !== RecruitmentStatus.REFUSE) {
    const groupLink = recruitmentConfig.value?.groupLink
      ? encodeURIComponent(recruitmentConfig.value.groupLink)
      : ''
    uni.redirectTo({ url: `/pages/recruitment/success?groupLink=${groupLink}` })
    return
  }

  // 2. 配置不可用（未报名 / 审核不通过的学生）：提示后返回，流程到此结束
  if (configStatus !== 'ok') {
    handleConfigUnavailable(configStatus)
    return
  }

  // 3. 配置可用，展示纳新须知
  showRecruitmentNotice()

  // 4. 审核不通过，允许重新提交，回填表单数据
  if (submitData) {
    isResubmit.value = true
    previousSubmitId.value = submitData.id
    await fillFormData(submitData)
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

  let tempFilePath = res.path
  // #ifdef H5
  // H5 下 ksp-cropper 的 res.path 是它用 URL.createObjectURL 自己造的 blob URL，
  // 不在 uni 内部的 files map 里，uni.uploadFile 只能用 XHR 取回一个没有 name 的裸 Blob，
  // 最终 multipart 的 filename 退化成 `file-<时间戳>`（无扩展名）。
  // 而同时 emit 的 res.base64（data URL）交给 uni.uploadFile 会走 base64ToFile → blobToFile，
  // 文件名与 mime 都是对的，所以 H5 优先用 base64。
  tempFilePath = res.base64 || res.path
  // #endif

  // 显示上传loading状态
  uploadingPhoto.value = true

  // 上传裁剪后的图片
  uploadFile(tempFilePath)
    .then((url) => {
      formData.value.imageUrl = url
      showToast('照片上传成功')
    })
    .catch((error) => {
      // 保留完整错误对象便于排查；toast 展示真实原因，不要再折叠成「网络错误」
      console.error('上传失败:', error)
      showToast(`证件照上传失败：${error?.message || error}`)
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
    // 本次提交里校验未通过的字段，仅用于行内错误提示与滚动定位
    fieldErrors.value = {}
    const errorKeys: string[] = []

    // 表单验证
    if (formRef.value) {
      const valid = await formRef.value.validate()
      if (!valid) {
        return
      }
      collectFormErrors(valid, errorKeys)
    }

    // 检查必填项
    if (!formData.value.imageUrl) {
      showToast('请上传证件照')
      reportFieldError('imageUrl', '请上传证件照', errorKeys)
      return
    }

    if (!formData.value.birthday) {
      showToast('请选择出生日期')
      reportFieldError('birthday', '请选择出生日期', errorKeys)
      return
    }

    if (!formData.value.grade) {
      showToast('请选择年级')
      // 年级来自纳新配置，页面上没有对应字段，只定位已有的错误
      locateFirstError(errorKeys)
      return
    }

    if (!formData.value.politicalOutlook) {
      showToast('请选择政治面貌')
      reportFieldError('politicalOutlook', '请选择政治面貌', errorKeys)
      return
    }

    if (!selectedCollegeId.value) {
      showToast('请选择学院')
      reportFieldError('college', '请选择学院', errorKeys)
      return
    }

    if (!selectedMajorId.value) {
      showToast('请选择专业')
      reportFieldError('major', '请选择专业', errorKeys)
      return
    }

    if (!selectedClassId.value) {
      showToast('请选择班级')
      reportFieldError('class', '请选择班级', errorKeys)
      return
    }

    // 逐项检查都通过，但表单本身还有校验错误时，同样把用户带到出错的位置
    if (errorKeys.length > 0) {
      locateFirstError(errorKeys)
    }

    submitting.value = true

    // 如果还没有获取微信用户信息，先获取
    if (!wxUserInfo.value || !wxUserInfo.value.openid) {
      const success = await getWxUserInfo()
      if (!success) {
        showToast('获取微信用户信息失败，请重试')
        return
      }
    }

    // 准备提交数据，包含 openid、unionId 和 socialType
    const submitData = {
      ...formData.value,
      openid: formData.value.openid,
      unionId: formData.value.unionId,
      socialType: getSocialType(), // 34=微信小程序，31=微信H5（服务号）
    }

    // 根据是否为重新提交，调用不同的接口
    const response = isResubmit.value
      ? await updateUserRecruitment(submitData)
      : await createUserRecruitment(submitData)

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
  <view class="recruitment-page" :class="{ dark: isDark }">
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
    <view class="header-section">
      <view class="header-title">
        纳新登记
      </view>
      <view class="header-subtitle">
        欢迎加入梯航工作室
      </view>
    </view>

    <!-- 重新提交提示 -->
    <view v-if="isResubmit && recruitmentConfig" class="notice-wrap">
      <view class="notice-card">
        <wd-icon name="warning" size="20px" color="#d97706" />
        <view class="notice-body">
          <view class="notice-title">
            您的申请未通过审核
          </view>
          <view class="notice-desc">
            请修改信息后重新提交，我们会尽快审核
          </view>
        </view>
      </view>
    </view>

    <!-- 主要表单内容 -->
    <view v-if="!loading && recruitmentConfig" class="form-body" :class="{ 'is-overlap': !isResubmit }">
      <wd-form ref="formRef" :model="formData" :rules="rules">
        <!-- 基本信息卡片 -->
        <view class="form-card">
          <view class="card-header">
            <view class="card-bar" />
            <text class="card-title">
              基本信息
            </text>
            <text
              class="card-chip"
              :class="{ 'is-full': cardProgress.basic.filled === cardProgress.basic.total }"
            >
              {{ cardProgress.basic.filled }}/{{ cardProgress.basic.total }}
            </text>
          </view>

          <view class="field-list">
            <!-- 证件照上传 -->
            <view id="field-imageUrl" class="field-row field-row--photo" :class="fieldRowClass('imageUrl')">
              <view class="photo-field">
                <view
                  class="photo-box"
                  :class="{ 'is-empty': !formData.imageUrl }"
                  hover-class="is-hover"
                  @click="onSelectPhoto"
                >
                  <!-- 上传中loading状态 -->
                  <view v-if="uploadingPhoto" class="photo-state">
                    <wd-loading :color="brandColor" size="24px" />
                    <text class="photo-state__text">
                      上传中...
                    </text>
                  </view>
                  <!-- 已上传的照片 -->
                  <template v-else-if="formData.imageUrl">
                    <image
                      :src="formData.imageUrl"
                      class="photo-image"
                      mode="aspectFill"
                    />
                    <view class="photo-badge">
                      更换
                    </view>
                  </template>
                  <!-- 默认上传提示 -->
                  <view v-else class="photo-state">
                    <wd-icon name="camera" size="24px" :color="brandColor" />
                    <text class="photo-state__text">
                      上传照片
                    </text>
                  </view>
                </view>
                <view class="photo-info">
                  <view class="field-label is-required">
                    一寸证件照
                  </view>
                  <view class="field-tip">
                    请上传清晰的正面免冠照片
                  </view>
                </view>
              </view>
              <view v-if="fieldErrors.imageUrl" class="field-error">
                {{ fieldErrors.imageUrl }}
              </view>
            </view>

            <view id="field-name" class="field-row" :class="fieldRowClass('name')">
              <wd-input
                v-model="formData.name"
                label-width="88px"
                label="姓名"
                placeholder="请输入真实姓名"
                required
                prop="name"
                :no-border="true"
              />
            </view>

            <view id="field-sex" class="field-row" :class="fieldRowClass('sex')">
              <wd-cell title-width="88px" title="性别" required center :border="false">
                <wd-radio-group v-model="formData.sex" shape="button" inline>
                  <wd-radio :value="1">
                    男
                  </wd-radio>
                  <wd-radio :value="2">
                    女
                  </wd-radio>
                </wd-radio-group>
              </wd-cell>
            </view>

            <view id="field-studentId" class="field-row" :class="fieldRowClass('studentId')">
              <wd-input
                v-model="formData.studentId"
                label="学号"
                label-width="88px"
                placeholder="请输入学号"
                required
                prop="studentId"
                :no-border="true"
              />
            </view>

            <view id="field-phone" class="field-row" :class="fieldRowClass('phone')">
              <wd-input
                v-model="formData.phone"
                label="手机号"
                label-width="88px"
                placeholder="请输入手机号"
                required
                prop="phone"
                :no-border="true"
              />
            </view>

            <view id="field-qqNumber" class="field-row" :class="fieldRowClass('qqNumber')">
              <wd-input
                v-model="formData.qqNumber"
                label="QQ号"
                label-width="88px"
                placeholder="请输入QQ号"
                required
                prop="qqNumber"
                :no-border="true"
              />
            </view>

            <view id="field-email" class="field-row" :class="fieldRowClass('email')">
              <wd-input
                v-model="formData.email"
                label="邮箱"
                label-width="88px"
                placeholder="请输入邮箱地址"
                required
                prop="email"
                :no-border="true"
              />
            </view>
          </view>
        </view>

        <!-- 个人详细信息卡片 -->
        <view class="form-card">
          <view class="card-header">
            <view class="card-bar" />
            <text class="card-title">
              个人详情
            </text>
            <text
              class="card-chip"
              :class="{ 'is-full': cardProgress.detail.filled === cardProgress.detail.total }"
            >
              {{ cardProgress.detail.filled }}/{{ cardProgress.detail.total }}
            </text>
          </view>

          <view class="field-list">
            <view id="field-birthday" class="field-row" :class="fieldRowClass('birthday')">
              <wd-cell title-width="88px" title="出生日期" required center :border="false">
                <wd-datetime-picker
                  v-model="formData.birthday"
                  :min-date="946656000000"
                  type="date"
                  @confirm="onBirthdayChange"
                />
              </wd-cell>
              <view v-if="fieldErrors.birthday" class="field-error">
                {{ fieldErrors.birthday }}
              </view>
            </view>

            <view id="field-nation" class="field-row" :class="fieldRowClass('nation')">
              <wd-cell title-width="88px" title="民族" required center :border="false">
                <wd-picker
                  v-model="formData.nation"
                  :columns="nationOptions"
                  @confirm="onNationChange"
                />
              </wd-cell>
              <view v-if="fieldErrors.nation" class="field-error">
                {{ fieldErrors.nation }}
              </view>
            </view>

            <view id="field-politicalOutlook" class="field-row" :class="fieldRowClass('politicalOutlook')">
              <wd-cell title-width="88px" title="政治面貌" required center :border="false">
                <wd-picker
                  v-model="formData.politicalOutlook"
                  :columns="politicalOptions"
                  @confirm="onPoliticalChange"
                />
              </wd-cell>
              <view v-if="fieldErrors.politicalOutlook" class="field-error">
                {{ fieldErrors.politicalOutlook }}
              </view>
            </view>

            <view id="field-province" class="field-row" :class="fieldRowClass('province')">
              <wd-cell title-width="88px" title="省份" required center :border="false">
                <wd-picker
                  v-model="formData.province"
                  :columns="provinceOptions"
                  placeholder="请选择省份"
                  @confirm="onProvinceChange"
                />
              </wd-cell>
              <view v-if="fieldErrors.province" class="field-error">
                {{ fieldErrors.province }}
              </view>
            </view>

            <view id="field-city" class="field-row" :class="fieldRowClass('city')">
              <wd-cell title-width="88px" title="市/区" required center :border="false">
                <wd-picker
                  v-model="formData.city"
                  :columns="cityOptions"
                  placeholder="请选择市或区"
                  :disabled="!selectedProvinceId"
                  @confirm="onCityChange"
                />
              </wd-cell>
              <view v-if="fieldErrors.city" class="field-error">
                {{ fieldErrors.city }}
              </view>
            </view>
          </view>
        </view>

        <!-- 学院专业信息卡片 -->
        <view class="form-card">
          <view class="card-header">
            <view class="card-bar" />
            <text class="card-title">
              学院信息
            </text>
            <text
              class="card-chip"
              :class="{ 'is-full': cardProgress.school.filled === cardProgress.school.total }"
            >
              {{ cardProgress.school.filled }}/{{ cardProgress.school.total }}
            </text>
          </view>

          <view class="field-list">
            <view id="field-college" class="field-row" :class="fieldRowClass('college')">
              <wd-cell title-width="88px" title="学院" required center :border="false">
                <wd-picker
                  v-model="selectedCollegeId"
                  :columns="collegeOptions"
                  placeholder="请选择学院"
                  @confirm="onCollegeChange"
                />
              </wd-cell>
              <view v-if="fieldErrors.college" class="field-error">
                {{ fieldErrors.college }}
              </view>
            </view>

            <view id="field-major" class="field-row" :class="fieldRowClass('major')">
              <wd-cell title-width="88px" title="专业" required center :border="false">
                <wd-picker
                  v-model="selectedMajorId"
                  :columns="majorOptions"
                  placeholder="请选择专业"
                  :disabled="!selectedCollegeId"
                  @confirm="onMajorChange"
                />
              </wd-cell>
              <view v-if="fieldErrors.major" class="field-error">
                {{ fieldErrors.major }}
              </view>
            </view>

            <view id="field-class" class="field-row" :class="fieldRowClass('class')">
              <wd-cell title-width="88px" title="班级" required center :border="false">
                <wd-picker
                  v-model="selectedClassId"
                  :columns="classOptions"
                  placeholder="请选择班级"
                  :disabled="!selectedMajorId"
                  @confirm="onClassChange"
                />
              </wd-cell>
              <view v-if="fieldErrors.class" class="field-error">
                {{ fieldErrors.class }}
              </view>
            </view>
          </view>
        </view>

        <!-- 个人能力与意向卡片 -->
        <view class="form-card">
          <view class="card-header">
            <view class="card-bar" />
            <text class="card-title">
              能力与意向
            </text>
            <text
              class="card-chip"
              :class="{ 'is-full': cardProgress.ability.filled === cardProgress.ability.total }"
            >
              {{ cardProgress.ability.filled }}/{{ cardProgress.ability.total }}
            </text>
          </view>

          <view id="field-userIntroduce" class="textarea-section" :class="fieldRowClass('userIntroduce')">
            <view class="field-label is-required">
              个人介绍
            </view>
            <view class="textarea-box">
              <wd-textarea
                v-model="formData.userIntroduce"
                placeholder="请简要介绍自己（兴趣爱好、性格特点等）"
                :maxlength="200"
                required
                show-word-limit
                prop="userIntroduce"
              />
            </view>
          </view>

          <view id="field-joinReason" class="textarea-section" :class="fieldRowClass('joinReason')">
            <view class="field-label is-required">
              加入原因
            </view>
            <view class="textarea-box">
              <wd-textarea
                v-model="formData.joinReason"
                placeholder="请说明加入工作室的原因"
                :maxlength="200"
                show-word-limit
                required
                prop="joinReason"
              />
            </view>
          </view>

          <view id="field-personalSkills" class="textarea-section" :class="fieldRowClass('personalSkills')">
            <view class="field-label is-required">
              个人技能
            </view>
            <view class="textarea-box">
              <wd-textarea
                v-model="formData.personalSkills"
                placeholder="请描述您的个人技能和特长"
                :maxlength="200"
                show-word-limit
                required
                prop="personalSkills"
              />
            </view>
          </view>

          <view id="field-interestDirection" class="textarea-section" :class="fieldRowClass('interestDirection')">
            <view class="field-label is-required">
              兴趣方向
            </view>
            <view class="textarea-box">
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
        </view>

        <view class="form-footnote">
          提交即表示您同意我们的信息收集与使用规范
        </view>
      </wd-form>
    </view>

    <!-- 吸底提交栏 -->
    <view v-if="!loading && recruitmentConfig && !showCropper" class="submit-bar">
      <view class="submit-bar__progress">
        <text class="submit-bar__count">
          已填 {{ filledCount }}/{{ requiredTotal }}
        </text>
        <view class="submit-bar__track">
          <view class="submit-bar__fill" :style="{ width: `${progressPercent}%` }" />
        </view>
      </view>
      <wd-button
        type="primary"
        :loading="submitting"
        custom-class="submit-btn"
        @click="onSubmit"
      >
        提交申请
      </wd-button>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="page-loading">
      <view class="page-loading__inner">
        <wd-loading :color="brandColor" />
        <view class="page-loading__text">
          正在加载纳新配置...
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* ---------------- 颜色 token ---------------- */
.recruitment-page {
  --c-brand: #2563eb;
  --c-brand-strong: #1d4ed8;
  --c-brand-soft: rgba(37, 99, 235, 0.08);
  --c-surface: #ffffff;
  --c-text: #0f172a;
  --c-text-2: #475569;
  --c-text-3: #94a3b8;
  --c-line: #eef1f5;
  --c-danger: #dc2626;
  --c-field: #f8fafc;

  /* 把 token 透传给 wot-design-uni，避免组件内部再出现硬编码色值 */
  --wot-cell-title-color: var(--c-text-2);
  --wot-cell-title-fs: 14px;
  --wot-cell-required-color: var(--c-danger);
  --wot-cell-required-size: 14px;
  --wot-input-color: var(--c-text);
  --wot-input-fs: 14px;
  --wot-input-placeholder-color: var(--c-text-3);
  --wot-textarea-color: var(--c-text);
  --wot-textarea-bg: transparent;
  --wot-textarea-count-fs: 12px;
  --wot-textarea-count-color: var(--c-text-3);
  --wot-textarea-count-current-color: var(--c-text-3);
  --wot-form-item-error-message-color: var(--c-danger);
  --wot-form-item-error-message-font-size: 12px;
  --wot-form-item-error-message-line-height: 18px;
  --wot-color-theme: var(--c-brand);
  --wot-radio-checked-color: var(--c-brand);
  --wot-radio-label-color: var(--c-text);
  --wot-radio-bg: var(--c-brand-soft);
  --wot-radio-button-bg: var(--c-field);
  --wot-radio-button-border: var(--c-line);
  --wot-radio-button-height: 36px;
  --wot-radio-button-min-width: 56px;

  min-height: 100vh;
  /* 吸底栏占位，保证最后一个字段不被挡住（先给固定值兜底，再用 env 覆盖） */
  padding-bottom: 96px;
  padding-bottom: calc(96px + constant(safe-area-inset-bottom));
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
}

.recruitment-page.dark {
  --c-brand: #3b82f6;
  --c-brand-strong: #60a5fa;
  --c-brand-soft: rgba(59, 130, 246, 0.14);
  --c-surface: #111a2b;
  --c-text: #e2e8f0;
  --c-text-2: #94a3b8;
  --c-text-3: #64748b;
  --c-line: rgba(255, 255, 255, 0.08);
  --c-danger: #f87171;
  --c-field: rgba(255, 255, 255, 0.04);
}

/* ---------------- 顶部 ---------------- */
.header-section {
  padding: 16px 16px 24px;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  color: #ffffff;
}

.header-subtitle {
  margin-top: 4px;
  font-size: 13px;
  line-height: 18px;
  color: rgba(255, 255, 255, 0.7);
}

/* ---------------- 重新提交提示 ---------------- */
.notice-wrap {
  position: relative;
  z-index: 2;
  margin: -16px 16px 16px;
}

.notice-card {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fffbeb;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.recruitment-page.dark .notice-card {
  background: rgba(245, 158, 11, 0.14);
}

.notice-body {
  flex: 1;
  margin-left: 12px;
}

.notice-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #b45309;
}

.notice-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: #d97706;
}

.recruitment-page.dark .notice-title {
  color: #fcd34d;
}

.recruitment-page.dark .notice-desc {
  color: rgba(252, 211, 77, 0.8);
}

/* ---------------- 表单容器 ---------------- */
.form-body {
  position: relative;
  z-index: 1;
  padding: 0 16px;
}

.form-body.is-overlap {
  margin-top: -16px;
}

.form-card {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 16px;
  background: var(--c-surface);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 8px 24px rgba(15, 23, 42, 0.04);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.card-bar {
  width: 3px;
  height: 14px;
  margin-right: 8px;
  border-radius: 2px;
  background: var(--c-brand);
}

.card-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  color: var(--c-text);
}

.card-chip {
  font-size: 12px;
  line-height: 18px;
  color: var(--c-text-3);
}

.card-chip.is-full {
  color: var(--c-brand);
}

/* ---------------- 字段行 ---------------- */
.field-row {
  position: relative;
  border-bottom: 1px solid var(--c-line);
}

.field-row:last-child {
  border-bottom: none;
}

.field-row--photo {
  padding: 4px 0 12px;
}

/* 错误态：行左侧 2px 竖条 */
.field-row.is-error::before,
.textarea-section.is-error::before {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: -8px;
  width: 2px;
  content: '';
  border-radius: 1px;
  background: var(--c-danger);
}

/* 定位后闪一次高亮，只改背景色，不影响布局尺寸 */
.field-row.is-flash,
.textarea-section.is-flash {
  animation: field-flash 300ms ease-in-out;
}

@keyframes field-flash {
  0% {
    background-color: transparent;
  }
  50% {
    background-color: var(--c-brand-soft);
  }
  100% {
    background-color: transparent;
  }
}

/* 统一的必填标识 */
.is-required::after {
  margin-left: 2px;
  content: '*';
  color: var(--c-danger);
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--c-text-2);
}

.field-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: var(--c-text-3);
}

.field-error {
  padding-bottom: 8px;
  font-size: 12px;
  line-height: 18px;
  color: var(--c-danger);
}

/* ---------------- 证件照 ---------------- */
.photo-field {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.photo-box {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 84px;
  height: 112px;
  border-radius: 12px;
  background: var(--c-field);
  transition: background-color 200ms ease;
}

.photo-box.is-empty {
  border: 1.5px dashed var(--c-brand);
  border-color: rgba(37, 99, 235, 0.4);
}

.recruitment-page.dark .photo-box.is-empty {
  border-color: rgba(59, 130, 246, 0.4);
}

.photo-box.is-hover {
  background: var(--c-brand-soft);
}

.photo-image {
  width: 100%;
  height: 100%;
}

.photo-state {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.photo-state__text {
  margin-top: 8px;
  font-size: 12px;
  line-height: 16px;
  color: var(--c-brand);
}

.photo-badge {
  position: absolute;
  right: 4px;
  bottom: 4px;
  padding: 2px 8px;
  font-size: 11px;
  line-height: 16px;
  color: #ffffff;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.6);
}

.photo-info {
  flex: 1;
  margin-left: 16px;
}

/* ---------------- 长文本 ---------------- */
.textarea-section {
  position: relative;
  margin-bottom: 16px;
}

.textarea-section:last-child {
  margin-bottom: 0;
}

.textarea-box {
  margin-top: 8px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--c-field);
  transition: border-color 200ms ease;
}

.textarea-box:focus-within {
  border-color: var(--c-brand);
}

/* ---------------- 表单末尾说明 ---------------- */
.form-footnote {
  padding: 8px 0 16px;
  text-align: center;
  font-size: 12px;
  line-height: 18px;
  color: var(--c-text-3);
}

/* ---------------- 吸底提交栏 ---------------- */
.submit-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--c-line);
  background: var(--c-surface);
  /* 小程序下 env() 不生效时回落到固定值 */
  padding-bottom: 12px;
  padding-bottom: calc(12px + constant(safe-area-inset-bottom));
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.submit-bar__progress {
  flex: 1;
  margin-right: 16px;
}

.submit-bar__count {
  font-size: 12px;
  line-height: 18px;
  color: var(--c-text-3);
}

.submit-bar__track {
  overflow: hidden;
  margin-top: 8px;
  height: 2px;
  border-radius: 1px;
  background: var(--c-line);
}

.submit-bar__fill {
  height: 100%;
  border-radius: 1px;
  background: var(--c-brand);
  transition: width 200ms ease;
}

/* ---------------- 加载态 ---------------- */
.page-loading {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-surface);
}

.page-loading__inner {
  text-align: center;
}

.page-loading__text {
  margin-top: 16px;
  font-size: 14px;
  line-height: 20px;
  color: var(--c-text-3);
}

/* ---------------- wot-design-uni 组件覆盖 ---------------- */
:deep(.submit-btn) {
  min-width: 140px;
  height: 44px !important;
  border: none !important;
  border-radius: 12px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  background: linear-gradient(135deg, var(--c-brand) 0%, var(--c-brand-strong) 100%) !important;
}

/* 行高统一 52px，触达区不低于 44pt */
:deep(.wd-cell),
:deep(.wd-input) {
  display: flex;
  align-items: center;
  min-height: 52px;
  background: transparent;
}

:deep(.wd-input) {
  padding: 0 !important;
}

:deep(.wd-cell) {
  padding: 0 !important;
}

:deep(.wd-cell__wrapper) {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 52px;
  padding: 0 !important;
}

:deep(.wd-cell__left) {
  align-items: center;
  margin-right: 12px;
}

:deep(.wd-cell__title),
:deep(.wd-input__label-inner) {
  flex: none;
  width: auto;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

:deep(.wd-cell__value) {
  color: var(--c-text);
}

/* 必填星号统一放到 label 右侧 */
:deep(.wd-cell__left.is-required),
:deep(.wd-input__label.is-required) {
  padding-left: 0;
}

:deep(.wd-cell__left.is-required::after),
:deep(.wd-input__label.is-required::after) {
  position: relative;
  top: auto;
  left: auto;
  margin-left: 2px;
  font-size: 14px;
  line-height: 20px;
  color: var(--c-danger);
}

/* picker 去掉自带的 cell 内边距与背景，交给外层 field-row 控制 */
:deep(.wd-picker__cell) {
  padding: 0 !important;
  background: transparent;
}

:deep(.wd-picker__value) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--c-text);
}

:deep(.wd-picker__placeholder) {
  color: var(--c-text-3);
}

:deep(.wd-radio-group) {
  display: flex;
  align-items: center;
}

/* 按钮态单选：视觉高度 36，但触达区补到 44 */
:deep(.wd-radio.is-button) {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}

:deep(.wd-radio__label) {
  color: var(--c-text);
}

/* 长文本：高度统一 96px，字数计数放右下角 */
:deep(.wd-textarea) {
  padding: 0;
  background: transparent;
}

:deep(.wd-textarea__value) {
  background: transparent;
}

:deep(.wd-textarea__value.is-show-limit) {
  padding-bottom: 20px;
}

:deep(.wd-textarea__inner) {
  height: 96px;
  min-height: 96px;
}

:deep(.wd-textarea__count) {
  bottom: 0;
  line-height: 16px;
  background: transparent;
}

:deep(.wd-input__error-message),
:deep(.wd-cell__error-message),
:deep(.wd-textarea__error-message) {
  padding-bottom: 8px;
  line-height: 18px;
}
</style>

<style>
page {
  background-color: #f5f7fa;
}
.dark page {
  background-color: #0b1220;
}
</style>

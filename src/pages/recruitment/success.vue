<!-- 纳新进度页：用户本人只读，不提供考核录入能力 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "申请状态"
  },
  "notLogin": true
}
</route>

<script setup lang="ts">
import type { UserRecruitmentAssessmentPublicRespVO, UserRecruitmentProgressRespVO } from '@/api/types/recruitment'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'
import { getSocialAuthRedirect, getWxUserInfoApi } from '@/api/login'
import { getRecruitmentProgress } from '@/api/recruitment'
import { RecruitmentStatus } from '@/api/types/recruitment'
import { useAppStore } from '@/store/app'
import { getSocialType, isWechatBrowser } from '@/utils/platform'

const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const loading = ref(true)
const error = ref('')
const groupLink = ref('')
const progress = ref<UserRecruitmentProgressRespVO | null>(null)

const status = computed(() => progress.value?.status ?? RecruitmentStatus.WAIT_AUDIT)
const assessments = computed(() => progress.value?.assessments ?? [])
// 旧接口可能仍把已登记集中考核的报名人返回为 1；用本人进度事实补足页面节点，
// 但不把它擅自改成拟录取，拟录取仍以服务端明确状态为准。
const displayStatus = computed(() => {
  if (status.value === RecruitmentStatus.PASS
    && assessments.value.some(item => item.assessmentStage === 2 && item.passed)) {
    return RecruitmentStatus.WAIT_INTERVIEW
  }
  return status.value
})
interface ProgressStatusConfig {
  icon: string
  tone: 'warn' | 'bad' | 'info' | 'success'
  iconColor: string
  title: string
  copy: string
  next: string
  current: number
  rejected?: boolean
}

const statusConfig = computed<ProgressStatusConfig>(() => {
  switch (displayStatus.value) {
    case RecruitmentStatus.WAIT_AUDIT:
      return { icon: 'time', tone: 'warn', iconColor: '#f59e0b', title: '报名表审核中', copy: '你的报名信息已提交，我们正在认真查看。', next: '审核完成后会开放流动考核，请留意群内和服务号通知。', current: 1 }
    case RecruitmentStatus.REFUSE:
      return { icon: 'edit', tone: 'bad', iconColor: '#ef4444', title: '报名表需要调整', copy: '本次审核暂未通过，你可以完善信息后重新提交。', next: '返回报名表检查信息，修改后重新提交审核。', current: 1, rejected: true }
    case RecruitmentStatus.FIT_ADMIT:
      return { icon: 'star-on', tone: 'success', iconColor: '#8b5cf6', title: '拟录取', copy: '恭喜你！你已进入拟录取环节。', next: '请留意后续报到通知，也可以继续参加其他方向的考核。', current: 4 }
    case RecruitmentStatus.WAIT_INTERVIEW:
      return { icon: 'calendar', tone: 'info', iconColor: '#2563eb', title: '集中考核进行中', copy: '你已获得对应方向的集中考核资格。', next: '按纳新群内通知参加集中考核，通过后将进入拟录取环节。', current: 3 }
    case RecruitmentStatus.PASS:
    default:
      return { icon: 'check', tone: 'info', iconColor: '#2563eb', title: '流动考核进行中', copy: '审核已通过，可以继续参加流动考核。', next: '先完成任一方向的流动考核；通过后会解锁对应的集中考核。', current: 2 }
  }
})

const stageLabels = ['交表', '审核', '流动考核', '集中考核', '拟录取']
const typeNames: Record<string, string> = {
  ELECTRONIC: '电子',
  STRUCTURE: '结构',
  PROGRAM: '程序',
}

const passedKeys = computed(() => new Set(assessments.value.map(item => `${item.assessmentStage}:${item.assessmentType}`)))
const passedAssessment = computed(() => assessments.value.filter(item => item.passed))
const availableAssessment = computed(() => {
  if (status.value === RecruitmentStatus.WAIT_AUDIT || status.value === RecruitmentStatus.REFUSE)
    return []

  const types = ['ELECTRONIC', 'STRUCTURE', 'PROGRAM']
  return types.flatMap((type) => {
    const result: Array<{ stage: number, type: string, label: string }> = []
    if (!passedKeys.value.has(`1:${type}`)) {
      result.push({ stage: 1, type, label: `${typeNames[type]} · 流动考核` })
    }
    else if (!passedKeys.value.has(`2:${type}`)) {
      result.push({ stage: 2, type, label: `${typeNames[type]} · 集中考核` })
    }
    return result
  })
})

const textPrimaryClass = computed(() => (isDark.value ? 'text-slate-100' : 'text-slate-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-slate-300' : 'text-slate-600'))
const textMutedClass = computed(() => (isDark.value ? 'text-slate-400' : 'text-slate-500'))

function setPageBackgroundColor() {
  const color = isDark.value ? '#020617' : '#f5f7fa'
  const api = (uni as any).setBackgroundColor
  if (typeof api === 'function') {
    api({ backgroundColor: color, backgroundColorTop: color, backgroundColorBottom: color })
  }
}

function decodeOption(value?: string) {
  if (!value)
    return ''
  try {
    return decodeURIComponent(value)
  }
  catch {
    return value
  }
}

interface WxIdentity {
  openid: string
  unionId?: string
}

function getWxCode(): Promise<{ code: string }> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve({ code: res.code }),
      fail: err => reject(err),
    })
  })
}

// 小程序 / APP 均通过 uni.login 的 code 换取 openid/unionId
async function getIdentityByCode(): Promise<WxIdentity | null> {
  try {
    const codeRes = await getWxCode()
    const res = await getWxUserInfoApi({ type: getSocialType(), code: codeRes.code })
    if (res.code === 0 && res.data?.openid) {
      return { openid: res.data.openid, unionId: res.data.unionId }
    }
    return null
  }
  catch (err) {
    console.error('获取微信用户信息失败:', err)
    return null
  }
}

// H5 服务号 OAuth 回调：使用授权 code 换取 openid/unionId
async function getIdentityH5(code: string, state?: string): Promise<WxIdentity | null> {
  try {
    const res = await getWxUserInfoApi({ type: getSocialType(), code, state })
    if (res.code === 0 && res.data?.openid) {
      return { openid: res.data.openid, unionId: res.data.unionId }
    }
    return null
  }
  catch (err) {
    console.error('获取微信用户信息失败:', err)
    return null
  }
}

// H5 微信浏览器且 URL 无 code 时，跳转微信授权页；返回 true 表示已发生跳转
async function redirectToWxAuthH5(): Promise<boolean> {
  try {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('code')
    currentUrl.searchParams.delete('state')
    const redirect = await getSocialAuthRedirect({ type: getSocialType(), redirectUri: currentUrl.toString() })
    if (redirect.code === 0 && redirect.data) {
      window.location.href = redirect.data
      return true
    }
    return false
  }
  catch (err) {
    console.error('初始化微信认证失败:', err)
    return false
  }
}

async function loadProgress(options: Record<string, string> = {}) {
  loading.value = true
  error.value = ''
  try {
    let identity: WxIdentity | null = null

    // #ifdef MP-WEIXIN
    identity = await getIdentityByCode()
    // #endif

    // #ifdef APP-PLUS
    identity = await getIdentityByCode()
    // #endif

    // #ifdef H5
    if (isWechatBrowser()) {
      if (options.code) {
        identity = await getIdentityH5(options.code, options.state)
      }
      else if (await redirectToWxAuthH5()) {
        return
      }
    }
    // #endif

    if (!identity) {
      error.value = '获取微信用户信息失败，请重试'
      return
    }

    const result = await getRecruitmentProgress(identity.openid, identity.unionId)
    if (result.code !== 0 || !result.data) {
      error.value = '未找到您的纳新记录'
      return
    }
    progress.value = result.data
  }
  catch (err: any) {
    console.error('获取纳新进度失败:', err)
    error.value = err?.message || '查询失败，请稍后重试'
  }
  finally {
    loading.value = false
  }
}

function onJoinGroup() {
  if (!groupLink.value)
    return

  // #ifdef H5
  window.location.href = groupLink.value
  // #endif
  // #ifdef MP-WEIXIN
  uni.navigateTo({
    url: `/pages-sub/webview/index?url=${encodeURIComponent(groupLink.value)}`,
    fail: () => uni.showToast({ title: '打开链接失败', icon: 'none' }),
  })
  // #endif
  // #ifdef APP-PLUS
  plus.runtime.openURL(groupLink.value)
  // #endif
}

function onResubmit() {
  uni.redirectTo({ url: '/pages/recruitment/index' })
}

function scoreText(item: UserRecruitmentAssessmentPublicRespVO) {
  return item.score === null || item.score === undefined || item.score === ''
    ? '已通过'
    : `已通过 · ${item.score} 分`
}

function assessmentLabel(item: UserRecruitmentAssessmentPublicRespVO) {
  return `${typeNames[item.assessmentType] || item.assessmentType} · ${item.assessmentStage === 1 ? '流动考核' : '集中考核'}`
}

onLoad((options) => {
  groupLink.value = decodeOption(options?.groupLink)
  loadProgress(options as Record<string, string>)
})
onShow(setPageBackgroundColor)
watch(isDark, setPageBackgroundColor)
</script>

<template>
  <view class="progress-page min-h-screen">
    <view class="header-section relative overflow-hidden from-[#2563eb] to-[#1e40af] bg-gradient-to-br px-6 pb-20 pt-12">
      <view class="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-white/10" />
      <view class="absolute bottom-[-20px] left-[-20px] h-24 w-24 rounded-full bg-white/5" />
      <view class="relative z-1">
        <view class="header-eyebrow">
          TIHANG STUDIO · RECRUITMENT
        </view>
        <view class="mt-2 text-2xl text-white font-bold">
          纳新进度
        </view>
        <view class="mt-1 text-xs text-white/75">
          每一步都有回应，期待与你在工作室相遇。
        </view>
      </view>
    </view>

    <view class="relative z-10 mt-[-34px] px-4 pb-8">
      <view v-if="loading" class="progress-card flex flex-col items-center rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-800">
        <wd-loading size="40px" color="#2563eb" />
        <text class="mt-4 text-sm" :class="textMutedClass">
          查询中，请稍候...
        </text>
      </view>

      <template v-else>
        <view class="progress-card rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <view class="flex items-center gap-3">
            <view class="status-icon flex shrink-0 items-center justify-center rounded-2xl" :class="`status-${statusConfig.tone}`">
              <wd-icon :name="statusConfig.icon" size="30px" :color="statusConfig.iconColor" />
            </view>
            <view class="min-w-0 flex-1">
              <view class="text-lg font-bold" :class="textPrimaryClass">
                {{ statusConfig.title }}
              </view>
              <view class="mt-1 text-sm leading-relaxed" :class="textMutedClass">
                {{ statusConfig.copy }}
              </view>
            </view>
          </view>

          <view v-if="error" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {{ error }}
          </view>
          <view v-else class="next-box mt-5 rounded-xl bg-blue-50 p-3.5 dark:bg-blue-500/10">
            <view class="mb-1 flex items-center text-sm text-blue-700 font-semibold dark:text-blue-300">
              <wd-icon name="arrow-right" size="16px" color="#2563eb" />
              <text class="ml-1">
                下一步
              </text>
            </view>
            <view class="text-xs leading-relaxed" :class="textSecondaryClass">
              {{ statusConfig.next }}
            </view>
          </view>

          <view class="stage-progress mt-6">
            <view v-for="(label, index) in stageLabels" :key="label" class="stage-node" :class="{ done: index < statusConfig.current, active: index === statusConfig.current, rejected: statusConfig.rejected && index === 1 }">
              <view class="stage-dot">
                <wd-icon v-if="index < statusConfig.current" name="check" size="13px" color="#fff" />
                <text v-else>
                  {{ index + 1 }}
                </text>
              </view>
              <text>{{ label }}</text>
            </view>
          </view>
        </view>

        <view v-if="!error && (passedAssessment.length || availableAssessment.length)" class="progress-card mt-3 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <view class="section-title flex items-center text-sm font-bold" :class="textPrimaryClass">
            <i />与我相关的考核
          </view>
          <view v-for="item in passedAssessment" :key="`${item.assessmentStage}-${item.assessmentType}`" class="assessment-row flex items-center justify-between border-b border-slate-100 py-3 last:border-0 dark:border-white/10">
            <view>
              <view class="text-sm font-semibold" :class="textPrimaryClass">
                {{ assessmentLabel(item) }}
              </view>
              <view class="mt-1 text-xs" :class="textMutedClass">
                考核记录已确认
              </view>
            </view>
            <view class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              {{ scoreText(item) }}
            </view>
          </view>
          <view v-for="item in availableAssessment" :key="`${item.stage}-${item.type}`" class="assessment-row flex items-center justify-between border-b border-slate-100 py-3 last:border-0 dark:border-white/10">
            <view>
              <view class="text-sm font-semibold" :class="textPrimaryClass">
                {{ item.label }}
              </view>
              <view class="mt-1 text-xs" :class="textMutedClass">
                {{ item.stage === 2 ? '已解锁对应方向' : '其他方向仍可继续参加' }}
              </view>
            </view>
            <view class="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              {{ item.stage === 2 ? '可参加' : '可继续参加' }}
            </view>
          </view>
        </view>

        <view v-if="!error" class="progress-card mt-3 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <view class="section-title flex items-center text-sm font-bold" :class="textPrimaryClass">
            <i />操作区
          </view>
          <view v-if="statusConfig.rejected" class="action-button primary flex items-center justify-center text-white font-semibold" hover-class="opacity-90" @click="onResubmit">
            <wd-icon name="edit" size="18px" color="#fff" />
            <text class="ml-2">
              修改并重新提交
            </text>
          </view>
          <view v-if="statusConfig.rejected" class="action-button secondary mt-3 flex items-center justify-center font-semibold" :class="groupLink ? 'text-blue-600 dark:text-blue-300' : 'disabled text-slate-400 dark:text-slate-500'" :hover-class="groupLink ? 'bg-blue-50 dark:bg-blue-500/10' : ''" @click="onJoinGroup">
            <wd-icon name="chat" size="18px" :color="groupLink ? '#2563eb' : '#94a3b8'" />
            <text class="ml-2">
              {{ groupLink ? '加入纳新群' : '纳新群暂未开放' }}
            </text>
          </view>
          <view v-else class="action-button primary flex items-center justify-center text-white font-semibold" :class="{ disabled: !groupLink }" :hover-class="groupLink ? 'opacity-90' : ''" @click="onJoinGroup">
            <wd-icon name="chat" size="18px" color="#fff" />
            <text class="ml-2">
              {{ groupLink ? '加入纳新群' : '纳新群暂未开放' }}
            </text>
          </view>
        </view>
      </template>

      <view class="mt-7 text-center text-xs" :class="textMutedClass">
        梯航智能车创新工作室
      </view>
    </view>
  </view>
</template>

<style scoped>
.progress-page {
  --brand: #2563eb;
}
.progress-card {
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 8px 24px rgba(15, 23, 42, 0.06);
}
.header-eyebrow {
  color: rgba(255, 255, 255, 0.68);
  font-size: 10px;
  letter-spacing: 0.13em;
}
.status-icon {
  width: 58px;
  height: 58px;
}
.status-warn {
  background: #fffbeb;
}
.status-bad {
  background: #fef2f2;
}
.status-info {
  background: #eff6ff;
}
.status-success {
  background: #f5f3ff;
}
.dark .status-warn {
  background: rgba(245, 158, 11, 0.12);
}
.dark .status-bad {
  background: rgba(239, 68, 68, 0.12);
}
.dark .status-info {
  background: rgba(59, 130, 246, 0.12);
}
.dark .status-success {
  background: rgba(139, 92, 246, 0.12);
}
.stage-progress {
  display: flex;
  justify-content: space-between;
  position: relative;
}
.stage-progress::before {
  content: '';
  position: absolute;
  left: 8%;
  right: 8%;
  top: 12px;
  height: 2px;
  background: #e2e8f0;
}
.dark .stage-progress::before {
  background: rgba(255, 255, 255, 0.14);
}
.stage-node {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  color: #94a3b8;
  font-size: 10px;
  white-space: nowrap;
}
.stage-dot {
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  background: #fff;
  color: #94a3b8;
  font-size: 11px;
}
.dark .stage-dot {
  border-color: #475569;
  background: #1e293b;
}
.stage-node.done,
.stage-node.active {
  color: #2563eb;
}
.stage-node.done .stage-dot {
  border-color: #2563eb;
  background: #2563eb;
}
.stage-node.active .stage-dot {
  border-color: #2563eb;
  background: #eff6ff;
  color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}
.stage-node.rejected {
  color: #ef4444;
}
.stage-node.rejected .stage-dot {
  border-color: #ef4444;
  background: #fef2f2;
  color: #ef4444;
}
.section-title i {
  display: inline-block;
  width: 4px;
  height: 18px;
  margin-right: 9px;
  border-radius: 4px;
  background: #2563eb;
}
.action-button {
  /* 常规移动端按钮高度：44px 同时满足视觉高度与最小触控目标 */
  height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 20px;
  transition:
    opacity 0.2s ease,
    background-color 0.2s ease;
}
.action-button.primary {
  background: linear-gradient(90deg, #2563eb, #1e40af);
}
.action-button.disabled {
  background: #cbd5e1;
  color: #fff;
  pointer-events: none;
}
.action-button.secondary {
  border: 1px solid #bfdbfe;
  background: #fff;
}
.dark .action-button.secondary {
  border-color: rgba(96, 165, 250, 0.45);
  background: #1e293b;
}
@media (prefers-reduced-motion: reduce) {
  .action-button {
    transition: none;
  }
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

<!-- 编辑资料页面 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "编辑资料"
  }
}
</route>

<script setup lang="ts">
import type { ISystemUserInfoVo, IUserProfileUpdateReqVO } from '@/api/types/user'
import { ref } from 'vue'
import { getUserInfo, updateUserProfile, uploadFile } from '@/api/user'
import KspCropper from '@/components/ksp-cropper.vue'
import { useUserStore } from '@/store'

defineOptions({
  name: 'ProfileEdit',
})

const userStore = useUserStore()

// 用户信息
const userInfo = ref<ISystemUserInfoVo | null>(null)
const loading = ref(false)
const submitting = ref(false)

// 表单数据
const formData = ref<IUserProfileUpdateReqVO>({
  mobile: '',
  email: '',
  avatar: '',
})

// 图片裁剪相关
const showCropper = ref(false)
const cropImageSrc = ref('')
const avatarSource = ref<'wechat' | 'album' | 'camera' | ''>('') // 头像来源

// 头像上传状态
const avatarUploading = ref(false)

// 性别选项
const sexOptions = [
  { label: '未知', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 },
]

// 获取用户信息
async function fetchUserInfo() {
  loading.value = true
  try {
    const res = await getUserInfo()
    userInfo.value = res.data

    // 填充表单数据
    formData.value = {
      mobile: res.data.mobile || '',
      email: res.data.email || '',
      avatar: res.data.avatar || '',
    }

    console.log('📋 获取用户信息成功:', res.data)
  }
  catch (error: any) {
    console.error('❌ 获取用户信息失败:', error)
    uni.showToast({
      title: '获取用户信息失败',
      icon: 'none',
    })
  }
  finally {
    loading.value = false
  }
}

// 清空手机号输入框
function clearMobileInput() {
  formData.value.mobile = ''
  uni.showToast({
    title: '输入框已清空',
    icon: 'none',
  })
}

// 统一的头像选择处理
function onChooseAvatar(e: any) {
  console.log('🎯 微信头像选择:', e)
  if (e.detail.avatarUrl) {
    // 标记来源为微信头像
    avatarSource.value = 'wechat'
    // 微信头像选择后也弹出裁切组件
    cropImageSrc.value = e.detail.avatarUrl
    showCropper.value = true
  }
}

// 统一处理头像选择结果
async function handleAvatarSelected(imagePath: string, source?: 'wechat' | 'album' | 'camera') {
  try {
    avatarUploading.value = true

    // 根据来源显示不同的上传提示
    const sourceText = {
      wechat: '微信头像',
      album: '相册图片',
      camera: '拍照图片',
    }[source || ''] || '头像'

    // 显示上传提示
    uni.showLoading({
      title: `正在上传${sourceText}...`,
      mask: true,
    })

    // 上传图片到服务器
    const serverImageUrl = await uploadFile(imagePath, 'avatar')

    // 设置服务器返回的图片URL
    formData.value.avatar = serverImageUrl

    uni.hideLoading()
    console.log('✅ 头像上传成功:', serverImageUrl, '来源:', source)
    uni.showToast({
      title: `${sourceText}上传成功`,
      icon: 'success',
    })

    // 清空来源标记
    avatarSource.value = ''
  }
  catch (error: any) {
    uni.hideLoading()
    console.error('❌ 头像上传失败:', error)

    let errorMessage = '上传失败，请重试'
    if (error.message) {
      if (error.message.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络'
      }
      else if (error.message.includes('格式')) {
        errorMessage = '图片格式不支持'
      }
      else if (error.message.includes('大小')) {
        errorMessage = '图片文件过大'
      }
      else {
        errorMessage = error.message
      }
    }

    uni.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 3000,
    })
  }
  finally {
    avatarUploading.value = false
  }
}

// 裁剪确认回调
async function onCropConfirm(result: any) {
  console.log('✂️ 裁剪结果:', result)
  console.log('🎯 头像来源:', avatarSource.value)

  // 根据来源显示不同的提示信息
  const sourceText = {
    wechat: '微信头像',
    album: '相册图片',
    camera: '拍照图片',
  }[avatarSource.value] || '图片'

  console.log(`📤 正在上传${sourceText}...`)

  // 关闭裁剪组件
  showCropper.value = false

  // ksp-cropper 返回的数据格式为 { path: string, base64?: string }
  const localImagePath = result.path

  // 使用统一的头像处理逻辑，传递来源信息
  await handleAvatarSelected(localImagePath, avatarSource.value || undefined)
}

// 裁剪取消回调
function onCropCancel() {
  showCropper.value = false
  console.log('👋 用户取消裁剪，来源:', avatarSource.value)

  // 清空来源标记
  avatarSource.value = ''
}

// 提交表单
async function handleSubmit() {
  // 验证邮箱格式
  if (formData.value.email && !isValidEmail(formData.value.email)) {
    uni.showToast({
      title: '请输入正确的邮箱格式',
      icon: 'none',
    })
    return
  }

  // 验证手机号格式
  if (formData.value.mobile && !isValidMobile(formData.value.mobile)) {
    uni.showToast({
      title: '请输入正确的手机号格式',
      icon: 'none',
    })
    return
  }

  submitting.value = true
  try {
    const updateData: IUserProfileUpdateReqVO = {
      mobile: formData.value.mobile?.trim() || undefined,
      email: formData.value.email?.trim() || undefined,
      avatar: formData.value.avatar || undefined,
    }

    const res = await updateUserProfile(updateData)

    if (res.code === 0) {
      uni.showToast({
        title: '保存成功',
        icon: 'success',
      })

      // 刷新用户信息
      await userStore.getUserInfo()

      // 返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
    else {
      uni.showToast({
        title: res.msg || '保存失败',
        icon: 'none',
      })
    }
  }
  catch (error: any) {
    console.error('❌ 更新用户信息失败:', error)
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none',
    })
  }
  finally {
    submitting.value = false
  }
}

// 验证邮箱格式
function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证手机号格式
function isValidMobile(mobile: string) {
  const mobileRegex = /^1[3-9]\d{9}$/
  return mobileRegex.test(mobile)
}

// 页面加载时获取用户信息
onLoad(() => {
  if (userStore.userInfo.accessToken) {
    fetchUserInfo()
  }
  else {
    uni.redirectTo({
      url: '/pages/login/index',
    })
  }
})
</script>

<template>
  <view class="min-h-screen bg-gray-50">
    <!-- 加载状态 -->
    <view v-if="loading" class="flex items-center justify-center py-20">
      <view class="text-sm text-gray-500">
        正在加载用户信息...
      </view>
    </view>

    <!-- 表单内容 -->
    <view v-else class="p-4 pb-32 space-y-4">
      <!-- 头像设置 -->
      <view class="rounded-2xl bg-white p-6">
        <view class="mb-4 text-lg text-gray-800 font-semibold">
          头像设置
        </view>

        <!-- 头像显示区域 -->
        <view class="mb-4 flex items-center justify-center">
          <view class="relative">
            <image
              :src="formData.avatar || '/static/images/default-avatar.png'"
              class="h-20 w-20 border-2 border-gray-200 rounded-2xl"
              mode="aspectFill"
            />

            <!-- 上传遮罩 -->
            <view
              v-if="avatarUploading"
              class="absolute inset-0 flex items-center justify-center rounded-2xl bg-black bg-opacity-60"
            >
              <view class="text-center">
                <view class="mb-2 text-lg">
                  📤
                </view>
                <view class="mt-1 text-xs text-white opacity-80">
                  正在上传头像...
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 头像选择按钮 -->
        <view>
          <!-- #ifdef MP-WEIXIN -->
          <button
            class="w-full border border-blue-500 rounded-xl bg-blue-50 py-3 text-sm text-blue-600 transition-colors active:bg-blue-100"
            open-type="chooseAvatar"
            :disabled="avatarUploading"
            @chooseavatar="onChooseAvatar"
          >
            <text class="mr-2">
              📷
            </text>
            选择头像
          </button>
          <!-- #endif -->
        </view>

        <view class="mt-3 text-center text-xs text-gray-500">
          点击按钮选择头像
        </view>
      </view>

      <!-- 基本信息 -->
      <view class="rounded-2xl bg-white p-6">
        <view class="mb-4 text-lg text-gray-800 font-semibold">
          基本信息
        </view>

        <view class="space-y-4">
          <!-- 手机号 -->
          <view class="space-y-2">
            <view class="text-sm text-gray-700 font-medium">
              手机号
            </view>
            <view class="flex gap-3">
              <input
                v-model="formData.mobile"
                placeholder="请输入手机号"
                type="number"
                class="flex-1 rounded-xl border-none bg-gray-50 px-4 py-3 text-sm text-gray-800"
              >
            </view>
          </view>

          <!-- 邮箱 -->
          <view class="space-y-2">
            <view class="text-sm text-gray-700 font-medium">
              邮箱
            </view>
            <input
              v-model="formData.email"
              placeholder="请输入邮箱地址"
              class="flex-1 rounded-xl border-none bg-gray-50 px-4 py-3 text-sm text-gray-800"
            >
          </view>
        </view>
      </view>

      <!-- 账号信息 -->
      <view v-if="userInfo" class="rounded-2xl bg-white p-6">
        <view class="mb-4 text-lg text-gray-800 font-semibold">
          账号信息
        </view>

        <view class="space-y-3">
          <view class="flex items-center justify-between py-2">
            <view class="text-sm text-gray-600">
              用户ID
            </view>
            <view class="text-sm text-gray-800 font-medium">
              {{ userInfo.id }}
            </view>
          </view>

          <view class="flex items-center justify-between py-2">
            <view class="text-sm text-gray-600">
              学号/工号
            </view>
            <view class="text-sm text-gray-800 font-medium">
              {{ userInfo.username }}
            </view>
          </view>

          <view class="flex items-center justify-between py-2">
            <view class="text-sm text-gray-600">
              姓名
            </view>
            <view class="text-sm text-gray-800 font-medium">
              {{ userInfo.nickname || '未设置' }}
            </view>
          </view>

          <view class="flex items-center justify-between py-2">
            <view class="text-sm text-gray-600">
              性别
            </view>
            <view class="text-sm text-gray-800 font-medium">
              {{ userInfo.sex === 1 ? '男' : userInfo.sex === 2 ? '女' : '未知' }}
            </view>
          </view>

          <view class="flex items-center justify-between py-2">
            <view class="text-sm text-gray-600">
              所属部门
            </view>
            <view class="text-sm text-gray-800 font-medium">
              {{ userInfo.dept ? userInfo.dept.name : '暂无部门' }}
            </view>
          </view>

          <view v-if="userInfo.roles && userInfo.roles.length > 0" class="flex items-start justify-between py-2">
            <view class="pt-1 text-sm text-gray-600">
              用户角色
            </view>
            <view class="ml-4 flex-1 text-right">
              <view
                v-for="role in userInfo.roles"
                :key="role.id"
                class="mb-1 mr-1 inline-block rounded-md bg-purple-50 px-2 py-1 text-xs text-purple-700"
              >
                {{ role.name }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4 pb-safe">
      <button
        class="w-full rounded-xl py-3 text-base font-medium transition-colors"
        :class="submitting ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 text-white active:bg-blue-600'"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '保存中...' : '保存修改' }}
      </button>
    </view>

    <!-- 图片裁剪组件 -->
    <KspCropper
      v-if="showCropper"
      :url="cropImageSrc"
      mode="ratio"
      :width="300"
      :height="300"
      @ok="onCropConfirm"
      @cancel="onCropCancel"
    />
  </view>
</template>

<style lang="scss" scoped>
/* 头像上传样式 */
.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.upload-progress {
  text-align: center;
  color: white;
  padding: 8px;
}

.upload-icon {
  font-size: 18px;
  margin-bottom: 4px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.upload-status {
  font-size: 10px;
  opacity: 0.8;
  margin-top: 2px;
}
</style>

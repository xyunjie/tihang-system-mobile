<!-- 考勤照片上传页面 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "考勤照片上传"
  }
}
</route>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { resetFace as resetFaceApi } from '@/api/attendance'
import { getUserExtra } from '@/api/user'
import { useUserStore } from '@/store'
import { useAppStore } from '@/store/app'
import { compressImage } from '@/utils'

// 页面状态
const attendancePhotoUrl = ref<string>('')
const originalPhotoUrl = ref<string>('') // 存储原始照片路径，用于比较变化
const selectedImagePath = ref<string>('')
const showCropper = ref<boolean>(false)
const uploading = ref<boolean>(false)

const userStore = useUserStore()

// 深色模式样式
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const cardClass = computed(() => (isDark.value ? 'bg-gray-800' : 'bg-white'))
const titleClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-900'))
const textClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-600'))

// 计算属性：判断是否已有考勤照片
const hasExistingPhoto = computed(() => {
  return Boolean(originalPhotoUrl.value)
})

// 计算属性：判断照片是否有变化
const hasPhotoChanged = computed(() => {
  // 如果已有照片，不允许修改
  if (hasExistingPhoto.value) {
    return false
  }

  // 如果没有当前照片，则不能更新
  if (!attendancePhotoUrl.value) {
    return false
  }

  // 如果原始照片为空（首次上传），且当前有照片，则认为有变化
  if (!originalPhotoUrl.value && attendancePhotoUrl.value) {
    return true
  }

  // 比较当前照片路径与原始照片路径是否不同
  return attendancePhotoUrl.value !== originalPhotoUrl.value
})

// 页面加载时获取当前考勤照片
onShow(() => {
  loadCurrentPhoto()
})

/**
 * 加载当前考勤照片
 */
async function loadCurrentPhoto() {
  try {
    // 获取当前用户信息
    const userInfo = userStore.userInfo
    if (!userInfo || !userInfo.userId) {
      console.log('用户信息不完整，无法获取考勤照片')
      return
    }

    // 调用用户扩展数据API获取人脸图片
    const response = await getUserExtra(Number(userInfo.userId))
    console.log('获取用户扩展数据响应:', response)

    if (response.code === 0 && response.data) {
      const userExtraData = response.data
      console.log('用户扩展数据:', userExtraData)

      // 尝试不同的字段名称获取人脸图片
      let faceImageUrl = ''

      if (userExtraData.userInfo) {
        try {
          // 如果userInfo是JSON字符串，尝试解析
          const parsedInfo = JSON.parse(userExtraData.userInfo)
          faceImageUrl = parsedInfo.faceImageUrl || parsedInfo.facePath || parsedInfo.avatar || ''
        }
        catch (e) {
          // 如果不是JSON，直接当作图片URL使用
          if (userExtraData.userInfo.startsWith('http')) {
            faceImageUrl = userExtraData.userInfo
          }
        }
      }

      // 直接检查其他可能的字段
      if (!faceImageUrl) {
        faceImageUrl = (userExtraData as any).facePath
          || (userExtraData as any).faceImageUrl
          || (userExtraData as any).avatar || ''
      }

      if (faceImageUrl) {
        attendancePhotoUrl.value = faceImageUrl
        originalPhotoUrl.value = faceImageUrl // 保存原始照片路径
        console.log('设置考勤照片URL:', faceImageUrl)
      }
      else {
        console.log('未找到人脸图片')
        // 清空原始路径
        originalPhotoUrl.value = ''
      }
    }
  }
  catch (error) {
    console.error('获取考勤照片失败:', error)
    // 获取失败不影响用户继续操作，只是无法回显已有照片
  }
}

/**
 * 选择照片
 */
function selectPhoto() {
  // 如果已有照片，不允许重新上传
  if (hasExistingPhoto.value) {
    uni.showToast({
      title: '考勤照片已上传，不允许修改',
      icon: 'none',
      duration: 2000,
    })
    return
  }

  console.log('点击选择照片')
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      console.log('选择图片成功:', res)
      const tempFilePath = res.tempFilePaths[0]

      // 检查文件大小
      uni.getFileInfo({
        filePath: tempFilePath,
        success: (fileInfo) => {
          console.log('文件信息:', fileInfo)
          if (fileInfo.size > 2 * 1024 * 1024) {
            uni.showToast({
              title: '图片大小不能超过2MB',
              icon: 'none',
            })
            return
          }

          // 显示裁剪器
          selectedImagePath.value = tempFilePath
          showCropper.value = true
          console.log('显示裁剪器', { selectedImagePath: tempFilePath, showCropper: true })
        },
        fail: () => {
          console.error('获取文件信息失败')
          uni.showToast({
            title: '获取文件信息失败',
            icon: 'none',
          })
        },
      })
    },
    fail: () => {
      console.error('选择图片失败')
      uni.showToast({
        title: '选择图片失败',
        icon: 'none',
      })
    },
  })
}

/**
 * 预览照片
 */
function previewPhoto() {
  if (attendancePhotoUrl.value) {
    uni.previewImage({
      urls: [attendancePhotoUrl.value],
      current: 0,
    })
  }
}

/**
 * 裁剪确认 - 按照官方文档格式处理
 */
async function onCropConfirm(event: any) {
  showCropper.value = false

  // wd-img-cropper 返回的数据格式为 { tempFilePath }
  if (event && event.tempFilePath) {
    try {
      // 显示压缩提示
      uni.showLoading({
        title: '压缩处理中...',
        mask: true,
      })

      // 压缩图片到2MB以内
      const compressedPath = await compressImage(event.tempFilePath, 2 * 1024 * 1024, 0.8)

      attendancePhotoUrl.value = compressedPath

      uni.hideLoading()
    }
    catch (error) {
      uni.hideLoading()
      console.error('图片压缩失败:', error)
      uni.showToast({
        title: '图片处理失败，请重试',
        icon: 'none',
      })
    }
  }
}

/**
 * 裁剪取消
 */
function onCropCancel() {
  showCropper.value = false
  selectedImagePath.value = ''
}

/**
 * 重置人脸/更新考勤照片
 */
async function handleResetFace() {
  if (!hasPhotoChanged.value) {
    if (hasExistingPhoto.value) {
      uni.showToast({
        title: '考勤照片已上传，不允许修改',
        icon: 'none',
      })
    }
    else {
      uni.showToast({
        title: '请先选择考勤照片',
        icon: 'none',
      })
    }
    return
  }

  uploading.value = true

  try {
    // 使用 API 接口上传文件
    const result = await resetFaceApi(attendancePhotoUrl.value)

    uni.showToast({
      title: '考勤照片上传成功',
      icon: 'success',
    })

    console.log('上传成功:', result)

    // 更新成功后，更新原始照片路径
    originalPhotoUrl.value = attendancePhotoUrl.value

    // 更新成功后返回上一级页面
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
  catch (error: any) {
    console.error('上传失败:', error)

    uni.showToast({
      title: error.message || '上传失败，请重试',
      icon: 'none',
    })
  }
  finally {
    uploading.value = false
  }
}
</script>

<template>
  <view class="min-h-screen p-8">
    <!-- 考勤照片配置区域 -->
    <view class="mb-8 rounded-4 p-8 shadow-sm" :class="cardClass">
      <view class="mb-10">
        <view class="mb-3 text-5 font-semibold" :class="titleClass">
          {{ hasExistingPhoto ? '考勤照片查看' : '考勤照片配置' }}
        </view>
        <view class="text-3 leading-relaxed" :class="textClass">
          {{ hasExistingPhoto ? '考勤照片已上传，不允许修改' : '请上传清晰的一寸正面照片用于考勤识别' }}
        </view>
      </view>

      <!-- 照片预览区域 -->
      <view class="mb-10 flex justify-center">
        <view v-if="!attendancePhotoUrl" class="h-49 w-35 flex flex-col items-center justify-center border-2 rounded-4 border-dashed transition-all" :class="isDark ? 'border-gray-600 bg-gray-800 active:border-gray-500 active:bg-gray-700' : 'border-gray-300 bg-gray-50 active:border-gray-400 active:bg-gray-100'" @tap="selectPhoto">
          <view class="mb-5">
            <wd-icon name="camera" size="40rpx" color="#999" />
          </view>
          <view class="mb-3 text-3 font-medium" :class="titleClass">
            点击上传考勤照片
          </view>
          <view class="px-3 text-center text-3 leading-normal" :class="textClass">
            建议使用一寸照片标准尺寸
          </view>
        </view>

        <view v-else class="flex flex-col items-center">
          <image
            :src="attendancePhotoUrl"
            mode="aspectFill"
            class="h-49 w-35 border-2 rounded-4 object-cover" :class="isDark ? 'border-gray-700' : 'border-gray-200'"
            @tap="previewPhoto"
          />
          <view v-if="hasExistingPhoto" class="mt-6">
            <view class="rounded-full px-3 py-1 text-xs font-medium" :class="isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'">
              照片已上传
            </view>
          </view>
          <view v-else class="mt-6">
            <wd-button
              type="primary"
              size="small"
              @tap="selectPhoto"
            >
              重新上传
            </wd-button>
          </view>
        </view>
      </view>

      <!-- 上传提示 -->
      <view v-if="!hasExistingPhoto" class="border-2 rounded-3 p-6" :class="isDark ? 'border-orange-700 bg-orange-900/30' : 'border-orange-200 bg-orange-50'">
        <view class="mb-4 flex items-center gap-3 text-3 font-medium" :class="isDark ? 'text-orange-300' : 'text-orange-600'">
          <wd-icon name="info" size="12rpx" color="#ff7d00" />
          <text>上传要求</text>
        </view>
        <view class="text-3 leading-relaxed" :class="textClass">
          <view class="mb-2" :class="textClass">
            • 照片尺寸：推荐使用一寸照片尺寸
          </view>
          <view class="mb-2" :class="textClass">
            • 照片格式：支持 JPG、PNG 格式
          </view>
          <view class="mb-2" :class="textClass">
            • 照片大小：不超过 2MB
          </view>
          <view class="mb-2" :class="textClass">
            • 照片要求：正面免冠照片，五官清晰
          </view>
          <view :class="textClass">
            • 光线要求：光线充足，避免阴影遮挡
          </view>
        </view>
      </view>

      <!-- 已上传提示 -->
      <view v-else class="border-2 rounded-3 p-6" :class="isDark ? 'border-green-700 bg-green-900/30' : 'border-green-200 bg-green-50'">
        <view class="mb-4 flex items-center gap-3 text-3 font-medium" :class="isDark ? 'text-green-300' : 'text-green-600'">
          <wd-icon name="check-circle" size="12rpx" color="#16a34a" />
          <text>上传完成</text>
        </view>
        <view class="text-3 leading-relaxed" :class="textClass">
          考勤照片已成功上传，为保障考勤系统的安全性和准确性，不允许修改已上传的照片。
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view v-if="!hasExistingPhoto" class="fixed bottom-0 left-0 right-0 border-t-2 p-8 shadow-lg" :class="[cardClass, isDark ? 'border-gray-700' : 'border-gray-100']">
      <wd-button
        type="primary"
        size="large"
        :disabled="!hasPhotoChanged || uploading"
        :loading="uploading"
        block
        @tap="handleResetFace"
      >
        {{ uploading ? '处理中...' : '上传考勤照片' }}
      </wd-button>
    </view>

    <!-- 图片裁剪组件 -->
    <wd-img-cropper
      v-model="showCropper"
      :img-src="selectedImagePath"
      aspect-ratio="295:413"
      @confirm="onCropConfirm"
      @cancel="onCropCancel"
    />
  </view>
</template>

<style lang="scss" scoped>
/* 使用 UnoCSS 原子化类名，无需自定义 CSS */
</style>

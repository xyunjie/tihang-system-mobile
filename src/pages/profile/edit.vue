<!-- 编辑资料页面 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "编辑资料"
  }
}
</route>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store'
import { getUserInfo, updateUserProfile, uploadFile } from '@/api/user'
import type { ISystemUserInfoVo, IUserProfileUpdateReqVO } from '@/api/types/user'
import KspCropper from '@/components/ksp-cropper.vue'

const userStore = useUserStore()

defineOptions({
  name: 'ProfileEdit',
})

// 用户信息
const userInfo = ref<ISystemUserInfoVo | null>(null)
const loading = ref(false)
const submitting = ref(false)

// 表单数据
const formData = ref<IUserProfileUpdateReqVO>({
  mobile: '',
  email: '',
  avatar: ''
})

// 图片裁剪相关
const showCropper = ref(false)
const cropImageSrc = ref('')

// 性别选项
const sexOptions = [
  { label: '未知', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 }
]

// 获取用户信息
const fetchUserInfo = async () => {
  loading.value = true
  try {
    const res = await getUserInfo()
    userInfo.value = res.data
    
    // 填充表单数据
    formData.value = {
      mobile: res.data.mobile || '',
      email: res.data.email || '',
      avatar: res.data.avatar || ''
    }
    
    console.log('📋 获取用户信息成功:', res.data)
  } catch (error: any) {
    console.error('❌ 获取用户信息失败:', error)
    uni.showToast({
      title: '获取用户信息失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 微信小程序手机号获取回调
const onGetPhoneNumber = (e: any) => {
  console.log('获取手机号回调:', e)
  
  if (e.detail.errMsg === 'getPhoneNumber:ok') {
    // 获取成功，需要将加密数据发送到后端解密
    const { encryptedData, iv } = e.detail
    console.log('手机号加密数据:', { encryptedData, iv })
    
    // TODO: 这里需要调用后端接口解密手机号
    // 目前先显示提示
    uni.showToast({
      title: '手机号获取成功，请联系开发者完成解密',
      icon: 'none',
      duration: 3000
    })
    
    // 临时显示示例手机号（实际上需要后端解密）
    // formData.value.mobile = '138****8888'
  } else {
    // 获取失败或用户取消
    console.log('用户取消授权或获取失败')
    uni.showToast({
      title: '获取手机号失败',
      icon: 'none'
    })
  }
}

// 清空手机号输入框
const clearMobileInput = () => {
  formData.value.mobile = ''
  uni.showToast({
    title: '输入框已清空',
    icon: 'none'
  })
}

// 选择头像
const chooseAvatar = () => {
  uni.showActionSheet({
    itemList: ['使用微信头像', '选择图片上传'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 使用微信头像
        useWechatAvatar()
      } else if (res.tapIndex === 1) {
        // 选择图片上传
        chooseImageUpload()
      }
    },
    fail: (error) => {
      console.log('用户取消选择头像')
    }
  })
}

// 使用微信头像
const useWechatAvatar = async () => {
  // #ifdef MP-WEIXIN
  try {
    const userProfile = await new Promise<any>((resolve, reject) => {
      uni.getUserProfile({
        desc: '用于完善用户资料',
        success: resolve,
        fail: reject
      })
    })
    
    console.log('获取微信头像成功:', userProfile.userInfo.avatarUrl)
    
    // 显示上传进度
    uni.showLoading({
      title: '正在上传...',
      mask: true
    })
    
    // 先下载微信头像到本地
    const downloadResult = await new Promise<any>((resolve, reject) => {
      uni.downloadFile({
        url: userProfile.userInfo.avatarUrl,
        success: resolve,
        fail: reject
      })
    })
    
    // 再上传到服务器
    const serverImageUrl = await uploadFile(downloadResult.tempFilePath, 'avatar')
    
    formData.value.avatar = serverImageUrl
    
    uni.hideLoading()
    uni.showToast({
      title: '微信头像设置成功',
      icon: 'success'
    })
    
  } catch (error: any) {
    uni.hideLoading()
    console.error('获取微信头像失败:', error)
    uni.showToast({
      title: error.message || '获取微信头像失败',
      icon: 'none'
    })
  }
  // #endif
  
  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '此功能仅在微信小程序中可用',
    icon: 'none'
  })
  // #endif
}

// 选择图片上传
const chooseImageUpload = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      console.log('选择图片:', tempFilePath)
      
      // 显示裁剪组件
      cropImageSrc.value = tempFilePath
      showCropper.value = true
    },
    fail: (error) => {
      console.error('选择图片失败:', error)
      uni.showToast({
        title: '选择图片失败',
        icon: 'none'
      })
    }
  })
}

// 裁剪确认回调
const onCropConfirm = async (result: any) => {
  console.log('裁剪结果:', result)
  
  try {
    // 显示上传进度
    uni.showLoading({
      title: '正在上传...',
      mask: true
    })
    
    // ksp-cropper 返回的数据格式为 { path: string, base64?: string }
    const localImagePath = result.path
    
    // 上传图片到服务器，指定头像目录
    const serverImageUrl = await uploadFile(localImagePath, 'avatar')
    
    // 设置服务器返回的图片URL
    formData.value.avatar = serverImageUrl
    showCropper.value = false
    
    uni.hideLoading()
    
    console.log('头像上传成功:', serverImageUrl)
    uni.showToast({
      title: '头像设置成功',
      icon: 'success'
    })
    
  } catch (error: any) {
    uni.hideLoading()
    console.error('头像上传失败:', error)
    uni.showToast({
      title: error.message || '上传失败，请重试',
      icon: 'none'
    })
    
    // 上传失败时，也关闭裁剪组件
    showCropper.value = false
  }
}

// 裁剪取消回调
const onCropCancel = () => {
  showCropper.value = false
  console.log('用户取消裁剪')
}

// 提交表单
const handleSubmit = async () => {
  // 验证邮箱格式
  if (formData.value.email && !isValidEmail(formData.value.email)) {
    uni.showToast({
      title: '请输入正确的邮箱格式',
      icon: 'none'
    })
    return
  }

  // 验证手机号格式
  if (formData.value.mobile && !isValidMobile(formData.value.mobile)) {
    uni.showToast({
      title: '请输入正确的手机号格式',
      icon: 'none'
    })
    return
  }

  submitting.value = true
  try {
    const updateData: IUserProfileUpdateReqVO = {
      mobile: formData.value.mobile?.trim() || undefined,
      email: formData.value.email?.trim() || undefined,
      avatar: formData.value.avatar || undefined
    }

    const res = await updateUserProfile(updateData)
    
    if (res.code === 0) {
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 刷新用户信息
      await userStore.getUserInfo()
      
      // 返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({
        title: res.msg || '保存失败',
        icon: 'none'
      })
    }
  } catch (error: any) {
    console.error('❌ 更新用户信息失败:', error)
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}

// 验证邮箱格式
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证手机号格式
const isValidMobile = (mobile: string) => {
  const mobileRegex = /^1[3-9]\d{9}$/
  return mobileRegex.test(mobile)
}

// 页面加载时获取用户信息
onMounted(() => {
  if (userStore.userInfo.accessToken) {
    fetchUserInfo()
  } else {
    uni.redirectTo({
      url: '/pages/login/index'
    })
  }
})
</script>

<template>
  <view class="bg-gray-50 min-h-screen">
    <!-- 加载状态 -->
    <view v-if="loading" class="flex items-center justify-center py-20">
      <view class="text-gray-500 text-sm">正在加载用户信息...</view>
    </view>

    <!-- 表单内容 -->
    <view v-else class="p-4 space-y-4 pb-32">
      <!-- 头像设置 -->
      <view class="bg-white rounded-2xl p-6">
        <view class="text-gray-800 text-lg font-semibold mb-4">头像设置</view>
        <view class="flex items-center justify-center">
          <view class="relative" @click="chooseAvatar">
            <image 
              :src="formData.avatar || '/static/images/default-avatar.png'" 
              class="w-20 h-20 rounded-2xl border-2 border-gray-200"
              mode="aspectFill"
            />
            <view class="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 active:opacity-100 transition-opacity">
              <text class="text-white text-xs">点击更换</text>
            </view>
          </view>
        </view>
        <view class="text-center text-gray-500 text-xs mt-2">点击头像选择微信头像或上传图片</view>
      </view>

      <!-- 基本信息 -->
      <view class="bg-white rounded-2xl p-6">
        <view class="text-gray-800 text-lg font-semibold mb-4">基本信息</view>
        
        <view class="space-y-4">
          <!-- 手机号 -->
          <view class="space-y-2">
            <view class="text-gray-700 text-sm font-medium">手机号</view>
            <view class="flex gap-3">
              <input 
                v-model="formData.mobile"
                placeholder="请输入手机号"
                type="number"
                class="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-none text-gray-800 text-sm"
              />
              <!-- #ifdef MP-WEIXIN -->
              <button 
                open-type="getPhoneNumber" 
                @getphonenumber="onGetPhoneNumber"
                class="px-4 py-3 bg-blue-500 text-white text-xs rounded-xl border-none active:bg-blue-600 transition-colors whitespace-nowrap"
              >
                微信手机号
              </button>
              <!-- #endif -->
              <!-- #ifndef MP-WEIXIN -->
              <button 
                @click="clearMobileInput"
                class="px-4 py-3 bg-gray-500 text-white text-xs rounded-xl border-none active:bg-gray-600 transition-colors whitespace-nowrap"
              >
                清空
              </button>
              <!-- #endif -->
            </view>
          </view>

          <!-- 邮箱 -->
          <view class="space-y-2">
            <view class="text-gray-700 text-sm font-medium">邮箱</view>
            <input 
              v-model="formData.email"
              placeholder="请输入邮箱地址"
              class="w-full px-4 py-3 bg-gray-50 rounded-xl border-none text-gray-800 text-sm"
            />
          </view>
        </view>
      </view>

      <!-- 账号信息 -->
      <view class="bg-white rounded-2xl p-6" v-if="userInfo">
        <view class="text-gray-800 text-lg font-semibold mb-4">账号信息</view>
        
        <view class="space-y-3">
          <view class="flex items-center justify-between py-2">
            <view class="text-gray-600 text-sm">用户编号</view>
            <view class="text-gray-800 text-sm font-medium">{{ userInfo.id }}</view>
          </view>
          
          <view class="flex items-center justify-between py-2">
            <view class="text-gray-600 text-sm">用户账号</view>
            <view class="text-gray-800 text-sm font-medium">{{ userInfo.username }}</view>
          </view>
          
          <view class="flex items-center justify-between py-2">
            <view class="text-gray-600 text-sm">用户昵称</view>
            <view class="text-gray-800 text-sm font-medium">{{ userInfo.nickname || '未设置' }}</view>
          </view>
          
          <view class="flex items-center justify-between py-2">
            <view class="text-gray-600 text-sm">性别</view>
            <view class="text-gray-800 text-sm font-medium">
              {{ userInfo.sex === 1 ? '男' : userInfo.sex === 2 ? '女' : '未知' }}
            </view>
          </view>
          
          <view class="flex items-center justify-between py-2">
            <view class="text-gray-600 text-sm">所属部门</view>
            <view class="text-gray-800 text-sm font-medium">
              {{ userInfo.dept ? userInfo.dept.name : '暂无部门' }}
            </view>
          </view>
          
          <view class="flex items-start justify-between py-2" v-if="userInfo.roles && userInfo.roles.length > 0">
            <view class="text-gray-600 text-sm pt-1">用户角色</view>
            <view class="text-right flex-1 ml-4">
              <view 
                v-for="role in userInfo.roles" 
                :key="role.id" 
                class="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md mr-1 mb-1"
              >
                {{ role.name }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe">
      <button 
        class="w-full py-3 rounded-xl text-base font-medium transition-colors"
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
/* 使用UnoCSS原子类，无需自定义CSS */
</style>
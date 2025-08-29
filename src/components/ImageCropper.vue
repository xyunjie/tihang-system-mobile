<!-- 图片裁剪组件 - 基于用户提供的完整裁剪逻辑 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "裁剪图片"
  }
}
</route>

<template>
  <view v-if="visible" class="fixed inset-0 z-50 bg-black">
    <!-- 顶部导航栏 -->
    <view 
      class="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 text-white bg-black"
      :style="{ 
        paddingTop: statusBarHeight + 'px',
        height: (statusBarHeight + 44) + 'px'
      }"
    >
      <view @click="handleCancel" class="text-base">取消</view>
      <view class="text-base">裁剪图片</view>
      <view @click="handleConfirm" class="text-base text-blue-400">完成</view>
    </view>
    
    <!-- 裁剪主体区域 -->
    <view 
      class="absolute inset-0 overflow-hidden"
      :style="{ 
        paddingTop: (statusBarHeight + 44) + 'px',
        paddingBottom: '80px'
      }"
    >
      <view class="w-full h-full">
        <view 
          v-if="isShowImg" 
          class="relative bg-black"
          :style="{
            width: cropperInitW + 'px',
            height: cropperInitH + 'px',
            margin: '0 auto'
          }"
        >
          <!-- 图片容器 -->
          <view 
            class="absolute"
            :style="{
              width: cropperW + 'px',
              height: cropperH + 'px',
              left: cropperL + 'px',
              top: cropperT + 'px'
            }"
          >
            <image 
              :src="imageSrc" 
              class="block"
              :style="{
                width: cropperW + 'px',
                height: cropperH + 'px'
              }"
              mode="aspectFit"
            />
            
            <!-- 裁剪框 -->
            <view 
              class="absolute border-2 border-white"
              :style="{
                left: cutL + 'px',
                top: cutT + 'px',
                right: cutR + 'px',
                bottom: cutB + 'px'
              }"
              @touchstart.stop="contentStartMove"
              @touchmove.stop="contentMoving"
              @touchend.stop="contentTouchEnd"
            >
              <!-- 裁剪框内部视图 -->
              <view class="w-full h-full relative">
                <!-- 九宫格辅助线 -->
                <view class="absolute border-white border-opacity-30 w-px h-full" :style="{ left: '33.33%' }"></view>
                <view class="absolute border-white border-opacity-30 w-px h-full" :style="{ left: '66.66%' }"></view>
                <view class="absolute border-white border-opacity-30 w-full h-px" :style="{ top: '33.33%' }"></view>
                <view class="absolute border-white border-opacity-30 w-full h-px" :style="{ top: '66.66%' }"></view>
                
                <!-- 边框拖拽线 -->
                <view class="absolute w-full h-1 -top-1 cursor-pointer" data-drag="top" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
                <view class="absolute w-1 h-full -right-1 cursor-pointer" data-drag="right" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
                <view class="absolute w-full h-1 -bottom-1 cursor-pointer" data-drag="bottom" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
                <view class="absolute w-1 h-full -left-1 cursor-pointer" data-drag="left" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
                
                <!-- 角点控制点 -->
                <view class="absolute w-3 h-3 bg-white border-2 border-gray-300 -top-1.5 left-1/2 transform -translate-x-1/2 cursor-pointer" data-drag="top" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
                <view class="absolute w-3 h-3 bg-white border-2 border-gray-300 -top-1.5 -right-1.5 cursor-pointer" data-drag="topRight"></view>
                <view class="absolute w-3 h-3 bg-white border-2 border-gray-300 top-1/2 -right-1.5 transform -translate-y-1/2 cursor-pointer" data-drag="right" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
                <view class="absolute w-3 h-3 bg-white border-2 border-gray-300 -bottom-1.5 -right-1.5 cursor-pointer" data-drag="rightBottom" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
                <view class="absolute w-3 h-3 bg-white border-2 border-gray-300 -bottom-1.5 left-1/2 transform -translate-x-1/2 cursor-pointer" data-drag="bottom" @touchstart.stop="dragStart" @touchmove.stop="dragMove" @touchend.stop="dragEnd"></view>
                <view class="absolute w-3 h-3 bg-white border-2 border-gray-300 -bottom-1.5 -left-1.5 cursor-pointer" data-drag="bottomLeft"></view>
                <view class="absolute w-3 h-3 bg-white border-2 border-gray-300 top-1/2 -left-1.5 transform -translate-y-1/2 cursor-pointer" data-drag="left" @touchstart.stop="dragStart" @touchmove.stop="dragMove"></view>
                <view class="absolute w-3 h-3 bg-white border-2 border-gray-300 -top-1.5 -left-1.5 cursor-pointer" data-drag="leftTop"></view>
              </view>
            </view>
          </view>
          
          <!-- 遮罩层 -->
          <view class="absolute inset-0 pointer-events-none">
            <!-- 上遮罩 -->
            <view 
              class="absolute bg-black bg-opacity-50"
              :style="{
                left: '0px',
                top: '0px',
                width: cropperInitW + 'px',
                height: (cropperT + cutT) + 'px'
              }"
            ></view>
            
            <!-- 下遮罩 -->
            <view 
              class="absolute bg-black bg-opacity-50"
              :style="{
                left: '0px',
                top: (cropperT + cropperH - cutB) + 'px',
                width: cropperInitW + 'px',
                height: (cropperInitH - cropperT - cropperH + cutB) + 'px'
              }"
            ></view>
            
            <!-- 左遮罩 -->
            <view 
              class="absolute bg-black bg-opacity-50"
              :style="{
                left: '0px',
                top: (cropperT + cutT) + 'px',
                width: (cropperL + cutL) + 'px',
                height: (cropperH - cutT - cutB) + 'px'
              }"
            ></view>
            
            <!-- 右遮罩 -->
            <view 
              class="absolute bg-black bg-opacity-50"
              :style="{
                left: (cropperL + cropperW - cutR) + 'px',
                top: (cropperT + cutT) + 'px',
                width: (cropperInitW - cropperL - cropperW + cutR) + 'px',
                height: (cropperH - cutT - cutB) + 'px'
              }"
            ></view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view 
      class="fixed bottom-0 left-0 right-0 bg-black z-10 px-4 py-4"
      :style="{ paddingBottom: safeAreaInsetBottom + 'px' }"
    >
      <view class="flex items-center justify-around">
        <view 
          @click="chooseImage"
          class="px-6 py-2 bg-gray-700 text-white text-sm rounded-lg active:bg-gray-600"
        >
          重新选择
        </view>
        <view 
          @click="handleConfirm"
          class="px-6 py-2 bg-blue-500 text-white text-sm rounded-lg active:bg-blue-600"
        >
          确认上传
        </view>
      </view>
    </view>
    
    <!-- 隐藏的Canvas用于生成裁剪结果 -->
    <canvas 
      canvas-id="myCanvas"
      :style="{ 
        position: 'absolute',
        border: '1px solid red',
        width: imageW + 'px',
        height: imageH + 'px',
        top: '-9999px',
        left: '-9999px'
      }"
    ></canvas>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'

interface Props {
  visible: boolean
  imageSrc: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', croppedImage: string): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 系统信息和常量
const statusBarHeight = ref(44)
const safeAreaInsetBottom = ref(34)
let SCREEN_WIDTH = 375
let PAGE_X = 0, PAGE_Y = 0, T_PAGE_X = 0, T_PAGE_Y = 0
let CUT_L = 0, CUT_T = 0, CUT_R = 0, CUT_B = 0
let IMG_RATIO = 1, IMG_REAL_W = 0, IMG_REAL_H = 0
const DRAFG_MOVE_RATIO = 1
const INIT_DRAG_POSITION = 100
const DRAW_IMAGE_W = 375

// 响应式数据
const isShowImg = ref(false)
const cropperInitW = ref(SCREEN_WIDTH)
const cropperInitH = ref(SCREEN_WIDTH) 
const cropperW = ref(SCREEN_WIDTH)
const cropperH = ref(SCREEN_WIDTH)
const cropperL = ref(0)
const cropperT = ref(0)
const cutL = ref(0)
const cutT = ref(0)
const cutB = ref(SCREEN_WIDTH)
const cutR = ref(100)
const imageW = ref(0)
const imageH = ref(0)
const scaleP = ref(0)
const qualityWidth = ref(DRAW_IMAGE_W)
const innerAspectRadio = ref(DRAFG_MOVE_RATIO)

// 初始化系统信息
onMounted(() => {
  nextTick(() => {
    uni.getSystemInfo({
      success: (res) => {
        statusBarHeight.value = res.statusBarHeight || 44
        safeAreaInsetBottom.value = res.safeAreaInsets?.bottom || 34
        SCREEN_WIDTH = res.windowWidth
        cropperInitW.value = SCREEN_WIDTH
        cropperInitH.value = SCREEN_WIDTH
        cropperW.value = SCREEN_WIDTH
        cropperH.value = SCREEN_WIDTH
        cutB.value = SCREEN_WIDTH
        
        if (props.imageSrc) {
          loadImage()
        }
      }
    })
  })
})

// 监听图片源变化
watch(() => props.imageSrc, () => {
  if (props.imageSrc) {
    loadImage()
  }
})

// 加载图片
const loadImage = () => {
  uni.showLoading({ title: '图片加载中...' })
  
  uni.getImageInfo({
    src: props.imageSrc,
    success: (res) => {
      IMG_RATIO = res.width / res.height
      
      if (IMG_RATIO >= 1) {
        IMG_REAL_W = SCREEN_WIDTH
        IMG_REAL_H = SCREEN_WIDTH / IMG_RATIO
      } else {
        IMG_REAL_W = SCREEN_WIDTH * IMG_RATIO
        IMG_REAL_H = SCREEN_WIDTH
      }
      
      let minRange = IMG_REAL_W > IMG_REAL_H ? IMG_REAL_W : IMG_REAL_H
      const INIT_DRAG_POS = minRange > INIT_DRAG_POSITION ? INIT_DRAG_POSITION : minRange
      
      if (IMG_RATIO >= 1) {
        const cutTopVal = Math.ceil((SCREEN_WIDTH / IMG_RATIO - (SCREEN_WIDTH / IMG_RATIO - INIT_DRAG_POS)) / 2)
        const cutBottomVal = cutTopVal
        const cutLeftVal = Math.ceil((SCREEN_WIDTH - SCREEN_WIDTH + INIT_DRAG_POS) / 2)
        const cutRightVal = cutLeftVal
        
        setData({
          cropperW: SCREEN_WIDTH,
          cropperH: SCREEN_WIDTH / IMG_RATIO,
          cropperL: Math.ceil((SCREEN_WIDTH - SCREEN_WIDTH) / 2),
          cropperT: Math.ceil((SCREEN_WIDTH - SCREEN_WIDTH / IMG_RATIO) / 2),
          cutL: cutLeftVal,
          cutT: cutTopVal,
          cutR: cutRightVal,
          cutB: cutBottomVal,
          imageW: IMG_REAL_W,
          imageH: IMG_REAL_H,
          scaleP: IMG_REAL_W / SCREEN_WIDTH,
          qualityWidth: DRAW_IMAGE_W,
          innerAspectRadio: IMG_RATIO
        })
      } else {
        const cutLeftVal = Math.ceil((SCREEN_WIDTH * IMG_RATIO - (SCREEN_WIDTH * IMG_RATIO)) / 2)
        const cutRightVal = cutLeftVal
        const cutTopVal = Math.ceil((SCREEN_WIDTH - INIT_DRAG_POS) / 2)
        const cutBottomVal = cutTopVal
        
        setData({
          cropperW: SCREEN_WIDTH * IMG_RATIO,
          cropperH: SCREEN_WIDTH,
          cropperL: Math.ceil((SCREEN_WIDTH - SCREEN_WIDTH * IMG_RATIO) / 2),
          cropperT: Math.ceil((SCREEN_WIDTH - SCREEN_WIDTH) / 2),
          cutL: cutLeftVal,
          cutT: cutTopVal,
          cutR: cutRightVal,
          cutB: cutBottomVal,
          imageW: IMG_REAL_W,
          imageH: IMG_REAL_H,
          scaleP: IMG_REAL_W / SCREEN_WIDTH,
          qualityWidth: DRAW_IMAGE_W,
          innerAspectRadio: IMG_RATIO
        })
      }
      
      isShowImg.value = true
    },
    complete: () => {
      uni.hideLoading()
    }
  })
}

// 设置数据的助手方法
const setData = (obj: any) => {
  Object.keys(obj).forEach(key => {
    if (key === 'cropperW') cropperW.value = obj[key]
    else if (key === 'cropperH') cropperH.value = obj[key]
    else if (key === 'cropperL') cropperL.value = obj[key]
    else if (key === 'cropperT') cropperT.value = obj[key]
    else if (key === 'cutL') cutL.value = obj[key]
    else if (key === 'cutT') cutT.value = obj[key]
    else if (key === 'cutR') cutR.value = obj[key]
    else if (key === 'cutB') cutB.value = obj[key]
    else if (key === 'imageW') imageW.value = obj[key]
    else if (key === 'imageH') imageH.value = obj[key]
    else if (key === 'scaleP') scaleP.value = obj[key]
    else if (key === 'qualityWidth') qualityWidth.value = obj[key]
    else if (key === 'innerAspectRadio') innerAspectRadio.value = obj[key]
  })
}

// 选择新图片
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      loadImage()
    }
  })
}

// 拖动开始
const contentStartMove = (e: any) => {
  PAGE_X = e.touches[0].pageX
  PAGE_Y = e.touches[0].pageY
}

// 拖动移动
const contentMoving = (e: any) => {
  let dragLengthX = (PAGE_X - e.touches[0].pageX) * DRAFG_MOVE_RATIO
  let dragLengthY = (PAGE_Y - e.touches[0].pageY) * DRAFG_MOVE_RATIO
  
  if (dragLengthX > 0) {
    if (cutL.value - dragLengthX < 0) dragLengthX = cutL.value
  } else {
    if (cutR.value + dragLengthX < 0) dragLengthX = -cutR.value
  }
  
  if (dragLengthY > 0) {
    if (cutT.value - dragLengthY < 0) dragLengthY = cutT.value
  } else {
    if (cutB.value + dragLengthY < 0) dragLengthY = -cutB.value
  }
  
  cutL.value = cutL.value - dragLengthX
  cutT.value = cutT.value - dragLengthY
  cutR.value = cutR.value + dragLengthX
  cutB.value = cutB.value + dragLengthY
  
  PAGE_X = e.touches[0].pageX
  PAGE_Y = e.touches[0].pageY
}

// 拖动结束
const contentTouchEnd = () => {}

// 大小调整开始
const dragStart = (e: any) => {
  T_PAGE_X = e.touches[0].pageX
  T_PAGE_Y = e.touches[0].pageY
  CUT_L = cutL.value
  CUT_R = cutR.value
  CUT_B = cutB.value
  CUT_T = cutT.value
}

// 大小调整移动
const dragMove = (e: any) => {
  const dragType = e.target.dataset.drag
  
  switch (dragType) {
    case 'right':
      const dragLengthR = (T_PAGE_X - e.touches[0].pageX) * DRAFG_MOVE_RATIO
      if (CUT_R + dragLengthR < 0) break
      cutR.value = CUT_R + dragLengthR
      break
      
    case 'left':
      const dragLengthL = (T_PAGE_X - e.touches[0].pageX) * DRAFG_MOVE_RATIO
      if (CUT_L - dragLengthL < 0) break
      if ((CUT_L - dragLengthL) > (cropperW.value - cutR.value)) break
      cutL.value = CUT_L - dragLengthL
      break
      
    case 'top':
      const dragLengthT = (T_PAGE_Y - e.touches[0].pageY) * DRAFG_MOVE_RATIO
      if (CUT_T - dragLengthT < 0) break
      if ((CUT_T - dragLengthT) > (cropperH.value - cutB.value)) break
      cutT.value = CUT_T - dragLengthT
      break
      
    case 'bottom':
      const dragLengthB = (T_PAGE_Y - e.touches[0].pageY) * DRAFG_MOVE_RATIO
      if (CUT_B + dragLengthB < 0) break
      cutB.value = CUT_B + dragLengthB
      break
      
    case 'rightBottom':
      const dragLengthX = (T_PAGE_X - e.touches[0].pageX) * DRAFG_MOVE_RATIO
      const dragLengthY = (T_PAGE_Y - e.touches[0].pageY) * DRAFG_MOVE_RATIO
      if (CUT_B + dragLengthY < 0 || CUT_R + dragLengthX < 0) break
      cutB.value = CUT_B + dragLengthY
      cutR.value = CUT_R + dragLengthX
      break
  }
}

const dragEnd = () => {}

// 取消操作
const handleCancel = () => {
  emit('update:visible', false)
  emit('cancel')
}

// 确认裁剪
const handleConfirm = () => {
  uni.showLoading({ title: '图片生成中...', mask: true })
  
  const ctx = uni.createCanvasContext('myCanvas')
  ctx.drawImage(props.imageSrc, 0, 0, IMG_REAL_W, IMG_REAL_H)
  
  ctx.draw(true, () => {
    const canvasW = ((cropperW.value - cutL.value - cutR.value) / cropperW.value) * IMG_REAL_W
    const canvasH = ((cropperH.value - cutT.value - cutB.value) / cropperH.value) * IMG_REAL_H
    const canvasL = (cutL.value / cropperW.value) * IMG_REAL_W
    const canvasT = (cutT.value / cropperH.value) * IMG_REAL_H
    
    uni.canvasToTempFilePath({
      x: canvasL,
      y: canvasT,
      width: canvasW,
      height: canvasH,
      destWidth: canvasW,
      destHeight: canvasH,
      quality: 0.8,
      canvasId: 'myCanvas',
      success: (res) => {
        uni.hideLoading()
        emit('confirm', res.tempFilePath)
        emit('update:visible', false)
        uni.showToast({ title: '裁剪完成', icon: 'success' })
      },
      fail: (error) => {
        uni.hideLoading()
        console.error('裁剪失败:', error)
        uni.showToast({ title: '裁剪失败', icon: 'none' })
        emit('confirm', props.imageSrc)
        emit('update:visible', false)
      }
    })
  })
}
</script>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>
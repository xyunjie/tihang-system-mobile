<script setup lang="ts">
import type { FormItemRule } from 'wot-design-uni/components/wd-form/types'
import type { FormField } from '@/api/types/bpm'
import { computed } from 'vue'
import { uploadFile } from '@/api/user'
import DeptSelector from './DeptSelector.vue'
import DictSelector from './DictSelector.vue'
import UserSelector from './UserSelector.vue'

// 定义支持的modelValue类型
const props = defineProps<Props>()

const emit = defineEmits<Emits>()

// 图片上传相关状态
const uploadingImages = ref<Array<{ id: string, progress: number }>>([])
const uploadFinishList = ref<string[]>([])

// 日期时间选择器专用类型转换
function getDateTimeValue(value: any, range: boolean): string | number | (string | number)[] | undefined {
  if (range) {
    if (value === null || value === undefined)
      return []
    if (typeof value === 'string' || typeof value === 'number')
      return [value]
    if (Array.isArray(value))
      return value
    if (value instanceof Date)
      return [value.getTime()]
    return []
  }
  else {
    if (value === null || value === undefined)
      return ''
    if (typeof value === 'string' || typeof value === 'number')
      return value
    if (Array.isArray(value)) {
      return value.filter(v => typeof v === 'string' || typeof v === 'number') as (string | number)[]
    }
    if (value instanceof Date)
      return value.getTime()
    return ''
  }
}

interface Props {
  field: FormField
  modelValue?: any
  formData?: Record<string, any>
  readonly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

// 解析字段配置
const parsedField = computed(() => {
  if (typeof props.field === 'string') {
    try {
      return JSON.parse(props.field) as FormField
    }
    catch {
      return {} as FormField
    }
  }
  return props.field as FormField
})

// 字段基本信息
const fieldType = computed(() => {
  if (parsedField.value.type === 'input')
    return parsedField.value?.props?.type ?? 'input'
  else
    return parsedField.value.type || 'input'
})
const fieldTitle = computed(() => parsedField.value.title || parsedField.value.label || '字段')
const isRequired = computed(() => parsedField.value.$required !== false || parsedField.value.required || false)
const fieldProps = computed(() => parsedField.value.props || {})
const fieldOptions = computed(() => parsedField.value.options || fieldProps.value.options || [])

// 通用属性
const placeholder = computed(() => fieldProps.value.placeholder || parsedField.value.placeholder || `请输入${fieldTitle.value}`)
const disabled = computed(() => props.readonly || fieldProps.value.disabled || parsedField.value.disabled)

// 统一的值更新处理
function updateValue(value: any, validate = false) {
  emit('update:modelValue', value)
}

// 事件处理器
function handleInput(value: any) {
  updateValue(value)
}

function handleNumberInput(value: any) {
  updateValue(value === '' ? null : Number(value))
}

function handleConfirm(value: any, validate = false) {
  console.log('handleConfirm', value)
  updateValue(value, validate)
}

function handleChange(value: any) {
  console.log('handleChange1111222', value)
  updateValue(value)
}

function validateFieldValue(field: {
  transform?: string
  mode?: string
  trigger?: string
  len?: number
  pattern?: string
  message?: string
}, value: any): Promise<boolean> {
  console.log('触发校验', field, value)

  return new Promise((resolve) => {
    if (field.mode === 'len') {
      if (!value || value.length !== field.len) {
        resolve(false)
        return
      }
    }
    else if (field.mode === 'min') {
      if (!value || value.length < field.len) {
        resolve(false)
        return
      }
    }
    else if (field.mode === 'max') {
      if (!value || value.length > field.len) {
        resolve(false)
        return
      }
    }
    else if (field.mode === 'pattern') {
      if (!value) {
        resolve(false)
        return
      }
      const pattern = new RegExp(field.pattern || '')
      if (!pattern.test(value)) {
        resolve(false)
        return
      }
    }
    resolve(true)
  })
}

function getRules(field: FormField): FormItemRule[] {
  if (isRequired.value && field.validate) {
    // 是必填且有自定义校验规则
    return field.validate?.map(v => ({
      required: isRequired.value,
      validator: val => validateFieldValue(v, val),
      message: v.message ?? `请填写${field.label || field.title}`,
    })) || []
  }
  else if (isRequired.value) {
    const message = typeof field.$required === 'string' ? field.$required : `请填写${field.label || field.title}`
    return [{ required: isRequired.value, message }]
  }
  else {
    return []
  }
}

// 签名板相关
function signatureConfirm(value: any) {
  if (disabled.value) {
    return
  }
  // TODO 需要上传后返回链接
  uploadImage(value.tempFilePath)
}

function signatureClear() {
  updateValue({ value: '' })
}

// 图片选择和上传
function handleSelectImage(maxLen: number, fileSize: number) {
  if (disabled.value) {
    return
  }
  if (uploadFinishList.value.length >= maxLen) {
    uni.showToast({ title: `最多只能上传${maxLen}张图片`, icon: 'none' })
    return
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      // 检查文件大小
      if (res.tempFiles[0].size) {
        const fileSizeMB = res.tempFiles[0].size / (1024 * 1024)
        if (fileSizeMB > fileSize) {
          uni.showToast({ title: `图片大小不能超过${fileSize}MB`, icon: 'none' })
          return
        }
      }
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const tempFilePath = res.tempFilePaths[0]
        uploadImage(tempFilePath)
      }
    },
    fail: (err) => {
      console.error('选择图片失败:', err)
      uni.showToast({ title: '选择图片失败', icon: 'none' })
    },
  })
}

// 上传图片
async function uploadImage(filePath: string, isSignature = false) {
  if (!filePath) {
    uni.showToast({ title: '文件路径无效', icon: 'none' })
    return
  }

  // 生成临时ID用于跟踪上传进度
  const tempId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 添加到上传中列表
  uploadingImages.value.push({ id: tempId, progress: 0 })

  try {
    // 使用通用文件上传接口
    const fileUrl = await uploadFile(filePath)

    // 成功后更新附件列表
    uploadFinishList.value.push(fileUrl)
    if (!isSignature)
      uni.showToast({ title: '上传成功', icon: 'success' })

    // 移除上传中状态
    const index = uploadingImages.value.findIndex(item => item.id === tempId)
    if (index > -1) {
      uploadingImages.value.splice(index, 1)
    }
    console.log('上传完成', uploadFinishList.value)
    // 更新父组件的模型值
    if (!isSignature)
      updateValue({ value: uploadFinishList.value })
    else
      updateValue({ value: fileUrl })
  }
  catch (error) {
    console.error('上传图片失败:', error)
    uni.showToast({ title: '上传图片失败', icon: 'none' })
    // 移除上传中状态
    const index = uploadingImages.value.findIndex(item => item.id === tempId)
    if (index > -1) {
      uploadingImages.value.splice(index, 1)
    }
  }
}

// 预览图片
function handlePreviewImage(url: string, index: number) {
  uni.previewImage({
    urls: uploadFinishList.value,
    current: index,
  })
}

// 删除附件
function handleDeleteAttachment(index: number) {
  if (index >= 0 && index < uploadFinishList.value.length) {
    uploadFinishList.value.splice(index, 1)
    uni.showToast({ title: '删除成功', icon: 'success' })
    // 更新父组件的模型值
    updateValue({ value: uploadFinishList.value })
  }
}
</script>

<template>
  <view>
    <!-- 基础输入类型 -->
    <wd-cell
      v-if="fieldType === 'input'"
      :title="fieldTitle"
      :required="isRequired"
      center
    >
      <wd-input
        :key="field._fc_id"
        :model-value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="fieldProps.maxlength || -1"
        :prop="field.field"
        :name="field.field"
        :rules="getRules(field)"
        @blur="handleInput"
      />
    </wd-cell>

    <!-- 多行文本 -->
    <wd-cell
      v-else-if="fieldType === 'textarea'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <wd-textarea
        :key="field._fc_id"
        :model-value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="fieldProps.maxlength || -1"
        :rows="fieldProps.rows || 4"
        :show-word-limit="fieldProps.showWordLimit !== false"
        :prop="field.field"
        :name="field.field"
        :rules="getRules(field)"
        @blur="handleInput"
      />
    </wd-cell>

    <!-- 密码输入 -->
    <wd-cell
      v-else-if="fieldType === 'password'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <wd-input
        :key="field._fc_id"
        :model-value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        show-password
        :prop="field.field"
        :name="field.field"
        :rules="getRules(field)"
        @blur="handleInput"
      />
    </wd-cell>

    <!-- 数字输入 -->
    <wd-cell
      v-else-if="['number', 'inputNumber'].includes(fieldType)"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <wd-input-number
        :key="field._fc_id"
        :model-value="modelValue ?? 0"
        :placeholder="placeholder"
        :disabled="disabled"
        :min="fieldProps.min"
        :max="fieldProps.max"
        :prop="field.field"
        :name="field.field"
        :rules="getRules(field)"
        @update:model-value="handleNumberInput"
      />
    </wd-cell>

    <!-- 单选框 -->
    <wd-cell
      v-else-if="fieldType === 'radio'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <wd-radio-group
        :key="field._fc_id"
        :model-value="modelValue"
        shape="button"
        @change="handleChange"
      >
        <wd-radio
          v-for="option in fieldOptions"
          :key="option.value"
          :value="option.value"
          :disabled="disabled"
        >
          {{ option.label }}
        </wd-radio>
      </wd-radio-group>
    </wd-cell>

    <!-- 多选框 -->
    <wd-cell
      v-else-if="fieldType === 'checkbox'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <wd-checkbox-group
        :key="field._fc_id"
        :model-value="modelValue ?? []"
        shape="button"
        @change="handleChange"
      >
        <wd-checkbox
          v-for="option in fieldOptions"
          :key="option.value"
          :model-value="option.value"
          :disabled="disabled"
        >
          {{ option.label }}
        </wd-checkbox>
      </wd-checkbox-group>
    </wd-cell>

    <!-- 选择器 -->
    <wd-cell
      v-else-if="['select', 'picker'].includes(fieldType)"
      :title="fieldTitle"
      :required="isRequired"
    >
      <wd-picker
        :key="field._fc_id"
        :model-value="modelValue ?? ''"
        :columns="fieldOptions"
        :placeholder="placeholder"
        :disabled="disabled"
        @confirm="handleConfirm"
      />
    </wd-cell>

    <!-- 开关 -->
    <wd-cell
      v-else-if="fieldType === 'switch'"
      :title="fieldTitle"
      :required="isRequired"
    >
      <wd-switch
        :key="field._fc_id"
        :model-value="modelValue ?? false"
        :disabled="disabled"
        @change="handleChange"
      />
    </wd-cell>

    <!-- 评分 -->
    <wd-cell
      v-else-if="fieldType === 'rate'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <wd-rate
        :key="field._fc_id"
        :model-value="modelValue ?? 0"
        :disabled="disabled"
        :allow-half="fieldProps.allowHalf"
        :show-text="fieldProps.showText"
        @change="handleChange"
      />
    </wd-cell>

    <!-- 滑块 -->
    <wd-cell
      v-else-if="fieldType === 'slider'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <wd-slider
        :key="field._fc_id"
        :model-value="modelValue ?? 0"
        :min="fieldProps.min || 0"
        :max="fieldProps.max || 100"
        :step="fieldProps.step || 1"
        :disabled="disabled"
        @change="handleChange"
      />
    </wd-cell>

    <!-- 日期选择器 -->
    <wd-cell
      v-else-if="fieldType === 'datePicker'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <wd-datetime-picker
        :key="field._fc_id"
        :model-value="getDateTimeValue(modelValue, field?.props?.range)"
        type="date"
        :placeholder="placeholder"
        :disabled="disabled"
        @confirm="handleConfirm"
      />
    </wd-cell>

    <!-- 时间选择器 -->
    <wd-cell
      v-else-if="fieldType === 'timePicker'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <wd-datetime-picker
        :key="field._fc_id"
        :model-value="getDateTimeValue(modelValue, field?.props?.range)"
        type="time"
        :placeholder="placeholder"
        :disabled="disabled"
        @confirm="handleConfirm"
      />
    </wd-cell>

    <!-- 文件上传 -->
    <!-- <wd-cell
      v-else-if="fieldType === 'FileUpload'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <view class="upload-container">
        <wd-button :key="field._fc_id" size="small" @click="handleFileUpload">
          选择文件
        </wd-button>
        <view v-if="modelValue" class="mt-2 text-sm text-green-600">
          已上传文件: {{ modelValue }}
        </view>
      </view>
    </wd-cell> -->

    <!-- 单图上传 -->
    <wd-cell
      v-else-if="fieldType === 'ImageUpload'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <!-- 图片列表 -->
      <view class="grid grid-cols-3 mt-3 gap-3">
        <!-- 已上传的图片 -->
        <view
          v-for="(imageUrl, index) in uploadFinishList"
          :key="index"
          class="relative aspect-square"
        >
          <image
            :src="imageUrl"
            class="h-full w-full border border-gray-200 rounded-lg object-cover"
            mode="aspectFill"
            @click="handlePreviewImage(imageUrl, index)"
          />
          <!-- 删除按钮 -->
          <view
            class="absolute h-6 w-6 flex items-center justify-center rounded-full bg-red-500 -right-2 -top-2"
            @click="handleDeleteAttachment(index)"
          >
            <text class="text-xs text-white">
              ×
            </text>
          </view>
        </view>

        <!-- 上传中的图片 -->
        <view
          v-for="uploadItem in uploadingImages"
          :key="uploadItem.id"
          class="relative aspect-square"
        >
          <view class="h-full w-full flex items-center justify-center border border-gray-200 rounded-lg bg-gray-100">
            <text class="text-xs text-gray-500">
              上传中...
            </text>
          </view>
          <!-- 上传进度遮罩 -->
          <view class="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-50">
            <text class="text-xs text-white">
              {{ uploadItem.progress }}%
            </text>
          </view>
        </view>

        <!-- 添加图片按钮 -->
        <view
          v-if="uploadFinishList.length + uploadingImages.length < 1"
          class="aspect-square flex items-center justify-center border-2 border-gray-300 rounded-lg border-dashed bg-gray-50"
          @click="handleSelectImage(1, fieldProps?.fileSize ?? 5)"
        >
          <view class="text-center">
            <text class="text-2xl text-gray-400">
              +
            </text>
            <text class="mt-1 block text-xs text-gray-400">
              添加图片
            </text>
          </view>
        </view>
      </view>
    </wd-cell>

    <!-- 多图上传 -->
    <wd-cell
      v-else-if="fieldType === 'ImagesUpload'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <!-- 图片列表 -->
      <view class="grid grid-cols-3 mt-3 gap-3">
        <!-- 已上传的图片 -->
        <view
          v-for="(imageUrl, index) in uploadFinishList"
          :key="index"
          class="relative aspect-square"
        >
          <image
            :src="imageUrl"
            class="h-full w-full border border-gray-200 rounded-lg object-cover"
            mode="aspectFill"
            @click="handlePreviewImage(imageUrl, index)"
          />
          <!-- 删除按钮 -->
          <view
            class="absolute h-6 w-6 flex items-center justify-center rounded-full bg-red-500 -right-2 -top-2"
            @click="handleDeleteAttachment(index)"
          >
            <text class="text-xs text-white">
              ×
            </text>
          </view>
        </view>

        <!-- 上传中的图片 -->
        <view
          v-for="uploadItem in uploadingImages"
          :key="uploadItem.id"
          class="relative aspect-square"
        >
          <view class="h-full w-full flex items-center justify-center border border-gray-200 rounded-lg bg-gray-100">
            <text class="text-xs text-gray-500">
              上传中...
            </text>
          </view>
          <!-- 上传进度遮罩 -->
          <view class="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-50">
            <text class="text-xs text-white">
              {{ uploadItem.progress }}%
            </text>
          </view>
        </view>

        <!-- 添加图片按钮 -->
        <view
          v-if="uploadFinishList.length + uploadingImages.length < (fieldProps?.limit ?? 5)"
          class="aspect-square flex items-center justify-center border-2 border-gray-300 rounded-lg border-dashed bg-gray-50"
          @click="handleSelectImage(fieldProps?.limit ?? 5, fieldProps?.fileSize ?? 5)"
        >
          <view class="text-center">
            <text class="text-2xl text-gray-400">
              +
            </text>
            <text class="mt-1 block text-xs text-gray-400">
              添加图片
            </text>
          </view>
        </view>
      </view>
    </wd-cell>

    <wd-cell
      v-else-if="fieldType === 'cascader'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <wd-col-picker
        :key="field._fc_id"
        :model-value="modelValue ?? []"
        :placeholder="placeholder"
        :columns="[
          field.props.options.map(item => {
            const anyItem = item as any // 类型断言以支持其他可能的字段名
            const mappedItem = {
              value: item.value,
              label: item.label || anyItem.text || anyItem.name || `选项${item.value}`, // 兼容多种label字段名
              children: item.children,
            }
            return mappedItem
          }),
        ]"
        :column-change="({ selectedItem, resolve, finish }) => {
          const temp = selectedItem?.children
          if (temp && temp?.length) {
            const mappedChildren = temp.map(item => {
              const anyItem = item as any // 类型断言以支持其他可能的字段名
              const mappedItem = {
                value: item.value,
                label: item.label || anyItem.text || anyItem.name || `选项${item.value}`, // 兼容多种label字段名
                children: item.children,
              }
              return mappedItem
            })
            resolve(mappedChildren)
          }
          else {
            finish()
          }
        }"
        :disabled="disabled"
        :prop="field.field"
        :name="field.field"
        :rules="getRules(field)"
        :display-format="(selectedItems: any) => {
          return selectedItems.map((item: any) => {
            const label = item.label || item.text || item.name || `选项${item.value}`
            return label
          }).join('/')
        }"
        @confirm="handleConfirm"
      />
    </wd-cell>

    <wd-cell
      v-else-if="fieldType === 'signaturePad'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <wd-signature
        :key="field._fc_id"
        style="z-index: -1;"
        enable-history
        :disabled="disabled"
        :export-scale="2"
        @confirm="signatureConfirm"
        @clear="signatureClear"
      />
    </wd-cell>

    <!-- 部门选择器 -->
    <wd-cell
      v-else-if="fieldType === 'DeptSelect'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <DeptSelector
        :key="`dept-${field._fc_id}`"
        :model-value="modelValue ?? ''"
        :placeholder="placeholder"
        :required="isRequired"
        :disabled="disabled"
        :multiple="fieldProps.multiple"
        :level="fieldProps.level"
        @update:model-value="handleChange($event)"
      />
    </wd-cell>

    <!-- 用户选择器 -->
    <wd-cell
      v-else-if="fieldType === 'UserSelect'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <UserSelector
        :key="`user-${field._fc_id}`"
        :model-value="modelValue"
        :placeholder="placeholder"
        :required="isRequired"
        :disabled="disabled"
        :multiple="fieldProps.multiple"
        :readonly="fieldProps.readonly !== false"
        @update:model-value="handleChange($event)"
      />
    </wd-cell>

    <!-- 字典选择器 -->
    <wd-cell
      v-else-if="fieldType === 'DictSelect'"
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <DictSelector
        :key="`dict-${field._fc_id}`"
        :model-value="modelValue"
        :placeholder="placeholder"
        :required="isRequired"
        :disabled="disabled"
        :dict-type="fieldProps.dictType || (field as any).dictType"
        :multiple="fieldProps.multiple"
        @update:model-value="handleChange($event)"
      />
    </wd-cell>

    <!-- 默认情况 -->
    <wd-cell
      v-else
      :title="fieldTitle"
      :required="isRequired"
      vertical
    >
      <view class="text-sm text-gray-500">
        不支持的字段类型: {{ fieldType }}
      </view>
    </wd-cell>
  </view>
</template>

<style scoped>
</style>

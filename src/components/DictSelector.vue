<script setup lang="ts">
import type { AppDictDataRespVO } from '@/api/types/dict'
import { computed, onMounted, ref, watch } from 'vue'
import { getDictDataListByType } from '@/api/dict'
import { useAppStore } from '@/store/app'

// 主题状态管理
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

/**
 * Props
 * 父组件通过 v-model 传 string 或 string[]，内部做转换
 */
interface Props {
  modelValue?: string | string[]
  title?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  dictType: string // 字典类型，必填
  multiple?: boolean // 是否支持多选
}

const props = withDefaults(defineProps<Props>(), {
  title: '选择选项',
  placeholder: '请选择',
  required: false,
  disabled: false,
  multiple: false,
})

/** v-model */
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

/** 内部状态 */
const componentKey = ref(0)
const dictColumns = ref<any[]>([])
const selectedValue = ref<string | string[]>() // 选中的值
const loading = ref(false)
const dictData = ref<AppDictDataRespVO[]>([])

/** 加载字典数据 */
async function loadDictData() {
  if (!props.dictType) {
    console.warn('字典选择器缺少 dictType 参数')
    return
  }

  try {
    loading.value = true
    const response = await getDictDataListByType(props.dictType)

    dictData.value = response.data

    // 转换为选择器需要的格式
    const options = response.data.map(item => ({
      value: item.value,
      label: item.label,
    }))

    dictColumns.value = options
    componentKey.value++

    console.log('字典数据加载成功:', { dictType: props.dictType, data: response.data })
  }
  catch (error) {
    console.error('加载字典数据失败:', error)
    uni.showToast({ title: '加载字典数据失败', icon: 'error' })
  }
  finally {
    loading.value = false
  }
}

// 处理确认选择
function handleConfirm(event: any) {
  const { value } = event
  selectedValue.value = value

  // 获取选中的字典信息
  let selectedItems: AppDictDataRespVO[] = []

  if (props.multiple && Array.isArray(value)) {
    // 多选模式
    selectedItems = value.map((val: string) =>
      dictData.value.find(dict => dict.value === val),
    ).filter(Boolean) as AppDictDataRespVO[]
  }
  else if (!props.multiple && typeof value === 'string') {
    // 单选模式
    const item = dictData.value.find(dict => dict.value === value)
    if (item) {
      selectedItems = [item]
    }
  }
  const data = {
    value,
  }
  emit('update:modelValue', data)
}

// displayFormat 用 selectedItems 去格式化，但 modelValue 还是 string 或 string[]
function displayFormat(selectedItems: any[]) {
  if (!selectedItems || selectedItems.length === 0)
    return ''
  return props.multiple
    ? selectedItems.map(item => item.label).join(', ')
    : selectedItems[0]?.label || ''
}

/** 处理取消选择 */
function handleCancel() {
  selectedValue.value = props.modelValue
  console.log('字典选择取消')
}

/** 监听外部值变化 */
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue
}, { immediate: true })

/** 初始化加载字典 */
onMounted(() => {
  if (props.dictType) {
    loadDictData()
  }
})
</script>

<template>
  <wd-picker
    :key="componentKey"
    v-model="selectedValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :columns="dictColumns"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<style scoped>
/* 字典选择器样式 */
</style>

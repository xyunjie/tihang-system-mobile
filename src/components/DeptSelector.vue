<script setup lang="ts">
import type { DeptSimpleRespVO } from '@/api/types/school-dept'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleDeptList } from '@/api/school-dept'
import { useAppStore } from '@/store/app'

// 主题状态管理
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

interface Props {
  modelValue?: number | number[] // 选中的部门ID
  multiple?: boolean // 是否多选
  placeholder?: string // 占位符
  disabled?: boolean // 是否禁用
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'change', value: number | number[], items: DeptSimpleRespVO[]): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择部门',
  multiple: false,
  disabled: false,
})

const emit = defineEmits<Emits>()

// 响应式数据
const selectedValue = ref<number | number[]>()
const deptColumns = ref<any[]>([])
const deptData = ref<DeptSimpleRespVO[]>([])
const loading = ref(false)
const componentKey = ref(0)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue
}, { immediate: true })

// 加载部门数据
async function loadDeptData() {
  try {
    loading.value = true

    // 获取部门精简列表
    const depts = await getSimpleDeptList()
    deptData.value = depts

    // 转换为选择器需要的格式
    const options = depts.map(item => ({
      value: item.id,
      label: item.name,
    }))

    deptColumns.value = options
    componentKey.value++

    console.log('部门数据加载成功:', { depts, count: depts.length })
  }
  catch (error) {
    console.error('加载部门数据失败:', error)
    uni.showToast({
      title: '加载部门数据失败',
      icon: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

// 处理确认选择
function handleConfirm(event: any) {
  const { value } = event
  selectedValue.value = value

  // 获取选中的部门信息
  let selectedItems: DeptSimpleRespVO[] = []

  if (props.multiple && Array.isArray(value)) {
    // 多选模式
    selectedItems = value.map((val: number) =>
      deptData.value.find(dept => dept.id === val),
    ).filter(Boolean) as DeptSimpleRespVO[]
  }
  else if (!props.multiple && typeof value === 'number') {
    // 单选模式
    const item = deptData.value.find(dept => dept.id === value)
    if (item) {
      selectedItems = [item]
    }
  }
  const date = {
    value,
  }
  emit('update:modelValue', date)
}

// 处理取消选择
function handleCancel() {
  selectedValue.value = props.modelValue
  console.log('部门选择取消')
}

// 组件挂载时加载数据
onMounted(() => {
  loadDeptData()
})
</script>

<template>
  <wd-picker
    :key="componentKey"
    v-model="selectedValue"
    :placeholder="placeholder"
    :columns="deptColumns"
    :disabled="disabled"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<style scoped>
/* 部门选择器样式 */
</style>

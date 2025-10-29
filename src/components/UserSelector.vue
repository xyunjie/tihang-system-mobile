<script setup lang="ts">
import type { UserSimpleRespVO } from '@/api/types/user'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleUserList } from '@/api/user'
import { useAppStore } from '@/store/app'

interface Props {
  modelValue?: number | number[]
  title?: string
  required?: boolean
  multiple?: boolean
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'change', value: number | number[]): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '选择用户',
  required: false,
  multiple: false,
  disabled: false,
})

const emit = defineEmits<Emits>()

const showPopup = ref(false)
const users = ref<UserSimpleRespVO[]>([])
const selectedValue = ref<number[]>([])
const searchKeyword = ref('')
const loading = ref(false)

// 主题状态管理与样式适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

const selectorContainerClass = computed(() => [
  'flex items-center justify-between rounded-lg px-4 py-3 border',
  isDark.value ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300',
])

const filledTextClass = computed(() => (
  isDark.value ? 'text-white' : 'text-gray-800'
))
const placeholderTextClass = computed(() => (
  isDark.value ? 'text-gray-400' : 'text-gray-400'
))
const arrowColor = computed(() => (
  isDark.value ? '#FFFFFF66' : '#00000040'
))

const overlayBgClass = computed(() => (
  isDark.value ? 'bg-gray-800' : 'bg-white'
))
const borderBaseClass = computed(() => (
  isDark.value ? 'border-gray-700' : 'border-gray-100'
))
const headerTitleClass = computed(() => (
  isDark.value ? 'text-white' : 'text-gray-800'
))
const listItemBaseClass = 'flex cursor-pointer items-center justify-between border-b py-4 transition-colors'
const listItemSelectedClass = computed(() => (
  isDark.value ? 'border-blue-400 bg-blue-900/30' : 'border-blue-200 bg-blue-50'
))
const listItemHoverClass = computed(() => (
  isDark.value ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
))
const userNameClass = computed(() => (
  isDark.value ? 'mb-1 text-base text-white font-medium' : 'mb-1 text-base text-gray-800 font-medium'
))
const deptClass = computed(() => (
  isDark.value ? 'text-sm text-gray-400' : 'text-sm text-gray-500'
))
const bottomBarClass = computed(() => (
  isDark.value ? 'border-t border-gray-700 bg-gray-800 px-5 py-4' : 'border-t border-gray-100 bg-white px-5 py-4'
))

// 计算显示值
const displayValue = computed(() => {
  if (!selectedValue.value.length)
    return ''

  const selectedUsers = selectedValue.value.map(id =>
    users.value.find(user => user.id === id),
  ).filter(Boolean)

  return selectedUsers.map(user => user?.nickname).join(', ')
})

// 过滤用户列表
const filteredUsers = computed(() => {
  if (!searchKeyword.value.trim()) {
    return users.value
  }

  const keyword = searchKeyword.value.toLowerCase()
  return users.value.filter(user =>
    user.nickname?.toLowerCase().includes(keyword)
    || user.deptName?.toLowerCase().includes(keyword),
  )
})

// 检查是否有选择
const hasSelection = computed(() => {
  return selectedValue.value.length > 0
})

// 加载用户数据
async function loadUserData() {
  try {
    loading.value = true
    const result = await getSimpleUserList()
    users.value = result || []
  }
  catch (error) {
    console.error('加载用户数据失败:', error)
    users.value = []
  }
  finally {
    loading.value = false
  }
}

// 查找用户
function findUser(id: number): UserSimpleRespVO | undefined {
  return users.value.find(user => user.id === id)
}

// 检查用户是否被选中
function isSelected(user: UserSimpleRespVO): boolean {
  return selectedValue.value.includes(user.id)
}

// 选择/取消选择用户
function handleSelectUser(user: UserSimpleRespVO) {
  if (props.multiple) {
    const index = selectedValue.value.indexOf(user.id)
    if (index > -1) {
      selectedValue.value.splice(index, 1)
    }
    else {
      selectedValue.value.push(user.id)
    }
  }
  else {
    if (selectedValue.value.includes(user.id)) {
      selectedValue.value = []
    }
    else {
      selectedValue.value = [user.id]
    }
  }
}

// 搜索处理
function handleSearch(value: string) {
  searchKeyword.value = value
}

// 搜索输入处理
function handleSearchInput(value: string) {
  searchKeyword.value = value
}

// 确认选择
function handleConfirm() {
  showPopup.value = false

  if (props.multiple) {
    emit('update:modelValue', { value: selectedValue.value })
  }
  else {
    const singleValue = selectedValue.value.length > 0 ? selectedValue.value[0] : undefined
    emit('update:modelValue', { value: singleValue })
  }
}

// 关闭弹窗
function handleClose() {
  showPopup.value = false
  searchKeyword.value = ''
}

// 监听modelValue变化，更新selectedValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    if (props.multiple && Array.isArray(newValue)) {
      selectedValue.value = [...newValue]
    }
    else {
      selectedValue.value = [newValue as number]
    }
  }
  else {
    selectedValue.value = []
  }
}, { immediate: true })

onMounted(() => {
  loadUserData()
})
</script>

<template>
  <view :class="selectorContainerClass" @click="!disabled && (showPopup = true)">
    <text :class="displayValue ? filledTextClass : placeholderTextClass">
      {{ displayValue || '请选择用户' }}
    </text>
    <wd-icon name="arrow-right" :color="arrowColor" size="16px" />
  </view>

  <!-- 用户选择弹窗 -->
  <wd-popup
    v-model="showPopup"
    position="bottom"
    :disabled="disabled"
    :safe-area-inset-bottom="true"
    @close="handleClose"
  >
    <div class="max-h-80vh flex flex-col rounded-t-4" :class="overlayBgClass">
      <div class="flex items-center justify-between border-b px-5 py-4" :class="borderBaseClass">
        <div class="text-lg font-semibold" :class="headerTitleClass">
          {{ title }}
        </div>
        <wd-button type="text" @click="handleClose">
          取消
        </wd-button>
      </div>

      <div class="border-b px-5 py-4" :class="borderBaseClass">
        <wd-search
          v-model="searchKeyword"
          placeholder="搜索用户姓名"
          @search="handleSearch"
          @input="handleSearchInput"
        />
      </div>

      <div class="max-h-100 min-h-50 flex-1 overflow-y-auto">
        <div v-if="loading" class="flex flex-col items-center justify-center py-10 text-sm text-gray-400">
          <wd-loading />
          <div class="mt-3">
            搜索中...
          </div>
        </div>

        <div v-else-if="filteredUsers.length === 0 && searchKeyword" class="flex flex-col items-center justify-center py-10 text-sm text-gray-400">
          <div>未找到相关用户</div>
        </div>

        <div v-else-if="filteredUsers.length === 0 && !searchKeyword" class="flex flex-col items-center justify-center py-10 text-sm text-gray-400">
          <div>暂无用户数据</div>
        </div>

        <div v-else class="px-5">
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            :class="[listItemBaseClass, borderBaseClass, listItemHoverClass, isSelected(user) ? listItemSelectedClass : '']"
            @click="handleSelectUser(user)"
          >
            <div class="flex-1">
              <div :class="userNameClass">
                {{ user.nickname }}
              </div>
              <div v-if="user.deptName" :class="deptClass">
                部门: {{ user.deptName }}
              </div>
            </div>
            <wd-icon
              v-if="isSelected(user)"
              name="check"
              color="#4D7FFF"
            />
          </div>
        </div>
      </div>

      <div :class="bottomBarClass">
        <wd-button
          type="primary"
          block
          :disabled="!hasSelection"
          @click="handleConfirm"
        >
          确定
        </wd-button>
      </div>
    </div>
  </wd-popup>
</template>

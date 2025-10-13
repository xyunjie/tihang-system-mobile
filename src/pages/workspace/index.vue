<!-- 工作台页面 -->
<route lang="jsonc" type="page">
{
  "layout": "tabbar",
  "style": {
    "navigationStyle": "default",
    "navigationBarTitleText": "工作台",
    "enablePullDownRefresh": true,
  }
}
</route>

<script setup lang="ts">
import type { BpmCategoryRespVO, BpmTaskStatisticsRespVO, ProcessDefinitionRespVO } from '@/api/types/bpm'
import { computed, reactive, ref } from 'vue'
import { getCategorySimpleList, getProcessDefinitionList, getTaskStatistics } from '@/api/bpm'

defineOptions({
  name: 'Workspace',
})

// 页面状态管理
const pageState = reactive({
  loading: false,
  refreshing: false,
  error: null as string | null,
  categoriesLoading: false,
})

// 下拉刷新相关状态
const isRefreshing = ref(false)

// 审批分类数据
const bpmCategories = ref<BpmCategoryRespVO[]>([])

// 流程定义数据
const processDefinitions = ref<ProcessDefinitionRespVO[]>([])
const processDefinitionsLoading = ref(false)

// 审批申请定义
interface ApprovalItem {
  id: string
  type: string
  title: string
  applicant: string
  applyTime: string
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  reason?: string
  amount?: number
  days?: number
  description: string
  urgency: 'low' | 'normal' | 'high' | 'urgent'
  department?: string
  avatar?: string
}

// 统计数据 - 直接使用API响应类型
const statistics = ref<BpmTaskStatisticsRespVO>({
  pendingCount: 0,
  completedCount: 0,
  ccCount: 0,
  todayCount: 0,
})

// 按分类获取流程定义 - 根据获取的分类数据和流程定义的category进行匹配
const processDefinitionsByCategory = computed(() => {
  const categoryMap: Record<string, {
    id: number
    name: string
    code: string
    processes: ProcessDefinitionRespVO[]
  }> = {}

  // 首先基于获取到的分类数据创建分类结构
  bpmCategories.value.forEach((category) => {
    categoryMap[category.code] = {
      id: category.id,
      name: category.name,
      code: category.code,
      processes: [],
    }
  })

  // 然后将流程定义分配到对应的分类中
  processDefinitions.value.forEach((process) => {
    const categoryCode = process.category

    // 如果找到匹配的分类，添加到该分类下
    if (categoryCode && categoryMap[categoryCode]) {
      categoryMap[categoryCode].processes.push(process)
    }
    else {
      // 如果没有匹配的分类，创建一个"其他"分类
      if (!categoryMap.Other) {
        categoryMap.Other = {
          id: 0,
          name: '其他',
          code: 'Other',
          processes: [],
        }
      }
      categoryMap.Other.processes.push(process)
    }
  })

  // 只返回有流程定义的分类
  const result: Record<string, typeof categoryMap[string]> = {}
  Object.entries(categoryMap).forEach(([key, value]) => {
    if (value.processes.length > 0) {
      result[key] = value
    }
  })

  return result
})
// 启动流程定义
async function startProcess(processDefinition: ProcessDefinitionRespVO) {
  try {
    // 根据 formType 判断表单类型
    if (processDefinition.formType === 20) {
      // 业务表单：先显示预览弹窗
      // 统一跳转到公共业务流程页面
      uni.navigateTo({
        url: `/pages-sub/bpm/business-process/index?processDefinitionId=${processDefinition.id}&processKey=${processDefinition.key}`,
      })
    }
    else if (processDefinition.formType === 10) {
      // 自定义表单：跳转到自定义表单页面
      uni.navigateTo({
        url: `/pages-sub/bpm/custom-form/index?processDefinitionId=${processDefinition.id}&processKey=${processDefinition.key}`,
      })
    }
    else {
      uni.showToast({
        title: `${processDefinition.name}流程启动功能开发中`,
        icon: 'none',
        duration: 2000,
      })
    }
  }
  catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '启动流程失败，请重试',
      icon: 'error',
    })
  }
}

// 获取审批分类列表
async function loadBpmCategories() {
  pageState.categoriesLoading = true
  try {
    const response = await getCategorySimpleList()
    console.log('审批分类加载成功:', response.data)
    if (response && response.code === 0) {
      bpmCategories.value = response.data || []
    }
    else {
      uni.showToast({
        title: response?.msg || '获取审批分类失败',
        icon: 'none',
      })
    }
  }
  catch (error) {
    console.error('获取审批分类异常:', error)
    uni.showToast({
      title: '网络异常，请重试',
      icon: 'none',
    })
  }
  finally {
    pageState.categoriesLoading = false
  }
}

// 获取流程定义列表
async function loadProcessDefinitions() {
  processDefinitionsLoading.value = true
  try {
    const response = await getProcessDefinitionList()
    console.log('流程定义加载成功:', response.data)
    if (response && response.code === 0) {
      processDefinitions.value = response.data || []
    }
    else {
      uni.showToast({
        title: response?.msg || '获取流程定义失败',
        icon: 'none',
      })
    }
  }
  catch (error) {
    console.error('获取流程定义异常:', error)
    uni.showToast({
      title: '网络异常，请重试',
      icon: 'none',
    })
  }
  finally {
    processDefinitionsLoading.value = false
  }
}

// 获取任务统计数据
async function loadTaskStatistics() {
  try {
    const response = await getTaskStatistics()
    console.log('任务统计数据加载成功:', response.data)
    if (response && response.code === 0) {
      statistics.value = response.data
    }
    else {
      console.error('获取任务统计失败:', response?.msg)
      uni.showToast({
        title: response?.msg || '获取统计数据失败',
        icon: 'none',
      })
    }
  }
  catch (error) {
    console.error('获取任务统计异常:', error)
    uni.showToast({
      title: '网络异常，请重试',
      icon: 'none',
    })
  }
}

// 跳转到待办任务页面
function navigateToTodoList() {
  uni.navigateTo({
    url: '/pages-sub/bpm/todo/index',
  })
}

// 跳转到已办任务页面
function navigateToDoneList() {
  uni.navigateTo({
    url: '/pages-sub/bpm/done/index',
  })
}

// 跳转到抄送列表页面
function navigateToCopyList() {
  uni.navigateTo({
    url: '/pages-sub/bpm/copy/index',
  })
}

// 跳转到我的审批页面
function navigateToMyApprovalList() {
  uni.navigateTo({
    url: '/pages-sub/bpm/my-approval/index',
  })
}

// 页面加载 - 微信小程序环境使用 onLoad 生命周期
// 在微信小程序中，可以使用 onLoad 或 onShow 生命周期
// 这里移除 onMounted，改为在需要时手动调用初始化函数
async function initPage(loading: boolean = true) {
  pageState.loading = loading
  try {
    // 并行加载审批分类、流程定义和任务统计数据
    await Promise.all([
      loadBpmCategories(),
      loadProcessDefinitions(),
      loadTaskStatistics(),
    ])
  }
  catch (error) {
    pageState.error = '加载失败，请重试'
  }
  finally {
    pageState.loading = false
  }
}

// 页面下拉刷新处理
async function handlePullDownRefresh() {
  if (isRefreshing.value) {
    return
  }

  console.log('开始下拉刷新...')
  isRefreshing.value = true
  pageState.refreshing = true

  try {
    // 重新加载所有数据
    await Promise.all([
      loadBpmCategories(),
      loadProcessDefinitions(),
      loadTaskStatistics(),
    ])

    uni.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1500,
    })
  }
  catch (error) {
    console.error('刷新失败:', error)
    uni.showToast({
      title: '刷新失败，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
  finally {
    pageState.refreshing = false
    isRefreshing.value = false
    // 停止下拉刷新
    uni.stopPullDownRefresh()
  }
}

// 在微信小程序中，可以通过 onLoad 调用
onLoad(() => {
  initPage()
})

onShow(() => {
  initPage(false)
})

// 页面下拉刷新
onPullDownRefresh(() => {
  handlePullDownRefresh()
})
</script>

<template>
  <!-- 使用普通的view容器，不需要scroll-view -->
  <view>
    <!-- 加载状态 -->
    <view v-if="pageState.loading" class="px-4 pt-4">
      <wd-skeleton theme="paragraph" class="mt-2" />
    </view>

    <view v-else class="px-4 pb-8 pt-4">
      <!-- 统计卡片 -->
      <view class="grid grid-cols-2 mb-5 gap-4">
        <view
          class="overflow-hidden rounded-2xl bg-blue-500 p-5 shadow-lg"
          @click="navigateToTodoList"
        >
          <view class="flex items-start justify-between">
            <view>
              <view class="mb-1 text-sm text-blue-100">
                待办任务
              </view>
              <view class="text-3xl text-white font-bold">
                {{ statistics.pendingCount }}
              </view>
            </view>
            <view class="h-11 w-11 flex items-center justify-center rounded-xl bg-white bg-opacity-20">
              <wd-icon name="fill-camera" size="22px" color="#ffffff" />
            </view>
          </view>
        </view>

        <view
          class="overflow-hidden rounded-2xl bg-green-500 p-5 shadow-lg"
          @click="navigateToDoneList"
        >
          <view class="flex items-start justify-between">
            <view>
              <view class="mb-1 text-sm text-green-100">
                已办任务
              </view>
              <view class="text-3xl text-white font-bold">
                {{ statistics.completedCount }}
              </view>
            </view>
            <view class="h-11 w-11 flex items-center justify-center rounded-xl bg-white bg-opacity-20">
              <wd-icon name="check-outline" size="22px" color="#ffffff" />
            </view>
          </view>
        </view>

        <view
          class="overflow-hidden rounded-2xl bg-orange-500 p-5 shadow-lg"
          @click="navigateToCopyList"
        >
          <view class="flex items-start justify-between">
            <view>
              <view class="mb-1 text-sm text-orange-100">
                今日抄送
              </view>
              <view class="text-3xl text-white font-bold">
                {{ statistics.ccCount }}
              </view>
            </view>
            <view class="h-11 w-11 flex items-center justify-center rounded-xl bg-white bg-opacity-20">
              <wd-icon name="edit-outline" size="22px" color="#ffffff" />
            </view>
          </view>
        </view>

        <view
          class="overflow-hidden rounded-2xl bg-purple-500 p-5 shadow-lg"
          @click="navigateToMyApprovalList"
        >
          <view class="flex items-start justify-between">
            <view>
              <view class="mb-1 text-sm text-purple-100">
                我的审批
              </view>
              <view class="text-3xl text-white font-bold">
                {{ statistics.todayCount }}
              </view>
            </view>
            <view class="h-11 w-11 flex items-center justify-center rounded-xl bg-white bg-opacity-20">
              <wd-icon name="home1" size="22px" color="#ffffff" />
            </view>
          </view>
        </view>
      </view>

      <!-- 流程定义列表 -->
      <view v-if="Object.keys(processDefinitionsByCategory).length > 0">
        <!-- 按分类显示流程定义 -->
        <view
          v-for="(categoryData, categoryKey) in processDefinitionsByCategory"
          :key="categoryKey"
          class="mb-4 last:mb-0"
        >
          <!-- 分类卡片 -->
          <view class="overflow-hidden rounded-2xl bg-white shadow-xl">
            <!-- 卡片标题 -->
            <view class="flex items-center justify-between border-b border-gray-100 bg-blue-100 px-4 py-3">
              <view class="flex items-center">
                <view class="text-base text-gray-800 font-bold">
                  {{ categoryData.name }}
                </view>
              </view>
            </view>

            <!-- 流程卡片网格 -->
            <view class="grid grid-cols-4 gap-4 p-4">
              <view
                v-for="process in categoryData.processes"
                :key="process.id"
                class="flex flex-col items-center"
                @click="startProcess(process)"
              >
                <!-- 图标容器 -->
                <view class="mb-2 h-16 w-16 flex items-center justify-center overflow-hidden rounded-2xl bg-blue-50">
                  <view class="h-14 w-14 flex items-center justify-center rounded-xl bg-blue-500 shadow-md">
                    <template v-if="process.icon">
                      <image
                        :src="process.icon"
                        class="h-8 w-8 object-contain"
                        mode="aspectFit"
                      />
                    </template>
                    <template v-else>
                      <text class="text-lg text-white font-bold">
                        {{ process.name.slice(0, 2) }}
                      </text>
                    </template>
                  </view>
                </view>

                <!-- 流程名称 -->
                <view class="line-clamp-2 w-full text-center text-sm text-gray-700 font-medium leading-tight">
                  {{ process.name }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 只保留必要的动画，其他样式使用UnoCSS */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

<!-- 关于我们 - 梯航智能车创新工作室 -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "关于我们"
  }
}
</route>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({
  name: 'AboutStudio',
})

// 获取屏幕边界到安全区域距离
let safeAreaInsets
let systemInfo

// #ifdef MP-WEIXIN
systemInfo = uni.getWindowInfo()
safeAreaInsets = systemInfo.safeArea
  ? {
      top: systemInfo.safeArea.top,
      right: systemInfo.windowWidth - systemInfo.safeArea.right,
      bottom: systemInfo.windowHeight - systemInfo.safeArea.bottom,
      left: systemInfo.safeArea.left,
    }
  : null
// #endif

// #ifndef MP-WEIXIN
systemInfo = uni.getSystemInfoSync()
safeAreaInsets = systemInfo.safeAreaInsets
// #endif

// 成就数据
const achievements = [
  { label: '成立年份', value: '2011', unit: '年', icon: '📅' },
  { label: '国家级奖项', value: '11', unit: '项', icon: '🏆' },
  { label: '省级一等奖', value: '31', unit: '项', icon: '🥇' },
  { label: '省级奖项总数', value: '100+', unit: '项', icon: '🏅' }
]

// 核心理念
const concepts = [
  { title: '教育理念', content: '以卓越和创新教育引领学生走向成功', icon: '💡' },
  { title: '教学策略', content: '以学生为中心的教学策略和方法', icon: '🎯' },
  { title: '院训精神', content: '求真、务实、严谨、创新', icon: '📚' },
  { title: '发展理念', content: '以赛促学、以赛促教', icon: '🚀' }
]

// 主要竞赛
const competitions = [
  { name: '全国大学生智能汽车竞赛', desc: '培养智能车技术与创新能力', icon: '🚗' },
  { name: '"挑战杯"课外学术科技竞赛', desc: '激发科学研究与探索兴趣', icon: '🔬' },
  { name: '嵌入式芯片与系统设计竞赛', desc: '提升嵌入式系统开发能力', icon: '💻' }
]

// 奖项分类
const awardCategories = [
  { level: '国家级', awards: [{ grade: '一等奖', count: 1 }, { grade: '二等奖', count: 7 }, { grade: '三等奖', count: 3 }], color: 'text-red-600 bg-red-50' },
  { level: '省级', awards: [{ grade: '一等奖', count: 31 }, { grade: '二等奖', count: 41 }, { grade: '三等奖', count: '100+' }], color: 'text-blue-600 bg-blue-50' }
]

// 滚动到指定位置
const scrollToSection = (sectionId: string) => {
  uni.pageScrollTo({
    selector: `#${sectionId}`,
    duration: 300
  })
}
</script>

<template>
  <view class="min-h-screen bg-gray-50" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 顶部logo和名称 -->
    <view class="relative bg-white">
      <!-- 背景装饰 -->
      <view class="absolute inset-0 overflow-hidden">
        <view class="absolute -top-20 -right-20 w-40 h-40 bg-blue-100 rounded-full opacity-30"></view>
        <view class="absolute -bottom-10 -left-10 w-32 h-32 bg-green-100 rounded-full opacity-20"></view>
      </view>
      
      <view class="relative z-10 text-center py-12 px-8">
        <!-- Logo区域 -->
        <view class="mb-6">
          <view class="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl mx-auto flex items-center justify-center shadow-lg">
            <text class="text-4xl text-white">🚗</text>
          </view>
        </view>
        
        <!-- 工作室名称 -->
        <view class="text-gray-800 text-2xl font-bold mb-2">梯航智能车创新工作室</view>
        <view class="text-gray-500 text-base">烟台科技学院海洋工程学院</view>
        
        <!-- 成立年份标识 -->
        <view class="mt-4 inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          成立于 2011 年
        </view>
      </view>
    </view>

    <!-- 成就数据展示 -->
    <view class="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
      <view class="px-4 py-3 border-b border-gray-100">
        <view class="text-gray-800 text-lg font-semibold">📊 工作室成就</view>
      </view>
      
      <view class="p-4">
        <view class="grid grid-cols-2 gap-4">
          <view 
            v-for="(item, index) in achievements" 
            :key="index"
            class="text-center p-4 bg-gray-50 rounded-xl"
          >
            <view class="text-2xl mb-2">{{ item.icon }}</view>
            <view class="text-2xl font-bold text-blue-600 mb-1">{{ item.value }}</view>
            <view class="text-gray-600 text-sm">{{ item.label }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 核心理念 -->
    <view id="concepts" class="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
      <view class="px-4 py-3 border-b border-gray-100">
        <view class="text-gray-800 text-lg font-semibold">💭 核心理念</view>
      </view>
      
      <view class="p-4 space-y-4">
        <view 
          v-for="(concept, index) in concepts" 
          :key="index"
          class="flex items-start p-3 bg-gray-50 rounded-xl"
        >
          <view class="text-lg mr-3 mt-1">{{ concept.icon }}</view>
          <view class="flex-1">
            <view class="text-gray-800 text-base font-medium mb-1">{{ concept.title }}</view>
            <view class="text-gray-600 text-sm leading-relaxed">{{ concept.content }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 工作室介绍 -->
    <view id="introduction" class="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
      <view class="px-4 py-3 border-b border-gray-100">
        <view class="text-gray-800 text-lg font-semibold">📖 工作室介绍</view>
      </view>
      
      <view class="p-4">
        <view class="text-gray-700 text-base leading-relaxed space-y-4">
          <view class="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
            工作室在学院"以赛促学、以赛促教"的良好氛围下，通过参与各类竞赛、自主学习先进知识、参与真实工程项目、专利申请等方式，全面提升成员的创新意识、实践能力和合作精神。
          </view>
          
          <view class="p-4 bg-green-50 rounded-xl border-l-4 border-green-400">
            激发工作室成员从事科学研究与探索的兴趣和潜能，提升成员的综合素质，为社会培养高质量的创新型人才。
          </view>
        </view>
      </view>
    </view>

    <!-- 主要竞赛 -->
    <view id="competitions" class="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
      <view class="px-4 py-3 border-b border-gray-100">
        <view class="text-gray-800 text-lg font-semibold">🏁 主要竞赛</view>
      </view>
      
      <view class="p-4 space-y-3">
        <view 
          v-for="(comp, index) in competitions" 
          :key="index"
          class="flex items-start p-4 bg-gray-50 rounded-xl"
        >
          <view class="text-xl mr-3 mt-1">{{ comp.icon }}</view>
          <view class="flex-1">
            <view class="text-gray-800 text-base font-medium mb-1">{{ comp.name }}</view>
            <view class="text-gray-600 text-sm">{{ comp.desc }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 获奖情况 -->
    <view id="awards" class="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
      <view class="px-4 py-3 border-b border-gray-100">
        <view class="text-gray-800 text-lg font-semibold">🏆 获奖情况</view>
      </view>
      
      <view class="p-4 space-y-4">
        <view 
          v-for="(category, index) in awardCategories" 
          :key="index"
          class="p-4 rounded-xl" 
          :class="category.color"
        >
          <view class="text-base font-semibold mb-3">{{ category.level }}</view>
          <view class="grid grid-cols-3 gap-3">
            <view 
              v-for="(award, awardIndex) in category.awards" 
              :key="awardIndex"
              class="text-center"
            >
              <view class="text-xl font-bold mb-1">{{ award.count }}</view>
              <view class="text-sm">{{ award.grade }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 发展成果 -->
    <view id="achievements-detail" class="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
      <view class="px-4 py-3 border-b border-gray-100">
        <view class="text-gray-800 text-lg font-semibold">🌟 发展成果</view>
      </view>
      
      <view class="p-4">
        <view class="space-y-4">
          <view class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <view class="flex items-center mb-2">
              <text class="text-lg mr-2">🎓</text>
              <view class="text-gray-800 text-base font-medium">人才培养</view>
            </view>
            <view class="text-gray-600 text-sm leading-relaxed">
              大量优秀毕业生从创新工作室走向社会，实现了高质量就业，为相关行业输送了优秀人才
            </view>
          </view>
          
          <view class="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
            <view class="flex items-center mb-2">
              <text class="text-lg mr-2">🏅</text>
              <view class="text-gray-800 text-base font-medium">荣誉认可</view>
            </view>
            <view class="text-gray-600 text-sm leading-relaxed">
              2021年荣获蓬莱区总工会、区人社局、区科技局联合颁发的"劳模和工匠人才创新（孵化）工作室"称号
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 联系信息 -->
    <view class="mx-4 mt-6 mb-8 bg-white rounded-2xl shadow-sm overflow-hidden">
      <view class="px-4 py-3 border-b border-gray-100">
        <view class="text-gray-800 text-lg font-semibold">📞 联系我们</view>
      </view>
      
      <view class="p-4">
        <view class="space-y-3">
          <view class="flex items-center p-3 bg-gray-50 rounded-xl">
            <text class="text-lg mr-3">🏫</text>
            <view class="flex-1">
              <view class="text-gray-800 text-sm font-medium">所属学院</view>
              <view class="text-gray-600 text-sm mt-1">海洋工程学院</view>
            </view>
          </view>
          
          <view class="flex items-center p-3 bg-gray-50 rounded-xl">
            <text class="text-lg mr-3">💼</text>
            <view class="flex-1">
              <view class="text-gray-800 text-sm font-medium">工作室性质</view>
              <view class="text-gray-600 text-sm mt-1">智能车创新实践基地</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 返回顶部按钮 -->
    <view 
      class="fixed bottom-20 right-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg active:bg-blue-600 transition-colors"
      @click="scrollToSection('top')"
      style="z-index: 100;"
    >
      <text class="text-white text-lg">↑</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>
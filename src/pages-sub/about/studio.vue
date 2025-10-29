<!-- 关于我们 - 梯航智能车创新工作室（分包版） -->
<route lang="jsonc" type="page">
{
  "style": {
    "navigationBarTitleText": "关于我们"
  }
}
</route>

<script setup lang="ts">
import { computed } from 'vue'
import ThemeCard from '@/components/ThemeCard.vue'
import { useAppStore } from '@/store/app'

defineOptions({
  name: 'AboutStudioSub',
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

// 主题适配
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const pageClass = computed(() => (isDark.value ? 'bg-[#0f172a]' : 'bg-gray-50'))
const textPrimaryClass = computed(() => (isDark.value ? 'text-gray-100' : 'text-gray-800'))
const textSecondaryClass = computed(() => (isDark.value ? 'text-gray-400' : 'text-gray-600'))
const textMutedClass = computed(() => (isDark.value ? 'text-gray-500' : 'text-gray-500'))
const sectionHeaderBorderClass = computed(() => (isDark.value ? 'border-b border-white/10' : 'border-b border-gray-100'))
const itemBgClass = computed(() => (isDark.value ? 'bg-white/6' : 'bg-gray-50'))
const badgeClass = computed(() => (isDark.value ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-100 text-blue-700'))
const heroBgClass = computed(() => (isDark.value ? 'bg-white/6' : 'bg-white'))

// 成就数据
const achievements = [
  { label: '成立年份', value: '2011', unit: '年', icon: '📅' },
  { label: '国家级奖项', value: '16', unit: '项', icon: '🏆' },
  { label: '省级一等奖', value: '31', unit: '项', icon: '🥇' },
  { label: '省级奖项总数', value: '200+', unit: '项', icon: '🏅' },
]

// 核心理念
const concepts = [
  { title: '教育理念', content: '以卓越和创新教育引领学生走向成功', icon: '💡' },
  { title: '教学策略', content: '以学生为中心的教学策略和方法', icon: '🎯' },
  { title: '院训精神', content: '求真、务实、严谨、创新', icon: '📚' },
  { title: '发展理念', content: '以赛促学、以赛促教', icon: '🚀' },
]

// 主要竞赛
const competitions = [
  { name: '全国大学生智能汽车竞赛', desc: '培养智能车技术与创新能力', icon: '🚗' },
  { name: '"挑战杯"课外学术科技竞赛', desc: '激发科学研究与探索兴趣', icon: '🔬' },
  { name: '嵌入式芯片与系统设计竞赛', desc: '提升嵌入式系统开发能力', icon: '💻' },
]

// 奖项分类（颜色在模板中根据 isDark 动态处理）
const awardCategories = [
  { level: '国家级', awards: [{ grade: '一等奖', count: 1 }, { grade: '二等奖', count: 12 }, { grade: '三等奖', count: 3 }] },
  { level: '省级', awards: [{ grade: '一等奖', count: 31 }, { grade: '二等奖', count: 41 }, { grade: '三等奖', count: '100+' }] },
]

// 滚动到指定位置
function scrollToSection(sectionId: string) {
  uni.pageScrollTo({ selector: `#${sectionId}`, duration: 300 })
}
</script>

<template>
  <view class="min-h-screen" :class="pageClass" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <!-- 顶部logo和名称（英雄区） -->
    <view class="relative" :class="heroBgClass">
      <!-- 背景装饰 -->
      <view class="absolute inset-0 overflow-hidden">
        <view class="absolute h-40 w-40 rounded-full bg-blue-100 opacity-30 -right-20 -top-20" />
        <view class="absolute h-32 w-32 rounded-full bg-green-100 opacity-20 -bottom-10 -left-10" />
      </view>

      <view class="relative z-10 px-8 py-12 text-center">
        <!-- Logo区域 -->
        <view class="mb-6">
          <view class="mx-auto h-24 w-24 flex items-center justify-center rounded-3xl from-blue-500 to-blue-700 bg-gradient-to-br shadow-lg">
            <text class="text-4xl text-white">
              🚗
            </text>
          </view>
        </view>

        <!-- 工作室名称 -->
        <view class="mb-2 text-2xl font-bold" :class="textPrimaryClass">
          梯航智能车创新工作室
        </view>
        <view class="text-base" :class="textSecondaryClass">
          烟台科技学院海洋工程学院
        </view>

        <!-- 成立年份标识 -->
        <view class="mt-4 inline-block rounded-full px-4 py-2 text-sm font-medium" :class="badgeClass">
          成立于 2011 年
        </view>
      </view>
    </view>

    <!-- 成就数据展示 -->
    <ThemeCard card-class="mx-4 mt-6">
      <view :class="sectionHeaderBorderClass" class="px-4 py-3">
        <view class="text-lg font-semibold" :class="textPrimaryClass">
          📊 工作室成就
        </view>
      </view>
      <view class="p-4">
        <view class="grid grid-cols-2 gap-4">
          <view v-for="(item, index) in achievements" :key="index" class="rounded-xl p-4 text-center" :class="itemBgClass">
            <view class="mb-2 text-2xl">
              {{ item.icon }}
            </view>
            <view class="mb-1 text-2xl text-blue-600 font-bold">
              {{ item.value }}
            </view>
            <view class="text-sm" :class="textSecondaryClass">
              {{ item.label }}
            </view>
          </view>
        </view>
      </view>
    </ThemeCard>

    <!-- 核心理念 -->
    <ThemeCard card-class="mx-4 mt-6">
      <view :class="sectionHeaderBorderClass" class="px-4 py-3">
        <view class="text-lg font-semibold" :class="textPrimaryClass">
          💭 核心理念
        </view>
      </view>
      <view class="p-4 space-y-4">
        <view v-for="(concept, index) in concepts" :key="index" class="flex items-start rounded-xl p-3" :class="itemBgClass">
          <view class="mr-3 mt-1 text-lg">
            {{ concept.icon }}
          </view>
          <view class="flex-1">
            <view class="mb-1 text-base font-medium" :class="textPrimaryClass">
              {{ concept.title }}
            </view>
            <view class="text-sm leading-relaxed" :class="textSecondaryClass">
              {{ concept.content }}
            </view>
          </view>
        </view>
      </view>
    </ThemeCard>

    <!-- 工作室介绍 -->
    <ThemeCard card-class="mx-4 mt-6">
      <view :class="sectionHeaderBorderClass" class="px-4 py-3">
        <view class="text-lg font-semibold" :class="textPrimaryClass">
          📖 工作室介绍
        </view>
      </view>
      <view class="p-4">
        <view class="text-base leading-relaxed space-y-4" :class="textSecondaryClass">
          <view class="border-l-4 border-blue-400 rounded-xl p-4" :class="isDark ? 'bg-blue-500/10 border-blue-400/60' : 'bg-blue-50 border-blue-400'">
            工作室在学院"以赛促学、以赛促教"的良好氛围下，通过参与各类竞赛、自主学习先进知识、参与真实工程项目、专利申请等方式，全面提升成员的创新意识、实践能力和合作精神。
          </view>
          <view class="border-l-4 border-green-400 rounded-xl p-4" :class="isDark ? 'bg-green-500/10 border-green-400/60' : 'bg-green-50 border-green-400'">
            激发工作室成员从事科学研究与探索的兴趣和潜能，提升成员的综合素质，为社会培养高质量的创新型人才。
          </view>
        </view>
      </view>
    </ThemeCard>

    <!-- 主要竞赛 -->
    <ThemeCard card-class="mx-4 mt-6">
      <view :class="sectionHeaderBorderClass" class="px-4 py-3">
        <view class="text-lg font-semibold" :class="textPrimaryClass">
          🏁 主要竞赛
        </view>
      </view>
      <view class="p-4 space-y-3">
        <view v-for="(comp, index) in competitions" :key="index" class="flex items-start rounded-xl p-4" :class="itemBgClass">
          <view class="mr-3 mt-1 text-xl">
            {{ comp.icon }}
          </view>
          <view class="flex-1">
            <view class="mb-1 text-base font-medium" :class="textPrimaryClass">
              {{ comp.name }}
            </view>
            <view class="text-sm" :class="textSecondaryClass">
              {{ comp.desc }}
            </view>
          </view>
        </view>
      </view>
    </ThemeCard>

    <!-- 获奖情况 -->
    <ThemeCard card-class="mx-4 mt-6">
      <view :class="sectionHeaderBorderClass" class="px-4 py-3">
        <view class="text-lg font-semibold" :class="textPrimaryClass">
          🏆 获奖情况
        </view>
      </view>
      <view class="p-4 space-y-4">
        <view
          v-for="(category, index) in awardCategories" :key="index" class="rounded-xl p-4"
          :class="isDark
            ? (category.level === '国家级' ? 'text-red-300 bg-red-500/10' : 'text-blue-300 bg-blue-500/10')
            : (category.level === '国家级' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50')"
        >
          <view class="mb-3 text-base font-semibold">
            {{ category.level }}
          </view>
          <view class="grid grid-cols-3 gap-3">
            <view v-for="(award, awardIndex) in category.awards" :key="awardIndex" class="text-center">
              <view class="mb-1 text-xl font-bold">
                {{ award.count }}
              </view>
              <view class="text-sm">
                {{ award.grade }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </ThemeCard>

    <!-- 发展成果 -->
    <ThemeCard card-class="mx-4 mt-6">
      <view :class="sectionHeaderBorderClass" class="px-4 py-3">
        <view class="text-lg font-semibold" :class="textPrimaryClass">
          🌟 发展成果
        </view>
      </view>
      <view class="p-4">
        <view class="space-y-4">
          <view class="border rounded-xl from-purple-50 to-pink-50 bg-gradient-to-r p-4" :class="isDark ? 'border-white/12 bg-white/6' : 'border-purple-100'">
            <view class="mb-2 flex items-center">
              <text class="mr-2 text-lg">
                🎓
              </text>
              <view class="text-base font-medium" :class="textPrimaryClass">
                人才培养
              </view>
            </view>
            <view class="text-sm leading-relaxed" :class="textSecondaryClass">
              大量优秀毕业生从创新工作室走向社会，实现了高质量就业，为相关行业输送了优秀人才
            </view>
          </view>

          <view class="border rounded-xl from-yellow-50 to-orange-50 bg-gradient-to-r p-4" :class="isDark ? 'border-white/12 bg-white/6' : 'border-yellow-100'">
            <view class="mb-2 flex items-center">
              <text class="mr-2 text-lg">
                🏅
              </text>
              <view class="text-base font-medium" :class="textPrimaryClass">
                荣誉认可
              </view>
            </view>
            <view class="text-sm leading-relaxed" :class="textSecondaryClass">
              2021年荣获蓬莱区总工会、区人社局、区科技局联合颁发的"劳模和工匠人才创新（孵化）工作室"称号
            </view>
          </view>
        </view>
      </view>
    </ThemeCard>

    <!-- 联系信息 -->
    <ThemeCard card-class="mx-4 mb-8 mt-6">
      <view :class="sectionHeaderBorderClass" class="px-4 py-3">
        <view class="text-lg font-semibold" :class="textPrimaryClass">
          📞 联系我们
        </view>
      </view>
      <view class="p-4">
        <view class="space-y-3">
          <view class="flex items-center rounded-xl p-3" :class="itemBgClass">
            <text class="mr-3 text-lg">
              🏫
            </text>
            <view class="flex-1">
              <view class="text-sm font-medium" :class="textPrimaryClass">
                所属学院
              </view>
              <view class="mt-1 text-sm" :class="textSecondaryClass">
                海洋工程学院
              </view>
            </view>
          </view>
          <view class="flex items-center rounded-xl p-3" :class="itemBgClass">
            <text class="mr-3 text-lg">
              💼
            </text>
            <view class="flex-1">
              <view class="text-sm font-medium" :class="textPrimaryClass">
                工作室性质
              </view>
              <view class="mt-1 text-sm" :class="textSecondaryClass">
                智能车创新实践基地
              </view>
            </view>
          </view>
        </view>
      </view>
    </ThemeCard>

    <!-- 返回顶部按钮 -->
    <view class="fixed bottom-20 right-4 h-12 w-12 flex items-center justify-center rounded-full bg-blue-500 shadow-lg transition-colors active:bg-blue-600" style="z-index: 100;" @click="scrollToSection('top')">
      <text class="text-lg text-white">
        ↑
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，无需自定义CSS */
</style>

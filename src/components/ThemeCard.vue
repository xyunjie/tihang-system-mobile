<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/store/app'

defineOptions({ name: 'ThemeCard' })

const props = defineProps<{
  padding?: string | false
  radius?: string
  border?: boolean
  shadow?: boolean
  bgClass?: string
  cardClass?: string
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

// 默认灰色半透明背景；深色模式下为白色轻微透明以保持层次
const baseBgClass = computed(() => {
  if (props.bgClass)
    return props.bgClass
  // 浅色模式：不透明白色，与页面卡片保持一致；深色模式保持轻微半透明以融入深色背景
  return isDark.value ? 'bg-white/6' : 'bg-white'
})

// 细边框与阴影，增强与背景的分层感
const borderClass = computed(() => {
  if (props.border === false)
    return ''
  return isDark.value ? 'border border-white/8' : 'border border-gray-100'
})

const shadowClass = computed(() => {
  if (props.shadow === false)
    return ''
  return isDark.value ? 'shadow-lg' : 'shadow-md'
})

const radiusClass = computed(() => props.radius ?? 'rounded-2xl')
const paddingClass = computed(() => {
  if (props.padding === false)
    return ''
  return props.padding ?? 'p-4'
})

const containerClass = computed(() => [
  'overflow-hidden',
  baseBgClass.value,
  borderClass.value,
  shadowClass.value,
  radiusClass.value,
  paddingClass.value,
  props.cardClass || '',
].filter(Boolean).join(' '))
</script>

<template>
  <view :class="containerClass" @click="$emit('click')">
    <slot />
  </view>
</template>

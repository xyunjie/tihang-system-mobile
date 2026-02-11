<script setup lang="ts">
import { computed } from 'vue'

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
// const appStore = useAppStore()
// const isDark = computed(() => appStore.theme === 'dark')

// 默认使用 bg-card
const baseBgClass = computed(() => {
  if (props.bgClass)
    return props.bgClass
  return 'bg-card'
})

// 边框适配主题色
const borderClass = computed(() => {
  if (props.border === false)
    return ''
  return 'border border-border'
})

const shadowClass = computed(() => {
  if (props.shadow === false)
    return ''
  return 'shadow-md'
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

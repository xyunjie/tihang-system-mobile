<script setup lang="ts">
import mpHtml from '@/components/mp-html/mp-html.vue'
import { useAppStore } from '@/store/app'

const props = defineProps<{
  content: string
  containerStyle?: string
  tagStyle?: Record<string, string>
  scrollTable?: boolean | string
}>()

// 仅适配文本颜色为主题感知，其余保持不变
const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')
const containerStyle = computed(() => {
  if (props.containerStyle)
    return props.containerStyle
  const textColor = isDark.value ? '#e5e7eb' : '#374151'
  return `padding: 6px 0; font-size: 15px; line-height: 1.8; color: ${textColor}; word-break: break-word; overflow-wrap: break-word; overflow: hidden;`
})

const defaultTagStyle = computed<Record<string, string>>(() => {
  if (isDark.value) {
    const borderColor = 'rgba(255,255,255,0.12)'
    const headerBg = 'rgba(255,255,255,0.06)'
    const cellBg = 'transparent'
    return {
      table: `border-collapse: collapse; table-layout: auto; width: auto; max-width: 100%; border: 1px solid ${borderColor}; margin: 8px auto;`,
      thead: `background-color: ${headerBg};`,
      th: `border: 1px solid ${borderColor}; padding: 6px; background-color: ${headerBg}; text-align: center; box-sizing: border-box; white-space: nowrap;`,
      td: `border: 1px solid ${borderColor}; padding: 6px; background-color: ${cellBg}; text-align: center; box-sizing: border-box;`,
      pre: 'font-size: 13px; background-color: #111827; color: #e5e7eb; border-radius: 8px;',
      code: 'font-size: 13px; background-color: rgba(255,255,255,0.06); color: #e5e7eb; border-radius: 4px; padding: 0 4px;',
    }
  }
  else {
    return {
      table: 'border-collapse: collapse; table-layout: auto; width: auto; max-width: 100%; border: 1px solid #d1d5db; margin: 8px auto;',
      thead: 'background-color: #f9fafb;',
      th: 'border: 1px solid #d1d5db; padding: 6px; background-color: #f9fafb; text-align: center; box-sizing: border-box; white-space: nowrap;',
      td: 'border: 1px solid #d1d5db; padding: 6px; text-align: center; box-sizing: border-box;',
      pre: 'font-size: 13px; background-color: #f7fafc; color: #374151; border-radius: 8px;',
      code: 'font-size: 13px; background-color: rgba(0,0,0,0.04); color: #374151; border-radius: 4px; padding: 0 4px;',
    }
  }
})

const tagStyle = computed(() => ({ ...defaultTagStyle.value, ...(props.tagStyle || {}) }))

const scrollTable = computed(() => props.scrollTable ?? true)
</script>

<template>
  <view class="content-body">
    <mp-html
      :content="props.content"
      :tag-style="tagStyle"
      :scroll-table="scrollTable"
      :show-language-name="true"
      :show-line-number="true"
      :container-style="containerStyle"
    />
  </view>
</template>

<style lang="scss" scoped>
/* 统一富文本内部图片与代码样式（兼容小程序端）*/
.content-body :deep(._img) {
  max-width: 100%;
  border-radius: 8px;
}

.content-body :deep(._pre) {
  white-space: pre;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 10px;
  border-radius: 8px;
  /* 背景颜色改为在 tagStyle 中动态控制 */
}

.content-body :deep(._code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  padding: 0 4px;
  border-radius: 4px;
}

/* 代码块中的 <code> 应继承背景与颜色，避免出现“气泡”背景 */
.content-body :deep(._pre) ._code {
  background: transparent !important;
  color: inherit !important;
  padding: 0 !important;
  border-radius: 0 !important;
}
</style>

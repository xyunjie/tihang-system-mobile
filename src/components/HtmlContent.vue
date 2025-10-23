<script setup lang="ts">
import mpHtml from '@/components/mp-html/mp-html.vue'

const props = defineProps<{
  content: string
  containerStyle?: string
  tagStyle?: Record<string, string>
  scrollTable?: boolean | string
}>()

const containerStyle = computed(() => props.containerStyle ?? 'padding: 6px 0; font-size: 15px; line-height: 1.8; color: #374151; word-break: break-word; overflow-wrap: break-word; overflow: hidden;')

const defaultTagStyle: Record<string, string> = {
  table: 'border-collapse: collapse; width: 100%; border: 1px solid #d1d5db;',
  th: 'border: 1px solid #d1d5db; padding: 6px; background-color: #f9fafb; text-align: left; box-sizing: border-box;',
  td: 'border: 1px solid #d1d5db; padding: 6px; text-align: left; box-sizing: border-box;',
  pre: 'font-size: 13px;',
  code: 'font-size: 13px;',
}

const tagStyle = computed(() => ({ ...defaultTagStyle, ...(props.tagStyle || {}) }))

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
  background: #f7fafc;
}

.content-body :deep(._code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.04);
  padding: 0 4px;
  border-radius: 4px;
}
</style>

<script lang="ts" setup>
import { computed } from 'vue'

interface Props {
  /** HTML 内容 */
  content?: string
  /** 自定义样式类名 */
  contentClass?: string
  /** 是否启用数学公式渲染 */
  enableMath?: boolean
  /** 是否启用代码高亮 */
  enableCodeHighlight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  contentClass: 'html-content',
  enableMath: true,
  enableCodeHighlight: true,
})

const emit = defineEmits<{
  /** 点击链接事件 */
  linkTap: [url: string]
  /** 点击图片事件 - urls: 所有图片URL列表, index: 当前点击的图片索引 */
  imageTap: [urls: string[], index: number]
}>()

// 处理数学公式 - 简单样式显示
function processMathFormulas(content: string): string {
  // 处理块级公式 $$...$$
  content = content.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    return `<div style="background-color: #f8f9fa; padding: 16px; margin: 12px 0; border-radius: 8px; text-align: center; font-family: 'Times New Roman', serif; font-size: 16px; font-style: italic; border-left: 4px solid #007aff; color: #333; overflow-x: auto;">${formula}</div>`
  })

  // 处理行内公式 $...$
  content = content.replace(/\$([^$]+)\$/g, (match, formula) => {
    return `<span style="background-color: #f8f9fa; padding: 2px 6px; border-radius: 4px; font-family: 'Times New Roman', serif; font-style: italic; font-size: 14px; color: #333;">${formula}</span>`
  })

  return content
}

// 处理代码高亮 - 固定样式显示
function processCodeHighlight(content: string): string {
  // 处理行内代码
  content = content.replace(/<code([^>]*)>(.*?)<\/code>/gi, (match, attrs, code) => {
    // 检查是否已经在pre标签内
    const isInPre = match.includes('class="') && /class="[^"]*language-/.test(match)
    if (isInPre) {
      return match // 保持原样，由下面的pre处理
    }

    return `<code style="background-color: #f6f8fa; color: #e83e8c; padding: 2px 4px; border-radius: 3px; font-family: 'SF Mono', Consolas, monospace; font-size: 13px;">${code}</code>`
  })

  // 处理代码块 pre > code
  content = content.replace(/<pre([^>]*)><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi, (match, preAttrs, codeAttrs, code) => {
    // 检测语言
    let language = ''
    const langMatch = `${codeAttrs} ${preAttrs}`.match(/class="[^"]*language-([^\s"]+)/)
    if (langMatch) {
      language = langMatch[1]
    }

    // 应用简单的语法高亮
    const highlightedCode = highlightSimpleCode(code)

    // 构建代码块HTML
    const languageLabel = language ? `<div style="position: absolute; top: 8px; left: 8px; background-color: rgba(55, 65, 81, 0.9); color: #d1d5db; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: 'SF Mono', Consolas, monospace; font-weight: 500; z-index: 10;">${language.toUpperCase()}</div>` : ''

    return `<div style="position: relative; margin: 16px 0; border-radius: 8px; overflow: hidden; background-color: #f6f8fa; border: 1px solid #e1e4e8;">
      ${languageLabel}
      <pre style="margin: 0; padding: 16px; padding-top: ${language ? '2.5rem' : '16px'}; background-color: #f6f8fa; border-radius: 8px; overflow-x: auto; font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 13px; line-height: 1.4; white-space: pre; word-wrap: normal;"><code style="background: #f6f8fa; color: #24292e;">${highlightedCode}</code></pre>
    </div>`
  })

  return content
}

// 简单的代码高亮处理 - 固定样式
function highlightSimpleCode(code: string): string {
  // JavaScript 关键字高亮
  const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'default', 'async', 'await', 'try', 'catch', 'finally', 'true', 'false', 'null', 'undefined']

  let highlightedCode = code

  // 高亮关键字
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g')
    highlightedCode = highlightedCode.replace(regex, `<span style="color: #d73a49; font-weight: 600;">${keyword}</span>`)
  })

  // 高亮字符串
  highlightedCode = highlightedCode.replace(/(["'`])([^"'`]*)\1/g, '<span style="color: #032f62;">$1$2$1</span>')

  // 高亮注释
  highlightedCode = highlightedCode.replace(/(\/\/.*$)/gm, '<span style="color: #6a737d; font-style: italic;">$1</span>')
  highlightedCode = highlightedCode.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a737d; font-style: italic;">$1</span>')

  // 高亮数字
  highlightedCode = highlightedCode.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color: #005cc5;">$1</span>')

  return highlightedCode
}

// 内容段落接口（可以是HTML文本或图片）
interface ContentSegment {
  type: 'html' | 'image'
  content: string // HTML内容或图片URL
  imageIndex?: number // 图片索引
}

// 将HTML内容分割为文本和图片段落
function splitContentToSegments(content: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  let imageIndex = 0
  let lastIndex = 0

  const imgRegex = /<img([^>]*)>/gi
  let match = imgRegex.exec(content)

  while (match !== null) {
    const matchIndex = match.index
    const imgTag = match[0]
    const attrs = match[1]
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i)

    // 添加图片之前的HTML内容
    if (matchIndex > lastIndex) {
      const htmlContent = content.substring(lastIndex, matchIndex)
      if (htmlContent.trim()) {
        segments.push({
          type: 'html',
          content: htmlContent,
        })
      }
    }

    // 添加图片
    if (srcMatch) {
      segments.push({
        type: 'image',
        content: srcMatch[1],
        imageIndex,
      })
      imageIndex++
    }

    lastIndex = matchIndex + imgTag.length
    match = imgRegex.exec(content)
  }

  // 添加最后剩余的HTML内容
  if (lastIndex < content.length) {
    const htmlContent = content.substring(lastIndex)
    if (htmlContent.trim()) {
      segments.push({
        type: 'html',
        content: htmlContent,
      })
    }
  }

  return segments
}

// 提取所有图片URL
function extractImageUrls(content: string): string[] {
  const imageUrls: string[] = []
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  let match = imgRegex.exec(content)
  while (match !== null) {
    imageUrls.push(match[1])
    match = imgRegex.exec(content)
  }
  return imageUrls
}

// 优化移动端显示（应用于HTML段落）
function optimizeForMobile(content: string): string {
  // 处理表格 - 添加水平滚动
  content = content.replace(/<table([^>]*)>/gi, (match, attrs) => {
    return `<div style="overflow-x: auto; margin: 8px 0;"><table${attrs} style="width: 100%; min-width: 300px; border-collapse: collapse; font-size: 14px;">`
  })
  content = content.replace(/<\/table>/gi, '</table></div>')

  // 优化段落和标题的字体大小
  content = content.replace(/<p([^>]*)>/gi, '<p$1 style="font-size: 15px; line-height: 1.6; margin: 8px 0;">')
  content = content.replace(/<h1([^>]*)>/gi, '<h1$1 style="font-size: 22px; font-weight: bold; margin: 16px 0 8px 0;">')
  content = content.replace(/<h2([^>]*)>/gi, '<h2$1 style="font-size: 20px; font-weight: bold; margin: 14px 0 6px 0;">')
  content = content.replace(/<h3([^>]*)>/gi, '<h3$1 style="font-size: 18px; font-weight: bold; margin: 12px 0 4px 0;">')
  content = content.replace(/<h4([^>]*)>/gi, '<h4$1 style="font-size: 16px; font-weight: bold; margin: 10px 0 4px 0;">')

  return content
}

// 内容段落列表
const contentSegments = computed(() => {
  if (!props.content)
    return []
  return splitContentToSegments(props.content)
})

// 图片URL列表（用于预览）
const imageUrls = computed(() => extractImageUrls(props.content || ''))

// 处理HTML段落内容
function processHtmlSegment(htmlContent: string): string {
  let processed = htmlContent

  // 优化移动端显示
  processed = optimizeForMobile(processed)

  // 处理数学公式
  if (props.enableMath) {
    processed = processMathFormulas(processed)
  }

  // 处理代码高亮
  if (props.enableCodeHighlight) {
    processed = processCodeHighlight(processed)
  }

  return processed
}

// 处理图片点击
function handleImageTap(index: number) {
  emit('imageTap', imageUrls.value, index)
}

// 将 HTML 转换为纯文本（用于摘要显示）
function getPlainTextContent(htmlContent: string): string {
  if (!htmlContent)
    return ''

  // 移除HTML标签
  let plainText = htmlContent.replace(/<[^>]*>/g, '')

  // 解码HTML实体
  plainText = plainText
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&nbsp;/g, ' ')

  // 移除多余空白字符
  plainText = plainText.replace(/\s+/g, ' ').trim()

  return plainText
}

// 导出工具函数
defineExpose({
  getPlainTextContent,
})
</script>

<template>
  <view class="html-renderer">
    <!-- 混合渲染：HTML文本和图片交替显示 -->
    <block v-for="(segment, index) in contentSegments" :key="index">
      <!-- HTML段落 -->
      <rich-text
        v-if="segment.type === 'html'"
        :nodes="processHtmlSegment(segment.content)"
        :class="contentClass"
      />

      <!-- 图片段落 -->
      <image
        v-else-if="segment.type === 'image'"
        :src="segment.content"
        mode="widthFix"
        class="my-2 w-full rounded-lg"
        @tap="handleImageTap(segment.imageIndex!)"
      />
    </block>
  </view>
</template>

<style lang="scss" scoped>
.html-renderer {
  :deep(.html-content) {
    font-size: 15px;
    line-height: 1.6;
    color: #333;
  }

  // 旧的数学公式样式（保留作为备用）
  :deep(.math-inline) {
    display: inline;
  }

  :deep(.math-block) {
    display: block;
    margin: 12px 0;
  }

  :deep(.code-block) {
    display: block;
    margin: 12px 0;
  }

  :deep(.code-pre) {
    margin: 0;
    padding: 16px;
    background-color: #f6f8fa;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 13px;
    line-height: 1.4;
    white-space: pre;
    word-wrap: normal;
  }

  :deep(.code-inline) {
    font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  }

  // 移动端适配
  :deep(.uni-image) {
    max-width: 100% !important;
    height: auto !important;
    display: block;
    margin: 8px 0;
    border-radius: 6px;
  }

  :deep(.html-table) {
    width: 100%;
    font-size: 14px;
    border-collapse: collapse;
  }

  :deep(.html-th),
  :deep(.html-td) {
    padding: 8px 12px;
    border: 1px solid #e1e4e8;
    font-size: 14px;
  }

  :deep(.html-th) {
    background-color: #f6f8fa;
    font-weight: 600;
  }
}
</style>

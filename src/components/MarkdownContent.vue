<script setup lang="ts">
import { computed } from 'vue'
import HtmlContent from '@/components/HtmlContent.vue'

const props = defineProps<{
  /** Markdown 源文本 */
  content: string
}>()

function escapeHtml(raw: string) {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 轻量 Markdown -> HTML（演示用，覆盖常见语法：标题/粗体/行内代码/代码块/列表/引用/链接/段落）
 * 说明：先整体 escape，再按规则生成 HTML，避免引入额外依赖。
 */
function markdownToHtml(md: string): string {
  if (!md)
    return ''

  // 统一换行
  const src = String(md).replace(/\r\n/g, '\n')

  // 1) 处理代码块 ```lang ... ```（先抽离，避免后续规则干扰）
  const codeBlocks: string[] = []
  let text = src.replace(/```([a-zA-Z0-9_-]+)?\n([\s\S]*?)\n```/g, (_, lang: string, code: string) => {
    const safe = escapeHtml(code)
    const language = lang ? `language-${escapeHtml(lang)}` : ''
    const html = `<pre><code class="${language}">${safe}</code></pre>`
    const idx = codeBlocks.push(html) - 1
    return `@@CODEBLOCK_${idx}@@`
  })

  // 2) escape 其它内容
  text = escapeHtml(text)

  // 3) 标题（# ~ ######）
  text = text.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
  text = text.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
  text = text.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
  text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  text = text.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')

  // 4) 引用 >
  text = text.replace(/^>\s?(.+)$/gm, '<blockquote>$1</blockquote>')

  // 5) 粗体 **text**（简单处理）
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 6) 行内代码 `code`
  text = text.replace(/`([^`]+?)`/g, '<code>$1</code>')

  // 7) 链接 [text](url)
  text = text.replace(/\[([^\]]+?)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')

  // 8) 无序列表（- / *）
  // 把连续的列表行包进 <ul>
  text = text.replace(/(^\s*[-*]\s+.+(?:\n\s*[-*]\s+.+)*)/gm, (block) => {
    const items = block
      .split('\n')
      .map(line => line.replace(/^\s*[-*]\s+/, '').trim())
      .filter(Boolean)
      .map(item => `<li>${item}</li>`)
      .join('')
    return `<ul>${items}</ul>`
  })

  // 9) 有序列表（1. 2.）
  text = text.replace(/(^\s*\d+\.\s+.+(?:\n\s*\d+\.\s+.+)*)/gm, (block) => {
    const items = block
      .split('\n')
      .map(line => line.replace(/^\s*\d+\.\s+/, '').trim())
      .filter(Boolean)
      .map(item => `<li>${item}</li>`)
      .join('')
    return `<ol>${items}</ol>`
  })

  // 10) 段落：按空行分段，把未被包裹的普通文本行转成 <p>
  // 先把连续空行标准化
  text = text.replace(/\n{3,}/g, '\n\n')
  const parts = text.split('\n\n').map(p => p.trim()).filter(Boolean)
  text = parts
    .map((p) => {
      // 已是块级元素则直接返回
      if (/^<(h\d|ul|ol|pre|blockquote)>/.test(p))
        return p
      // 普通段落：保留换行为 <br/>
      const withBr = p.replace(/\n/g, '<br/>')
      return `<p>${withBr}</p>`
    })
    .join('')

  // 11) 回填代码块
  text = text.replace(/@@CODEBLOCK_(\d+)@@/g, (_, i: string) => codeBlocks[Number(i)] || '')

  return text
}

const html = computed(() => markdownToHtml(props.content))
</script>

<template>
  <HtmlContent :content="html" />
</template>

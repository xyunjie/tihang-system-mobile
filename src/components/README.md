# HTML渲染组件集成指南

## 概述

HtmlRenderer组件是一个专为移动端优化的HTML内容渲染组件，支持数学公式渲染和代码高亮功能。

## 功能特性

### 移动端优化
- **响应式图片**：自动调整图片尺寸，防止超出页面宽度
- **表格滚动**：为表格添加水平滚动，适配小屏幕
- **字体优化**：针对移动端调整合适的字体大小
- **间距调整**：优化段落、标题的间距布局

### 数学公式渲染（预留KaTeX集成）
- 行内公式：`$E=mc^2$`
- 块级公式：`$$\sum_{i=1}^{n} x_i$$`

### 代码高亮（预留Highlight.js集成）
- 行内代码高亮
- 代码块语法高亮
- 支持多种编程语言

## 使用方法

### 基本用法

```vue
<template>
  <HtmlRenderer 
    :content="htmlContent"
    :enable-math="true"
    :enable-code-highlight="true"
    content-class="html-content"
  />
</template>

<script setup>
import HtmlRenderer from '@/components/HtmlRenderer.vue'

const htmlContent = `
  <h2>标题</h2>
  <p>这是一个段落，包含行内公式 $E=mc^2$</p>
  
  <h3>代码示例</h3>
  <pre><code>
function hello() {
  console.log('Hello World!')
}
  </code></pre>
  
  <h3>数学公式</h3>
  $$\\sum_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n$$
`
</script>
```

### Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| content | string | '' | HTML内容字符串 |
| contentClass | string | 'html-content' | 自定义CSS类名 |
| enableMath | boolean | true | 启用数学公式渲染 |
| enableCodeHighlight | boolean | true | 启用代码高亮 |

### Events 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| linkTap | url: string | 点击链接时触发 |
| imageTap | src: string | 点击图片时触发 |

## 移动端优化特性

### 1. 图片处理
- 自动设置 `max-width: 100%` 和 `height: auto`
- 添加圆角和边距
- 移除原有的固定宽高属性

### 2. 表格优化
- 添加水平滚动容器
- 设置最小宽度避免过度压缩
- 优化字体大小为14px

### 3. 字体调整
- 段落：15px，行高1.6
- H1：22px
- H2：20px
- H3：18px
- H4：16px
- 代码：13px

### 4. 代码块优化
- 使用 `white-space: pre` 保持格式
- 添加水平滚动
- 优化padding和margin

## 后续集成计划

### KaTeX集成
```bash
npm install katex
```

在组件中集成KaTeX渲染：
```javascript
import katex from 'katex'

function renderMathWithKaTeX(formula, displayMode = false) {
  return katex.renderToString(formula, {
    displayMode,
    throwOnError: false
  })
}
```

### Highlight.js集成
```bash
npm install highlight.js
```

在组件中集成代码高亮：
```javascript
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'

hljs.registerLanguage('javascript', javascript)

function highlightWithHljs(code, language) {
  return hljs.highlight(code, { language }).value
}
```

## 工具函数

### getPlainTextContent
将HTML内容转换为纯文本，用于摘要显示：

```javascript
const plainText = htmlRendererRef.value.getPlainTextContent(htmlContent)
```

## 注意事项

1. **文章列表页面不使用此组件**：根据性能考虑，文章列表页面继续使用简单的文本显示
2. **样式约束**：遵循组件库默认样式，不自定义CSS
3. **移动端优先**：所有样式和布局都以移动端体验为优先
4. **性能优化**：大型数学公式和代码块会自动添加滚动，避免页面卡顿

## 示例效果

### 数学公式
- 行内：E=mc² 
- 块级：居中显示的复杂公式

### 代码高亮
```javascript
// 关键字为红色
function example() {
  // 注释为灰色斜体
  const message = "字符串为蓝色"
  return 42 // 数字为蓝色
}
```

### 响应式图片
所有图片都会自动适配屏幕宽度，不会超出页面边界。
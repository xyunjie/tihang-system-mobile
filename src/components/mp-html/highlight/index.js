/**
 * @fileoverview highlight 插件
 * Include prismjs (https://prismjs.com)
 */
import Parser  from '../parser'
import config  from './config'
// @ts-ignore prism.min.js 为纯 JS 资源文件，不参与 TS 项目检查
import prism  from './prism.min'

function Highlight (vm) {
  this.vm = vm
}

Highlight.prototype.onParse = function (node, vm) {
  if (node.name === 'pre') {
    if (vm.options.editable) {
      node.attrs.class = [node.attrs.class, 'hl-pre'].filter(Boolean).join(' ')
      return
    }
    let i
    for (i = node.children.length; i--;) {
      if (node.children[i].name === 'code') break
    }
    if (i === -1) return
    const code = node.children[i]
    let className = [code.attrs.class, node.attrs.class].filter(Boolean).join(' ')
    i = className.indexOf('language-')
    if (i === -1) {
      i = className.indexOf('lang-')
      if (i === -1) {
        className = 'language-text'
        i = 9
      } else {
        i += 5
      }
    } else {
      i += 9
    }
    let j
    for (j = i; j < className.length; j++) {
      if (className[j] === ' ') break
    }
    const lang = className.substring(i, j)
    if (code.children.length) {
      const text = this.vm.getText(code.children).replace(/&amp;/g, '&')
      if (!text) return
      if (node.c) {
        node.c = undefined
      }
      if (prism.languages[lang]) {
        code.children = (new Parser(this.vm).parse(
          // 加一层 pre 保留空白符
          `<pre>${prism.highlight(text, prism.languages[lang], lang).replace(/token /g, 'hl-')}</pre>`))[0].children
      }
      node.attrs.class = 'hl-pre'
      code.attrs.class = 'hl-code'
      if (config.showLanguageName) {
        node.children.push({
          name: 'div',
          attrs: {
            class: 'hl-language',
            style: 'user-select:none'
          },
          children: [{
            type: 'text',
            text: lang
          }]
        })
      }
      if (config.copyByLongPress) {
        node.attrs.style = `${node.attrs.style || ''};user-select:none`
        node.attrs['data-content'] = text
        vm.expose()
      }
      if (config.showLineNumber) {
        // 规范化行统计：统一换行符并去掉结尾多余的换行，减少“最后多一行”的情况
        const normalized = text
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\n+$/g, '')
        const line = normalized ? normalized.split('\n').length : 1
        const children = []
        for (let k = line; k--;) {
          children.push({
            name: 'span',
            attrs: { class: 'span' }
          })
        }
        node.children.push({
          name: 'span',
          attrs: { class: 'line-numbers-rows' },
          children
        })
      }
    }
  }
}

export default Highlight

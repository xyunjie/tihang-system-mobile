// https://www.npmjs.com/package/@uni-helper/unocss-preset-uni
import { presetUni } from '@uni-helper/unocss-preset-uni'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUni({
      attributify: {
        // prefix: 'fg-', // 如果加前缀，则需要在代码里面使用 `fg-` 前缀，如：<div fg-border="1px solid #000"></div>
        prefixedOnly: true,
      },
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    // 支持css class属性化
    presetAttributify(),
  ],
  transformers: [
    // 启用指令功能：主要用于支持 @apply、@screen 和 theme() 等 CSS 指令
    transformerDirectives(),
    // 启用 () 分组功能
    // 支持css class组合，eg: `<div class="hover:(bg-gray-400 font-medium) font-(light mono)">测试 unocss</div>`
    transformerVariantGroup(),
  ],
  shortcuts: [
    {
      center: 'flex justify-center items-center',
    },
  ],
  safelist: ['i-carbon-home', 'i-carbon-user', 'i-carbon-workspace', 'i-carbon-user-multiple'],
  rules: [
    [
      'p-safe',
      {
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      },
    ],
    ['pt-safe', { 'padding-top': 'env(safe-area-inset-top)' }],
    ['pb-safe', { 'padding-bottom': 'env(safe-area-inset-bottom)' }],
  ],
  theme: {
    colors: {
      /** 主题色，用法如: text-primary */
      primary: 'var(--wot-color-theme,#0957DE)',
      // 科技风主题色系统
      'theme-primary': 'var(--color-primary)',
      'theme-primary-light': 'var(--color-primary-light)',
      'theme-primary-dark': 'var(--color-primary-dark)',
      'theme-success': 'var(--color-success)',
      'theme-warning': 'var(--color-warning)',
      'theme-error': 'var(--color-error)',
      'theme-info': 'var(--color-info)',
      // 背景色（使用 surface 前缀避免混淆）
      'surface-primary': 'var(--bg-primary)',
      'surface-secondary': 'var(--bg-secondary)',
      'surface-tertiary': 'var(--bg-tertiary)',
      'surface-elevated': 'var(--bg-elevated)',
      // 文本色（使用 content 前缀避免混淆）
      'content-primary': 'var(--text-primary)',
      'content-secondary': 'var(--text-secondary)',
      'content-tertiary': 'var(--text-tertiary)',
      'content-disabled': 'var(--text-disabled)',
      // 边框色（使用 divider 前缀避免混淆）
      'divider-light': 'var(--border-light)',
      'divider-medium': 'var(--border-medium)',
      'divider-dark': 'var(--border-dark)',
    },
    fontSize: {
      /** 提供更小号的字体，用法如：text-2xs */
      '2xs': ['20rpx', '28rpx'],
      '3xs': ['18rpx', '26rpx'],
    },
    boxShadow: {
      'theme-sm': 'var(--shadow-sm)',
      'theme-md': 'var(--shadow-md)',
      'theme-lg': 'var(--shadow-lg)',
      'theme-xl': 'var(--shadow-xl)',
    },
  },
})

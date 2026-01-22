/*
 * @Author: 菲鸽
 * @Date: 2024-03-28 19:13:55
 * @Last Modified by: 菲鸽
 * @Last Modified time: 2024-03-28 19:24:55
 */
export const platform = __UNI_PLATFORM__
export const isH5 = __UNI_PLATFORM__ === 'h5'
export const isApp = __UNI_PLATFORM__ === 'app'
export const isMp = __UNI_PLATFORM__.startsWith('mp-')
export const isMpWeixin = __UNI_PLATFORM__.startsWith('mp-weixin')
export const isMpAplipay = __UNI_PLATFORM__.startsWith('mp-alipay')
export const isMpToutiao = __UNI_PLATFORM__.startsWith('mp-toutiao')

/**
 * 检查是否在微信浏览器中（H5 环境）
 * @returns 是否在微信浏览器中
 */
export function isWechatBrowser(): boolean {
  // #ifdef H5
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
  // #endif
  // #ifndef H5
  return false
  // #endif
}

/**
 * 检查是否在微信环境中（小程序或微信浏览器）
 * @returns 是否在微信环境中
 */
export function isWechatEnvironment(): boolean {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  // #ifdef H5
  return isWechatBrowser()
  // #endif
  return false
}

/**
 * 获取当前微信环境类型
 * @returns 'mp-weixin' | 'h5-wechat' | 'other'
 */
export function getWechatEnvType(): 'mp-weixin' | 'h5-wechat' | 'other' {
  // #ifdef MP-WEIXIN
  return 'mp-weixin'
  // #endif
  // #ifdef H5
  if (isWechatBrowser()) {
    return 'h5-wechat'
  }
  return 'other'
  // #endif
  return 'other'
}

/**
 * 获取社交类型编码
 * @returns 34=微信小程序，31=微信H5（服务号）
 */
export function getSocialType(): number {
  // #ifdef MP-WEIXIN
  return 34
  // #endif
  // #ifdef H5
  if (isWechatBrowser()) {
    return 31
  }
  // #endif
  return 34
}

const PLATFORM = {
  platform,
  isH5,
  isApp,
  isMp,
  isMpWeixin,
  isMpAplipay,
  isMpToutiao,
  isWechatBrowser,
  isWechatEnvironment,
  getWechatEnvType,
  getSocialType,
}
export default PLATFORM

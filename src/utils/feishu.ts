import { getSocialAuthRedirect } from '@/api/login'
import { currRoute } from '.'

// 飞书社交类型值（后端 SocialTypeEnum.FEISHU）
export const FEISHU_SOCIAL_TYPE = 40

/**
 * 飞书登录上下文：发起授权前暂存 type、redirect，回调页 callback.vue 读取。
 *
 * 不再把 type、redirect 拼进 redirect_uri 的 query：该值会被后端、飞书多次跳转重复编码，
 * 导致换取 token 时与授权时登记的 redirect_uri 不一致（飞书 20071）。
 */
const FEISHU_LOGIN_CONTEXT_KEY = 'feishuLoginContext'

interface FeishuLoginContext {
  type: number
  redirect: string
}

// 路由参数解析与设置重定向地址
function setupRedirectFromQuery(): string {
  const query = currRoute().query
  return query.redirect || '/pages/index/index'
}

/**
 * 读取并清除飞书登录上下文（只用一次，避免影响后续其它方式的登录）
 */
export function popFeishuLoginContext(): FeishuLoginContext | null {
  try {
    const context = uni.getStorageSync(FEISHU_LOGIN_CONTEXT_KEY) as FeishuLoginContext | ''
    uni.removeStorageSync(FEISHU_LOGIN_CONTEXT_KEY)
    return context || null
  }
  catch {
    return null
  }
}

/**
 * 获取飞书 OAuth 授权链接
 *
 * redirect_uri 固定为不带 query 的回调地址（需与飞书后台重定向 URL 白名单一致），
 * 登录后的跳转目标暂存到本地，由回调页读取
 *
 * @param redirect 登录成功后的跳转目标
 * @param callbackPath 回调页路径
 */
export async function buildFeishuAuthLink(redirect: string, callbackPath: string = '/pages/login/callback'): Promise<string> {
  const context: FeishuLoginContext = { type: FEISHU_SOCIAL_TYPE, redirect }
  uni.setStorageSync(FEISHU_LOGIN_CONTEXT_KEY, context)
  const redirectUri = `${location.origin}${callbackPath}`
  const res = await getSocialAuthRedirect({ type: FEISHU_SOCIAL_TYPE, redirectUri })
  if (res.code !== 0 || !res.data) {
    throw new Error(res.msg || '获取飞书授权链接失败')
  }
  return res.data
}

/**
 * 在飞书内置浏览器中获取飞书 OAuth 授权链接。
 *
 * 仅当 UA 为飞书/Lark 客户端时返回链接，否则返回 undefined（与 getWeChatAuthLink 保持一致）。
 * 拿到链接后由调用方 location.href 跳转，授权完成飞书会回调 /pages/login/callback。
 */
export async function getFeishuAuthLink(callbackPath: string = '/pages/login/callback'): Promise<string | undefined> {
  const ua = navigator.userAgent || ''
  // 飞书/Lark 客户端 WebView 的 UA 含 "Lark"（国际版/国内版均是），部分版本含 "Feishu"
  if (!/Lark|Feishu/i.test(ua)) {
    return
  }
  try {
    return await buildFeishuAuthLink(setupRedirectFromQuery(), callbackPath)
  }
  catch (error: any) {
    uni.showToast({ icon: 'none', title: error?.message || '授权链接获取失败' })
    throw error
  }
}

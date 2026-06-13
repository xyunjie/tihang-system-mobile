import { getSocialAuthRedirect } from '@/api/login'
import { currRoute } from '.'

// 飞书社交类型值（后端 SocialTypeEnum.FEISHU）
const FEISHU_SOCIAL_TYPE = 40

// 路由参数解析与设置重定向地址
function setupRedirectFromQuery(): string {
  const query = currRoute().query
  return query.redirect || '/pages/index/index'
}

/**
 * 在飞书内置浏览器中获取飞书 OAuth 授权链接。
 *
 * 仅当 UA 为飞书/Lark 客户端时返回链接，否则返回 undefined（与 getWeChatAuthLink 保持一致）。
 * 拿到链接后由调用方 location.href 跳转，授权完成飞书会回调 /pages/login/callback?type=40。
 */
export async function getFeishuAuthLink(callbackPath: string = '/pages/login/callback'): Promise<string | undefined> {
  const redirectUrl = setupRedirectFromQuery()
  const ua = navigator.userAgent || ''
  // 飞书/Lark 客户端 WebView 的 UA 含 "Lark"（国际版/国内版均是），部分版本含 "Feishu"
  if (!/Lark|Feishu/i.test(ua)) {
    return
  }

  // 构造通用回调地址，使用 callback 页面处理 type/code/state
  const queryParts = [`type=${FEISHU_SOCIAL_TYPE}`]
  if (redirectUrl) {
    queryParts.push(`redirect=${encodeURIComponent(redirectUrl)}`)
  }
  const callbackQuery = `?${queryParts.join('&')}`
  const redirectUri = `${location.origin}${callbackPath}${callbackQuery}`
  const res = await getSocialAuthRedirect({ type: FEISHU_SOCIAL_TYPE, redirectUri })
  if (res.code !== 0) {
    uni.showToast({ icon: 'none', title: res.msg || '授权链接获取失败' })
    throw new Error(res.msg)
  }
  return res.data
}

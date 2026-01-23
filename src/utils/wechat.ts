import { getSocialAuthRedirect } from '@/api/login'
import { currRoute } from '.'

// 路由参数解析与设置重定向地址
function setupRedirectFromQuery(): string {
  const query = currRoute().query
  return query.redirect || '/pages/index/index'
}

export async function getWeChatAuthLink(callbackPath: string = '/pages/login/callback'): Promise<string | undefined> {
  const redirectUrl = setupRedirectFromQuery()
  const ua = navigator.userAgent || ''
  if (!/MicroMessenger/i.test(ua)) {
    return
  }

  // 构造通用回调地址，使用 callback 页面处理 type/code/state
  const queryParts = [`type=31`]
  if (redirectUrl) {
    queryParts.push(`redirect=${encodeURIComponent(redirectUrl)}`)
  }
  const callbackQuery = `?${queryParts.join('&')}`
  const redirectUri = `${location.origin}${callbackPath}${callbackQuery}`
  const res = await getSocialAuthRedirect({ type: 31, redirectUri })
  if (res.code !== 0) {
    uni.showToast({ icon: 'none', title: res.msg || '授权链接获取失败' })
    throw new Error(res.msg)
  }
  return res.data
}

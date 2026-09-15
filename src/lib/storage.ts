import type { AppSettings } from './types'
import { APP_DEFAULTS, WM_DEFAULTS } from './types'
import { detectLang, isLang, t } from '../i18n'
import { normalizeWm } from './wmSerialize'

const KEY = 'wmstudio.settings.v1'

/** 首次访问的默认参数：默认水印文字随界面语言 */
function firstRunDefaults(lang: AppSettings['lang']): AppSettings {
  return {
    ...APP_DEFAULTS,
    lang,
    wm: { ...WM_DEFAULTS, content: t('app.defaultWatermark') },
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY)
    // 首次访问：语言按浏览器偏好自动检测
    if (!raw) return firstRunDefaults(detectLang())
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      ...APP_DEFAULTS,
      ...parsed,
      // 老版本设置没有 lang 字段；非法值同样回落到检测结果
      lang: isLang(parsed.lang) ? parsed.lang : detectLang(),
      // 走统一的钳制校验：本地存储被改坏/写入越界值时也能正常启动
      wm: normalizeWm(parsed.wm),
    }
  } catch {
    return APP_DEFAULTS
  }
}

export function saveSettings(s: AppSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* 隐私模式等场景静默失败 */
  }
}

export function resetWatermark(): AppSettings {
  return { ...loadSettings(), wm: { ...APP_DEFAULTS.wm } }
}

export function applyTheme(theme: AppSettings['theme']): void {
  const dark =
    theme === 'dark' ||
    (theme !== 'light' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', !!dark)
}
